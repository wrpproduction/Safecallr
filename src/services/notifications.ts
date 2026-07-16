import { Capacitor } from "@capacitor/core";
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from "@capacitor/push-notifications";
import { db, doc, setDoc, serverTimestamp } from "../firebase";
import { toast } from "sonner";

// Keep track of registered listeners to avoid duplicates
let isNativeListenersSetup = false;

/**
 * Open the system app settings screen on iOS/Android native platforms
 */
export const openAppSettings = () => {
  try {
    if (Capacitor.isNativePlatform()) {
      window.location.href = "app-settings:";
      toast.info("Redirection vers les réglages de l'application...");
    }
  } catch (err) {
    console.error("[SafeCallr] Failed to open settings:", err);
  }
};

/**
 * Set up notifications for both native platform (Capacitor) and web (FCM)
 */
export const setupNotifications = async (
  userId: string,
  navigate: (path: string) => void,
  onPermissionDenied?: () => void
) => {
  if (!userId) return;

  try {
    if (Capacitor.isNativePlatform()) {
      console.log("[SafeCallr] Initializing Native Push Notifications for user:", userId);
      await setupNativePush(userId, navigate, onPermissionDenied);
    } else {
      console.log("[SafeCallr] Web environment. Skipping native push; existing FCM flow will handle it.");
    }
  } catch (error) {
    console.error("[SafeCallr] setupNotifications error:", error);
  }
};

/**
 * Configure Capacitor Native Push Notifications
 */
const setupNativePush = async (
  userId: string,
  navigate: (path: string) => void,
  onPermissionDenied?: () => void
) => {
  try {
    // 1. Check current permission status
    let permStatus = await PushNotifications.checkPermissions();
    console.log("[SafeCallr] Push permission check status:", permStatus.receive);

    if (permStatus.receive === "prompt") {
      // Request permissions
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== "granted") {
      console.warn("[SafeCallr] Push notifications permission denied.");
      if (onPermissionDenied) {
        onPermissionDenied();
      } else {
        toast.error(
          "SafeCallr a besoin des notifications pour vous authentifier en temps réel. Veuillez les activer dans les réglages.",
          {
            duration: 8000,
            action: {
              label: "Réglages",
              onClick: () => openAppSettings(),
            },
          }
        );
      }
      return;
    }

    // 2. Add event listeners if they haven't been configured yet
    if (!isNativeListenersSetup) {
      console.log("[SafeCallr] Setting up native push event listeners...");

      // Handle successful registration - save token to Firestore
      await PushNotifications.addListener("registration", async (token: Token) => {
        const platformName = Capacitor.getPlatform(); // 'ios' or 'android'
        console.log(`[SafeCallr] Native registration success. Platform: ${platformName}, Token length: ${token.value.length}`);
        
        try {
          await setDoc(
            doc(db, "users", userId),
            {
              fcmToken: token.value,
              platform: platformName,
              tokenUpdatedAt: serverTimestamp(),
            },
            { merge: true }
          );
          console.log("[SafeCallr] Token saved to Firestore users successfully.");
        } catch (dbErr) {
          console.error("[SafeCallr] Failed to save native push token to Firestore:", dbErr);
        }
      });

      // Handle registration errors
      await PushNotifications.addListener("registrationError", (error: any) => {
        console.error("[SafeCallr] Native push registration error:", error);
      });

      // Handle notification received when app is in the foreground
      await PushNotifications.addListener(
        "pushNotificationReceived",
        (notification: PushNotificationSchema) => {
          console.log("[SafeCallr] Push notification received in foreground:", notification);
          
          const title = notification.title || "Nouvelle notification";
          const body = notification.body || "Veuillez vérifier votre compte.";
          const code = notification.data?.code;
          const requestId = notification.data?.requestId || notification.data?.id || notification.data?.authRequestId;
          const type = notification.data?.type;

          // Display authentication code directly in the UI via prominent persistent Toast
          if (code) {
            toast.success(
              `${title} : ${body} (Code: ${code})`,
              {
                duration: 15000, // Long-lasting
                action: {
                  label: "Ouvrir",
                  onClick: () => {
                    if (requestId) {
                      if (type === "verification" || type === "request") {
                        navigate(`/request/${requestId}`);
                      } else {
                        navigate(`/auth-request/${requestId}`);
                      }
                    } else {
                      navigate("/dashboard");
                    }
                  },
                },
              }
            );
          } else {
            toast.info(
              `${title} : ${body}`,
              {
                duration: 10000,
                action: {
                  label: "Ouvrir",
                  onClick: () => {
                    if (requestId) {
                      if (type === "verification" || type === "request") {
                        navigate(`/request/${requestId}`);
                      } else {
                        navigate(`/auth-request/${requestId}`);
                      }
                    } else {
                      navigate("/dashboard");
                    }
                  },
                },
              }
            );
          }
        }
      );

      // Handle action performed (user taps notification)
      await PushNotifications.addListener(
        "pushNotificationActionPerformed",
        (action: ActionPerformed) => {
          console.log("[SafeCallr] Push notification action performed:", action);
          
          const notification = action.notification;
          const requestId = notification.data?.requestId || notification.data?.id || notification.data?.authRequestId;
          const type = notification.data?.type;

          if (requestId) {
            console.log(`[SafeCallr] Navigating to request: ${requestId} (type: ${type})`);
            if (type === "verification" || type === "request") {
              navigate(`/request/${requestId}`);
            } else {
              navigate(`/auth-request/${requestId}`);
            }
          } else {
            navigate("/dashboard");
          }
        }
      );

      isNativeListenersSetup = true;
    }

    // 3. Register with Apple / Google push notification services
    await PushNotifications.register();
    console.log("[SafeCallr] PushNotifications.register() called.");

  } catch (error) {
    console.error("[SafeCallr] Error in native push setup:", error);
  }
};
