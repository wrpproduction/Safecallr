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
          <div class="label">Email</div><div class="value">${data.email}</div>
          <div class="label">Téléphone</div><div class="value">${data.phone || "Non renseigné"}</div>
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
Email : ${data.email}
Téléphone : ${data.phone || "Non renseigné"}
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
