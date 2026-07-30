import { Capacitor } from "@capacitor/core";
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from "@capacitor/push-notifications";
import { NativeSettings, AndroidSettings, IOSSettings } from "capacitor-native-settings";
import { db, doc, setDoc, serverTimestamp, requestFCMToken } from "../firebase";
import { toast } from "sonner";

// Keep track of registered listeners to avoid duplicate listener registrations
let isNativeListenersSetup = false;

// Store the active userId to prevent closure issues when listeners are registered once
let currentUserId: string | null = null;

/**
 * Open the system app settings screen on iOS/Android native platforms using capacitor-native-settings
 */
export const openAppSettings = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      await NativeSettings.open({
        optionAndroid: AndroidSettings.ApplicationDetails,
        optionIOS: IOSSettings.App,
      });
      toast.info("Redirection vers les réglages de l'application...");
    }
  } catch (err) {
    console.error("[SafeCallr] Failed to open app settings:", err);
  }
};

/**
 * Single push notification service that detects platform at runtime with Capacitor.isNativePlatform().
 * - On native iOS / Android: uses @capacitor/push-notifications
 * - On web: uses existing FCM Web Push flow (getToken + service worker)
 */
export const setupPushNotifications = async (
  userId: string,
  navigate: (path: string) => void,
  onPermissionDenied?: () => void
) => {
  if (!userId) return;

  // Update module-level variable for current user ID to avoid stale closure in event listeners
  currentUserId = userId;

  try {
    if (Capacitor.isNativePlatform()) {
      console.log("[SafeCallr] Native platform detected. Initializing Capacitor Push Notifications for user:", userId);
      await setupNativePush(navigate, onPermissionDenied);
    } else {
      console.log("[SafeCallr] Web environment. Maintaining existing Web FCM Push flow.");
      await requestFCMToken(userId);
    }
  } catch (error) {
    console.error("[SafeCallr] setupPushNotifications error:", error);
  }
};

/**
 * Configure Capacitor Native Push Notifications on iOS and Android
 */
const setupNativePush = async (
  navigate: (path: string) => void,
  onPermissionDenied?: () => void
) => {
  try {
    // 1. Check current permission status
    let permStatus = await PushNotifications.checkPermissions();
    console.log("[SafeCallr] Native push permission check status:", permStatus.receive);

    if (permStatus.receive === "prompt") {
      // Request permissions
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== "granted") {
      console.warn("[SafeCallr] Native push notifications permission denied.");
      if (onPermissionDenied) {
        onPermissionDenied();
      } else {
        toast.error(
          "SafeCallr a besoin des notifications pour vous transmettre les demandes de vérification. Veuillez les autoriser dans les réglages.",
          {
            duration: 8000,
            action: {
              label: "Réglages",
              onClick: () => { openAppSettings(); },
            },
          }
        );
      }
      return;
    }

    // 2. Add event listeners if they haven't been configured yet
    if (!isNativeListenersSetup) {
      console.log("[SafeCallr] Setting up native push event listeners...");

      // Listen to 'registration' event to retrieve the token and store it for currentUserId
      await PushNotifications.addListener("registration", async (token: Token) => {
        const platformName = Capacitor.getPlatform() as "ios" | "android" | "web";
        console.log(`[SafeCallr] Native registration success. Platform: ${platformName}`);

        if (!currentUserId) {
          console.warn("[SafeCallr] Cannot save push token: currentUserId is null");
          return;
        }

        try {
          // Save token in Firestore user document with required fields: token, platform, updatedAt
          await setDoc(
            doc(db, "users", currentUserId),
            {
              token: token.value,
              fcmToken: token.value, // backward compatibility
              platform: platformName,
              updatedAt: serverTimestamp(),
              tokenUpdatedAt: serverTimestamp(),
            },
            { merge: true }
          );
          console.log(`[SafeCallr] Native push token successfully updated in Firestore for user ${currentUserId}.`);
        } catch (dbErr) {
          console.error("[SafeCallr] Failed to save native push token to Firestore:", dbErr);
        }
      });

      // Listen to 'registrationError' and log error without blocking app
      await PushNotifications.addListener("registrationError", (error: any) => {
        console.error("[SafeCallr] Native push registration error:", error);
      });

      // Listen to 'pushNotificationReceived' (app in foreground): show notification in app UI
      await PushNotifications.addListener(
        "pushNotificationReceived",
        (notification: PushNotificationSchema) => {
          try {
            console.log("[SafeCallr] Push notification received in foreground:", notification);

            const title = notification.title || "SafeCallr";
            const body = notification.body || "Nouvelle notification reçue";
            const data = notification.data || {};
            const type = data.type;
            const requestId = data.requestId || data.id || data.authRequestId;

            if (type === "contact_request") {
              toast.info(`${title}: ${body}`, {
                duration: 10000,
                action: {
                  label: "Voir demandes",
                  onClick: () => {
                    try { navigate("/contacts"); } catch (e) { console.error(e); }
                  },
                },
              });
            } else if (type === "auth_request" || type === "verification" || type === "request" || requestId) {
              toast.info(`${title}: ${body}`, {
                duration: 10000,
                action: {
                  label: "Valider",
                  onClick: () => {
                    try {
                      if (requestId) {
                        if (type === "verification" || type === "request") {
                          navigate(`/request/${requestId}`);
                        } else {
                          navigate(`/auth-request/${requestId}`);
                        }
                      } else {
                        navigate("/dashboard");
                      }
                    } catch (e) { console.error(e); }
                  },
                },
              });
            } else {
              // type absent ou inconnu
              toast.info(`${title}: ${body}`, {
                duration: 8000,
                action: {
                  label: "Ouvrir",
                  onClick: () => {
                    try { navigate("/dashboard"); } catch (e) { console.error(e); }
                  },
                },
              });
            }
          } catch (err) {
            console.error("[SafeCallr] Error in pushNotificationReceived handler:", err);
          }
        }
      );

      // Listen to 'pushNotificationActionPerformed' (user taps notification): navigate based on type
      await PushNotifications.addListener(
        "pushNotificationActionPerformed",
        (action: ActionPerformed) => {
          try {
            console.log("[SafeCallr] Push notification action performed:", action);

            const notification = action.notification;
            const data = notification.data || {};
            const type = data.type;
            const requestId = data.requestId || data.id || data.authRequestId;

            if (type === "contact_request") {
              console.log("[SafeCallr] Navigating to contacts page for contact_request");
              navigate("/contacts");
            } else if (type === "auth_request" || type === "verification" || type === "request") {
              if (requestId) {
                console.log(`[SafeCallr] Navigating to auth request validation: ${requestId}`);
                if (type === "verification" || type === "request") {
                  navigate(`/request/${requestId}`);
                } else {
                  navigate(`/auth-request/${requestId}`);
                }
              } else {
                navigate("/dashboard");
              }
            } else if (requestId) {
              // Fallback if type is missing but requestId exists
              console.log(`[SafeCallr] Navigating with fallback requestId: ${requestId}`);
              navigate(`/request/${requestId}`);
            } else {
              // type absent or unknown -> home screen / dashboard without error
              console.log("[SafeCallr] Unknown notification type or missing type/requestId, navigating to dashboard");
              navigate("/dashboard");
            }
          } catch (err) {
            console.error("[SafeCallr] Error handling pushNotificationActionPerformed:", err);
            try {
              navigate("/dashboard");
            } catch (navErr) {
              // ignore
            }
          }
        }
      );

      isNativeListenersSetup = true;
    }

    // 3. Call PushNotifications.register()
    await PushNotifications.register();
    console.log("[SafeCallr] PushNotifications.register() executed.");
  } catch (error) {
    console.error("[SafeCallr] Error setting up native push:", error);
  }
};
