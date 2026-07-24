/**
 * SafeCallr Email Template Builder
 * Provides consistent branding for administration and user notifications.
 */

export interface EmailData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  createdAt: string;
  // Professional specific
  profession?: string;
  companyName?: string;
  siret?: string;
  // Institution specific
  organizationName?: string;
  organizationSiret?: string;
  representativeName?: string;
  jobTitle?: string;
}

export interface PlatformStats {
  totalPublic: number;
  totalPros: number;
  totalOrgs: number;
  last7Days: number;
}

export type RegistrationType = "grand_public" | "pro_solo" | "institution";

const COLORS = {
  navy: "#0F1B3D",
  mint: "#3DFFA0",
  gray: "#6B7280",
  lightGray: "#F3F4F6",
  white: "#FFFFFF"
};

const LOGO_URL = "https://safecallr.com/logo-navy.png"; // Placeholder URL

export function buildAdminNotificationEmail(data: EmailData, type: RegistrationType, stats: PlatformStats) {
  const typeLabels = {
    grand_public: "Grand public",
    pro_solo: "Professionnel indépendant",
    institution: "Collaborateur institution"
  };

  const typeLabel = typeLabels[type];

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nouveau inscrit SafeCallr</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1F2937; margin: 0; padding: 0; background-color: #F9FAFB; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { background-color: ${COLORS.navy}; padding: 30px; text-align: center; }
    .content { padding: 40px; }
    .footer { background-color: #F3F4F6; padding: 20px; text-align: center; font-size: 12px; color: ${COLORS.gray}; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 16px; }
    .badge-type { background-color: ${COLORS.mint}; color: ${COLORS.navy}; }
    h1 { color: ${COLORS.white}; margin: 0; font-size: 24px; font-weight: 600; }
    h2 { color: ${COLORS.navy}; margin-top: 0; font-size: 20px; border-bottom: 1px solid ${COLORS.lightGray}; padding-bottom: 10px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 8px; margin-bottom: 24px; }
    .label { font-weight: 600; color: ${COLORS.gray}; font-size: 14px; }
    .value { color: ${COLORS.navy}; font-size: 14px; }
    .stats-card { background-color: ${COLORS.lightGray}; padding: 20px; border-radius: 8px; margin-top: 30px; }
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .stat-item { text-align: center; }
    .stat-value { display: block; font-size: 18px; font-weight: 700; color: ${COLORS.navy}; }
    .stat-label { font-size: 11px; color: ${COLORS.gray}; text-transform: uppercase; }
    .divider { height: 1px; background-color: ${COLORS.lightGray}; margin: 30px 0; }
    .cta-button { display: inline-block; background-color: ${COLORS.mint}; color: ${COLORS.navy}; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 700; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SafeCallr Notifications</h1>
    </div>
    
    <div class="content">
      <div class="badge badge-type">${typeLabel}</div>
      <h2>Nouveau inscrit : ${data.firstName} ${data.lastName}</h2>
      
      <p>Bravo ! Un nouvel utilisateur vient de s'inscrire sur SafeCallr.</p>
      
      <div class="divider"></div>
      
      <div class="section">
        <p style="font-weight: 700; font-size: 12px; color: ${COLORS.gray}; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 15px;">Informations Utilisateur</p>
        <div class="info-grid">
          <div class="label">Prénom</div><div class="value">${data.firstName}</div>
          <div class="label">Nom</div><div class="value">${data.lastName}</div>
          <div class="label">Date</div><div class="value">${data.createdAt}</div>
        </div>
      </div>

      ${type === "pro_solo" ? `
      <div class="section" style="margin-top: 20px;">
        <p style="font-weight: 700; font-size: 12px; color: ${COLORS.gray}; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 15px;">Informations Professionnelles</p>
        <div class="info-grid">
          <div class="label">Profession</div><div class="value">${data.profession || "N/A"}</div>
          <div class="label">Société</div><div class="value">${data.companyName || "N/A"}</div>
          <div class="label">SIRET</div><div class="value">${data.siret || "N/A"}</div>
        </div>
      </div>
      ` : ""}

      ${type === "institution" ? `
      <div class="section" style="margin-top: 20px;">
        <p style="font-weight: 700; font-size: 12px; color: ${COLORS.gray}; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 15px;">Organisation</p>
        <div class="info-grid">
          <div class="label">Nom</div><div class="value">${data.organizationName || "N/A"}</div>
          <div class="label">SIRET</div><div class="value">${data.organizationSiret || "N/A"}</div>
          <div class="label">Représentant</div><div class="value">${data.representativeName || "N/A"}</div>
          <div class="label">Fonction</div><div class="value">${data.jobTitle || "N/A"}</div>
        </div>
      </div>
      ` : ""}
      
      <div class="stats-card">
        <p style="font-weight: 700; font-size: 12px; color: ${COLORS.gray}; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 15px;">Statistiques Plateforme</p>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-value">${stats.totalPublic}</span>
            <span class="stat-label">Grand Public</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${stats.totalPros}</span>
            <span class="stat-label">Pros</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${stats.totalOrgs}</span>
            <span class="stat-label">Orgs</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${stats.last7Days}</span>
            <span class="stat-label">7 derniers jours</span>
          </div>
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="https://safecallr.com/admin" class="cta-button">Accéder au back-office</a>
      </div>
    </div>
    
    <div class="footer">
      Notification automatique SafeCallr &bull; ${new Date().toLocaleDateString()}
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Nouveau inscrit SafeCallr — ${typeLabel} — ${data.firstName} ${data.lastName}

Bravo ! Un nouvel utilisateur vient de s'inscrire sur SafeCallr.

TYPE D'INSCRIPTION : ${typeLabel}

INFORMATIONS UTILISATEUR
Prénom : ${data.firstName}
Nom : ${data.lastName}
Date d'inscription : ${data.createdAt}

${type === "pro_solo" ? `
INFORMATIONS PROFESSIONNELLES
Profession : ${data.profession || "N/A"}
Société : ${data.companyName || "N/A"}
SIRET : ${data.siret || "N/A"}
` : ""}

${type === "institution" ? `
ORGANISATION
Nom : ${data.organizationName || "N/A"}
SIRET : ${data.organizationSiret || "N/A"}
Représentant : ${data.representativeName || "N/A"}
Fonction du collaborateur : ${data.jobTitle || "N/A"}
` : ""}

STATISTIQUES PLATEFORME
Total inscrits grand public : ${stats.totalPublic}
Total inscrits professionnels : ${stats.totalPros}
Total organisations actives : ${stats.totalOrgs}
Inscriptions des 7 derniers jours : ${stats.last7Days}

Accéder au back-office : https://safecallr.com/admin
— Notification automatique SafeCallr
  `.trim();

  return { html, text };
}

export interface ActivationEmailTranslations {
  subject: string;
  subtitle: string;
  title: string;
  greeting: string;
  thankYou: string;
  instruction: string;
  confidentiality: string;
  automated: string;
  footer: string;
}

export const ACTIVATION_TRANSLATIONS: Record<string, ActivationEmailTranslations> = {
  fr: {
    subject: "Votre code d'activation SafeCallr",
    subtitle: "L'authentification humaine contre la fraude",
    title: "Activez votre compte",
    greeting: "Bonjour {firstName},",
    thankYou: "Merci pour votre inscription sur SafeCallr !",
    instruction: "Pour finaliser votre inscription et activer votre compte, veuillez saisir le code de sécurité à 6 chiffres ci-dessous dans l'application :",
    confidentiality: "Ce code de sécurité est strictement confidentiel et expire dans 30 minutes. L'équipe SafeCallr ne vous demandera jamais ce code par téléphone ou par e-mail.",
    automated: "Cet e-mail est automatique. Merci de ne pas y répondre directement.",
    footer: "L'équipe SafeCallr — MOTIOON"
  },
  en: {
    subject: "Your SafeCallr activation code",
    subtitle: "Human authentication against fraud",
    title: "Activate your account",
    greeting: "Hello {firstName},",
    thankYou: "Thank you for signing up for SafeCallr!",
    instruction: "To complete your registration and activate your account, please enter the 6-digit security code below in the app:",
    confidentiality: "This security code is strictly confidential and expires in 30 minutes. The SafeCallr team will never ask you for this code by phone or email.",
    automated: "This is an automated email. Please do not reply directly.",
    footer: "The SafeCallr team — MOTIOON"
  },
  es: {
    subject: "Su código de activación de SafeCallr",
    subtitle: "Autenticación humana contra el fraude",
    title: "Active su cuenta",
    greeting: "Hola {firstName}:",
    thankYou: "¡Gracias por registrarse en SafeCallr!",
    instruction: "Para completar su registro y activar su cuenta, introduzca en la aplicación el código de seguridad de 6 dígitos que figura a continuación:",
    confidentiality: "Este código de seguridad es estrictamente confidencial y expira en 30 minutos. El equipo de SafeCallr nunca le pedirá este código por teléfono ni por correo electrónico.",
    automated: "Este es un correo automático. Por favor, no responda directamente.",
    footer: "El equipo de SafeCallr — MOTIOON"
  }
};

export interface ProValidationEmailTranslations {
  subject: string;
  subtitle: string;
  title: string;
  greeting: string;
  body: string;
  nowCan: string;
  itemDashboard: string;
  itemCalls: string;
  itemClients: string;
  buttonText: string;
  footer: string;
  automated: string;
}

export const PRO_VALIDATION_TRANSLATIONS: Record<string, ProValidationEmailTranslations> = {
  fr: {
    subject: "Bienvenue sur SafeCallr - Votre compte est validé !",
    subtitle: "L'authentification humaine contre la fraude",
    title: "Félicitations {firstName} !",
    greeting: "Bonjour {firstName},",
    body: "Votre compte professionnel <strong>SafeCallr</strong> a été validé par notre équipe.",
    nowCan: "Vous pouvez désormais :",
    itemDashboard: "Accéder à votre tableau de bord",
    itemCalls: "Initier des appels sécurisés",
    itemClients: "Gérer vos clients",
    buttonText: "Se connecter",
    footer: "L'équipe SafeCallr — MOTIOON",
    automated: "Cet e-mail est automatique. Merci de ne pas y répondre directement."
  },
  en: {
    subject: "Welcome to SafeCallr - Your account is validated!",
    subtitle: "Human authentication against fraud",
    title: "Congratulations {firstName}!",
    greeting: "Hello {firstName},",
    body: "Your professional <strong>SafeCallr</strong> account has been validated by our team.",
    nowCan: "You can now:",
    itemDashboard: "Access your dashboard",
    itemCalls: "Initiate secure calls",
    itemClients: "Manage your clients",
    buttonText: "Log In",
    footer: "The SafeCallr team — MOTIOON",
    automated: "This is an automated email. Please do not reply directly."
  },
  es: {
    subject: "SafeCallr - ¡Su account profesional ha sido verificado!",
    subtitle: "Autenticación humana contra el fraude",
    title: "¡Felicidades {firstName}!",
    greeting: "Hola {firstName}:",
    body: "Nuestro equipo ha verificado su cuenta profesional de SafeCallr. Ahora puede:",
    nowCan: "",
    itemDashboard: "Acceder a su panel de control",
    itemCalls: "Iniciar llamadas seguras",
    itemClients: "Gestionar sus clientes",
    buttonText: "Iniciar sesión",
    footer: "El equipo de SafeCallr — MOTIOON",
    automated: "Este es un correo automático. Por favor, no responda directamente."
  }
};

export interface ProRejectionEmailTranslations {
  subject: string;
  subtitle: string;
  title: string;
  greeting: string;
  body: string;
  reasonLabel: string;
  note: string;
  footer: string;
  automated: string;
}

export const PRO_REJECTION_TRANSLATIONS: Record<string, ProRejectionEmailTranslations> = {
  fr: {
    subject: "Information concernant votre inscription SafeCallr",
    subtitle: "L'authentification humaine contre la fraude",
    title: "Information concernant votre inscription",
    greeting: "Bonjour {firstName},",
    body: "Après examen de votre dossier, nous ne sommes pas en milieu de valider votre compte professionnel pour le moment.",
    reasonLabel: "Motif du refus :",
    note: "Vous pouvez soumettre une nouvelle demande en tenant compte de ces remarques.",
    footer: "L'équipe SafeCallr — MOTIOON",
    automated: "Cet e-mail est automatique. Merci de ne pas y répondre directement."
  },
  en: {
    subject: "Information regarding your SafeCallr registration",
    subtitle: "Human authentication against fraud",
    title: "Information regarding your registration",
    greeting: "Hello {firstName},",
    body: "After reviewing your application, we are unable to validate your professional account at this time.",
    reasonLabel: "Reason for rejection:",
    note: "You can submit a new application taking these remarks into account.",
    footer: "The SafeCallr team — MOTIOON",
    automated: "This is an automated email. Please do not reply directly."
  },
  es: {
    subject: "Información sobre su registro en SafeCallr",
    subtitle: "Autenticación humana contra el fraude",
    title: "Información sobre su registro",
    greeting: "Hola {firstName}:",
    body: "Tras revisar su solicitud, no podemos validar su cuenta profesional en este momento.",
    reasonLabel: "Motivo del rechazo:",
    note: "Puede enviar una nueva solicitud teniendo en cuenta estas observaciones.",
    footer: "El equipo de SafeCallr — MOTIOON",
    automated: "Este es un correo automático. Por favor, no responda directamente."
  }
};

export interface ProConfirmationEmailTranslations {
  subject: string;
  subtitle: string;
  title: string;
  greeting: string;
  body: string;
  note: string;
  processingLabel: string;
  processingValue: string;
  successInfo: string;
  footer: string;
  automated: string;
}

export const PRO_CONFIRMATION_TRANSLATIONS: Record<string, ProConfirmationEmailTranslations> = {
  fr: {
    subject: "SafeCallr - Confirmation de votre demande d'inscription",
    subtitle: "L'authentification humaine contre la fraude",
    title: "Demande d'inscription reçue",
    greeting: "Bonjour {firstName},",
    body: "Merci pour votre inscription sur <strong>SafeCallr Pro</strong>.",
    note: "Nous avons bien reçu votre dossier et vos justificatifs. Notre équipe de sécurité procède actuellement à la vérification de vos informations.",
    processingLabel: "Délai de traitement :",
    processingValue: "24 à 48 heures ouvrées.",
    successInfo: "Vous recevrez un e-mail dès que votre compte sera validé par nos services.",
    footer: "L'équipe SafeCallr — MOTIOON",
    automated: "Cet e-mail est automatique. Merci de ne pas y répondre directement."
  },
  en: {
    subject: "SafeCallr - Confirmation of your registration request",
    subtitle: "Human authentication against fraud",
    title: "Registration request received",
    greeting: "Hello {firstName},",
    body: "Thank you for registering on <strong>SafeCallr Pro</strong>.",
    note: "We have successfully received your application and supporting documents. Our security team is currently verifying your information.",
    processingLabel: "Processing time:",
    processingValue: "24 to 48 hours (business days).",
    successInfo: "You will receive an email as soon as your account is validated by our services.",
    footer: "The SafeCallr team — MOTIOON",
    automated: "This is an automated email. Please do not reply directly."
  },
  es: {
    subject: "SafeCallr - Confirmación de su solicitud de registro",
    subtitle: "Autenticación humana contra el fraude",
    title: "Solicitud de registro recibida",
    greeting: "Hola {firstName}:",
    body: "Gracias por registrarse en <strong>SafeCallr Pro</strong>.",
    note: "Hemos recibido correctamente su solicitud y los documentos justificativos. Nuestro equipo de seguridad está verificando su información.",
    processingLabel: "Plazo de tramitación:",
    processingValue: "24 a 48 horas (días hábiles).",
    successInfo: "Recibirá un correo electrónico tan pronto como su cuenta sea validada por nuestros servicios.",
    footer: "El equipo de SafeCallr — MOTIOON",
    automated: "Este es un correo automático. Por favor, no responda directamente."
  }
};

export interface OrganizationEmailTranslations {
  subject: string;
  subtitle: string;
  title: string;
  greeting: string;
  body: string;
  instructions: string;
  buttonText: string;
  fallbackText: string;
  footer: string;
  automated: string;
}

export const ORGANIZATION_TRANSLATIONS: Record<string, OrganizationEmailTranslations> = {
  fr: {
    subject: "Bienvenue sur SafeCallr - Activation de votre compte {orgName}",
    subtitle: "L'authentification humaine contre la fraude",
    title: "Bienvenue sur SafeCallr",
    greeting: "Bonjour {firstName},",
    body: "Votre organisation <strong>{orgName}</strong> a été enregistrée avec succès sur SafeCallr.",
    instructions: "Pour activer votre compte de représentant et définir votre mot de passe, veuillez cliquer sur le bouton ci-dessous :",
    buttonText: "Activer mon compte",
    fallbackText: "Si le bouton ne fonctionne pas, vous pouvez copier-coller ce lien de secours dans votre navigateur :",
    footer: "L'équipe SafeCallr — MOTIOON",
    automated: "Cet e-mail est automatique. Merci de ne pas y répondre directement."
  },
  en: {
    subject: "Welcome to SafeCallr - Activate your account {orgName}",
    subtitle: "Human authentication against fraud",
    title: "Welcome to SafeCallr",
    greeting: "Hello {firstName},",
    body: "Your organization <strong>{orgName}</strong> has been successfully registered on SafeCallr.",
    instructions: "To activate your representative account and set your password, please click the button below:",
    buttonText: "Activate my account",
    fallbackText: "If the button doesn't work, copy and paste this link into your browser:",
    footer: "The SafeCallr team — MOTIOON",
    automated: "This is an automated email. Please do not reply directly."
  },
  es: {
    subject: "Bienvenido a SafeCallr - Active su cuenta {orgName}",
    subtitle: "Autenticación humana contra el fraude",
    title: "Bienvenido a SafeCallr",
    greeting: "Hola {firstName}:",
    body: "Su organización <strong>{orgName}</strong> se ha registrado correctamente en SafeCallr.",
    instructions: "Para activar su cuenta de representante y establecer su contraseña, haga clic en el botón siguiente:",
    buttonText: "Activar mi cuenta",
    fallbackText: "Si el botón no funciona, copie y pegue este enlace en su navegador:",
    footer: "El equipo de SafeCallr — MOTIOON",
    automated: "Este es un correo automático. Por favor, no responda directamente."
  }
};

export function normalizeLang(lang: string | undefined | null): "fr" | "en" | "es" {
  if (!lang) return "en";
  const normalized = lang.substring(0, 2).toLowerCase();
  if (normalized === "fr" || normalized === "en" || normalized === "es") {
    return normalized as "fr" | "en" | "es";
  }
  return "en";
}

export function buildActivationEmail(code: string, firstName: string, lang: string) {
  const l = normalizeLang(lang);
  const t = ACTIVATION_TRANSLATIONS[l];

  const greeting = t.greeting.replace("{firstName}", firstName || "");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #ffffff; background-color: #0b0f19; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #1f2937; border-radius: 16px; background-color: #0b0f19; }
    .header { text-align: center; margin-bottom: 30px; }
    .icon-container { display: inline-block; background-color: #10b981; padding: 12px; border-radius: 12px; margin-bottom: 10px; }
    .app-name { font-size: 24px; font-weight: 800; color: #10b981; margin: 0; letter-spacing: -0.05em; }
    .subtitle { font-size: 13px; color: #9ca3af; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 0.15em; }
    .card { background-color: #111827; padding: 25px; border-radius: 12px; border: 1px solid #1f2937; text-align: center; }
    .card-title { font-size: 18px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 15px; text-align: left; }
    .card-text { font-size: 14px; line-height: 1.6; color: #d1d5db; margin-bottom: 25px; text-align: left; }
    .code-container { margin: 30px 0; background-color: #1f2937; border: 1px solid #374151; padding: 15px 30px; border-radius: 12px; display: inline-block; }
    .code-text { font-size: 36px; font-weight: 800; letter-spacing: 0.2em; color: #10b981; font-family: monospace; }
    .warning-text { font-size: 12px; color: #9ca3af; margin-top: 15px; text-align: left; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; border-top: 1px solid #1f2937; padding-top: 20px; }
    .footer-automated { margin: 0 0 10px 0; }
    .footer-team { margin: 0; font-weight: bold; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="icon-container">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6z"/></svg>
      </div>
      <h1 class="app-name">SafeCallr</h1>
      <p class="subtitle">${t.subtitle}</p>
    </div>

    <div class="card">
      <h2 class="card-title">${t.title}</h2>
      <p class="card-text">
        ${greeting}<br/><br/>
        ${t.thankYou}<br/>
        ${t.instruction}
      </p>

      <div class="code-container">
        <span class="code-text">${code}</span>
      </div>

      <p class="warning-text">${t.confidentiality}</p>
    </div>

    <div class="footer">
      <p class="footer-automated">${t.automated}</p>
      <p class="footer-team">${t.footer}</p>
    </div>
  </div>
</body>
</html>`;

  const text = `SafeCallr — ${t.title}

${greeting}

${t.thankYou}
${t.instruction}

CODE : ${code}

${t.confidentiality}

${t.automated}
${t.footer}`;

  return { subject: t.subject, html, text };
}

export function buildProValidationEmail(firstName: string, origin: string, lang: string) {
  const l = normalizeLang(lang);
  const t = PRO_VALIDATION_TRANSLATIONS[l];

  const greeting = t.greeting.replace("{firstName}", firstName || "");
  const title = t.title.replace("{firstName}", firstName || "");
  const loginUrl = `${origin || "https://safecallr.com"}/pro/login`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #ffffff; background-color: #0b0f19; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #1f2937; border-radius: 16px; background-color: #0b0f19; }
    .header { text-align: center; margin-bottom: 30px; }
    .icon-container { display: inline-block; background-color: #10b981; padding: 12px; border-radius: 12px; margin-bottom: 10px; }
    .app-name { font-size: 24px; font-weight: 800; color: #10b981; margin: 0; letter-spacing: -0.05em; }
    .subtitle { font-size: 13px; color: #9ca3af; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 0.15em; }
    .card { background-color: #111827; padding: 25px; border-radius: 12px; border: 1px solid #1f2937; text-align: left; }
    .card-title { font-size: 18px; font-weight: 700; color: #10b981; margin-top: 0; margin-bottom: 15px; }
    .card-text { font-size: 14px; line-height: 1.6; color: #d1d5db; margin-bottom: 20px; }
    .list-container { margin: 20px 0; padding-left: 20px; }
    .list-item { font-size: 14px; color: #e5e7eb; margin-bottom: 8px; list-style-type: none; position: relative; padding-left: 20px; }
    .list-item::before { content: "✓"; position: absolute; left: 0; color: #10b981; font-weight: bold; }
    .btn-container { text-align: center; margin: 30px 0; }
    .btn { display: inline-block; background-color: #10b981; color: #0b0f19; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; border-top: 1px solid #1f2937; padding-top: 20px; }
    .footer-automated { margin: 0 0 10px 0; }
    .footer-team { margin: 0; font-weight: bold; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="icon-container">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6z"/></svg>
      </div>
      <h1 class="app-name">SafeCallr</h1>
      <p class="subtitle">${t.subtitle}</p>
    </div>

    <div class="card">
      <h2 class="card-title">${title}</h2>
      <p class="card-text">${greeting}</p>
      <p class="card-text">${t.body}</p>
      
      ${t.nowCan ? `<p class="card-text" style="font-weight: 600;">${t.nowCan}</p>` : ""}
      
      <ul class="list-container">
        <li class="list-item">${t.itemDashboard}</li>
        <li class="list-item">${t.itemCalls}</li>
        <li class="list-item">${t.itemClients}</li>
      </ul>

      <div class="btn-container">
        <a href="${loginUrl}" class="btn">${t.buttonText}</a>
      </div>
    </div>

    <div class="footer">
      <p class="footer-automated">${t.automated}</p>
      <p class="footer-team">${t.footer}</p>
    </div>
  </div>
</body>
</html>`;

  const text = `SafeCallr — ${title}

${greeting}

${t.body.replace(/<[^>]*>/g, "")}

${t.nowCan || ""}
- ${t.itemDashboard}
- ${t.itemCalls}
- ${t.itemClients}

${t.buttonText} : ${loginUrl}

${t.automated}
${t.footer}`;

  return { subject: t.subject, html, text };
}

export function buildProRejectionEmail(firstName: string, reason: string, lang: string) {
  const l = normalizeLang(lang);
  const t = PRO_REJECTION_TRANSLATIONS[l];

  const greeting = t.greeting.replace("{firstName}", firstName || "");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #ffffff; background-color: #0b0f19; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #1f2937; border-radius: 16px; background-color: #0b0f19; }
    .header { text-align: center; margin-bottom: 30px; }
    .icon-container { display: inline-block; background-color: #ef4444; padding: 12px; border-radius: 12px; margin-bottom: 10px; }
    .app-name { font-size: 24px; font-weight: 800; color: #ef4444; margin: 0; letter-spacing: -0.05em; }
    .subtitle { font-size: 13px; color: #9ca3af; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 0.15em; }
    .card { background-color: #111827; padding: 25px; border-radius: 12px; border: 1px solid #1f2937; text-align: left; }
    .card-title { font-size: 18px; font-weight: 700; color: #ef4444; margin-top: 0; margin-bottom: 15px; }
    .card-text { font-size: 14px; line-height: 1.6; color: #d1d5db; margin-bottom: 20px; }
    .reason-box { background-color: #181115; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .reason-title { margin: 0 0 5px 0; font-weight: bold; color: #f87171; font-size: 14px; }
    .reason-text { margin: 0; color: #fca5a5; font-size: 14px; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; border-top: 1px solid #1f2937; padding-top: 20px; }
    .footer-automated { margin: 0 0 10px 0; }
    .footer-team { margin: 0; font-weight: bold; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="icon-container">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
      <h1 class="app-name">SafeCallr</h1>
      <p class="subtitle">${t.subtitle}</p>
    </div>

    <div class="card">
      <h2 class="card-title">${t.title}</h2>
      <p class="card-text">${greeting}</p>
      <p class="card-text">${t.body}</p>
      
      <div class="reason-box">
        <p class="reason-title">${t.reasonLabel}</p>
        <p class="reason-text">${reason}</p>
      </div>

      <p class="card-text">${t.note}</p>
    </div>

    <div class="footer">
      <p class="footer-automated">${t.automated}</p>
      <p class="footer-team">${t.footer}</p>
    </div>
  </div>
</body>
</html>`;

  const text = `SafeCallr — ${t.title}

${greeting}

${t.body}

${t.reasonLabel} ${reason}

${t.note}

${t.automated}
${t.footer}`;

  return { subject: t.subject, html, text };
}

export function buildProRegistrationConfirmationEmail(firstName: string, lang: string) {
  const l = normalizeLang(lang);
  const t = PRO_CONFIRMATION_TRANSLATIONS[l];

  const greeting = t.greeting.replace("{firstName}", firstName || "");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #ffffff; background-color: #0b0f19; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #1f2937; border-radius: 16px; background-color: #0b0f19; }
    .header { text-align: center; margin-bottom: 30px; }
    .icon-container { display: inline-block; background-color: #10b981; padding: 12px; border-radius: 12px; margin-bottom: 10px; }
    .app-name { font-size: 24px; font-weight: 800; color: #10b981; margin: 0; letter-spacing: -0.05em; }
    .subtitle { font-size: 13px; color: #9ca3af; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 0.15em; }
    .card { background-color: #111827; padding: 25px; border-radius: 12px; border: 1px solid #1f2937; text-align: left; }
    .card-title { font-size: 18px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 15px; }
    .card-text { font-size: 14px; line-height: 1.6; color: #d1d5db; margin-bottom: 20px; }
    .delay-box { background-color: #1f2937; border: 1px solid #374151; padding: 15px; margin: 20px 0; border-radius: 8px; }
    .delay-text { margin: 0; color: #e5e7eb; font-size: 14px; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; border-top: 1px solid #1f2937; padding-top: 20px; }
    .footer-automated { margin: 0 0 10px 0; }
    .footer-team { margin: 0; font-weight: bold; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="icon-container">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6z"/></svg>
      </div>
      <h1 class="app-name">SafeCallr</h1>
      <p class="subtitle">${t.subtitle}</p>
    </div>

    <div class="card">
      <h2 class="card-title">${t.title}</h2>
      <p class="card-text">${greeting}</p>
      <p class="card-text">${t.body}</p>
      <p class="card-text">${t.note}</p>

      <div class="delay-box">
        <p class="delay-text"><strong>${t.processingLabel}</strong> ${t.processingValue}</p>
      </div>

      <p class="card-text">${t.successInfo}</p>
    </div>

    <div class="footer">
      <p class="footer-automated">${t.automated}</p>
      <p class="footer-team">${t.footer}</p>
    </div>
  </div>
</body>
</html>`;

  const text = `SafeCallr — ${t.title}

${greeting}

${t.body.replace(/<[^>]*>/g, "")}

${t.note}

${t.processingLabel} ${t.processingValue}

${t.successInfo}

${t.automated}
${t.footer}`;

  return { subject: t.subject, html, text };
}

export function buildOrganizationEmail(orgName: string, firstName: string, activationLink: string, lang: string) {
  const l = normalizeLang(lang);
  const t = ORGANIZATION_TRANSLATIONS[l];

  const greeting = t.greeting.replace("{firstName}", firstName || "");
  const subject = t.subject.replace("{orgName}", orgName || "");
  const body = t.body.replace("{orgName}", orgName || "");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #ffffff; background-color: #0b0f19; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #1f2937; border-radius: 16px; background-color: #0b0f19; }
    .header { text-align: center; margin-bottom: 30px; }
    .icon-container { display: inline-block; background-color: #10b981; padding: 12px; border-radius: 12px; margin-bottom: 10px; }
    .app-name { font-size: 24px; font-weight: 800; color: #10b981; margin: 0; letter-spacing: -0.05em; }
    .subtitle { font-size: 13px; color: #9ca3af; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 0.15em; }
    .card { background-color: #111827; padding: 25px; border-radius: 12px; border: 1px solid #1f2937; text-align: left; }
    .card-title { font-size: 18px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 15px; }
    .card-text { font-size: 14px; line-height: 1.6; color: #d1d5db; margin-bottom: 20px; }
    .btn-container { text-align: center; margin: 30px 0; }
    .btn { display: inline-block; background-color: #10b981; color: #0b0f19; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; }
    .fallback-text { font-size: 12px; color: #9ca3af; margin-top: 25px; word-break: break-all; }
    .fallback-link { color: #10b981; text-decoration: underline; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; border-top: 1px solid #1f2937; padding-top: 20px; }
    .footer-automated { margin: 0 0 10px 0; }
    .footer-team { margin: 0; font-weight: bold; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="icon-container">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6z"/></svg>
      </div>
      <h1 class="app-name">SafeCallr</h1>
      <p class="subtitle">${t.subtitle}</p>
    </div>

    <div class="card">
      <h2 class="card-title">${t.title}</h2>
      <p class="card-text">${greeting}</p>
      <p class="card-text">${body}</p>
      <p class="card-text">${t.instructions}</p>

      <div class="btn-container">
        <a href="${activationLink}" class="btn">${t.buttonText}</a>
      </div>

      <p class="fallback-text">
        ${t.fallbackText}<br/>
        <a href="${activationLink}" class="fallback-link">${activationLink}</a>
      </p>
    </div>

    <div class="footer">
      <p class="footer-automated">${t.automated}</p>
      <p class="footer-team">${t.footer}</p>
    </div>
  </div>
</body>
</html>`;

  const text = `SafeCallr — ${t.title}

${greeting}

${body.replace(/<[^>]*>/g, "")}

${t.instructions}

${t.buttonText} : ${activationLink}

${t.fallbackText}
${activationLink}

${t.automated}
${t.footer}`;

  return { subject, html, text };
}
