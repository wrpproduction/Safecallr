import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp, getCountFromServer, doc, setDoc, getDoc, increment } from "firebase/firestore";
import { 
  buildAdminNotificationEmail, 
  buildProValidationEmail, 
  buildProRejectionEmail, 
  buildProRegistrationConfirmationEmail 
} from "../lib/emailTemplates";
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
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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

  // Repli absolu : Écrire directement dans la collection Firestore 'mail' depuis le navigateur client
  try {
    await addDoc(collection(db, "mail"), {
      to,
      message: {
        subject,
        html,
        text
      },
      createdAt: serverTimestamp()
    });
    console.log(`[EmailService] E-mail enregistré en brouillon dans Firestore collection 'mail' (sentVia: ${sentVia})`);
  } catch (error) {
    console.error("[EmailService] Échec critique, impossible d'enregistrer l'e-mail de repli dans Firestore :", error);
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
   * contenant un code de validation à 6 chiffres unique et sécurisé.
   */
  async sendCustomVerificationEmail(email: string, firstName: string) {
    try {
      const lang = await getBrowserLang();
      const response = await fetch("/api/send-custom-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, firstName, lang }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to send verification email via server endpoint");
      }
      console.log(`[EmailService] Localized verification email successfully sent via server (lang: ${lang})`);
    } catch (err) {
      console.error("[EmailService] Error in custom 6-digit email flow:", err);
      // fallback
      if (auth.currentUser) {
        auth.languageCode = await getBrowserLang();
        await sendEmailVerification(auth.currentUser);
      }
    }
  }
};
