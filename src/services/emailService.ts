import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, getCountFromServer } from "firebase/firestore";
import { buildAdminNotificationEmail } from "../lib/emailTemplates";

export const emailService = {
  /**
   * Envoie un email de confirmation de validation de compte pro.
   */
  async sendProValidationEmail(email: string, firstName: string) {
    try {
      await addDoc(collection(db, "mail"), {
        to: email,
        message: {
          subject: "Bienvenue sur SafeCallr - Votre compte est validé !",
          text: `Bonjour ${firstName}, nous avons le plaisir de vous informer que votre compte professionnel SafeCallr a été validé. Vous pouvez dès à présent vous connecter et initier des demandes de vérification.`,
          html: `
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
          `
        },
        createdAt: serverTimestamp()
      });
      console.log(`Email de validation envoyé à ${email}`);
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email de validation:", error);
    }
  },

  /**
   * Envoie un email de rejet de compte pro.
   */
  async sendProRejectionEmail(email: string, firstName: string, reason: string) {
    try {
      await addDoc(collection(db, "mail"), {
        to: email,
        message: {
          subject: "Information concernant votre inscription SafeCallr",
          text: `Bonjour ${firstName}, votre demande d'inscription professionnelle a été refusée pour le motif suivant : ${reason}.`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #f87171;">Information concernant votre inscription</h2>
              <p>Bonjour ${firstName},</p>
              <p>Après examen de votre dossier, nous ne sommes pas en mesure de valider votre compte professionnel pour le moment.</p>
              <div style="background-color: #fef2f2; border-left: 4px solid #f87171; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold; color: #991b1b;">Motif du refus :</p>
                <p style="margin: 5px 0 0 0; color: #b91c1c;">${reason}</p>
              </div>
              <p>Vous pouvez soumettre une nouvelle demande en tenant compte de ces remarques.</p>
              <p style="margin-top: 30px; font-size: 12px; color: #9a9a9f;">L'équipe SafeCallr</p>
            </div>
          `
        },
        createdAt: serverTimestamp()
      });
      console.log(`Email de rejet envoyé à ${email}`);
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email de rejet:", error);
    }
  },

  /**
   * Envoie un email de confirmation de réception de demande d'inscription pro.
   */
  async sendProRegistrationConfirmationEmail(email: string, firstName: string) {
    try {
      await addDoc(collection(db, "mail"), {
        to: email,
        message: {
          subject: "SafeCallr - Confirmation de votre demande d'inscription",
          text: `Bonjour ${firstName}, nous avons bien reçu votre demande d'inscription professionnelle. Notre équipe va l'étudier et vous recevrez une réponse sous 24-48h ouvrées.`,
          html: `
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
          `
        },
        createdAt: serverTimestamp()
      });
      console.log(`Email de confirmation d'inscription envoyé à ${email}`);
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email de confirmation d'inscription:", error);
    }
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

      await addDoc(collection(db, "mail"), {
        to: "contact@safecallr.com",
        message: {
          subject: subject,
          html: html,
          text: text
        },
        createdAt: serverTimestamp()
      });

      console.log(`Notification d'inscription envoyée à contact@safecallr.com pour : ${data.email}`);
    } catch (error) {
      console.error("Erreur d'envoi de la notification administrateur :", error);
    }
  }
};
