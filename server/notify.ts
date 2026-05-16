import admin from "firebase-admin";
import { buildAdminNotificationEmail, EmailData, RegistrationType, PlatformStats } from '../src/lib/emailTemplates.js';

// Configuration
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "contact@remiprevel.com";
const ENABLED = process.env.ADMIN_NOTIFICATIONS_ENABLED !== "false";

/**
 * Sends a notification to the administrator via the Trigger Email extension.
 * This writes a document to the 'mail' collection.
 */
export async function sendAdminNotification(
  type: RegistrationType,
  data: EmailData,
  stats: PlatformStats
): Promise<boolean> {
  if (!ENABLED) {
    console.log("[Notification] Admin notifications are disabled via env.");
    return false;
  }

  const db = admin.firestore();
  const { html, text } = buildAdminNotificationEmail(data, type, stats);
  
  const typeLabel = type === "grand_public" ? "Grand public" : type === "pro_solo" ? "Professionnel" : "Institution";
  const subject = `Nouveau inscrit SafeCallr — ${typeLabel} — ${data.firstName} ${data.lastName}`;

  try {
    console.log(`[Notification] Triggering email via extension for ${data.email}...`);
    
    // Document compatible avec l'extension Trigger Email from Firestore
    await db.collection("mail").add({
      to: ADMIN_EMAIL,
      message: {
        subject: subject,
        html: html,
        text: text,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`[Notification] Success: Document added to 'mail' collection for ${ADMIN_EMAIL}`);
    return true;
  } catch (error) {
    console.error(`[Notification] Error writing to mail collection:`, error);
    return false;
  }
}
