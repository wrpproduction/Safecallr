import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setupPushNotifications } from "../services/pushNotifications";

interface NotificationControllerProps {
  user: any;
}

/**
 * Non-rendering global listener component attached inside the main router context.
 * Triggered ONLY when the user is authenticated (user.uid exists).
 */
export default function NotificationController({ user }: NotificationControllerProps) {
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    if (user && user.uid) {
      setupPushNotifications(user.uid, navigate).catch((err) => {
        if (isMounted) {
          console.error("[SafeCallr] Error initializing push notifications in NotificationController:", err);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [user?.uid, navigate]);

  return null;
}
