import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setupNotifications } from "../services/notifications";

interface NotificationControllerProps {
  user: any;
}

export default function NotificationController({ user }: NotificationControllerProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.uid) {
      setupNotifications(user.uid, navigate).catch((err) => {
        console.error("[SafeCallr] Error in NotificationController setup:", err);
      });
    }
  }, [user?.uid, navigate]);

  return null;
}
