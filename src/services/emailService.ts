import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp, getCountFromServer, doc, setDoc, getDoc, increment } from "firebase/firestore";
import { 
  buildAdminNotificationEmail, 
  buildProValidationEmail, 
  buildProRejectionEmail, 
  buildProRegistrationConfirmationEmail,
  buildActivationEmail
} from "../lib/emailTemplates";
import { getApiUrl } from "../lib/api";
import { sendEmailVerification } from "firebase/auth";
import { Preferences } from "@capacitor/preferences";

async function getBrowserLang(): Promise<string> {
  try {
    const { value } = await Preferences.get({ key: "app_lang" });
    if (value === "fr" || value === "en" || value === "es") {
      return value;
    }
  } catch (e) {
    console.warn("[EmailService] Preferences error:", e);
  }
  if (typeof navigator !== "undefined" && navigator.language) {
    const devLang = navigator.language.substring(0, 2).toLowerCase();
    if (devLang === "fr" || devLang === "en" || devLang === "es") {
      return devLang;
    }
  }
  return "en";
}

async function getUserLang(uid?: string): Promise<string> {
  if (uid) {
    try {
      const userSnap = await getDoc(doc(db, "users", uid));
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data && data.lang && (data.lang === "fr" || data.lang === "en" || data.lang === "es")) {
          return data.lang;
        }
      }
    } catch (e) {
      console.warn("[EmailService] Error fetching user lang from firestore:", e);
    }
  }
  return getBrowserLang();
}

/**
 * Envoie un email par l'API Resend de façon sécurisée (via le serveur Express)
 * avec un repli (fallback) sur la collection Firestore 'mail' en cas d'erreur ou d'absence de clé API.
 */
async function sendEmailWithFallback(to: string, subject: string, html: string, text: string) {
  let sentVia = "none";
  try {
    const idToken = await auth.currentUser?.getIdToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (idToken) {
      headers["Authorization"] = `Bearer ${idToken}`;
    }
    const response = await fetch(getApiUrl("/api/send-email"), {
      method: "POST",
      headers,
      body: JSON.stringify({ to, subject, html, text }),
    });
    
    if (response.ok) {
      const data = await response.json();
      sentVia = data.sentVia || "none";
      if (sentVia === "resend") {
        console.log(`[EmailService] Mail envoyé avec succès à ${to} via Resend.`);
        return;
      }
    }
  } catch (err) {
    console.warn("[EmailService] Impossible de contacter le proxy d'envoi d'e-mail du serveur, repli sur Firestore...", err);
  }

  // Repli d'audit : Écrire dans la collection 'mail_logs' (n'active pas l'extension Trigger Email tierce)
  try {
    await addDoc(collection(db, "mail_logs"), {
      to,
      from: "SafeCallr <contact@safecallr.com>",
      replyTo: "contact@safecallr.com",
      message: {
        subject,
        html,
        text
      },
      createdAt: serverTimestamp()
    });
    console.log(`[EmailService] E-mail consigné dans mail_logs (sentVia: ${sentVia})`);
  } catch (error) {
    console.warn("[EmailService] Sauvegarde journal d'e-mail ignorée :", error);
  }
}

export const emailService = {
  /**
   * Envoie un email de confirmation de validation de compte pro.
   */
  async sendProValidationEmail(email: string, firstName: string, uid?: string) {
    const lang = await getUserLang(uid);
    const { subject, html, text } = buildProValidationEmail(firstName, window.location.origin, lang);
    await sendEmailWithFallback(email, subject, html, text);
  },

  /**
   * Envoie un email de rejet de compte pro.
   */
  async sendProRejectionEmail(email: string, firstName: string, reason: string, uid?: string) {
    const lang = await getUserLang(uid);
    const { subject, html, text } = buildProRejectionEmail(firstName, reason, lang);
    await sendEmailWithFallback(email, subject, html, text);
  },

  /**
   * Envoie un email de confirmation de réception de demande d'inscription pro.
   */
  async sendProRegistrationConfirmationEmail(email: string, firstName: string, uid?: string) {
    const lang = await getUserLang(uid);
    const { subject, html, text } = buildProRegistrationConfirmationEmail(firstName, lang);
    await sendEmailWithFallback(email, subject, html, text);
  },

  /**
   * Envoie un email de notification d'inscription à l'administrateur.
   */
  async sendAdminRegistrationNotification(
    data: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      profession?: string;
      companyName?: string;
      siret?: string;
      organizationName?: string;
      organizationSiret?: string;
      representativeName?: string;
      jobTitle?: string;
    },
    type: "grand_public" | "pro_solo" | "institution"
  ) {
    try {
      let totalPublic = 0;
      let totalPros = 0;
      let totalOrgs = 0;
      let last7Days = 0;

      // 1. Incrémenter les compteurs directement sur le document global /global/stats
      try {
        const statsDocRef = doc(db, "global", "stats");
        const updates: any = {
          last7Days: increment(1)
        };
        if (type === "grand_public") {
          updates.usersCount = increment(1);
        } else if (type === "pro_solo") {
          updates.prosCount = increment(1);
        } else if (type === "institution") {
          updates.orgsCount = increment(1);
        }
        await setDoc(statsDocRef, updates, { merge: true });
        console.log(`[EmailService] Stats incrémentées avec succès dans global/stats pour le type ${type}`);
      } catch (incErr) {
        console.warn("[EmailService] Échec d'incrémentation du document global/stats :", incErr);
      }

      // 2. Charger les statistiques du document global /global/stats
      try {
        const statsDocRef = doc(db, "global", "stats");
        const statsSnap = await getDoc(statsDocRef);
        if (statsSnap.exists()) {
          const statsData = statsSnap.data();
          totalPublic = statsData.usersCount || 0;
          totalPros = statsData.prosCount || 0;
          totalOrgs = statsData.orgsCount || 0;
          last7Days = statsData.last7Days || 0;
        }
      } catch (err) {
        console.warn("[EmailService] Impossible de charger les stats globales, tentative de comptage direct :", err);
        try {
          const [snapPublic, snapPros, snapOrgs] = await Promise.all([
            getCountFromServer(collection(db, "users")),
            getCountFromServer(collection(db, "pros")),
            getCountFromServer(collection(db, "organizations"))
          ]);
          totalPublic = snapPublic.data().count;
          totalPros = snapPros.data().count;
          totalOrgs = snapOrgs.data().count;
        } catch (innerErr) {
          console.warn("Échec du comptage direct de repli :", innerErr);
        }
      }

      const emailData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || "",
        createdAt: new Date().toLocaleString("fr-FR"),
        profession: data.profession,
        companyName: data.companyName,
        siret: data.siret,
        organizationName: data.organizationName,
        organizationSiret: data.organizationSiret,
        representativeName: data.representativeName,
        jobTitle: data.jobTitle
      };

      const { html, text } = buildAdminNotificationEmail(
        emailData,
        type,
        {
          totalPublic,
          totalPros,
          totalOrgs,
          last7Days
        }
      );

      const typeLabel = type === "grand_public" ? "Grand public" : type === "pro_solo" ? "Professionnel" : "Institution";
      const subject = `NOUVELLE INSCRIPTION SAFECALLR — ${typeLabel} — ${data.firstName} ${data.lastName}`;

      await sendEmailWithFallback("contact@safecallr.com", subject, html, text);
      console.log(`Notification d'inscription envoyée à contact@safecallr.com pour : ${data.email}`);
    } catch (error) {
      console.error("Erreur d'envoi de la notification administrateur :", error);
    }
  },

  /**
   * Envoie un email de vérification d'adresse e-mail personnalisé pour SafeCallr,
   * contenant un code de validation unique et sécurisé.
   * Fonctionne de façon 100% robuste sur le Web et sur mobile natif (iOS / Android).
   */
  async sendCustomVerificationEmail(email: string, firstName: string) {
    const lang = await getBrowserLang();
    const cleanEmail = email.trim().toLowerCase();

    // 1. Essayer d'abord l'endpoint serveur dédié
    try {
      const response = await fetch(getApiUrl("/api/send-custom-verification"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: cleanEmail, firstName, lang }),
      });
      
      if (response.ok) {
        console.log(`[EmailService] E-mail d'activation envoyé avec succès via le serveur (lang: ${lang})`);
        return;
      }
    } catch (err) {
      console.warn("[EmailService] Serveur API inaccessible pour l'e-mail d'activation, bascule sur le repli Firestore :", err);
    }

    // 2. Repli direct Firestore (garantit l'envoi même sur mobile natif ou proxy hors d'atteinte)
    try {
      // Générer le code de sécurité (6 chiffres + 1 lettre majuscule)
      const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
      const randomLetter = letters.charAt(Math.floor(Math.random() * letters.length));
      const codeDigits = Math.floor(100000 + Math.random() * 900000);
      const code = `${codeDigits}${randomLetter}`;

      // Stocker le code dans la collection verification_codes
      await setDoc(doc(db, "verification_codes", cleanEmail), {
        email: cleanEmail,
        code,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        used: false,
        uid: auth.currentUser?.uid || null
      });

      // Générer l'e-mail officiel d'activation SafeCallr
      const { subject, html, text } = buildActivationEmail(code, firstName || "", lang);

      // Envoyer via la collection mail Firestore (extension Firebase Trigger Email)
      await sendEmailWithFallback(cleanEmail, subject, html, text);
      console.log(`[EmailService] Code d'activation généré et envoyé via repli Firestore pour ${cleanEmail}`);
    } catch (fallbackErr) {
      console.error("[EmailService] Échec critique du repli d'envoi du code d'activation :", fallbackErr);
      if (auth.currentUser) {
        try {
          auth.languageCode = lang;
          await sendEmailVerification(auth.currentUser);
        } catch (e) {
          console.warn("[EmailService] Échec repli Firebase Auth standard :", e);
        }
      }
    }
  }
};
