import { db, auth, functions } from "../firebase";
import { collection, addDoc, serverTimestamp, getCountFromServer, doc, setDoc, getDoc, increment } from "firebase/firestore";
import { 
  buildAdminNotificationEmail, 
  buildProValidationEmail, 
  buildProRejectionEmail, 
  buildProRegistrationConfirmationEmail
} from "../lib/emailTemplates";
import { getApiUrl } from "../lib/api";
import { httpsCallable } from "firebase/functions";
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
   * Envoie l'email contenant le code d'activation via la Cloud Function sendVerificationCode.
   * L'email est pris directement depuis le compte Firebase Auth de l'utilisateur connecté
   * et l'envoi est assuré par l'extension Trigger Email (collection "mail").
   */
  async sendCustomVerificationEmail(_email?: string, firstName?: string) {
    // 1. Tenter la Cloud Function callable
    try {
      const sendVerificationCodeFn = httpsCallable<{ firstName?: string }, { ok: boolean }>(
        functions,
        "sendVerificationCode"
      );
      const result = await sendVerificationCodeFn({ firstName: firstName || "" });
      if (result.data?.ok) {
        return result.data;
      }
    } catch (cfErr: any) {
      console.warn("[EmailService] Cloud Function non joignable (" + cfErr.message + "), bascule sur le proxy serveur local...");
    }

    // 2. Repli serveur : /api/send-verification-code (qui écrit dans 'mail' et 'verification_codes' via Admin SDK)
    const idToken = await auth.currentUser?.getIdToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (idToken) headers["Authorization"] = `Bearer ${idToken}`;

    const response = await fetch(getApiUrl("/api/send-verification-code"), {
      method: "POST",
      headers,
      body: JSON.stringify({ firstName: firstName || "" })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Impossible d'envoyer le code d'activation.");
    }
    return await response.json();
  },

  /**
   * Envoie un email de réinitialisation de mot de passe aux couleurs officielles SafeCallr,
   * sans aucune mention de compte GCP tiers.
   */
  async sendCustomPasswordResetEmail(email: string, lang: string = "fr") {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Tenter la Cloud Function callable (architecture cible 100% Firebase)
    try {
      const sendResetFn = httpsCallable<{ email: string; lang?: string }, { ok: boolean }>(
        functions,
        "sendPasswordReset"
      );
      const res = await sendResetFn({ email: cleanEmail, lang });
      if (res.data?.ok) return res.data;
    } catch (cfErr: any) {
      console.warn("[EmailService] Cloud Function sendPasswordReset exception :", cfErr.message || cfErr);
      // Si l'erreur provient de la Cloud Function (utilisateur non trouvé, argument invalide, trop de requêtes)
      if (cfErr.code === "not-found" || cfErr.code === "functions/not-found" || cfErr.message?.includes("Aucun compte")) {
        throw new Error("Aucun compte n'est associé à cette adresse email.");
      }
      if (cfErr.code === "invalid-argument" || cfErr.code === "functions/invalid-argument") {
        throw new Error("L'adresse email saisie n'est pas valide.");
      }
      if (cfErr.code === "resource-exhausted" || cfErr.code === "functions/resource-exhausted") {
        throw new Error("Trop de tentatives. Veuillez patienter avant de réessayer.");
      }
    }

    // 2. Repli serveur : /api/send-password-reset
    const response = await fetch(getApiUrl("/api/send-password-reset"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail, lang })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Impossible d'envoyer l'e-mail de réinitialisation.");
    }
    return await response.json();
  }
};
