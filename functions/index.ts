import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';

// Initialisation Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Config (à renseigner dans les variables de config de la Cloud Function)
// firebase functions:config:set resend.key="YOUR_API_KEY" admin.email="ADMIN_EMAIL"
const RESEND_API_KEY = functions.config().resend?.key || process.env.RESEND_API_KEY;
const ADMIN_EMAIL = functions.config().admin?.email || process.env.ADMIN_NOTIFICATION_EMAIL || "contact@safecallr.com";

const resend = new Resend(RESEND_API_KEY);

/**
 * Récupère les statistiques de la plateforme
 */
async function getStats() {
  const [publicSnap, prosSnap, orgsSnap] = await Promise.all([
    db.collection("users").count().get(),
    db.collection("pros").count().get(),
    db.collection("organizations").count().get()
  ]);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const last7DaysSnap = await db.collection("users")
    .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(sevenDaysAgo))
    .get();

  return {
    totalPublic: publicSnap.data().count,
    totalPros: prosSnap.data().count,
    totalOrgs: orgsSnap.data().count,
    last7Days: last7DaysSnap.size
  };
}

/**
 * Trigger sur la création d'un utilisateur Grand Public
 */
export const onUserCreated = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const stats = await getStats();
    
    const subject = `Nouveau inscrit SafeCallr — Grand public — ${data.firstName} ${data.lastName}`;
    
    // Appel à l'API Resend (ou via collection mail si extension utilisée)
    return resend.emails.send({
      from: 'SafeCallr Notifications <notifications@safecallr.com>',
      to: ADMIN_EMAIL,
      subject: subject,
      html: `...` // Utiliser le template défini
    });
  });

/**
 * Trigger sur la création d'un Professionnel
 */
export const onProCreated = functions.firestore
  .document('pros/{proId}')
  .onCreate(async (snap, context) => {
    // Logique similaire pour Pros
  });

/**
 * Trigger sur la création d'un Collaborateur (via Collection Group)
 */
export const onMemberCreated = functions.firestore
  .document('organizations/{orgId}/members/{memberId}')
  .onCreate(async (snap, context) => {
    // Logique similaire pour Collaborateurs
  });
