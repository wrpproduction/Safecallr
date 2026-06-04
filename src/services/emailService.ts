import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp, getCountFromServer, doc, setDoc } from "firebase/firestore";
import { buildAdminNotificationEmail } from "../lib/emailTemplates";
import { sendEmailVerification } from "firebase/auth";

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
  async sendProValidationEmail(email: string, firstName: string) {
    const subject = "Bienvenue sur SafeCallr - Votre compte est validé !";
    const text = `Bonjour ${firstName}, nous avons le plaisir de vous informer que votre compte professionnel SafeCallr a été validé. Vous pouvez dès à présent vous connecter et initier des demandes de vérification.`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #4ade80;">Félicitations ${firstName} !</h2>
        <p>Votre compte professionnel <strong>SafeCallr</strong> a été validé par notre équipe.</p>
        <p>Vous pouvez désormais :</p>
        <ul>
          <li>Accéder à votre tableau de bord</li>
          <li>Initier des appels sécurisés</li>
          <li>Gérer vos clients</li>
        </ul>
        <div style="margin-top: 30px; text-align: center;">
          <a href="${window.location.origin}/pro/login" style="background-color: #18181b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Se connecter</a>
        </div>
        <p style="margin-top: 30px; font-size: 12px; color: #9a9a9f;">L'équipe SafeCallr</p>
      </div>
    `;

    await sendEmailWithFallback(email, subject, html, text);
  },

  /**
   * Envoie un email de rejet de compte pro.
   */
  async sendProRejectionEmail(email: string, firstName: string, reason: string) {
    const subject = "Information concernant votre inscription SafeCallr";
    const text = `Bonjour ${firstName}, votre demande d'inscription professionnelle a été refusée pour le motif suivant : ${reason}.`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #f87171;">Information concernant votre inscription</h2>
        <p>Bonjour ${firstName},</p>
        <p>Après examen de votre dossier, nous ne sommes pas en module de valider votre compte professionnel pour le moment.</p>
        <div style="background-color: #fef2f2; border-left: 4px solid #f87171; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold; color: #991b1b;">Motif du refus :</p>
          <p style="margin: 5px 0 0 0; color: #b91c1c;">${reason}</p>
        </div>
        <p>Vous pouvez soumettre une nouvelle demande en tenant compte de ces remarques.</p>
        <p style="margin-top: 30px; font-size: 12px; color: #9a9a9f;">L'équipe SafeCallr</p>
      </div>
    `;

    await sendEmailWithFallback(email, subject, html, text);
  },

  /**
   * Envoie un email de confirmation de réception de demande d'inscription pro.
   */
  async sendProRegistrationConfirmationEmail(email: string, firstName: string) {
    const subject = "SafeCallr - Confirmation de votre demande d'inscription";
    const text = `Bonjour ${firstName}, nous avons bien reçu votre demande d'inscription professionnelle. Notre équipe va l'étudier et vous recevrez une réponse sous 24-48h ouvrées.`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #18181b;">Demande d'inscription reçue</h2>
        <p>Bonjour ${firstName},</p>
        <p>Merci pour votre inscription sur <strong>SafeCallr Pro</strong>.</p>
        <p>Nous avons bien reçu votre dossier et vos justificatifs. Notre équipe de sécurité procède actuellement à la vérification de vos informations.</p>
        <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; margin: 20px 0; border: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #374151;"><strong>Délai de traitement :</strong> 24 à 48 heures ouvrées.</p>
        </div>
        <p>Vous recevrez un email dès que votre compte sera validé par nos services.</p>
        <p style="margin-top: 30px; font-size: 12px; color: #9a9a9f;">L'équipe SafeCallr</p>
      </div>
    `;

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

      try {
        const [snapPublic, snapPros, snapOrgs] = await Promise.all([
          getCountFromServer(collection(db, "users")),
          getCountFromServer(collection(db, "pros")),
          getCountFromServer(collection(db, "organizations"))
        ]);
        totalPublic = snapPublic.data().count;
        totalPros = snapPros.data().count;
        totalOrgs = snapOrgs.data().count;
      } catch (err) {
        console.warn("Could not load count for admin notification stats:", err);
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
      // 1. Générer le code à 6 chiffres
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // 2. Stocker le code directement dans Firestore (assure le fonctionnement même si l'admin SDK a un problème)
      try {
        await setDoc(doc(db, "verification_codes", email), {
          email,
          code,
          createdAt: serverTimestamp(),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes de validité
          used: false
        });
        console.log(`[EmailService] Code à 6 chiffres enregistré pour ${email}: ${code}`);
      } catch (dbErr) {
        console.error("[EmailService] Échec d'écriture du code dans Firestore:", dbErr);
        throw dbErr;
      }

      // 3. Préparer l'e-mail brandé SafeCallr
      const subject = "SafeCallr - Activez votre compte avec votre code à 6 chiffres";
      const text = `Bonjour ${firstName || ""}, votre code de validation d'adresse email pour SafeCallr est : ${code}. Il expire dans 30 minutes.`;
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #1f2937; border-radius: 16px; background-color: #0b0f19; color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background-color: #10b981; padding: 12px; border-radius: 12px; margin-bottom: 10px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6z"/></svg>
            </div>
            <h1 style="font-size: 24px; font-weight: 800; color: #10b981; margin: 0; letter-spacing: -0.05em;">SafeCallr</h1>
            <p style="font-size: 13px; color: #9ca3af; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 0.15em;">Sécurité des appels bancaires</p>
          </div>

          <div style="background-color: #111827; padding: 25px; border-radius: 12px; border: 1px solid #1f2937; text-align: center;">
            <h2 style="font-size: 18px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 15px; text-align: left;">Activez votre compte</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #d1d5db; margin-bottom: 25px; text-align: left;">
              Bonjour ${firstName || "utilisateur"},<br/><br/>
              Merci pour votre inscription sur <strong>SafeCallr</strong> !<br/>
              Pour finaliser votre inscription et activer votre compte, veuillez saisir le code de sécurité à 6 chiffres ci-dessous dans l'application :
            </p>

            <div style="margin: 30px 0; background-color: #1f2937; border: 1px solid #374151; padding: 15px 30px; border-radius: 12px; display: inline-block;">
              <span style="font-size: 36px; font-weight: 800; letter-spacing: 0.2em; color: #10b981; font-family: monospace;">${code}</span>
            </div>

            <p style="font-size: 12px; color: #9ca3af; margin-top: 15px; text-align: left;">
              Ce code de sécurité est strictement confidentiel et expire dans 30 minutes. L'équipe SafeCallr ne vous demandera jamais ce code par téléphone ou par e-mail.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; border-top: 1px solid #1f2937; padding-top: 20px;">
            <p style="margin: 0 0 10px 0;">Cet e-mail est automatique. Merci de ne pas y répondre directement.</p>
            <p style="margin: 0; font-weight: bold; color: #9ca3af;">L'équipe SafeCallr &bull; SafeCallr Network</p>
          </div>
        </div>
      `;

      // 4. Envoyer avec repli
      await sendEmailWithFallback(email, subject, html, text);
      console.log(`[EmailService] Verification code email triggered for ${email}`);
    } catch (err) {
      console.error("[EmailService] Error in custom 6-digit email flow:", err);
      // fallback
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
      }
    }
  }
};
