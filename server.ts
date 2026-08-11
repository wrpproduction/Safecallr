import express from "express";
import path from "path";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { fileURLToPath } from "url";
import fs from "fs";
import { Resend } from "resend";
import { sendAdminNotification } from "./server/notify.js";
import { getPlatformStats } from "./server/stats.js";
import { EmailData, buildActivationEmail, buildOrganizationEmail } from "./src/lib/emailTemplates.js";

// Global process exception handlers to prevent any unhandled error from crashing the server
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Anti-Crash] Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[Anti-Crash] Uncaught Exception:", error);
});

// Helper function to safely write files on filesystems which may be read-only (e.g., serverless environments)
function safeWriteFileSync(filePath: string, content: string) {
  try {
    fs.writeFileSync(filePath, content);
  } catch (err: any) {
    console.warn(`[SafeWrite Warning] Could not write file to ${filePath}: ${err.message}`);
  }
}

// Force NODE_ENV to production if executing the bundled output (CJS) or inside dist folder
const isProductionBundle = 
  (typeof __filename !== "undefined" && (__filename.endsWith(".cjs") || __filename.includes("dist"))) ||
  (process.env.NODE_ENV === "production");

if (isProductionBundle) {
  process.env.NODE_ENV = "production";
  console.log("[Environment] Production bundle detected. NODE_ENV has been forced to production.");
}

// Handle ESM and CommonJS path resolution gracefully
let resolvedFilename = "";
let resolvedDirname = "";

try {
  const g = globalThis as any;
  if (typeof g.__filename !== "undefined" && g.__filename) {
    resolvedFilename = g.__filename;
  } else if (typeof import.meta !== "undefined" && import.meta.url) {
    resolvedFilename = fileURLToPath(import.meta.url);
  }
} catch (e) {
  // Ignore
}

try {
  const g = globalThis as any;
  if (typeof g.__dirname !== "undefined" && g.__dirname) {
    resolvedDirname = g.__dirname;
  } else if (resolvedFilename) {
    resolvedDirname = path.dirname(resolvedFilename);
  } else {
    resolvedDirname = process.cwd();
  }
} catch (e) {
  resolvedDirname = process.cwd();
}

// Initialisation Firebase Admin sécurisée
let config: any = {};
let db: any;
let fcm: any;
let firebaseInitialized = false;

try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  }
} catch (e) {
  console.warn("[FirebaseConfig] N'a pas pu lire firebase-applet-config.json:", e);
}

const projectId = config.projectId || process.env.FIREBASE_PROJECT_ID || process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;

try {
  if (projectId) {
    if (!admin.apps.length) {
      let credential = undefined;
      const saKeyPath = path.join(process.cwd(), "firebase-service-account.json");
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
          credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY));
          console.log("[Firebase] Initialisation avec clé de compte de service (Env).");
        } catch (err: any) {
          console.error("[Firebase] Clé de compte de service dans l'env invalide:", err.message);
        }
      } else if (fs.existsSync(saKeyPath)) {
        try {
          credential = admin.credential.cert(JSON.parse(fs.readFileSync(saKeyPath, "utf-8")));
          console.log("[Firebase] Initialisation avec clé de compte de service (Fichier).");
        } catch (err: any) {
          console.error("[Firebase] Fichier de compte de service invalide:", err.message);
        }
      }

      admin.initializeApp({
        projectId: projectId,
        ...(credential ? { credential } : {})
      });
    }
    const dbId = process.env.FIRESTORE_DB_ID || config.firestoreDatabaseId || "(default)";
    db = getFirestore(dbId);
    fcm = admin.messaging();
    firebaseInitialized = true;
    console.log(`[Firebase] Initialisé avec Succès. Project: ${projectId}, Database: ${dbId}`);
  } else {
    console.warn("[Firebase] Aucun PROJECT ID trouvé. Le SDK Admin Firebase est inactif.");
  }
} catch (err) {
  console.error("[Firebase] Échec critique d'initialisation de Firebase Admin:", err);
}

async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentification requise" });
    }

    const token = authHeader.split("Bearer ")[1];
    if (!token) {
      return res.status(401).json({ error: "Token manquant" });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    (req as any).user = {
      uid: decodedToken.uid,
      email: decodedToken.email || "",
    };
    next();
  } catch (error: any) {
    console.error("[requireAuth] Verification failed:", error?.message || error);
    return res.status(401).json({ error: "Token invalide ou expiré" });
  }
}

async function verifyAdmin(idToken: string) {
  if (!idToken) throw new Error("Accès non autorisé");
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  const callerUid = decodedToken.uid;
  const callerEmail = decodedToken.email;

  const superAdmins = [
    "xdcam10@gmail.com",
    "contact@wrpproduction.com",
    "contact@safecallr.com"
  ];

  const isAdminEmail = superAdmins.includes(callerEmail || "");
  let adminExists = false;

  if (!isAdminEmail) {
    try {
      const adminDoc = await db.collection("admins").doc(callerUid).get();
      adminExists = adminDoc.exists;
    } catch (dbErr: any) {
      console.warn("[verifyAdmin] Failed to read admins collection from Firestore:", dbErr.message);
    }
  } else {
    adminExists = true;
  }
  
  if (!isAdminEmail && !adminExists) {
    throw new Error("Accès refusé. Réservé aux super-administrateurs.");
  }

  // Auto-promouvoir en admin si email présent dans la liste (non bloquant en cas d'erreur de droits)
  if (isAdminEmail) {
    try {
      const adminDoc = await db.collection("admins").doc(callerUid).get();
      if (!adminDoc.exists) {
        await db.collection("admins").doc(callerUid).set({
          uid: callerUid,
          email: callerEmail,
          role: "admin",
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Utilisateur ${callerEmail} promu admin dans Firestore.`);
      }
    } catch (err: any) {
      console.warn("[verifyAdmin] Failed code auto-promote admin update (continuing anyway since email is in whitelist):", err.message);
    }
  }

  return { uid: callerUid, email: callerEmail || "" };
}

async function createAuditLog(orgId: string, actor: { uid: string, email: string }, action: string, details: any) {
  await db.collection("organizations").doc(orgId).collection("auditLog").add({
    action,
    actorUid: actor.uid,
    actorEmail: actor.email,
    details,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Helper to dynamically get Resend API Key from process.env or Firestore settings
  async function getResendApiKey(): Promise<string | null> {
    const envKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
    if (envKey && envKey.trim().length > 0) {
      return envKey.trim();
    }
    if (firebaseInitialized && db) {
      try {
        const emailDoc = await db.collection("settings").doc("email").get();
        if (emailDoc.exists && emailDoc.data()?.resendApiKey) {
          return emailDoc.data().resendApiKey.trim();
        }
        const systemDoc = await db.collection("settings").doc("system").get();
        if (systemDoc.exists && systemDoc.data()?.resendApiKey) {
          return systemDoc.data().resendApiKey.trim();
        }
      } catch (e) {
        console.warn("[Resend] Error reading API key from Firestore settings:", e);
      }
    }
    return null;
  }

  // API: Status of Resend configuration
  app.get("/api/resend-status", async (req, res) => {
    const apiKey = await getResendApiKey();
    res.json({ configured: !!apiKey });
  });

  // API: Save or update Resend API Key directly in Firestore settings (Admin)
  app.post("/api/resend-config", requireAuth, async (req, res) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
        return res.status(400).json({ error: "Clé API Resend requise." });
      }
      if (firebaseInitialized && db) {
        await db.collection("settings").doc("email").set({
          resendApiKey: apiKey.trim(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        return res.json({ success: true, message: "Clé API Resend enregistrée avec succès dans la base de données." });
      } else {
        return res.status(500).json({ error: "Base de données non initialisée." });
      }
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // API: AI-powered blog post generation with Gemini (SEO & GEO optimized)
  app.post("/api/generate-blog-post", requireAuth, async (req, res) => {
    try {
      const { topic, category, targetLocation, keywords } = req.body;
      if (!topic) {
        return res.status(400).json({ error: "Le champ 'topic' (sujet) est requis." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ 
          error: "La clé API Gemini (GEMINI_API_KEY) n'est pas configurée. Veuillez l'ajouter dans les paramètres secrets." 
        });
      }

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Vous êtes un expert de haut niveau en cybersécurité, en référencement naturel (SEO) et en marketing de contenu géolocalisé pour SafeCallr.
SafeCallr est une solution révolutionnaire d'authentification humaine d'appels téléphoniques (double authentification humaine / 2FA par téléphone pour lutter contre le spoofing, l'usurpation d'identité et les fraudes de type "faux conseiller bancaire" ou "fraude au président").

Rédigez un article de blog complet, captivant et extrêmement informatif sur le sujet suivant : "${topic}".
La catégorie ciblée est : ${category === "grand_public" ? "Grand Public (Particuliers)" : "Professionnels & Entreprises"}.
${targetLocation ? `La zone géographique ciblée (pour optimisation GEO SEO locale) est : ${targetLocation}. Intégrez des mentions, anecdotes locales ou conseils spécifiques à cette région/ville de façon naturelle et experte.` : ""}
${keywords ? `Intégrez de manière fluide et optimale pour le référencement ces mots-clés : ${keywords}.` : ""}

Consignes de rédaction :
- Rédigez le contenu complet en Markdown propre avec des titres clairs (H2, H3), des listes à puces et des paragraphes espacés.
- Le ton doit être professionnel, rassurant, expert et didactique. Expliquez comment SafeCallr résout le problème posé dans l'article.
- La "metaTitle" sera optimisée pour le SEO (moins de 60 caractères) et servira d'URL/slug.
- La "metaDescription" doit faire moins de 160 caractères et inciter au clic sur les moteurs de recherche.

Renvoyez uniquement l'objet JSON correspondant exactement au schéma demandé.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              title: { type: 'STRING', description: "Titre SEO accrocheur de l'article" },
              content: { type: 'STRING', description: "Contenu complet au format Markdown avec des titres (H2, H3) et paragraphes." },
              summary: { type: 'STRING', description: "Résumé court (2-3 phrases) pour l'affichage des cartes d'aperçu" },
              metaTitle: { type: 'STRING', description: "Titre SEO optimal (moins de 60 caractères)" },
              metaDescription: { type: 'STRING', description: "Description SEO optimale (moins de 160 caractères)" },
              seoKeywords: { type: 'STRING', description: "Mots-clés SEO séparés par des virgules" },
              geoTargeting: { type: 'STRING', description: "Zone géographique ou portée ciblée" }
            },
            required: ['title', 'content', 'summary', 'metaTitle', 'metaDescription', 'seoKeywords', 'geoTargeting']
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Aucune réponse générée par l'IA.");
      }

      const articleData = JSON.parse(text);
      return res.json(articleData);
    } catch (err: any) {
      console.error("[Gemini Generate Article Error]:", err);
      return res.status(500).json({ error: `Erreur d'IA : ${err.message}` });
    }
  });

  // API: Secure server-side Proxy for sending emails using Resend with direct Firestore /mail fallback
  app.post("/api/send-email", requireAuth, async (req, res) => {
    try {
      const { to, subject, html, text } = req.body;

      if (!to || !subject) {
        return res.status(400).json({ error: "Les champs 'to' et 'subject' sont requis." });
      }

      const apiKey = await getResendApiKey();
      if (!apiKey) {
        console.warn("[Resend Backend] RESEND_API_KEY non configurée. Envoi direct via Resend désactivé.");
        return res.json({ 
          success: true, 
          sentVia: "none", 
          warning: "RESEND_API_KEY is not defined. The email will be generated via Firestore fallback." 
        });
      }

      const resend = new Resend(apiKey);
      const fromAddress = process.env.EMAIL_FROM_ADDRESS || "contact@safecallr.com";
      const fromName = process.env.EMAIL_FROM_NAME || "SafeCallr";

      console.log(`[Resend Backend] Tentative d'envoi d'un mail à : ${to} (Sujet : ${subject})`);
      
      let emailResult;
      try {
        emailResult = await resend.emails.send({
          from: `${fromName} <${fromAddress}>`,
          to: to,
          subject: subject,
          html: html || text,
          text: text || ""
        });
      } catch (domainErr: any) {
        console.warn("[Resend Backend] Sending from custom domain failed, falling back to onboarding@resend.dev:", domainErr.message);
        emailResult = await resend.emails.send({
          from: `${fromName} <onboarding@resend.dev>`,
          to: to,
          subject: subject,
          html: html || text,
          text: text || ""
        });
      }

      console.log(`[Resend Backend] Mail envoyé avec succès à ${to} via Resend. ID:`, emailResult.data?.id);

      // Tenter d'enregistrer l'audit log dans la collection Firestore mail si disponible (optionnel)
      if (firebaseInitialized && db) {
        try {
          await db.collection("mail").add({
            to,
            message: { subject, html, text },
            status: "sent",
            sentVia: "resend",
            resendId: emailResult.data?.id || "",
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
        } catch (dbErr) {
          console.warn("[Resend Backend] Sauvegarde de l'audit logFirestore ignorée (Droits Firestore Admin limités).");
        }
      }

      return res.json({ success: true, sentVia: "resend", emailId: emailResult.data?.id });
    } catch (err: any) {
      console.error("[Resend Backend] Échec d'envoi d'email via l'API Resend:", err);
      return res.status(500).json({ error: err.message, sentVia: "error" });
    }
  });

  // API: Resend access / reset password link to a user or representative (Admin)
  app.post("/api/admin/resend-access", async (req, res) => {
    try {
      const { idToken, email, name, orgId, orgName } = req.body;
      const actor = await verifyAdmin(idToken);

      if (!email) {
        return res.status(400).json({ error: "L'adresse email est requise." });
      }

      const targetEmail = email.trim();
      const targetName = name || targetEmail.split("@")[0];
      const targetOrg = orgName || "SafeCallr";

      let resetLink = "";
      if (firebaseInitialized) {
        try {
          try {
            await admin.auth().getUserByEmail(targetEmail);
          } catch (getUserErr: any) {
            if (getUserErr.code === "auth/user-not-found") {
              await admin.auth().createUser({
                email: targetEmail,
                displayName: targetName
              });
            }
          }
          resetLink = await admin.auth().generatePasswordResetLink(targetEmail);
        } catch (authErr: any) {
          console.warn("[Resend Access] Warning during generatePasswordResetLink:", authErr);
        }
      }

      const resendApiKey = await getResendApiKey();
      const emailSubject = `[SafeCallr] Activation et réinitialisation de vos accès (${targetOrg})`;
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0b0e; color: #ffffff; padding: 32px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid #2e2e34;">
          <div style="margin-bottom: 24px; text-align: center;">
            <h2 style="color: #3DFFA0; margin: 0; font-size: 24px; font-weight: 800;">SafeCallr</h2>
            <p style="color: #9a9a9f; font-size: 13px; margin-top: 4px;">Protection et Authentification Sécurisée des Appels</p>
          </div>
          <div style="background: #111113; border: 1px solid #2e2e34; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="font-size: 16px; font-weight: bold; margin-top: 0; color: #ffffff;">Bonjour ${targetName},</p>
            <p style="color: #d1d5db; font-size: 14px; line-height: 1.6;">Un administrateur vient de vous renvoyer votre lien d'activation et de connexion à votre espace professionnel <strong>${targetOrg}</strong>.</p>
            ${resetLink ? `
              <div style="text-align: center; margin: 28px 0;">
                <a href="${resetLink}" style="background-color: #3DFFA0; color: #000000; font-weight: bold; font-size: 14px; padding: 14px 28px; border-radius: 8px; text-decoration: none; display: inline-block;">Activer et définir mon mot de passe</a>
              </div>
              <p style="color: #6b7280; font-size: 12px; line-height: 1.5; word-break: break-all;">
                Si le bouton ci-dessus ne fonctionne pas, vous pouvez copier/coller ce lien sécurisé dans votre navigateur :<br/>
                <a href="${resetLink}" style="color: #3DFFA0;">${resetLink}</a>
              </p>
            ` : `
              <p style="color: #eab308; font-size: 13px;">Veuillez vous rendre sur <a href="https://safecallr.com/login" style="color: #3DFFA0;">safecallr.com/login</a> et utiliser la fonction "Mot de passe oublié" avec votre email <strong>${targetEmail}</strong>.</p>
            `}
          </div>
          <p style="color: #6b7280; font-size: 11px; text-align: center; margin: 0;">Cet e-mail est destiné à ${targetEmail}. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer ce message.</p>
        </div>
      `;

      let sentVia = "mail_queue";
      if (resendApiKey) {
        try {
          const resend = new Resend(resendApiKey);
          let fromAddress = process.env.EMAIL_FROM_ADDRESS || "contact@safecallr.com";
          const fromName = process.env.EMAIL_FROM_NAME || "SafeCallr";

          try {
            await resend.emails.send({
              from: `${fromName} <${fromAddress}>`,
              to: targetEmail,
              subject: emailSubject,
              html: emailHtml
            });
            sentVia = "resend";
          } catch (resendDomainErr: any) {
            console.warn("[Resend Access] Primary email send failed, retrying with onboarding@resend.dev:", resendDomainErr.message);
            await resend.emails.send({
              from: `${fromName} <onboarding@resend.dev>`,
              to: targetEmail,
              subject: emailSubject,
              html: emailHtml
            });
            sentVia = "resend_onboarding";
          }
        } catch (resendErr: any) {
          console.error("[Resend Access] Direct Resend error, falling back to Firestore /mail collection:", resendErr);
        }
      }

      if (firebaseInitialized && db) {
        try {
          await db.collection("mail").add({
            to: targetEmail,
            message: {
              subject: emailSubject,
              html: emailHtml
            },
            status: sentVia.startsWith("resend") ? "sent" : "queued",
            sentVia,
            orgId: orgId || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
        } catch (mErr) {
          console.warn("[Resend Access] Could not queue in Firestore mail collection:", mErr);
        }
      }

      return res.json({ 
        success: true, 
        message: `Accès renvoyés avec succès à ${targetEmail}`,
        sentVia,
        email: targetEmail 
      });
    } catch (error: any) {
      console.error("[Resend Access Error]:", error);
      return res.status(500).json({ error: error.message || "Erreur lors de l'envoi des accès." });
    }
  });

  // API: Générer un code de vérification à 6 chiffres personnalisé et envoyer le courriel
  app.post("/api/send-custom-verification", async (req, res) => {
    try {
      const { email, firstName, lang } = req.body;
      if (!email) {
        return res.status(400).json({ error: "L'adresse email est requise." });
      }

      if (!firebaseInitialized) {
        return res.status(500).json({ error: "Le SDK Admin de Firebase n'est pas prêt." });
      }

      // 1. Générer le code à 6 chiffres
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // 2. Stocker le code dans Firebase Firestore (expiration sous 30 mins)
      try {
        await db.collection("verification_codes").doc(email).set({
          email,
          code,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 mins
          used: false
        });
      } catch (dbErr: any) {
        console.error("[Verification] Impossible de stocker le code dans Firestore :", dbErr.message);
        // On continue même en cas d'erreur de base de l'Admin SDK, car le client a déjà écrit le code
      }

      const { subject, html, text } = buildActivationEmail(code, firstName || "", lang || "en");

      // Envoi de l'email via la collection "mail" ou via Resend directement
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        try {
          const resend = new Resend(apiKey);
          const fromAddress = process.env.EMAIL_FROM_ADDRESS || "contact@safecallr.com";
          const fromName = process.env.EMAIL_FROM_NAME || "SafeCallr";

          await resend.emails.send({
            from: `${fromName} <${fromAddress}>`,
            to: email,
            subject: subject,
            html: html,
            text: text
          });

          console.log(`[Verification] Email de vérification à 6 chiffres envoyé à ${email} via Resend.`);
        } catch (resendErr) {
          console.error("[Verification] Échec de l'envoi via Resend d'Express, tentative de repli via Firestore...");
          await db.collection("mail").add({
            to: email,
            message: { subject, html, text },
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          }).catch(() => {});
        }
      } else {
        console.log(`[Verification] Pas de clé API Resend configurée. Enregistrement en brouillon dans Firestore mail...`);
        await db.collection("mail").add({
          to: email,
          message: { subject, html, text },
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        }).catch(() => {});
      }

      return res.json({ success: true });
    } catch (err: any) {
      console.error("[Verification] Erreur lors de la génération du code / envoi de l'email :", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // API: Endpoint de vérification de code à 6 chiffres pour SafeCallr
  app.post("/api/verify-email-code", async (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        return res.status(400).json({ error: "E-mail et code de validation requis." });
      }

      if (!firebaseInitialized || !db) {
        return res.status(500).json({ error: "Firebase non prêt ou inactif sur le serveur." });
      }

      const ref = db.collection("verification_codes").doc(email);
      const docSnap = await ref.get();

      if (!docSnap.exists) {
        return res.status(400).json({ error: "Code de validation incorrect ou expiré." });
      }

      const data = docSnap.data();

      if (data.used) {
        return res.status(400).json({ error: "Ce code de validation a déjà été utilisé." });
      }

      const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
      if (expiresAt < new Date()) {
        return res.status(400).json({ error: "Ce code de validation a expiré." });
      }

      if (data.code !== code) {
        return res.status(400).json({ error: "Code de validation incorrect." });
      }

      // Marquer le code comme utilisé
      await ref.update({ used: true }).catch(() => {});

      // Mettre à jour Firebase Auth
      try {
        const userRecord = await admin.auth().getUserByEmail(email);
        await admin.auth().updateUser(userRecord.uid, { emailVerified: true });
        
        // Mettre à jour Firestore document users & pros pour synchroniser
        await db.collection("users").doc(userRecord.uid).update({ emailVerified: true }).catch(() => {});
        await db.collection("pros").doc(userRecord.uid).update({ emailVerified: true }).catch(() => {});
      } catch (authErr: any) {
        console.warn("[Verification Code API] Note: Mise à jour optionnelle Firebase Auth bloquée ou échouée :", authErr.message);
      }

      return res.json({ success: true });
    } catch (err: any) {
      console.error("[Verification Code API] Erreur critique :", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // API: Endpoint de vérification d'e-mail personnalisé du protocole SafeCallr
  app.get("/api/verify-custom-email", async (req, res) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== "string") {
        return res.status(400).send(`
          <div style="font-family: sans-serif; text-align: center; padding: 50px; background-color: #0b0f19; color: #ffffff; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <div style="background-color: #111827; padding: 40px; border-radius: 16px; border: 1px solid #1f2937; max-width: 450px;">
              <h1 style="color: #ef4444; margin-top: 0;">Lien invalide</h1>
              <p style="color: #9ca3af; line-height: 1.6;">Le jeton de vérification est manquant, corrompu ou invalide.</p>
              <a href="/auth" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px;">Retour à la connexion</a>
            </div>
          </div>
        `);
      }

      if (!firebaseInitialized) {
        return res.status(500).send("Le SDK Admin de Firebase n'est pas prêt.");
      }

      const tokenRef = db.collection("verification_tokens").doc(token);
      const tokenDoc = await tokenRef.get();

      if (!tokenDoc.exists) {
        return res.status(404).send(`
          <div style="font-family: sans-serif; text-align: center; padding: 50px; background-color: #0b0f19; color: #ffffff; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <div style="background-color: #111827; padding: 40px; border-radius: 16px; border: 1px solid #1f2937; max-width: 450px;">
              <h1 style="color: #ef4444; margin-top: 0;">Lien inexistant ou expiré</h1>
              <p style="color: #9ca3af; line-height: 1.6;">Ce lien de validation n'existe pas ou a atteint sa date limite de validité.</p>
              <a href="/auth" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px;">Retour à la connexion</a>
            </div>
          </div>
        `);
      }

      const data = tokenDoc.data();
      if (data.used) {
        return res.redirect("/auth?verified=true");
      }

      const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
      if (expiresAt < new Date()) {
        return res.status(400).send(`
          <div style="font-family: sans-serif; text-align: center; padding: 50px; background-color: #0b0f19; color: #ffffff; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <div style="background-color: #111827; padding: 40px; border-radius: 16px; border: 1px solid #1f2937; max-width: 450px;">
              <h1 style="color: #ef4444; margin-top: 0;">Lien de validation expiré</h1>
              <p style="color: #9ca3af; line-height: 1.6;">Ce lien de sécurité a expiré. Pour des raisons de sécurité, les liens ont une validité de 24 heures.</p>
              <a href="/auth" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px;">Retour à la connexion</a>
            </div>
          </div>
        `);
      }

      // Marquer le jeton comme utilisé
      await tokenRef.update({ used: true });

      // Verifier l'utilisateur dans Firebase Auth via Admin SDK
      const uid = data.uid;
      await admin.auth().updateUser(uid, { emailVerified: true });

      // Mettre à jour le document utilisateur dans Firestore
      try {
        await db.collection("users").doc(uid).update({ emailVerified: true });
        console.log(`[Verification] Document utilisateur Firestore mis à jour avec emailVerified: true pour le UID ${uid}`);
      } catch (err) {
        console.warn(`[Verification] Impossible de mettre à jour le document Firestore pour le UID ${uid} (peut-être inexistant dans users):`, err);
      }

      return res.redirect("/auth?verified=true");
    } catch (err: any) {
      console.error("[Verification] Erreur de validation de l'e-mail personnalisé:", err);
      return res.status(500).send(`Erreur serveur interne: ${err.message}`);
    }
  });

  // API: Demande de contact entreprise
  app.post("/api/contact", async (req, res) => {
    try {
      const { firstName, lastName, email, phone, companyName, message } = req.body;

      if (!email || !firstName || !lastName || !message) {
        return res.status(400).json({ error: "Champs obligatoires manquants" });
      }

      // 1. Enregistrer la demande dans Firestore
      const requestData = {
        firstName,
        lastName,
        email,
        phone: phone || "",
        companyName: companyName || "",
        message,
        targetEmail: "contact@safecallr.com",
        status: "new",
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection("companyContactRequests").add(requestData);

      // 2. Déclencher l'envoi d'un email via l'extension Trigger Email (collection 'mail')
      await db.collection("mail").add({
        to: "contact@safecallr.com",
        replyTo: email,
        message: {
          subject: `NOUVELLE DEMANDE : ${companyName || firstName + " " + lastName}`,
          text: `
            Nom : ${firstName} ${lastName}
            Entreprise : ${companyName || "N/A"}
            Email : ${email}
            Téléphone : ${phone || "N/A"}
            
            Message :
            ${message}
          `,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 30px; border-radius: 20px;">
              <div style="background-color: #18181b; color: #4ade80; padding: 15px; border-radius: 12px; margin-bottom: 30px; text-align: center;">
                <h2 style="margin: 0;">Nouvelle Demande de Contact</h2>
              </div>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Expéditeur</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-weight: bold; text-align: right;">${firstName} ${lastName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Entreprise</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-weight: bold; text-align: right;">${companyName || "<i>Non précisée</i>"}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Email</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-weight: bold; text-align: right;"><a href="mailto:${email}" style="color: #4ade80; text-decoration: none;">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Téléphone</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-weight: bold; text-align: right;">${phone || "<i>Non précisé</i>"}</td>
                </tr>
              </table>
              
              <div style="margin-top: 30px; background-color: #f9fafb; padding: 20px; border-radius: 12px;">
                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Message</p>
                <p style="margin: 0; line-height: 1.6; color: #1f2937;">${message.replace(/\n/g, '<br>')}</p>
              </div>
              
              <p style="margin-top: 40px; font-size: 11px; color: #9ca3af; text-align: center;">Ce message a été généré automatiquement par le formulaire de contact SafeCallr.</p>
            </div>
          `
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Contact API Error:", error);
      res.status(500).json({ error: "Une erreur est survenue lors du traitement de votre demande." });
    }
  });

  // API: Sitemap dynamique
  app.get(["/sitemap.xml", "/api/sitemap.xml", "/api/sitemap"], async (req, res) => {
    const baseUrl = "https://safecallr.com";
    const pages = [
      { url: "/", priority: 1.0, changefreq: "daily" },
      { url: "/particuliers", priority: 0.9, changefreq: "weekly" },
      { url: "/professionnels", priority: 0.9, changefreq: "weekly" },
      { url: "/entreprises", priority: 0.9, changefreq: "weekly" },
      { url: "/institutions", priority: 0.8, changefreq: "weekly" },
      { url: "/how-it-works", priority: 0.8, changefreq: "monthly" },
      { url: "/actualite", priority: 0.8, changefreq: "daily" },
      { url: "/company-contact", priority: 0.7, changefreq: "monthly" },
      // Legal Pages - FR / EN / ES
      { url: "/cgu", priority: 0.5, changefreq: "monthly" },
      { url: "/terms", priority: 0.5, changefreq: "monthly" },
      { url: "/terminos", priority: 0.5, changefreq: "monthly" },
      { url: "/confidentialite", priority: 0.5, changefreq: "monthly" },
      { url: "/privacy", priority: 0.5, changefreq: "monthly" },
      { url: "/privacidad", priority: 0.5, changefreq: "monthly" },
      { url: "/mentions-legales", priority: 0.5, changefreq: "monthly" },
      { url: "/legal-notice", priority: 0.5, changefreq: "monthly" },
      { url: "/aviso-legal", priority: 0.5, changefreq: "monthly" },
    ];

    const escapeXml = (unsafe: string) => 
      unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '\'': return '&apos;';
          case '"': return '&quot;';
          default: return c;
        }
      });

    let dynamicArticleUrls: string[] = [];
    if (firebaseInitialized && db) {
      try {
        const blogSnap = await db.collection("blog_posts").get();
        blogSnap.forEach((doc: any) => {
          const data = doc.data();
          if (data.slug || data.metaTitle || doc.id) {
            const rawSlug = data.slug || encodeURIComponent(data.metaTitle || doc.id);
            dynamicArticleUrls.push(`/actualite/${rawSlug}`);
          }
        });
      } catch (err) {
        console.warn("[Sitemap] Unable to fetch blog posts for sitemap:", err);
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const staticUrlsXml = pages.map(page => `  <url>
    <loc>${escapeXml(baseUrl + page.url)}</loc>
    <lastmod>${todayStr}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n');

    const dynamicUrlsXml = dynamicArticleUrls.map(url => `  <url>
    <loc>${escapeXml(baseUrl + url)}</loc>
    <lastmod>${todayStr}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrlsXml}
${dynamicUrlsXml ? dynamicUrlsXml + '\n' : ''}</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(xml.trim());
  });

  // API: Trouver un utilisateur par téléphone
  app.get("/api/user-by-phone/:phone", requireAuth, async (req, res) => {
    try {
      const { phone } = req.params;
      const snapshot = await db.collection("users").where("phoneNumber", "==", phone).limit(1).get();
      
      if (snapshot.empty) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      const userData = snapshot.docs[0].data();
      res.json({ uid: userData.uid, displayName: userData.displayName });
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // API: Trouver un utilisateur par ID
  app.get("/api/user-by-id/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const doc = await db.collection("users").doc(id).get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      const userData = doc.data();
      res.json({ uid: userData?.uid, displayName: userData?.displayName });
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // API: Envoyer une notification FCM
  app.post("/api/notify", requireAuth, async (req, res) => {
    try {
      const { recipientId, title, body, data } = req.body;
      
      if (!recipientId) return res.status(400).json({ error: "recipientId manquant" });

      const userDoc = await db.collection("users").doc(recipientId).get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: "Utilisateur destinataire non trouvé" });
      }

      const userData = userDoc.data();
      const targetToken = userData?.fcmToken || userData?.token;

      if (!targetToken || typeof targetToken !== "string") {
        return res.status(404).json({ error: "Token FCM du destinataire non trouvé" });
      }

      const message = {
        notification: { title, body },
        data: data || {},
        token: targetToken,
      };

      await fcm.send(message);
      res.json({ success: true });
    } catch (error) {
      console.error("FCM Error:", error);
      res.status(500).json({ error: "Erreur d'envoi notification" });
    }
  });

  // API: Supprimer un utilisateur par email (Auth + Firestore) - Pour reset de compte
  app.post("/api/admin/delete-user", async (req, res) => {
    try {
      const idToken = req.headers.authorization?.split("Bearer ")[1] || req.body.idToken;
      if (!idToken) return res.status(401).json({ error: "Non authentifié" });

      try {
        await verifyAdmin(idToken);
      } catch (adminErr: any) {
        return res.status(403).json({ error: adminErr.message || "Accès refusé" });
      }

      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email manquant" });

      console.log(`Tentative de réinitialisation complète pour: ${email}`);
      
      let uid = null;
      
      // 1. Tenter de trouver l'UID via Firebase Auth
      try {
        const userRecord = await admin.auth().getUserByEmail(email);
        uid = userRecord.uid;
        console.log(`UID trouvé dans Auth: ${uid}`);
      } catch (authErr: any) {
        console.log(`L'email ${email} n'est pas dans Firebase Auth.`);
      }

      // 2. Si non trouvé dans Auth, chercher dans Firestore (pros)
      if (!uid) {
        const prosSnap = await db.collection("pros").where("email", "==", email).limit(1).get();
        if (!prosSnap.empty) {
          uid = prosSnap.docs[0].id;
          console.log(`UID trouvé dans Firestore (pros): ${uid}`);
        }
      }

      // 3. Si toujours non trouvé, chercher dans Firestore (users)
      if (!uid) {
        const usersSnap = await db.collection("users").where("email", "==", email).limit(1).get();
        if (!usersSnap.empty) {
          uid = usersSnap.docs[0].id;
          console.log(`UID trouvé dans Firestore (users): ${uid}`);
        }
      }

      if (!uid) {
        return res.status(404).json({ error: "Aucune trace de ce compte n'a été trouvée (ni dans Auth, ni dans Firestore)." });
      }

      // 4. Suppression de Firestore (toutes les collections possibles)
      const collections = ["pros", "users", "verification_requests"];
      for (const coll of collections) {
        try {
          if (coll === "verification_requests") {
            // Supprimer les requêtes liées
            const reqs = await db.collection(coll).where("requesterId", "==", uid).get();
            const batch = db.batch();
            reqs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
          } else {
            await db.collection(coll).doc(uid).delete();
          }
        } catch (e) {
          console.error(`Erreur suppression collection ${coll}:`, e);
        }
      }
      
      // 5. Suppression de Firebase Auth
      try {
        await admin.auth().deleteUser(uid);
        console.log(`Utilisateur supprimé de Firebase Auth: ${uid}`);
      } catch (e: any) {
        if (e.code !== "auth/user-not-found") {
          console.error("Erreur suppression Auth:", e);
        }
      }

      res.json({ success: true, message: `Le compte ${email} a été entièrement réinitialisé.` });
    } catch (error: any) {
      console.error("Global Reset Error:", error);
      res.status(500).json({ error: error.message || "Erreur lors de la réinitialisation" });
    }
  });

  // API: Créer une organisation (Privilégié)
  app.post("/api/admin/create-organization", async (req, res) => {
    let logSteps: string[] = ["Route entered"];
    try {
      const { 
        idToken,
        orgData,
        repData,
        lang
      } = req.body;

      logSteps.push(`Received payload. OrgName: ${orgData?.name}, Siret: ${orgData?.siret}, RepEmail: ${repData?.email}`);
      safeWriteFileSync("./create-org-progress.log", JSON.stringify({ steps: logSteps }, null, 2));

      if (!idToken) {
        logSteps.push("Error: No idToken provided");
        safeWriteFileSync("./create-org-progress.log", JSON.stringify({ steps: logSteps }, null, 2));
        return res.status(401).json({ error: "Non authentifié" });
      }

      // 1. Vérifier l'identité et le rôle de l'appelant
      logSteps.push("Verifying caller token...");
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const callerUid = decodedToken.uid;
      const callerEmail = decodedToken.email;
      logSteps.push(`Caller verified: ${callerEmail} (UID: ${callerUid})`);
      safeWriteFileSync("./create-org-progress.log", JSON.stringify({ steps: logSteps }, null, 2));

      const superAdmins = [
        "xdcam10@gmail.com",
        "contact@wrpproduction.com",
        "contact@safecallr.com"
      ];

      const isAdminEmail = superAdmins.includes(callerEmail || "");
      let adminExists = false;

      if (!isAdminEmail) {
        try {
          const adminDoc = await db.collection("admins").doc(callerUid).get();
          adminExists = adminDoc.exists;
        } catch (dbErr: any) {
          logSteps.push(`Database check failed for non-admin: ${dbErr.message}`);
          console.warn("[create-organization] Failed to read admins collection:", dbErr.message);
        }
      } else {
        adminExists = true;
      }
      
      if (!isAdminEmail && !adminExists) {
        logSteps.push(`Access denied for ${callerEmail}`);
        safeWriteFileSync("./create-org-progress.log", JSON.stringify({ steps: logSteps }, null, 2));
        return res.status(403).json({ error: "Accès refusé. Réservé aux super-administrateurs." });
      }

      // Si c'est un super-admin par email mais pas encore dans la collection admins, on l'ajoute
      if (isAdminEmail) {
        try {
          const adminDoc = await db.collection("admins").doc(callerUid).get();
          if (!adminDoc.exists) {
            logSteps.push(`Adding ${callerEmail} to admins collection...`);
            await db.collection("admins").doc(callerUid).set({
              uid: callerUid,
              email: callerEmail,
              role: "admin",
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`Utilisateur ${callerEmail} promu admin dans Firestore.`);
          }
        } catch (err: any) {
          logSteps.push(`Warning: could not promote admin in Firestore: ${err.message}`);
        }
      }

      // 2. Vérifier si le SIRET existe déjà
      logSteps.push(`Checking if SIRET ${orgData?.siret} already exists...`);
      const siretSnapshot = await db.collection("organizations").where("siret", "==", orgData.siret).limit(1).get();
      if (!siretSnapshot.empty) {
        logSteps.push(`Error: SIRET ${orgData?.siret} already exists`);
        safeWriteFileSync("./create-org-progress.log", JSON.stringify({ steps: logSteps }, null, 2));
        return res.status(400).json({ error: "Une organisation avec ce SIRET existe déjà." });
      }

      // 3. Vérifier si l'email du représentant existe déjà
      logSteps.push(`Checking if representative email ${repData?.email} already exists...`);
      try {
        await admin.auth().getUserByEmail(repData.email);
        logSteps.push(`Error: Representative email ${repData?.email} already exists`);
        safeWriteFileSync("./create-org-progress.log", JSON.stringify({ steps: logSteps }, null, 2));
        return res.status(400).json({ error: "L'email du représentant est déjà utilisé." });
      } catch (authErr: any) {
        // User not found is what we want
        if (authErr.code !== "auth/user-not-found") {
          logSteps.push(`Unexpected Auth error on getUserByEmail: ${authErr.message}`);
          throw authErr;
        }
      }

      // 4. Création de l'organisation
      logSteps.push("Creating organization ID ref...");
      const orgRef = db.collection("organizations").doc();
      const orgId = orgRef.id;
      logSteps.push(`Org ID created: ${orgId}`);

      // 5. Création du compte représentant
      logSteps.push(`Creating Auth representative user with email ${repData?.email}...`);
      const userRecord = await admin.auth().createUser({
        email: repData.email,
        displayName: `${repData.firstName} ${repData.lastName}`,
        emailVerified: false,
      });
      const repUid = userRecord.uid;
      logSteps.push(`Auth user created with UID ${repUid}`);
      safeWriteFileSync("./create-org-progress.log", JSON.stringify({ steps: logSteps }, null, 2));

      // 6. Envoi lien d'activation (En Resend direct avec fallback en collection mail pour Firestore extension)
      logSteps.push(`Generating business activation link for ${repData?.email}...`);
      let activationLink = "";
      try {
        const baseUrl = process.env.APP_URL || "https://safecallr.com";
        activationLink = `${baseUrl}/business/register?orgId=${orgId}&email=${encodeURIComponent(repData.email)}&firstName=${encodeURIComponent(repData.firstName || '')}&lastName=${encodeURIComponent(repData.lastName || '')}&companyName=${encodeURIComponent(orgData.name || '')}&siret=${encodeURIComponent(orgData.siret || '')}&address=${encodeURIComponent(orgData.address || '')}&zipCode=${encodeURIComponent(orgData.zipCode || '')}&city=${encodeURIComponent(orgData.city || '')}`;
        logSteps.push(`Activation link generated: ${activationLink}`);
      } catch (linkErr: any) {
        logSteps.push(`Warning: could not generate custom link: ${linkErr.message}. Formatting fallback.`);
        activationLink = `https://safecallr.com/business/register?orgId=${orgId}&email=${encodeURIComponent(repData.email)}`;
      }
      console.log(`Lien d'activation pour ${repData.email}: ${activationLink}`);
      safeWriteFileSync("./create-org-progress.log", JSON.stringify({ steps: logSteps }, null, 2));

      const emailObj = buildOrganizationEmail(orgData.name, repData.firstName, activationLink, lang || "fr");
      const orgMailSubject = emailObj.subject;
      const orgMailHtml = emailObj.html;
      const orgMailText = emailObj.text;

      // Dual sending system (Resend API first, Firestore mail collection fallback)
      logSteps.push("Attempting to send activation email...");
      const apiKey = process.env.RESEND_API_KEY;
      let emailSentDirectly = false;

      if (apiKey) {
        try {
          const resend = new Resend(apiKey);
          const fromAddress = process.env.EMAIL_FROM_ADDRESS || "contact@safecallr.com";
          const fromName = process.env.EMAIL_FROM_NAME || "SafeCallr";

          await resend.emails.send({
            from: `${fromName} <${fromAddress}>`,
            to: repData.email,
            subject: orgMailSubject,
            html: orgMailHtml,
            text: orgMailText
          });
          logSteps.push(`Success: Activation email sent directly via Resend to ${repData.email}`);
          console.log(`[Create Org Mail] Mail envoyé directement avec succès à ${repData.email} via Resend.`);
          emailSentDirectly = true;
        } catch (resendErr: any) {
          logSteps.push(`Warning: Resend direct email failed: ${resendErr.message}. Falling back to Firestore mail collection...`);
          console.error("[Create Org Mail] Échec Resend, repli vers Firestore mail...", resendErr);
        }
      }

      if (!emailSentDirectly) {
        logSteps.push("Adding entry to Firestore 'mail' collection as fallback...");
        try {
          await db.collection("mail").add({
            to: repData.email,
            message: {
              subject: orgMailSubject,
              html: orgMailHtml,
              text: orgMailText
            },
            orgId: orgId,
            type: "invitation",
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
          logSteps.push("Fallback: Mail document successfully added to Firestore.");
        } catch (mailErr: any) {
          logSteps.push(`Warning: mail collection add fallback failed: ${mailErr.message}. Continuing transaction anyway...`);
        }
      }
      safeWriteFileSync("./create-org-progress.log", JSON.stringify({ steps: logSteps }, null, 2));

      // 7. Transactionnelle : Création documents Firestore
      logSteps.push("Setting up batch write...");
      const batch = db.batch();
      
      const initialStatus = orgData.status || "pending";
      const initialCapabilities = orgData.capabilities || {
        external: orgData.capabilities?.external ?? (orgData.type === "business" ? false : true),
        internal: orgData.capabilities?.internal ?? (orgData.type === "business" ? true : false)
      };

      batch.set(orgRef, {
        ...orgData,
        id: orgId,
        status: initialStatus,
        active: initialStatus === "active",
        capabilities: initialCapabilities,
        representativeUserId: repUid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: callerUid
      });

      batch.set(orgRef.collection("members").doc(repUid), {
        id: repUid,
        firstName: repData.firstName,
        lastName: repData.lastName,
        email: repData.email,
        role: orgData.type === "business" ? "admin" : "representative",
        status: "active",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: callerUid
      });

      // Aussi créer le profil dans la collection users générale pour qu'il puisse se connecter
      batch.set(db.collection("users").doc(repUid), {
        uid: repUid,
        orgId: orgId,
        userClass: "professional",
        firstName: repData.firstName,
        lastName: repData.lastName,
        displayName: `${repData.firstName} ${repData.lastName}`,
        email: repData.email,
        phoneNumber: repData.directPhone || "", // Optionnel au début
        role: "pro_representative",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      logSteps.push("Committing batch write...");
      await batch.commit();
      logSteps.push("Batch transaction committed successfully!");
      safeWriteFileSync("./create-org-progress.log", JSON.stringify({ steps: logSteps }, null, 2));

      res.json({ success: true, orgId, activationLink });

    } catch (error: any) {
      console.error("Create Org Error:", error);
      logSteps.push(`CRITICAL ERROR: ${error.message}`);
      if (error.stack) logSteps.push(`STACK: ${error.stack}`);
      safeWriteFileSync("./create-org-progress.log", JSON.stringify({ steps: logSteps, error: error.message }, null, 2));
      res.status(500).json({ error: error.message || "Erreur lors de la création de l'organisation" });
    }
  });

  // API: Liste de toutes les organisations (Admin)
  app.get("/api/admin/organizations", async (req, res) => {
    try {
      const idToken = req.headers.authorization?.split("Bearer ")[1];
      if (!idToken) return res.status(401).json({ error: "Non authentifié" });
      await verifyAdmin(idToken);

      const snapshot = await db.collection("organizations").orderBy("createdAt", "desc").get();
      const orgs = [];

      for (const doc of snapshot.docs) {
        const data = doc.data();
        let totalMembers = 0;
        try {
          const membersSnap = await db.collection("organizations").doc(doc.id).collection("members").get();
          totalMembers = membersSnap.size;
        } catch (mErr) {
          console.warn(`Could not count members for org ${doc.id}`, mErr);
        }
        orgs.push({ id: doc.id, ...data, totalMembers });
      }

      res.json(orgs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API: Détail d'une organisation (Admin)
  app.get("/api/admin/organizations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const idToken = req.headers.authorization?.split("Bearer ")[1];
      if (!idToken) return res.status(401).json({ error: "Non authentifié" });
      await verifyAdmin(idToken);

      const orgDoc = await db.collection("organizations").doc(id).get();
      if (!orgDoc.exists) return res.status(404).json({ error: "Organisation non trouvée" });

      const membersCount = await db.collection("organizations").doc(id).collection("members").count().get();
      const activeMembersCount = await db.collection("organizations").doc(id).collection("members").where("status", "==", "active").count().get();
      const authCount = await db.collection("organizations").doc(id).collection("authRequests").count().get();
      
      // Audit log (10 derniers)
      const auditLogSnap = await db.collection("organizations").doc(id).collection("auditLog").orderBy("createdAt", "desc").limit(10).get();
      const auditLog = auditLogSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Représentant actuel
      const repUid = orgDoc.data()?.representativeUserId;
      let representative = null;
      if (repUid) {
        const repDoc = await db.collection("organizations").doc(id).collection("members").doc(repUid).get();
        representative = repDoc.exists ? repDoc.data() : null;
      }

      res.json({
        ...orgDoc.data(),
        id: orgDoc.id,
        stats: {
          totalMembers: membersCount.data().count,
          activeMembers: activeMembersCount.data().count,
          totalAuths: authCount.data().count
        },
        auditLog,
        representative
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API: Modifier infos légales (Admin)
  app.post("/api/admin/organizations/:id/legal", async (req, res) => {
    try {
      const { id } = req.params;
      const { idToken, data } = req.body;
      const actor = await verifyAdmin(idToken);

      const orgRef = db.collection("organizations").doc(id);
      const oldDoc = await orgRef.get();
      if (!oldDoc.exists) return res.status(404).json({ error: "Organisation non trouvée" });

      await orgRef.update(data);
      await createAuditLog(id, actor, 'update_legal', { before: oldDoc.data(), after: data });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API: Modifier identité visuelle / branding (Admin)
  app.post("/api/admin/organizations/:id/branding", async (req, res) => {
    try {
      const { id } = req.params;
      const { idToken, logoUrl, primaryColor, trustMessage } = req.body;
      const actor = await verifyAdmin(idToken);

      const orgRef = db.collection("organizations").doc(id);
      const oldDoc = await orgRef.get();
      if (!oldDoc.exists) return res.status(404).json({ error: "Organisation non trouvée" });

      const updateData: any = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
      if (primaryColor !== undefined) updateData.primaryColor = primaryColor;
      if (trustMessage !== undefined) updateData.trustMessage = trustMessage;

      await orgRef.update(updateData);

      try {
        await db.collection("companies").doc(id).update(updateData);
      } catch (e2) {}

      await createAuditLog(id, actor, 'update_branding', { before: oldDoc.data(), after: updateData });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API: Changer statut organisation (Admin)
  app.post("/api/admin/organizations/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { idToken, active, status } = req.body;
      const actor = await verifyAdmin(idToken);

      const targetStatus = status || (active ? "active" : "deactivated");
      const isActive = targetStatus === "active";

      await db.collection("organizations").doc(id).update({
        status: targetStatus,
        active: isActive,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      try {
        await db.collection("companies").doc(id).update({
          status: targetStatus,
          active: isActive,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (e2) {}

      await createAuditLog(id, actor, isActive ? 'reactivate' : 'deactivate', { status: targetStatus, active: isActive });

      res.json({ success: true, status: targetStatus, active: isActive });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API: Mettre a jour les capacites (External / Internal Business) (Admin)
  app.post("/api/admin/organizations/:id/capabilities", async (req, res) => {
    try {
      const { id } = req.params;
      const { idToken, capabilities } = req.body; // { external: boolean, internal: boolean }
      const actor = await verifyAdmin(idToken);

      await db.collection("organizations").doc(id).update({
        capabilities,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      try {
        await db.collection("companies").doc(id).update({
          capabilities,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (e2) {}

      await createAuditLog(id, actor, 'update_legal', { capabilities });

      res.json({ success: true, capabilities });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API: Changer représentant (Admin)
  app.post("/api/admin/organizations/:id/representative", async (req, res) => {
    try {
      const { id } = req.params;
      const { idToken, reqData, mode } = req.body; // mode: 'promote' | 'create'
      const actor = await verifyAdmin(idToken);

      const orgRef = db.collection("organizations").doc(id);
      const oldOrgData = await orgRef.get();
      if (!oldOrgData.exists) return res.status(404).json({ error: "Org non trouvée" });

      let newRepUid = "";

      if (mode === 'create') {
        // Créer nouveau compte Firebase Auth
        const userRec = await admin.auth().createUser({
          email: reqData.email,
          displayName: `${reqData.firstName} ${reqData.lastName}`
        });
        newRepUid = userRec.uid;

        // Créer membre
        await orgRef.collection("members").doc(newRepUid).set({
          id: newRepUid,
          firstName: reqData.firstName,
          lastName: reqData.lastName,
          email: reqData.email,
          role: "representative",
          status: "active",
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        newRepUid = reqData.uid;
        // Mettre à jour rôle
        await orgRef.collection("members").doc(newRepUid).update({ role: "representative" });
      }

      // Rétrograder l'ancien représentant
      const oldRepUid = oldOrgData.data()?.representativeUserId;
      if (oldRepUid && oldRepUid !== newRepUid) {
        await orgRef.collection("members").doc(oldRepUid).update({ role: "collaborator" });
      }

      // Mettre à jour org
      await orgRef.update({ representativeUserId: newRepUid });

      await createAuditLog(id, actor, 'change_representative', { from: oldRepUid, to: newRepUid });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API: Suppression organisation (Admin)
  app.delete("/api/admin/organizations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const idToken = req.headers.authorization?.split("Bearer ")[1];
      if (!idToken) return res.status(401).json({ error: "Non authentifié" });
      await verifyAdmin(idToken);

      // Deep delete: members, authRequests, auditLog
      const orgRef = db.collection("organizations").doc(id);
      
      const subcollections = ["members", "authRequests", "auditLog"];
      for (const sub of subcollections) {
        const snap = await orgRef.collection(sub).get();
        const batch = db.batch();
        snap.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }

      await orgRef.delete();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API: Stats globales (Admin)
  app.get("/api/admin/stats/global", async (req, res) => {
    try {
      const idToken = req.headers.authorization?.split("Bearer ")[1];
      if (!idToken) return res.status(401).json({ error: "Non authentifié" });
      await verifyAdmin(idToken);

      const orgsCount = await db.collection("organizations").count().get();
      const activeOrgsCount = await db.collection("organizations").where("active", "==", true).count().get();
      
      const usersCount = await db.collection("users").count().get();
      const prosCount = await db.collection("pros").count().get();
      const authRequestsCount = await db.collection("authRequests").count().get();
      
      res.json({
        totalOrganizations: orgsCount.data().count,
        activeOrganizations: activeOrgsCount.data().count,
        totalUsers: usersCount.data().count,
        totalPros: prosCount.data().count,
        totalAuths30d: authRequestsCount.data().count
      });
    } catch (error: any) {
      console.error("Stats API Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Ajouter un collaborateur (Par le Représentant)
  app.post("/api/dashboard/create-member", async (req, res) => {
    try {
      const { idToken, orgId, memberData, lang } = req.body;
      if (!idToken || !orgId) return res.status(401).json({ error: "Requête invalide" });

      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const callerUid = decodedToken.uid;

      // Vérifier si l'appelant est le représentant de l'organisation
      const orgDoc = await db.collection("organizations").doc(orgId).get();
      if (!orgDoc.exists || orgDoc.data()?.representativeUserId !== callerUid) {
        return res.status(403).json({ error: "Accès refusé. Réservé au représentant." });
      }

      // Vérifier le domaine de l'email
      const emailDomain = memberData.email.split("@")[1];
      const allowedDomains = orgDoc.data()?.allowedEmailDomains || [];
      if (!allowedDomains.includes(emailDomain)) {
        return res.status(400).json({ error: `L'email doit appartenir à l'un des domaines autorisés : ${allowedDomains.join(", ")}` });
      }

      // Création Auth
      const userRecord = await admin.auth().createUser({
        email: memberData.email,
        displayName: `${memberData.firstName} ${memberData.lastName}`,
      });
      const memberUid = userRecord.uid;

      // Envoi lien d'activation
      const actionCodeSettings = {
        url: process.env.APP_URL ? `${process.env.APP_URL}/auth?mode=login` : 'https://safecallr.com/auth?mode=login',
        handleCodeInApp: true,
      };
      const activationLink = await admin.auth().generatePasswordResetLink(memberData.email, actionCodeSettings);
      console.log(`Lien d'activation pour collaborateur ${memberData.email}: ${activationLink}`);

      // Build and send the activation email
      const orgName = orgDoc.data()?.name || "SafeCallr";
      const emailObj = buildOrganizationEmail(orgName, memberData.firstName, activationLink, lang || "fr");
      const { subject, html, text } = emailObj;

      // Dual sending system (Resend API first, Firestore mail collection fallback)
      const apiKey = process.env.RESEND_API_KEY;
      let emailSentDirectly = false;

      if (apiKey) {
        try {
          const resend = new Resend(apiKey);
          const fromAddress = process.env.EMAIL_FROM_ADDRESS || "contact@safecallr.com";
          const fromName = process.env.EMAIL_FROM_NAME || "SafeCallr";

          await resend.emails.send({
            from: `${fromName} <${fromAddress}>`,
            to: memberData.email,
            subject: subject,
            html: html,
            text: text
          });
          emailSentDirectly = true;
          console.log(`[Create Member Mail] Mail envoyé directement avec succès à ${memberData.email} via Resend.`);
        } catch (resendErr: any) {
          console.error("[Create Member Mail] Échec Resend, repli vers Firestore mail...", resendErr);
        }
      }

      if (!emailSentDirectly) {
        try {
          await db.collection("mail").add({
            to: memberData.email,
            message: {
              subject: subject,
              html: html,
              text: text
            },
            orgId: orgId,
            type: "invitation",
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`[Create Member Mail] Enregistré dans Firestore 'mail' collection.`);
        } catch (mailErr: any) {
          console.warn("[Create Member Mail] Warning: mail collection add fallback failed:", mailErr.message);
        }
      }

      const batch = db.batch();
      batch.set(db.collection("organizations").doc(orgId).collection("members").doc(memberUid), {
        id: memberUid,
        ...memberData,
        role: "collaborator",
        status: "active",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: callerUid
      });

      batch.set(db.collection("users").doc(memberUid), {
        uid: memberUid,
        orgId: orgId,
        userClass: "professional",
        firstName: memberData.firstName,
        lastName: memberData.lastName,
        displayName: `${memberData.firstName} ${memberData.lastName}`,
        email: memberData.email,
        role: "pro_collaborator",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      await batch.commit();
      res.json({ success: true, memberId: memberUid });

    } catch (error: any) {
      console.error("Create Member Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Import massif CSV de collaborateurs (SafeCallr Business & Organisations)
  app.post("/api/dashboard/import-members-csv", async (req, res) => {
    try {
      const { idToken, orgId, members, lang } = req.body;
      if (!idToken || !orgId || !Array.isArray(members)) {
        return res.status(400).json({ error: "Données requises manquantes ou format invalide." });
      }

      // Verify Auth Token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const callerUid = decodedToken.uid;

      // Check Organization or Company
      let orgDoc = await db.collection("organizations").doc(orgId).get();
      let collectionName = "organizations";
      if (!orgDoc.exists) {
        orgDoc = await db.collection("companies").doc(orgId).get();
        collectionName = "companies";
      }

      const orgData = orgDoc.data();
      const allowedDomains = orgData?.allowedEmailDomains || (orgData?.domain ? [orgData.domain] : []);

      let importedCount = 0;
      const errors: Array<{ email: string; reason: string }> = [];

      for (const m of members) {
        try {
          const email = (m.email || "").trim().toLowerCase();
          const firstName = (m.firstName || m.prenom || "").trim();
          const lastName = (m.lastName || m.nom || "").trim();
          const phone = (m.phone || m.telephone || "").trim();
          const jobTitle = (m.jobTitle || m.fonction || "").trim();

          if (!email || !firstName || !lastName) {
            errors.push({ email: email || "N/A", reason: "Champs nom, prénom ou email manquants." });
            continue;
          }

          // Domain check if allowed domains defined
          if (allowedDomains.length > 0) {
            const emailDomain = email.split("@")[1];
            if (!emailDomain || !allowedDomains.includes(emailDomain)) {
              errors.push({ email, reason: `Domaine '@${emailDomain}' non autorisé. Domaines autorisés: ${allowedDomains.join(", ")}` });
              continue;
            }
          }

          // Check or create auth user
          let memberUid: string;
          try {
            const existingUser = await admin.auth().getUserByEmail(email);
            memberUid = existingUser.uid;
          } catch {
            const userRecord = await admin.auth().createUser({
              email: email,
              phoneNumber: phone ? (phone.startsWith("+") ? phone : undefined) : undefined,
              displayName: `${firstName} ${lastName}`
            });
            memberUid = userRecord.uid;
          }

          // Save member in collection
          const memberRef = db.collection(collectionName).doc(orgId).collection("members").doc(memberUid);
          await memberRef.set({
            id: memberUid,
            firstName,
            lastName,
            displayName: `${firstName} ${lastName}`,
            email,
            phone,
            jobTitle,
            role: "collaborator",
            status: "active",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: callerUid
          }, { merge: true });

          // Also mirror in global 'users' collection
          await db.collection("users").doc(memberUid).set({
            uid: memberUid,
            orgId: orgId,
            userClass: "professional",
            firstName,
            lastName,
            displayName: `${firstName} ${lastName}`,
            email,
            phone,
            jobTitle,
            role: "pro_collaborator",
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

          importedCount++;
        } catch (mErr: any) {
          console.error(`Error importing member ${m.email}:`, mErr);
          errors.push({ email: m.email || "N/A", reason: mErr.message || "Erreur d'importation" });
        }
      }

      res.json({
        success: true,
        importedCount,
        failedCount: errors.length,
        errors
      });

    } catch (error: any) {
      console.error("CSV Import Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Activation d'un compte organisation / business via lien d'invitation
  app.post("/api/business/activate-account", async (req, res) => {
    try {
      const {
        orgId,
        email,
        password,
        firstName,
        lastName,
        companyName,
        siret,
        address,
        zipCode,
        city,
        phoneNumber,
        jobTitle
      } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "E-mail et mot de passe requis." });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères." });
      }

      const trimmedEmail = email.trim().toLowerCase();

      // 1. Check or create Firebase Auth user
      let userRecord;
      try {
        userRecord = await admin.auth().getUserByEmail(trimmedEmail);
        // User exists (e.g. pre-created by admin SDK), update password and verify email
        await admin.auth().updateUser(userRecord.uid, {
          password: password,
          emailVerified: true,
          displayName: `${firstName || ''} ${lastName || ''}`.trim() || undefined
        });
      } catch (authErr: any) {
        if (authErr.code === "auth/user-not-found") {
          userRecord = await admin.auth().createUser({
            email: trimmedEmail,
            password: password,
            emailVerified: true,
            displayName: `${firstName || ''} ${lastName || ''}`.trim() || undefined
          });
        } else {
          throw authErr;
        }
      }

      const uid = userRecord.uid;

      // 2. Resolve or create Organization document
      let targetOrgId = orgId;
      if (!targetOrgId) {
        const orgsSnap = await db.collection("organizations").where("adminEmail", "==", trimmedEmail).limit(1).get();
        if (!orgsSnap.empty) {
          targetOrgId = orgsSnap.docs[0].id;
        } else {
          const newOrgRef = db.collection("organizations").doc();
          targetOrgId = newOrgRef.id;
        }
      }

      const fullAddress = address ? `${address}, ${zipCode || ''} ${city || ''}` : '';

      // Update / set Organization doc
      const orgRef = db.collection("organizations").doc(targetOrgId);
      await orgRef.set({
        id: targetOrgId,
        name: companyName || "Organisation",
        siret: siret || "",
        address: fullAddress,
        streetNumber: address ? (address.split(" ")[0] || "") : "",
        zipCode: zipCode || "",
        city: city || "",
        adminEmail: trimmedEmail,
        status: "active",
        active: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        allowedEmailDomains: [trimmedEmail.split("@")[1] || "gmail.com"]
      }, { merge: true });

      // Update / set Member record
      const memberRef = db.collection("organizations").doc(targetOrgId).collection("members").doc(uid);
      await memberRef.set({
        firstName: firstName || "",
        lastName: lastName || "",
        email: trimmedEmail,
        role: "admin",
        status: "active",
        jobTitle: jobTitle || "Administrateur principal",
        directPhone: phoneNumber || "",
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // Update / set User record
      const userRef = db.collection("users").doc(uid);
      await userRef.set({
        uid: uid,
        userClass: "professional",
        firstName: firstName || "",
        lastName: lastName || "",
        displayName: `${firstName || ''} ${lastName || ''}`.trim(),
        email: trimmedEmail,
        phoneNumber: phoneNumber || "",
        orgId: targetOrgId,
        role: "representative",
        emailVerified: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // Create Custom Token for seamless auto-login on frontend
      const customToken = await admin.auth().createCustomToken(uid);

      return res.json({
        success: true,
        customToken,
        orgId: targetOrgId,
        message: "Compte organisation activé avec succès !"
      });

    } catch (err: any) {
      console.error("Error in /api/business/activate-account:", err);
      return res.status(500).json({ error: err.message || "Erreur lors de l'activation du compte." });
    }
  });

  // API: Modifier statut collaborateur
  app.post("/api/dashboard/update-member-status", async (req, res) => {
    try {
      const { idToken, orgId, memberId, status } = req.body;
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const callerUid = decodedToken.uid;

      const orgDoc = await db.collection("organizations").doc(orgId).get();
      if (!orgDoc.exists || orgDoc.data()?.representativeUserId !== callerUid) {
        return res.status(403).json({ error: "Accès refusé." });
      }

      await db.collection("organizations").doc(orgId).collection("members").doc(memberId).update({
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API: Export CSV Authentifications
  app.get("/api/dashboard/export-auth-requests/:orgId", async (req, res) => {
     try {
       const { orgId } = req.params;
       const idToken = req.headers.authorization?.split("Bearer ")[1];
       if (!idToken) return res.status(401).json({ error: "L'authentification est requise." });

       const decodedToken = await admin.auth().verifyIdToken(idToken);
       const callerUid = decodedToken.uid;

       const orgDoc = await db.collection("organizations").doc(orgId).get();
       if (!orgDoc.exists || orgDoc.data()?.representativeUserId !== callerUid) {
         return res.status(403).json({ error: "Accès refusé." });
       }

       const snapshot = await db.collection("organizations").doc(orgId).collection("authRequests")
         .orderBy("createdAt", "desc")
         .limit(1000) // Limitation pour l'exemple
         .get();

       let csv = "date_iso,collaborateur,telephone_client_masque,statut,ip\n";
       snapshot.forEach(doc => {
         const d = doc.data();
         const date = d.createdAt.toDate().toISOString();
         const maskedPhone = d.clientPhone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 ** ** ** $5");
         csv += `${date},${d.memberName},${maskedPhone},${d.status},${d.ipAddress}\n`;
       });

       res.setHeader("Content-Type", "text/csv");
       res.setHeader("Content-Disposition", `attachment; filename=safecallr-export-${orgId}.csv`);
       res.send(csv);

     } catch (error: any) {
       res.status(500).json({ error: error.message });
     }
  });

  // API: Déclencher une demande d'authentification
  app.post("/api/auth/trigger", async (req, res) => {
    try {
      const { idToken, orgId, clientPhone } = req.body;
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const callerUid = decodedToken.uid;

      // 1. Vérifier le membre
      const memberDoc = await db.collection("organizations").doc(orgId).collection("members").doc(callerUid).get();
      if (!memberDoc.exists || memberDoc.data()?.status !== "active") {
        return res.status(403).json({ error: "Votre compte collaborateur n'est pas actif." });
      }

      const memberData = memberDoc.data()!;

      // 2. Vérifier l'organisation (statut active & capacité external)
      const orgDoc = await db.collection("organizations").doc(orgId).get();
      const orgData = orgDoc.data();
      
      if (!orgDoc.exists) {
        return res.status(404).json({ error: "Organisation introuvable." });
      }

      if (orgData?.status === "pending") {
        return res.status(403).json({ error: "Votre organisation est en attente de validation par l'administration SafeCallr. Aucune vérification ne peut être émise tant que votre compte n'a pas été validé." });
      }

      if (!orgData?.active || orgData?.status === "suspended" || orgData?.status === "deactivated") {
        return res.status(403).json({ error: "Votre organisation est inactives ou suspendue." });
      }

      if (orgData?.capabilities?.external === false) {
        return res.status(403).json({ error: "La capacité de vérification externe (clients finaux) n'est pas activée pour votre organisation." });
      }

      // 3. Vérifier si le client est inscrit
      const userSnapshot = await db.collection("users").where("phoneNumber", "==", clientPhone).limit(1).get();
      if (userSnapshot.empty) {
        return res.status(404).json({ error: "Ce client n'est pas inscrit sur SafeCallr." });
      }

      const userData = userSnapshot.docs[0].data();

      // 4. Générer le code à 4 chiffres
      const code = Math.floor(1000 + Math.random() * 9000).toString();

      // 5. Créer l'authRequest
      const requestRef = db.collection("organizations").doc(orgId).collection("authRequests").doc();
      const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";

      await requestRef.set({
        id: requestRef.id,
        memberId: callerUid,
        memberName: `${memberData.firstName} ${memberData.lastName}`,
        clientPhone,
        code,
        status: "pending",
        ipAddress: Array.isArray(ip) ? ip[0] : ip,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        completedAt: null
      });

      // 6. Mettre à jour lastActivityAt
      await memberDoc.ref.update({
        lastActivityAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 7. Simuler l'envoi FCM (ou réel si on a le token)
      console.log(`[FCM] Notification de vérification envoyée pour la demande ${requestRef.id} (${orgDoc.data()?.name})`);
      
      const targetToken = userData.fcmToken || userData.token;
      if (targetToken) {
        try {
          await fcm.send({
            token: targetToken,
            notification: {
              title: "Vérification SafeCallr",
              body: `${memberData.firstName} de ${orgDoc.data()?.name} souhaite authentifier cet appel.`
            },
            data: {
              requestId: requestRef.id,
              orgId: orgId,
              type: "auth_request",
              trustMessage: orgDoc.data()?.trustMessage || ""
            }
          });
        } catch (e) {
          console.error("FCM Send Error:", e);
        }
      }

      res.json({ success: true, requestId: requestRef.id, code });

    } catch (error: any) {
      console.error("Trigger Auth Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Annuler une demande
  app.post("/api/auth/cancel", async (req, res) => {
    try {
      const { idToken, orgId, requestId } = req.body;
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const callerUid = decodedToken.uid;

      const requestRef = db.collection("organizations").doc(orgId).collection("authRequests").doc(requestId);
      const requestDoc = await requestRef.get();

      if (!requestDoc.exists || requestDoc.data()?.memberId !== callerUid) {
        return res.status(403).json({ error: "Accès refusé." });
      }

      await requestRef.update({
        status: "failed",
        reason: "cancelled_by_caller",
        completedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

function convertMarkdownToSEOPageHTML(markdown: string): string {
  if (!markdown) return "";
  
  const escapeHtml = (str: string) => 
    (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const lines = markdown.split("\n");
  let html = "";
  let inList = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      continue;
    }

    if (line.startsWith("### ")) {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<h3 style="font-size:20px;font-weight:700;color:#ffffff;margin:24px 0 12px 0;">${escapeHtml(line.slice(4))}</h3>`;
    } else if (line.startsWith("## ")) {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<h2 style="font-size:24px;font-weight:800;color:#00e676;margin:32px 0 16px 0;">${escapeHtml(line.slice(3))}</h2>`;
    } else if (line.startsWith("# ")) {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<h1 style="font-size:28px;font-weight:800;color:#ffffff;margin:32px 0 16px 0;">${escapeHtml(line.slice(2))}</h1>`;
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      if (!inList) {
        html += '<ul style="margin:16px 0;padding-left:24px;color:#cbd5e1;">';
        inList = true;
      }
      html += `<li style="margin-bottom:8px;">${escapeHtml(line.slice(2))}</li>`;
    } else {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<p style="margin-bottom:16px;line-height:1.7;">${escapeHtml(line)}</p>`;
    }
  }

  if (inList) {
    html += "</ul>";
  }

  return html;
}

async function getSEOSitemapXML(db: any): Promise<string> {
  const baseUrl = "https://safecallr.com";
  const staticPages = [
    { url: "/", priority: "1.0", changefreq: "daily" },
    { url: "/particuliers", priority: "0.9", changefreq: "weekly" },
    { url: "/en/particuliers", priority: "0.8", changefreq: "weekly" },
    { url: "/es/particuliers", priority: "0.8", changefreq: "weekly" },
    { url: "/professionnels", priority: "0.9", changefreq: "weekly" },
    { url: "/en/professionnels", priority: "0.8", changefreq: "weekly" },
    { url: "/es/professionnels", priority: "0.8", changefreq: "weekly" },
    { url: "/entreprises", priority: "0.9", changefreq: "weekly" },
    { url: "/en/entreprises", priority: "0.8", changefreq: "weekly" },
    { url: "/es/entreprises", priority: "0.8", changefreq: "weekly" },
    { url: "/institutions", priority: "0.8", changefreq: "weekly" },
    { url: "/how-it-works", priority: "0.8", changefreq: "monthly" },
    { url: "/en/how-it-works", priority: "0.7", changefreq: "monthly" },
    { url: "/es/how-it-works", priority: "0.7", changefreq: "monthly" },
    { url: "/actualite", priority: "0.8", changefreq: "daily" },
    { url: "/en/actualite", priority: "0.7", changefreq: "daily" },
    { url: "/es/actualite", priority: "0.7", changefreq: "daily" },
    { url: "/company-contact", priority: "0.7", changefreq: "monthly" },
    { url: "/en/company-contact", priority: "0.6", changefreq: "monthly" },
    { url: "/es/company-contact", priority: "0.6", changefreq: "monthly" },
    { url: "/sitemap", priority: "0.7", changefreq: "weekly" },
    { url: "/plan-du-site", priority: "0.7", changefreq: "weekly" },
    { url: "/cgu", priority: "0.5", changefreq: "monthly" },
    { url: "/terms", priority: "0.5", changefreq: "monthly" },
    { url: "/terms-of-use", priority: "0.5", changefreq: "monthly" },
    { url: "/terminos", priority: "0.5", changefreq: "monthly" },
    { url: "/condiciones-uso", priority: "0.5", changefreq: "monthly" },
    { url: "/confidentialite", priority: "0.5", changefreq: "monthly" },
    { url: "/privacy", priority: "0.5", changefreq: "monthly" },
    { url: "/privacidad", priority: "0.5", changefreq: "monthly" },
    { url: "/mentions-legales", priority: "0.5", changefreq: "monthly" },
    { url: "/legal-notice", priority: "0.5", changefreq: "monthly" },
    { url: "/aviso-legal", priority: "0.5", changefreq: "monthly" },
  ];

  const DEFAULT_ARTICLES_SLUGS = [
    { slug: "comment-reconnaitre-arnaque-faux-conseiller-bancaire", date: "2026-02-01" },
    { slug: "spoofing-telephonique-comment-les-escrocs-usurpent-votre-numero", date: "2026-01-20" },
    { slug: "fraude-au-president-proteger-votre-entreprise", date: "2026-01-10" }
  ];

  const todayStr = new Date().toISOString().split("T")[0];
  let articlesList: any[] = [];

  if (db) {
    try {
      const snap = await db.collection("articles").where("published", "==", true).get();
      if (!snap.empty) {
        articlesList = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      }
    } catch (err) {
      console.warn("[SEO Server] Error fetching articles for sitemap XML:", err);
    }
  }

  for (const def of DEFAULT_ARTICLES_SLUGS) {
    if (!articlesList.some(a => a.slug === def.slug || a.metaTitle === def.slug || a.id === def.slug)) {
      articlesList.push({ slug: def.slug, updatedAt: def.date });
    }
  }

  const escapeXml = (unsafe: string) =>
    (unsafe || "").replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });

  const staticXml = staticPages.map(page => `  <url>
    <loc>${escapeXml(baseUrl + page.url)}</loc>
    <lastmod>${todayStr}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n');

  const dynamicXml = articlesList.map(art => {
    const slug = art.slug || art.metaTitle || art.id;
    const artDate = art.updatedAt || art.createdAt;
    const lastmodStr = artDate ? (typeof artDate === 'string' ? artDate.split("T")[0] : new Date(artDate).toISOString().split("T")[0]) : todayStr;
    return `  <url>
    <loc>${escapeXml(baseUrl + "/actualite/" + encodeURIComponent(slug))}</loc>
    <lastmod>${lastmodStr}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticXml}
${dynamicXml ? dynamicXml + '\n' : ''}</urlset>`;
}

async function getSEORenderedHTML(reqPath: string, rawTemplate: string, db: any): Promise<string> {
  const url = (reqPath || "/").split("?")[0];
  const escapeHtml = (str: string) => (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const DEFAULT_BLOG_ARTICLES = [
    {
      id: "comment-reconnaitre-arnaque-faux-conseiller-bancaire",
      metaTitle: "comment-reconnaitre-arnaque-faux-conseiller-bancaire",
      slug: "comment-reconnaitre-arnaque-faux-conseiller-bancaire",
      title: "Comment reconnaître une arnaque au faux conseiller bancaire en 2026 ?",
      category: "grand_public",
      categoryLabel: "Grand Public & Familles",
      summary: "Analyse détaillée des techniques de spoofing téléphonique utilisées par les escrocs pour usurper le numéro officiel de votre banque, et les réflexes de sécurité SafeCallr pour protéger vos comptes.",
      metaDescription: "Guide pratique 2026 : apprenez à déjouer les arnaques au faux conseiller bancaire. Découvrez le spoofing de numéro et la solution SafeCallr pour valider vos appels en temps réel.",
      seoKeywords: "faux conseiller bancaire, arnaque téléphonique, spoofing banque, sécurité bancaire, SafeCallr, authentification appel, 2FA téléphone",
      imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80",
      createdAt: "2026-02-01T10:00:00.000Z",
      author: "Comité de Vigilance Cybersécurité SafeCallr",
      content: `
# Comment reconnaître une arnaque au faux conseiller bancaire en 2026 ?

L'arnaque au faux conseiller bancaire représente aujourd'hui plus de 300 millions d'euros de préjudice annuel en France. Les escrocs exploitent la confiance des épargnants grâce à une technique redoutable : le **spoofing téléphonique**.

## Qu'est-ce que le spoofing de numéro de téléphone ?

Le spoofing permet à un individu malveillant de modifier l'identifiant d'appelant (Caller ID) affiché sur votre écran de téléphone. Même si le numéro qui s'affiche est exactement celui enregistré dans vos contacts comme étant le service fraude de votre banque, l'appel provient en réalité d'un centre d'appel frauduleux.

### Le scénario type de l'escroquerie

1. **La prise de contact urgente :** L'escroc vous appelle en prétendant qu'une transaction frauduleuse de plusieurs milliers d'euros est en cours sur votre compte bancaire.
2. **La mise en confiance :** Il égrène des informations personnelles vous concernant (nom, adresse, début de numéro de carte) obtenues lors de fuites de données antérieures.
3. **La fausse annulation :** Il vous demande de valider une notification push sur votre application bancaire ou de lui dicter un code SMS reçu à l'instant, sous prétexte d'annuler le virement. En réalité, vous validez l'ajout d'un nouveau bénéficiaire ou un transfert d'argent sortant.

## Pourquoi les mesures traditionnelles ne suffisent plus ?

- **Le SMS de validation (OTP) :** Il est facilement détourné par ingénierie sociale ou usurpation de SIM.
- **L'affichage du numéro officiel :** Il n'a plus aucune valeur de preuve en raison des faiblesses originelles des réseaux télécoms.

## La solution SafeCallr : La double authentification humaine d'appel

Face à ce fléau, SafeCallr introduit la certification réciproque d'appel en temps réel.

- **Demande de preuve instantanée :** Lorsque vous recevez un appel suspect de votre banque, demandez à l'interlocuteur d'envoyer un jeton d'authentification SafeCallr.
- **Notification cryptographique :** Un jeton sécurisé s'affiche instantanément sur votre application mobile SafeCallr.
- **Si l'appelant refuse ou hésite :** Vous avez la certitude absolue qu'il s'agit d'une tentative d'usurpation d'identité.

Ne donnez plus jamais suite à un appel d'urgence sans l'avoir certifié au préalable via l'application SafeCallr.
`
    },
    {
      id: "spoofing-telephonique-comment-les-escrocs-usurpent-votre-numero",
      metaTitle: "spoofing-telephonique-comment-les-escrocs-usurpent-votre-numero",
      slug: "spoofing-telephonique-comment-les-escrocs-usurpent-votre-numero",
      title: "Spoofing Téléphonique : Comment les pirates usurpent les numéros officiels",
      category: "grand_public",
      categoryLabel: "Technologie & Cybersécurité",
      summary: "Comprendre les vulnérabilités du protocole d'identification de l'appelant (Caller ID) et comment la technologie cryptographique SafeCallr restaure la confiance numérique.",
      metaDescription: "Tout comprendre sur le spoofing de numéro de téléphone : vulnérabilités du Caller ID, cadre légal MAN et comment SafeCallr sécurise la voix.",
      seoKeywords: "spoofing telephonique, Caller ID spoofing, piratage telephone, usurpation numero, reseau telecom, SafeCallr, authentification voix",
      imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80",
      createdAt: "2026-01-20T14:30:00.000Z",
      author: "Équipe R&D SafeCallr",
      content: `
# Spoofing Téléphonique : Comment les pirates usurpent les numéros officiels

Le réseau téléphonique commuté a été conçu dans les années 1970 avec une hypothèse fondamentale : les opérateurs télécoms se font une confiance implicite. Cette architecture originale est aujourd'hui exploitée par des réseaux criminels à l'échelle mondiale.

## Les coulisses techniques du Caller ID Spoofing

Lorsqu'un appel est émis via la voix sur IP (VoIP), l'émetteur peut configurer librement le champ d'entête SIP \`From:\`. Les serveurs Asterisk ou logiciels d'appel automatisés permettent de définir n'importe quel numéro à 10 chiffres.

### Le mécanisme en 3 étapes :

1. **Abonnement VoIP sans vérification :** L'escroc souscrit un service d'appel VoIP auprès d'un fournisseur peu scrupuleux.
2. **Personnalisation du champ CLI :** Il renseigne le numéro officiel d'un établissement bancaire ou d'une administration publique.
3. **Acheminement vers la victime :** L'opérateur téléphonique destinataire affiche le numéro transmis sans être en mesure de vérifier son authenticité à la source.

## Cadre réglementaire et limites du mécanisme MAN (Mécanisme d'Authentification des Numéros)

En France, la loi Naegelen et le plan de numérotation imposent aux opérateurs d'interrompre les appels dont l'identifiant n'est pas certifié. Cependant :

- Les appels provenant de passerelles internationales échappent encore partiellement au filtrage.
- Le chiffrement de bout en bout du réseau télécom ne garantit pas la légitimité de l'interlocuteur humain au bout du fil.

## Comment SafeCallr garantit l'intégrité de l'appelant

SafeCallr ne se fie pas au réseau télécom pour valider l'identité. En combinant un canal de données sécurisé et une signature cryptographique temporaire, SafeCallr crée une passerelle hors-bande (out-of-band) inviolable entre l'appelant et l'appelé.
`
    },
    {
      id: "fraude-au-president-proteger-votre-entreprise",
      metaTitle: "fraude-au-president-proteger-votre-entreprise",
      slug: "fraude-au-president-proteger-votre-entreprise",
      title: "Fraude au Président et Usurpation d'Identité : Protéger son Entreprise",
      category: "professionnel",
      categoryLabel: "Entreprises & PME",
      summary: "Les PME et grands groupes font face à des pertes colossales dues aux faux ordres de virement exécutés par téléphone. Découvrez le protocole d'authentification renforcée SafeCallr Pro.",
      metaDescription: "Comment protéger votre entreprise contre la fraude au président et les fausses instructions de virement. Guide complet et protocole de sécurité SafeCallr.",
      seoKeywords: "fraude au president, arnaque virement, securite entreprise, usurpation identite direction, SafeCallr pro, authentification entreprise",
      imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
      createdAt: "2026-01-10T09:15:00.000Z",
      author: "Département Sécurité Entreprises SafeCallr",
      content: `
# Fraude au Président et Usurpation d'Identité : Protéger son Entreprise

La fraude au président (ou FOVI pour Faux Ordres de Virement d'Entreprise) consiste à contacter un collaborateur du service comptable ou financier en se faisant passer pour le dirigeant ou le cabinet d'avocat de l'entreprise, afin d'exiger un virement urgent et confidentiel.

## L'impact dévastateur de l'ingénierie sociale

Les escrocs réalisent une préparation minutieuse avant de passer à l'action :
- **Recherche d'organigramme :** Identification des responsables comptables sur LinkedIn et réseaux professionnels.
- **Période stratégique :** Appel en fin de journée ou pendant les vacances du dirigeant.
- **Tone & Pression psychologique :** Discours autoritaire exigeant la discrétion absolue ("opération de rachat ultra-confidentielle").

## L'avènement du Deepfake Vocal (Vishing par IA)

Avec les progrès de l'intelligence artificielle générative, il est désormais possible de cloner la voix d'un dirigeant à partir de quelques minutes d'enregistrement vidéo public. L'analyse vocale humaine ne permet plus d'identifier un imposteur.

## La réponse opérationnelle SafeCallr Entreprise

1. **Protocole de validation obligatoire :** Tout ordre de virement inhabituel transmitted par téléphone doit faire l'objet d'un jeton de validation SafeCallr émis depuis le compte certifié du dirigeant.
2. **Piste d'audit infalsifiable :** Chaque vérification d'appel génère un journal d'horodatage chiffré, garantissant le respect des procédures internes et simplifiant les contrôles de conformité (DORA / ISO 27001).
`
    }
  ];

  let pageTitle = "SafeCallr | Protection Anti-Spoofing & Authentification d'Appels";
  let pageDescription = "SafeCallr est la solution d'authentification humaine d'appels téléphoniques en temps réel. Protégez-vous contre le spoofing, l'usurpation d'identité et les faux conseillers bancaires.";
  let pageKeywords = "SafeCallr, authentification appels, spoofing, faux conseiller bancaire, sécurité téléphonique, 2FA téléphone, anti-fraude, protection usurpation, cybersécurité";
  let pageImage = "https://safecallr.com/og-image.png";
  let canonicalUrl = `https://safecallr.com${url}`;
  let ogType = "website";
  let jsonLdObj: any = null;
  let rootBodyHtml = "";

  // 1. Handle Blog Post Detail Route: /actualite/:slug
  if (url.startsWith("/actualite/") && url.length > 11) {
    const rawSlug = url.replace("/actualite/", "");
    const decodedSlug = decodeURIComponent(rawSlug);
    let article: any = null;

    if (db && decodedSlug) {
      try {
        let snap = await db.collection("articles").where("metaTitle", "==", decodedSlug).where("published", "==", true).limit(1).get();
        if (snap.empty) {
          snap = await db.collection("articles").where("slug", "==", decodedSlug).where("published", "==", true).limit(1).get();
        }
        if (snap.empty && decodedSlug.length > 5) {
          const docRef = db.collection("articles").doc(decodedSlug);
          const docSnap = await docRef.get();
          if (docSnap.exists) article = { id: docSnap.id, ...docSnap.data() };
        }
        if (!snap.empty && !article) {
          article = { id: snap.docs[0].id, ...snap.docs[0].data() };
        }
      } catch (err) {
        console.warn("[SEO Dynamic Server] Error fetching article from Firestore:", err);
      }
    }

    if (!article) {
      article = DEFAULT_BLOG_ARTICLES.find(
        a => a.slug === decodedSlug || a.metaTitle === decodedSlug || a.id === decodedSlug
      );
    }

    if (article) {
      const articleSlug = article.slug || article.metaTitle || article.id;
      pageTitle = `${article.title} | Blog Cybersécurité SafeCallr`;
      pageDescription = article.metaDescription || article.summary || article.title;
      if (article.seoKeywords) pageKeywords = article.seoKeywords;
      if (article.imageUrl) pageImage = article.imageUrl;
      ogType = "article";
      canonicalUrl = `https://safecallr.com/actualite/${encodeURIComponent(articleSlug)}`;

      jsonLdObj = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": article.title,
        "image": [pageImage],
        "datePublished": article.createdAt || "2026-02-01T10:00:00.000Z",
        "dateModified": article.updatedAt || article.createdAt || "2026-02-01T10:00:00.000Z",
        "description": pageDescription,
        "author": {
          "@type": "Organization",
          "name": article.author || "Comité de Vigilance SafeCallr",
          "url": "https://safecallr.com"
        },
        "publisher": {
          "@type": "Organization",
          "name": "SafeCallr",
          "logo": {
            "@type": "ImageObject",
            "url": "https://safecallr.com/logo.png"
          }
        }
      };

      const articleBodyHtml = convertMarkdownToSEOPageHTML(article.content || "");

      rootBodyHtml = `
        <div style="max-width:900px;margin:0 auto;padding:40px 20px;font-family:system-ui,-apple-system,sans-serif;color:#f8fafc;background-color:#0f1b3d;">
          <nav style="margin-bottom:24px;">
            <a href="/actualite" style="color:#00e676;text-decoration:none;font-weight:700;font-size:15px;">← Retour aux actualités & guides SafeCallr</a>
          </nav>
          <article>
            <header style="margin-bottom:30px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:20px;">
              <span style="color:#00e676;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">${escapeHtml(article.categoryLabel || article.category || 'Actualités')}</span>
              <h1 style="font-size:32px;font-weight:800;color:#ffffff;margin:12px 0 16px 0;line-height:1.3;">${escapeHtml(article.title)}</h1>
              <p style="color:#94a3b8;font-size:14px;margin:0;">Publié par <strong>${escapeHtml(article.author || 'Comité de Vigilance SafeCallr')}</strong> — ${new Date(article.createdAt || Date.now()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </header>
            ${article.imageUrl ? `<img src="${escapeHtml(article.imageUrl)}" alt="${escapeHtml(article.title)}" style="width:100%;max-height:450px;object-fit:cover;border-radius:16px;margin-bottom:30px;box-shadow:0 10px 30px rgba(0,0,0,0.5);" />` : ''}
            <div style="font-size:18px;line-height:1.6;color:#e2e8f0;margin-bottom:30px;background:rgba(255,255,255,0.03);padding:20px;border-radius:12px;border-left:4px solid #00e676;">
              <p style="margin:0;"><strong>${escapeHtml(article.summary || '')}</strong></p>
            </div>
            <div style="font-size:16px;line-height:1.8;color:#cbd5e1;">
              ${articleBodyHtml}
            </div>
          </article>
        </div>
      `;
    } else {
      pageTitle = "Article Introuvable | Blog SafeCallr";
      pageDescription = "L'article demandé n'existe pas ou a été déplacé.";
      rootBodyHtml = `
        <div style="max-width:800px;margin:0 auto;padding:60px 20px;font-family:system-ui,-apple-system,sans-serif;color:#f8fafc;background-color:#0f1b3d;text-align:center;">
          <h1 style="font-size:32px;font-weight:800;color:#ffffff;margin-bottom:16px;">Article introuvable</h1>
          <p style="font-size:16px;color:#94a3b8;margin-bottom:32px;">L'article que vous recherchez n'existe pas ou a été mis à jour.</p>
          <a href="/actualite" style="display:inline-block;background:#00e676;color:#0f1b3d;padding:12px 24px;border-radius:12px;font-weight:700;text-decoration:none;">Voir toutes les actualités</a>
        </div>
      `;
    }
  } else if (url === "/actualite" || url === "/blog") {
    // 2. Handle Blog Listing Route: /actualite
    pageTitle = "Actualités & Guides de Sécurité Téléphonique | Blog SafeCallr";
    pageDescription = "Consultez nos articles, conseils d'experts et décryptages d'arnaques (faux conseiller bancaire, spoofing, fraude au président) pour sécuriser vos télécommunications.";
    pageKeywords = "blog cybersécurité, actualités spoofing, guides sécurité téléphone, alerte arnaque bancaire, conseils SafeCallr, anti-fraude";
    canonicalUrl = "https://safecallr.com/actualite";

    let articlesList: any[] = [];
    if (db) {
      try {
        const snap = await db.collection("articles").where("published", "==", true).get();
        if (!snap.empty) {
          articlesList = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
        }
      } catch (err) {
        console.warn("[SEO Server] Error fetching articles list from Firestore:", err);
      }
    }

    if (articlesList.length === 0) {
      articlesList = DEFAULT_BLOG_ARTICLES;
    } else {
      // Merge defaults if not present
      for (const defArt of DEFAULT_BLOG_ARTICLES) {
        if (!articlesList.some(a => a.slug === defArt.slug || a.metaTitle === defArt.metaTitle)) {
          articlesList.push(defArt);
        }
      }
    }

    jsonLdObj = {
      "@context": "https://schema.org",
      "@type": "Blog",
      "name": "Actualités & Guides Cybersécurité — SafeCallr",
      "description": pageDescription,
      "publisher": {
        "@type": "Organization",
        "name": "SafeCallr",
        "logo": { "@type": "ImageObject", "url": "https://safecallr.com/logo.png" }
      },
      "blogPost": articlesList.map(a => ({
        "@type": "BlogPosting",
        "headline": a.title,
        "description": a.summary,
        "image": a.imageUrl,
        "datePublished": a.createdAt || "2026-02-01T10:00:00.000Z",
        "url": `https://safecallr.com/actualite/${encodeURIComponent(a.slug || a.metaTitle || a.id)}`
      }))
    };

    const articlesCardsHtml = articlesList.map(art => {
      const artSlug = art.slug || art.metaTitle || art.id;
      return `
        <article style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px;margin-bottom:24px;display:flex;flex-direction:column;gap:12px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
            <span style="color:#00e676;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;background:rgba(0,230,118,0.1);padding:4px 10px;border-radius:20px;">${escapeHtml(art.categoryLabel || art.category || 'Actualités')}</span>
            <span style="color:#64748b;font-size:13px;">${new Date(art.createdAt || Date.now()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          <h2 style="font-size:22px;font-weight:700;color:#ffffff;margin:0;"><a href="/actualite/${encodeURIComponent(artSlug)}" style="color:#ffffff;text-decoration:none;">${escapeHtml(art.title)}</a></h2>
          <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0;">${escapeHtml(art.summary || '')}</p>
          <div style="margin-top:8px;">
            <a href="/actualite/${encodeURIComponent(artSlug)}" style="color:#00e676;font-weight:700;text-decoration:none;font-size:15px;">Lire l'article complet →</a>
          </div>
        </article>
      `;
    }).join("");

    rootBodyHtml = `
      <div style="max-width:1100px;margin:0 auto;padding:40px 20px;font-family:system-ui,-apple-system,sans-serif;color:#f8fafc;background-color:#0f1b3d;">
        <header style="margin-bottom:30px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:20px;">
          <h1 style="font-size:32px;font-weight:800;color:#00e676;margin:0 0 10px 0;">Blog & Guides de Sécurité Téléphonique SafeCallr</h1>
          <p style="font-size:18px;color:#94a3b8;margin:0;">Décryptages d'experts, alertes cybersécurité et conseils pratiques pour vous protéger des arnaques au faux conseiller bancaire et du spoofing.</p>
        </header>
        <nav style="margin-bottom:40px;display:flex;gap:20px;flex-wrap:wrap;font-weight:600;">
          <a href="/" style="color:#00e676;text-decoration:none;">Accueil</a>
          <a href="/particuliers" style="color:#00e676;text-decoration:none;">Pour Particuliers</a>
          <a href="/professionnels" style="color:#00e676;text-decoration:none;">Pour Professionnels</a>
          <a href="/entreprises" style="color:#00e676;text-decoration:none;">Pour Entreprises</a>
          <a href="/how-it-works" style="color:#00e676;text-decoration:none;">Comment ça marche</a>
        </nav>
        <section>
          ${articlesCardsHtml}
        </section>
        <footer style="margin-top:50px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);font-size:14px;color:#64748b;">
          <p>© SafeCallr — Tous droits réservés. <a href="/cgu" style="color:#94a3b8;">CGU</a> | <a href="/confidentialite" style="color:#94a3b8;">Confidentialité</a> | <a href="/mentions-legales" style="color:#94a3b8;">Mentions Légales</a></p>
        </footer>
      </div>
    `;
  } else if (url === "/particuliers") {
    pageTitle = "SafeCallr pour Particuliers | Protection contre les Faux Conseillers Bancaires & Spoofing";
    pageDescription = "Protégez votre famille et vos comptes bancaires contre les arnaques téléphoniques. Validez l'identité de votre banquier en temps réel avant tout échange confidentiel.";
    pageKeywords = "SafeCallr particuliers, arnaque faux conseiller, protection banque famille, securite telephone, anti-spoofing particulier";
    
    rootBodyHtml = `
      <div style="max-width:1100px;margin:0 auto;padding:40px 20px;font-family:system-ui,-apple-system,sans-serif;color:#f8fafc;background-color:#0f1b3d;">
        <header style="margin-bottom:30px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:20px;">
          <h1 style="font-size:32px;font-weight:800;color:#00e676;margin:0 0 10px 0;">SafeCallr pour Particuliers & Familles — Protection Anti-Spoofing</h1>
          <p style="font-size:18px;color:#94a3b8;margin:0;">Ne cédez plus à la panique des faux conseillers bancaires. Authentifiez chaque appel important avant de communiquer des informations personnelles ou de valider un virement.</p>
        </header>
        <nav style="margin-bottom:40px;display:flex;gap:20px;flex-wrap:wrap;font-weight:600;">
          <a href="/" style="color:#00e676;text-decoration:none;">Accueil</a>
          <a href="/professionnels" style="color:#00e676;text-decoration:none;">Pour Indépendants & Pros</a>
          <a href="/entreprises" style="color:#00e676;text-decoration:none;">Pour Entreprises</a>
          <a href="/how-it-works" style="color:#00e676;text-decoration:none;">Comment ça marche</a>
          <a href="/actualite" style="color:#00e676;text-decoration:none;">Actualités & Blog</a>
        </nav>
        <section style="margin-bottom:30px;">
          <h2 style="font-size:24px;font-weight:700;color:#ffffff;">Pourquoi adopter SafeCallr pour votre foyer ?</h2>
          <p style="font-size:16px;line-height:1.7;color:#cbd5e1;">Les arnaques téléphoniques ciblent des milliers de personnes chaque jour. Un prétendu conseiller bancaire vous signale une opération suspecte et vous demande de valider une transaction. Grâce à SafeCallr, vous vérifiez instantanément si l'appelant est réellement votre banquier.</p>
        </section>
        <section style="margin-bottom:30px;">
          <h2 style="font-size:24px;font-weight:700;color:#ffffff;">Fonctionnalités clés pour les particuliers</h2>
          <ul style="padding-left:20px;color:#cbd5e1;line-height:1.8;font-size:16px;">
            <li><strong>Vérification d'appel en temps réel :</strong> Recevez un jeton de validation sur l'application lors de l'appel.</li>
            <li><strong>Alerte anti-spoofing instantanée :</strong> Identifiez les numéros masqués ou usurpés.</li>
            <li><strong>Historique et journal de sécurité :</strong> Gardez une trace de tous vos appels vérifiés.</li>
            <li><strong>Application gratuite et intuitive :</strong> Disponible sur iOS et Android.</li>
          </ul>
        </section>
        <footer style="margin-top:50px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);font-size:14px;color:#64748b;">
          <p>© SafeCallr — Tous droits réservés. <a href="/cgu" style="color:#94a3b8;">CGU</a> | <a href="/confidentialite" style="color:#94a3b8;">Confidentialité</a> | <a href="/mentions-legales" style="color:#94a3b8;">Mentions Légales</a></p>
        </footer>
      </div>
    `;
  } else if (url === "/professionnels") {
    pageTitle = "SafeCallr pour Professionnels & Indépendants | Authentifiez vos Appels Sortants Clients";
    pageDescription = "Démarquez-vous et restaurez la confiance de vos clients lors de vos démarches téléphoniques. Certifiez l'authenticité de vos appels pros en un clic.";
    pageKeywords = "SafeCallr pro, authentification appel client, confiance telephonique, indeptendants pros, securite appel sortant";

    rootBodyHtml = `
      <div style="max-width:1100px;margin:0 auto;padding:40px 20px;font-family:system-ui,-apple-system,sans-serif;color:#f8fafc;background-color:#0f1b3d;">
        <header style="margin-bottom:30px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:20px;">
          <h1 style="font-size:32px;font-weight:800;color:#00e676;margin:0 0 10px 0;">SafeCallr pour Professionnels & Indépendants — Confiance Téléphonique</h1>
          <p style="font-size:18px;color:#94a3b8;margin:0;">Prouvez l'authenticité de vos appels sortants auprès de vos clients et prospects en un clic.</p>
        </header>
        <nav style="margin-bottom:40px;display:flex;gap:20px;flex-wrap:wrap;font-weight:600;">
          <a href="/" style="color:#00e676;text-decoration:none;">Accueil</a>
          <a href="/particuliers" style="color:#00e676;text-decoration:none;">Pour Particuliers</a>
          <a href="/entreprises" style="color:#00e676;text-decoration:none;">Pour Entreprises</a>
          <a href="/how-it-works" style="color:#00e676;text-decoration:none;">Comment ça marche</a>
          <a href="/company-contact" style="color:#00e676;text-decoration:none;">Contact Pro</a>
        </nav>
        <section style="margin-bottom:30px;">
          <h2 style="font-size:24px;font-weight:700;color:#ffffff;">Rassurez vos clients dès les premières secondes de l'appel</h2>
          <p style="font-size:16px;line-height:1.7;color:#cbd5e1;">Face à la hausse des arnaques, vos clients hésitent à décrocher ou à partager des données confidentielles par téléphone. SafeCallr permet à vos clients de valider que c'est bien vous qui les appelez.</p>
        </section>
        <section style="margin-bottom:30px;">
          <h2 style="font-size:24px;font-weight:700;color:#ffffff;">Les avantages pour votre activité professionnelle</h2>
          <ul style="padding-left:20px;color:#cbd5e1;line-height:1.8;font-size:16px;">
            <li><strong>Taux de décroché supérieur :</strong> Vos clients savent qu'il s'agit d'un appel légitime.</li>
            <li><strong>Élimination de la méfiance :</strong> Transmettez des devis, factures ou rendez-vous en toute sérénité.</li>
            <li><strong>Espace Pro dédié :</strong> Envoyez vos requêtes d'authentification directement depuis votre interface web ou mobile.</li>
          </ul>
        </section>
        <footer style="margin-top:50px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);font-size:14px;color:#64748b;">
          <p>© SafeCallr — Tous droits réservés. <a href="/cgu" style="color:#94a3b8;">CGU</a> | <a href="/confidentialite" style="color:#94a3b8;">Confidentialité</a> | <a href="/mentions-legales" style="color:#94a3b8;">Mentions Légales</a></p>
        </footer>
      </div>
    `;
  } else if (url === "/entreprises" || url === "/institutions") {
    pageTitle = "SafeCallr pour Entreprises & Banques | Sécurité Téléphonique & Anti-Fraude au Président";
    pageDescription = "Protégez la voix de votre marque et vos centres de contact. Éliminez la fraude au président, le spoofing de vos numéros officiels et protégez vos clients.";
    pageKeywords = "SafeCallr entreprises, anti-spoofing banque, fraude au president, securite centre d'appel, API authentification voix";

    rootBodyHtml = `
      <div style="max-width:1100px;margin:0 auto;padding:40px 20px;font-family:system-ui,-apple-system,sans-serif;color:#f8fafc;background-color:#0f1b3d;">
        <header style="margin-bottom:30px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:20px;">
          <h1 style="font-size:32px;font-weight:800;color:#00e676;margin:0 0 10px 0;">SafeCallr pour Entreprises, Banques & Grandes Organisations</h1>
          <p style="font-size:18px;color:#94a3b8;margin:0;">Protégez la voix de votre marque et sécurisez les échanges téléphoniques stratégiques avec vos collaborateurs et vos clients.</p>
        </header>
        <nav style="margin-bottom:40px;display:flex;gap:20px;flex-wrap:wrap;font-weight:600;">
          <a href="/" style="color:#00e676;text-decoration:none;">Accueil</a>
          <a href="/particuliers" style="color:#00e676;text-decoration:none;">Pour Particuliers</a>
          <a href="/professionnels" style="color:#00e676;text-decoration:none;">Pour Indépendants</a>
          <a href="/company-contact" style="color:#00e676;text-decoration:none;">Demander une démo</a>
        </nav>
        <section style="margin-bottom:30px;">
          <h2 style="font-size:24px;font-weight:700;color:#ffffff;">Protégez votre marque contre l'usurpation de numéro (Spoofing)</h2>
          <p style="font-size:16px;line-height:1.7;color:#cbd5e1;">Les réseaux criminels usurpent régulièrement les numéros des grandes banques, assurances et institutions pour piéger les citoyens. SafeCallr fournit une infrastructure d'authentification forte de la voix et des appels sortants.</p>
        </section>
        <section style="margin-bottom:30px;">
          <h2 style="font-size:24px;font-weight:700;color:#ffffff;">Solutions Entreprise SafeCallr</h2>
          <ul style="padding-left:20px;color:#cbd5e1;line-height:1.8;font-size:16px;">
            <li><strong>API & SDK d'intégration téléphonique :</strong> Intégrez l'authentification dans vos centres de contact et vos applications métier.</li>
            <li><strong>Lutte contre la fraude au président :</strong> Vérifiez la légitimité des demandes de virement ou de modifications RIB.</li>
            <li><strong>Authentification forte 2FA des téléconseillers :</strong> Garantissez l'identité de vos opérateurs auprès des clients.</li>
          </ul>
        </section>
        <footer style="margin-top:50px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);font-size:14px;color:#64748b;">
          <p>© SafeCallr — Tous droits réservés. <a href="/cgu" style="color:#94a3b8;">CGU</a> | <a href="/confidentialite" style="color:#94a3b8;">Confidentialité</a> | <a href="/mentions-legales" style="color:#94a3b8;">Mentions Légales</a></p>
        </footer>
      </div>
    `;
  } else if (url === "/how-it-works") {
    pageTitle = "Comment fonctionne SafeCallr ? | Le Protocole d'Authentification Téléphonique 2FA";
    pageDescription = "Découvrez la technologie brevetée SafeCallr : double authentification humaine d'appel, jetons cryptographiques éphémères et validation en temps réel sur mobile.";
    pageKeywords = "fonctionnement SafeCallr, 2FA telephonique, jeton securite appel, protocole anti-spoofing, authentification vocale";

    rootBodyHtml = `
      <div style="max-width:1100px;margin:0 auto;padding:40px 20px;font-family:system-ui,-apple-system,sans-serif;color:#f8fafc;background-color:#0f1b3d;">
        <header style="margin-bottom:30px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:20px;">
          <h1 style="font-size:32px;font-weight:800;color:#00e676;margin:0 0 10px 0;">Comment fonctionne l'authentification d'appel SafeCallr ?</h1>
          <p style="font-size:18px;color:#94a3b8;margin:0;">Un protocole de sécurité innovant en 3 étapes simples pour éliminer définitivement le spoofing téléphonique.</p>
        </header>
        <nav style="margin-bottom:40px;display:flex;gap:20px;flex-wrap:wrap;font-weight:600;">
          <a href="/" style="color:#00e676;text-decoration:none;">Accueil</a>
          <a href="/particuliers" style="color:#00e676;text-decoration:none;">Pour Particuliers</a>
          <a href="/professionnels" style="color:#00e676;text-decoration:none;">Pour Professionnels</a>
          <a href="/actualite" style="color:#00e676;text-decoration:none;">Actualités</a>
        </nav>
        <section style="margin-bottom:30px;">
          <h2 style="font-size:24px;font-weight:700;color:#ffffff;">Étape 1 : Vous recevez un appel suspect</h2>
          <p style="font-size:16px;line-height:1.7;color:#cbd5e1;">Votre téléphone sonne. L'interlocuteur se présente comme votre banquier, votre conseiller ou un professionnel de santé.</p>
        </section>
        <section style="margin-bottom:30px;">
          <h2 style="font-size:24px;font-weight:700;color:#ffffff;">Étape 2 : Demande d'authentification en temps réel</h2>
          <p style="font-size:16px;line-height:1.7;color:#cbd5e1;">Vous demandez à votre interlocuteur de certifier son appel via SafeCallr. L'appelant officiel envoie une notification sécurisée sur votre application SafeCallr.</p>
        </section>
        <section style="margin-bottom:30px;">
          <h2 style="font-size:24px;font-weight:700;color:#ffffff;">Étape 3 : Validation instantanée</h2>
          <p style="font-size:16px;line-height:1.7;color:#cbd5e1;">Votre écran affiche la confirmation d'identité certifiée par le protocole SafeCallr. Vous poursuivez l'échange en toute sécurité.</p>
        </section>
        <footer style="margin-top:50px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);font-size:14px;color:#64748b;">
          <p>© SafeCallr — Tous droits réservés. <a href="/cgu" style="color:#94a3b8;">CGU</a> | <a href="/confidentialite" style="color:#94a3b8;">Confidentialité</a> | <a href="/mentions-legales" style="color:#94a3b8;">Mentions Légales</a></p>
        </footer>
      </div>
    `;
  } else if (url === "/company-contact") {
    pageTitle = "Contact & Demande de Démo | Équipe Cybersécurité SafeCallr";
    pageDescription = "Contactez nos spécialistes en sécurité des télécommunications. Demandez une démonstration personnalisée de la solution SafeCallr pour votre organisation.";
    pageKeywords = "contact SafeCallr, demo anti-spoofing, devis securite telephonique, equipe SafeCallr";

    rootBodyHtml = `
      <div style="max-width:1100px;margin:0 auto;padding:40px 20px;font-family:system-ui,-apple-system,sans-serif;color:#f8fafc;background-color:#0f1b3d;">
        <header style="margin-bottom:30px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:20px;">
          <h1 style="font-size:32px;font-weight:800;color:#00e676;margin:0 0 10px 0;">Contactez l'Équipe SafeCallr</h1>
          <p style="font-size:18px;color:#94a3b8;margin:0;">Vous êtes une entreprise, une banque, une institution ou un professionnel ? Parlons de la sécurisation de vos communications.</p>
        </header>
        <nav style="margin-bottom:40px;display:flex;gap:20px;flex-wrap:wrap;font-weight:600;">
          <a href="/" style="color:#00e676;text-decoration:none;">Accueil</a>
          <a href="/entreprises" style="color:#00e676;text-decoration:none;">Solutions Entreprises</a>
          <a href="/professionnels" style="color:#00e676;text-decoration:none;">Solutions Professionnels</a>
        </nav>
        <section style="margin-bottom:30px;">
          <h2 style="font-size:24px;font-weight:700;color:#ffffff;">Besoin d'une démo ou d'un devis sur mesure ?</h2>
          <p style="font-size:16px;line-height:1.7;color:#cbd5e1;">Nos experts en sécurité des télécommunications sont à votre disposition pour vous accompagner dans la mise en place de la solution SafeCallr au sein de vos équipes.</p>
        </section>
        <footer style="margin-top:50px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);font-size:14px;color:#64748b;">
          <p>© SafeCallr — Tous droits réservés. <a href="/cgu" style="color:#94a3b8;">CGU</a> | <a href="/confidentialite" style="color:#94a3b8;">Confidentialité</a> | <a href="/mentions-legales" style="color:#94a3b8;">Mentions Légales</a></p>
        </footer>
      </div>
    `;
  } else if (url === "/cgu" || url === "/terms" || url === "/terms-of-use" || url === "/terminos" || url === "/condiciones-uso") {
    pageTitle = "Conditions Générales d'Utilisation (CGU) | SafeCallr";
    pageDescription = "Consultez les Conditions Générales d'Utilisation (CGU) régissant l'accès et l'utilisation des services SafeCallr.";

    rootBodyHtml = `
      <div style="max-width:1100px;margin:0 auto;padding:40px 20px;font-family:system-ui,-apple-system,sans-serif;color:#f8fafc;background-color:#0f1b3d;">
        <header style="margin-bottom:30px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:20px;">
          <h1 style="font-size:32px;font-weight:800;color:#00e676;margin:0 0 10px 0;">Conditions Générales d'Utilisation (CGU)</h1>
          <p style="font-size:18px;color:#94a3b8;margin:0;">Règles d'utilisation du service d'authentification et de sécurité téléphonique SafeCallr.</p>
        </header>
        <nav style="margin-bottom:40px;display:flex;gap:20px;flex-wrap:wrap;font-weight:600;">
          <a href="/" style="color:#00e676;text-decoration:none;">Accueil</a>
          <a href="/confidentialite" style="color:#00e676;text-decoration:none;">Confidentialité</a>
          <a href="/mentions-legales" style="color:#00e676;text-decoration:none;">Mentions Légales</a>
        </nav>
        <section style="margin-bottom:30px;">
          <h2 style="font-size:24px;font-weight:700;color:#ffffff;">Objet du service</h2>
          <p style="font-size:16px;line-height:1.7;color:#cbd5e1;">SafeCallr met à disposition une plateforme permettant de certifier et valider l'authenticité des appels téléphoniques entrants et sortants afin de lutter contre la fraude.</p>
        </section>
        <footer style="margin-top:50px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);font-size:14px;color:#64748b;">
          <p>© SafeCallr — Tous droits réservés.</p>
        </footer>
      </div>
    `;
  } else if (url === "/confidentialite" || url === "/privacy" || url === "/privacidad") {
    pageTitle = "Politique de Confidentialité & RGPD | SafeCallr";
    pageDescription = "Découvrez comment SafeCallr traite et protège vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD).";

    rootBodyHtml = `
      <div style="max-width:1100px;margin:0 auto;padding:40px 20px;font-family:system-ui,-apple-system,sans-serif;color:#f8fafc;background-color:#0f1b3d;">
        <header style="margin-bottom:30px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:20px;">
          <h1 style="font-size:32px;font-weight:800;color:#00e676;margin:0 0 10px 0;">Politique de Confidentialité & Protection des Données</h1>
          <p style="font-size:18px;color:#94a3b8;margin:0;">Engagement de SafeCallr quant à la protection et le respect de votre vie privée.</p>
        </header>
        <nav style="margin-bottom:40px;display:flex;gap:20px;flex-wrap:wrap;font-weight:600;">
          <a href="/" style="color:#00e676;text-decoration:none;">Accueil</a>
          <a href="/cgu" style="color:#00e676;text-decoration:none;">CGU</a>
          <a href="/mentions-legales" style="color:#00e676;text-decoration:none;">Mentions Légales</a>
        </nav>
        <section style="margin-bottom:30px;">
          <h2 style="font-size:24px;font-weight:700;color:#ffffff;">Protection et sécurité des données (RGPD)</h2>
          <p style="font-size:16px;line-height:1.7;color:#cbd5e1;">SafeCallr ne vend et ne cède aucune donnée personnelle à des tiers. Les informations collectées servent exclusivement à assurer la vérification sécurisée de vos appels.</p>
        </section>
        <footer style="margin-top:50px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);font-size:14px;color:#64748b;">
          <p>© SafeCallr — Tous droits réservés.</p>
        </footer>
      </div>
    `;
  } else if (url === "/mentions-legales" || url === "/legal-notice" || url === "/aviso-legal") {
    pageTitle = "Mentions Légales | SafeCallr";
    pageDescription = "Informations légales, éditeur du site et hébergement de la plateforme SafeCallr.";

    rootBodyHtml = `
      <div style="max-width:1100px;margin:0 auto;padding:40px 20px;font-family:system-ui,-apple-system,sans-serif;color:#f8fafc;background-color:#0f1b3d;">
        <header style="margin-bottom:30px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:20px;">
          <h1 style="font-size:32px;font-weight:800;color:#00e676;margin:0 0 10px 0;">Mentions Légales</h1>
          <p style="font-size:18px;color:#94a3b8;margin:0;">Informations légales relatives au site et aux applications SafeCallr.</p>
        </header>
        <nav style="margin-bottom:40px;display:flex;gap:20px;flex-wrap:wrap;font-weight:600;">
          <a href="/" style="color:#00e676;text-decoration:none;">Accueil</a>
          <a href="/cgu" style="color:#00e676;text-decoration:none;">CGU</a>
          <a href="/confidentialite" style="color:#00e676;text-decoration:none;">Confidentialité</a>
        </nav>
        <section style="margin-bottom:30px;">
          <h2 style="font-size:24px;font-weight:700;color:#ffffff;">Éditeur du service</h2>
          <p style="font-size:16px;line-height:1.7;color:#cbd5e1;">La plateforme SafeCallr est éditée par la société SafeCallr, spécialisée dans la sécurité et l'authentification des télécommunications.</p>
        </section>
        <footer style="margin-top:50px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);font-size:14px;color:#64748b;">
          <p>© SafeCallr — Tous droits réservés.</p>
        </footer>
      </div>
    `;
  } else if (url === "/sitemap" || url === "/plan-du-site") {
    pageTitle = "Plan du Site & Navigation | SafeCallr";
    pageDescription = "Retrouvez l'ensemble des rubriques, services et guides du site SafeCallr.";

    rootBodyHtml = `
      <div style="max-width:1100px;margin:0 auto;padding:40px 20px;font-family:system-ui,-apple-system,sans-serif;color:#f8fafc;background-color:#0f1b3d;">
        <header style="margin-bottom:30px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:20px;">
          <h1 style="font-size:32px;font-weight:800;color:#00e676;margin:0 0 10px 0;">Plan du Site SafeCallr</h1>
          <p style="font-size:18px;color:#94a3b8;margin:0;">Accès direct à toutes les rubriques et pages de notre site.</p>
        </header>
        <ul style="line-height:2;font-size:18px;color:#00e676;">
          <li><a href="/" style="color:#00e676;">Accueil — Protection Anti-Spoofing</a></li>
          <li><a href="/particuliers" style="color:#00e676;">Pour Particuliers & Familles</a></li>
          <li><a href="/professionnels" style="color:#00e676;">Pour Professionnels & Indépendants</a></li>
          <li><a href="/entreprises" style="color:#00e676;">Pour Entreprises & Grandes Organisations</a></li>
          <li><a href="/how-it-works" style="color:#00e676;">Comment ça marche ?</a></li>
          <li><a href="/actualite" style="color:#00e676;">Actualités & Blog Cybersécurité</a></li>
          <li><a href="/company-contact" style="color:#00e676;">Contact Entreprise</a></li>
          <li><a href="/cgu" style="color:#00e676;">Conditions Générales d'Utilisation</a></li>
          <li><a href="/confidentialite" style="color:#00e676;">Politique de Confidentialité</a></li>
          <li><a href="/mentions-legales" style="color:#00e676;">Mentions Légales</a></li>
        </ul>
      </div>
    `;
  } else if (url === "/" || url === "") {
    // Default Landing Page HTML
    pageTitle = "SafeCallr | Protection Anti-Spoofing & Authentification d'Appels";
    pageDescription = "SafeCallr est la solution d'authentification humaine d'appels téléphoniques en temps réel. Protégez-vous contre le spoofing, l'usurpation d'identité et les faux conseillers bancaires.";
    
    jsonLdObj = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "SafeCallr",
      "applicationCategory": "SecurityApplication",
      "operatingSystem": "iOS, Android, Web",
      "url": "https://safecallr.com",
      "logo": "https://safecallr.com/logo.png",
      "image": "https://safecallr.com/og-image.png",
      "description": pageDescription,
      "author": {
        "@type": "Organization",
        "name": "SafeCallr",
        "url": "https://safecallr.com"
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR"
      }
    };

    rootBodyHtml = `
      <div style="max-width:1100px;margin:0 auto;padding:40px 20px;font-family:system-ui,-apple-system,sans-serif;color:#f8fafc;background-color:#0f1b3d;">
        <header style="margin-bottom:30px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:20px;">
          <h1 style="font-size:32px;font-weight:800;color:#00e676;margin:0 0 10px 0;">SafeCallr — Authentification d'Appels & Protection Anti-Spoofing</h1>
          <p style="font-size:18px;color:#94a3b8;margin:0;">La solution de sécurité téléphonique en temps réel contre la fraude au faux conseiller bancaire, le spoofing et l'usurpation d'identité.</p>
        </header>
        <nav style="margin-bottom:40px;display:flex;gap:20px;flex-wrap:wrap;font-weight:600;">
          <a href="/particuliers" style="color:#00e676;text-decoration:none;">Pour Particuliers</a>
          <a href="/professionnels" style="color:#00e676;text-decoration:none;">Pour Indépendants & Pros</a>
          <a href="/entreprises" style="color:#00e676;text-decoration:none;">Pour Entreprises</a>
          <a href="/how-it-works" style="color:#00e676;text-decoration:none;">Comment ça marche</a>
          <a href="/actualite" style="color:#00e676;text-decoration:none;">Actualités & Blog</a>
          <a href="/company-contact" style="color:#00e676;text-decoration:none;">Contact Entreprise</a>
        </nav>
        <section style="margin-bottom:30px;">
          <h2 style="font-size:24px;font-weight:700;color:#ffffff;">Ne faites plus jamais confiance aveuglément à un appel sortant</h2>
          <p style="font-size:16px;line-height:1.7;color:#cbd5e1;">SafeCallr invente la double authentification humaine d'appel (2FA téléphonique). Lorsqu'une banque, une institution ou un proche vous appelle, SafeCallr valide l'identité de votre interlocuteur en temps réel avant tout échange confidentiel.</p>
        </section>
        <section style="margin-bottom:30px;">
          <h2 style="font-size:24px;font-weight:700;color:#ffffff;">Comment SafeCallr vous protège du faux conseiller bancaire ?</h2>
          <p style="font-size:16px;line-height:1.7;color:#cbd5e1;">Le spoofing téléphonique permet aux escrocs d'afficher le numéro exact de votre banque sur votre écran. Avec SafeCallr, le conseiller doit envoyer un jeton d'authentification sécurisé sur votre application. Vous validez en un clic l'authenticité de l'appel.</p>
        </section>
        <section style="margin-bottom:30px;">
          <h2 style="font-size:24px;font-weight:700;color:#ffffff;">Pour tous vos usages : Particuliers, Professionnels & Entreprises</h2>
          <p style="font-size:16px;line-height:1.7;color:#cbd5e1;">Que vous soyez un particulier souhaitant protéger vos comptes bancaires, un professionnel indépendant rassurant ses clients, ou une entreprise sécurisant ses communications sortantes, SafeCallr s'adapte à vos besoins.</p>
        </section>
        <footer style="margin-top:50px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);font-size:14px;color:#64748b;">
          <p>© SafeCallr — Tous droits réservés. <a href="/cgu" style="color:#94a3b8;">CGU</a> | <a href="/confidentialite" style="color:#94a3b8;">Confidentialité</a> | <a href="/mentions-legales" style="color:#94a3b8;">Mentions Légales</a></p>
        </footer>
      </div>
    `;
  }

  let html = rawTemplate;

  // Clean existing SEO tags from template first
  html = html.replace(/<title>[\s\S]*?<\/title>/gi, "");
  html = html.replace(/<meta\s+name=["']description["'][\s\S]*?>/gi, "");
  html = html.replace(/<meta\s+name=["']keywords["'][\s\S]*?>/gi, "");
  html = html.replace(/<link\s+rel=["']canonical["'][\s\S]*?>/gi, "");
  html = html.replace(/<meta\s+property=["']og:[\s\S]*?>/gi, "");
  html = html.replace(/<meta\s+name=["']twitter:[\s\S]*?>/gi, "");
  html = html.replace(/<script\s+type=["']application\/ld\+json["']>[\s\S]*?<\/script>/gi, "");

  let newHeadTags = `
    <title>${escapeHtml(pageTitle)}</title>
    <meta name="description" content="${escapeHtml(pageDescription)}" />
    <meta name="keywords" content="${escapeHtml(pageKeywords)}" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />

    <!-- Open Graph / Social -->
    <meta property="og:type" content="${escapeHtml(ogType)}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:site_name" content="SafeCallr" />
    <meta property="og:title" content="${escapeHtml(pageTitle)}" />
    <meta property="og:description" content="${escapeHtml(pageDescription)}" />
    <meta property="og:image" content="${escapeHtml(pageImage)}" />
    <meta property="og:locale" content="fr_FR" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${escapeHtml(canonicalUrl)}" />
    <meta name="twitter:title" content="${escapeHtml(pageTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(pageDescription)}" />
    <meta name="twitter:image" content="${escapeHtml(pageImage)}" />
  `;

  if (jsonLdObj) {
    newHeadTags += `
    <!-- Structured Data JSON-LD -->
    <script type="application/ld+json">
${JSON.stringify(jsonLdObj, null, 2)}
    </script>
    `;
  }

  html = html.replace("</head>", `${newHeadTags}\n</head>`);

  // Inject rootBodyHtml if specified
  if (rootBodyHtml) {
    if (html.includes('<div id="root"></div>')) {
      html = html.replace('<div id="root"></div>', `<div id="root">\n${rootBodyHtml}\n    </div>`);
    } else {
      html = html.replace(/<div id="root">[\s\S]*?<\/div>\s*<script/gi, `<div id="root">\n${rootBodyHtml}\n    </div>\n    <script`);
    }
  }

  return html;
}

  // Vite middleware pour le développement
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    // SPA fallback for dev mode
    app.get("*", async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith("/api/")) return next();
      if (url.includes("sitemap.xml")) {
        try {
          const xml = await getSEOSitemapXML(db);
          res.setHeader("Content-Type", "application/xml; charset=utf-8");
          return res.status(200).send(xml);
        } catch (err) {
          console.warn("[SEO Server Dev] Error serving dynamic sitemap.xml:", err);
        }
        const staticPath = path.join(process.cwd(), "public", "sitemap.xml");
        if (fs.existsSync(staticPath)) {
          res.setHeader("Content-Type", "application/xml; charset=utf-8");
          return res.sendFile(staticPath);
        }
      }
      if (url.includes("robots.txt")) {
        const staticPath = path.join(process.cwd(), "public", "robots.txt");
        if (fs.existsSync(staticPath)) {
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          return res.sendFile(staticPath);
        }
      }
      try {
        let template = fs.readFileSync(path.resolve(resolvedDirname, "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        const seoHtml = await getSEORenderedHTML(req.path, template, db);
        res.status(200).set({ "Content-Type": "text/html; charset=utf-8" }).end(seoHtml);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");

    // Serve dynamic sitemap.xml before static files so it always fetches live articles from Firestore
    app.get("/sitemap.xml", async (req, res) => {
      try {
        const xml = await getSEOSitemapXML(db);
        res.setHeader("Content-Type", "application/xml; charset=utf-8");
        return res.status(200).send(xml);
      } catch (err) {
        console.warn("[SEO Server Prod] Error serving dynamic sitemap.xml:", err);
      }
      const sitemapDist = path.join(distPath, "sitemap.xml");
      const sitemapPublic = path.join(process.cwd(), "public", "sitemap.xml");
      const fileToServe = fs.existsSync(sitemapDist) ? sitemapDist : fs.existsSync(sitemapPublic) ? sitemapPublic : null;
      if (fileToServe) {
        res.setHeader("Content-Type", "application/xml; charset=utf-8");
        return res.sendFile(fileToServe);
      }
      return res.status(404).send("Sitemap not found");
    });

    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".webmanifest") || filePath.endsWith("manifest.webmanifest")) {
          res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
        } else if (filePath.endsWith("sitemap.xml")) {
          res.setHeader("Content-Type", "application/xml; charset=utf-8");
        } else if (filePath.endsWith("robots.txt")) {
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
        }
      }
    }));

    app.get("*", async (req, res, next) => {
      const url = req.path;
      if (url.startsWith("/api/")) return next();

      if (url === "/sitemap.xml" || url.endsWith("sitemap.xml")) {
        try {
          const xml = await getSEOSitemapXML(db);
          res.setHeader("Content-Type", "application/xml; charset=utf-8");
          return res.status(200).send(xml);
        } catch (err) {
          console.warn("[SEO Server Prod] Error serving dynamic sitemap.xml:", err);
        }
        const sitemapDist = path.join(distPath, "sitemap.xml");
        const sitemapPublic = path.join(process.cwd(), "public", "sitemap.xml");
        const fileToServe = fs.existsSync(sitemapDist) ? sitemapDist : fs.existsSync(sitemapPublic) ? sitemapPublic : null;
        if (fileToServe) {
          res.setHeader("Content-Type", "application/xml; charset=utf-8");
          return res.sendFile(fileToServe);
        }
      }

      if (url === "/robots.txt" || url.endsWith("robots.txt")) {
        const robotsDist = path.join(distPath, "robots.txt");
        const robotsPublic = path.join(process.cwd(), "public", "robots.txt");
        const fileToServe = fs.existsSync(robotsDist) ? robotsDist : fs.existsSync(robotsPublic) ? robotsPublic : null;
        if (fileToServe) {
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          return res.sendFile(fileToServe);
        }
      }

      try {
        const indexPath = path.join(distPath, "index.html");
        if (fs.existsSync(indexPath)) {
          let rawHtml = fs.readFileSync(indexPath, "utf-8");
          const seoHtml = await getSEORenderedHTML(url, rawHtml, db);
          return res.status(200).set({ "Content-Type": "text/html; charset=utf-8" }).send(seoHtml);
        }
      } catch (err) {
        console.warn("[SEO Server Prod] Error serving SEO HTML:", err);
      }

      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Global Error Handler Middleware to guarantee ALL server crashes return a clean JSON payload rather than default Express HTML
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("[Global Error Middleware] Caught uncaught error:", err);
    res.status(err.status || 500).json({
      error: err.message || "Erreur serveur interne",
      code: err.code || "INTERNAL_SERVER_ERROR"
    });
  });

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Serveur SafeCallr démarré sur http://localhost:${PORT}`);
    });
  }

  // --- TRIGGERS NOTIFICATIONS ADMIN ---
  if (firebaseInitialized && db && !process.env.VERCEL) {
    const startTime = Date.now();
    console.log("[Triggers] Démarrage des listeners de notification...");

    // 1. Nouvel utilisateur Grand Public
    db.collection("users").orderBy("createdAt", "desc").limit(1).onSnapshot(async (snapshot) => {
      try {
        for (const change of snapshot.docChanges()) {
          if (change.type === "added") {
            const data = change.doc.data();
            const createdAt = data.createdAt?.toDate() || new Date();
            
            // Ignorer les anciens documents au démarrage
            if (createdAt.getTime() < startTime - 10000) continue;

            console.log(`[Trigger] Nouvel utilisateur détecté: ${data.email}`);
            const stats = await getPlatformStats(db);
            await sendAdminNotification(db, "grand_public", {
              firstName: data.firstName || "Inconnu",
              lastName: data.lastName || "Inconnu",
              email: data.email,
              phone: data.phoneNumber,
              createdAt: createdAt.toLocaleString("fr-FR")
            }, stats);
          }
        }
      } catch (innerErr: any) {
        console.error("[Trigger Error] Erreur dans la boucle users snapshot callback:", innerErr);
      }
    }, (err) => console.error("[Trigger Error] Users:", err));

    // 2. Nouveau Professionnel Solo
    db.collection("pros").orderBy("createdAt", "desc").limit(1).onSnapshot(async (snapshot) => {
      try {
        for (const change of snapshot.docChanges()) {
          if (change.type === "added") {
            const data = change.doc.data();
            const createdAt = data.createdAt?.toDate() || new Date();

            if (createdAt.getTime() < startTime - 10000) continue;

            console.log(`[Trigger] Nouveau pro détecté: ${data.email}`);
            const stats = await getPlatformStats(db);
            
            // Récupérer infos entreprise si possible
            let companyName = "";
            if (data.companyId) {
              const compDoc = await db.collection("companies").doc(data.companyId).get();
              companyName = compDoc.data()?.name || "";
            }

            await sendAdminNotification(db, "pro_solo", {
              firstName: data.firstName || "Inconnu",
              lastName: data.lastName || "Inconnu",
              email: data.email,
              phone: data.phone,
              createdAt: createdAt.toLocaleString("fr-FR"),
              profession: data.jobTitle,
              companyName: companyName,
              siret: "" // À remplir si disponible dans le doc pro
            }, stats);
          }
        }
      } catch (innerErr: any) {
        console.error("[Trigger Error] Erreur dans la boucle pros snapshot callback:", innerErr);
      }
    }, (err) => console.error("[Trigger Error] Pros:", err));

    // 3. Nouveau Collaborateur Institution (via collectionGroup pour members)
    db.collectionGroup("members").orderBy("createdAt", "desc").limit(1).onSnapshot(async (snapshot) => {
      try {
        for (const change of snapshot.docChanges()) {
          if (change.type === "added") {
            const data = change.doc.data();
            const createdAt = data.createdAt?.toDate() || new Date();

            if (createdAt.getTime() < startTime - 10000) continue;

            // On ne veut pas notifier pour le Représentant qui est créé en même temps que l'organisation (ou alors différemment)
            // Mais l'utilisateur demande : "Institution (collaborateur)"
            
            const orgId = change.doc.ref.parent.parent?.id;
            if (!orgId) continue;

            const orgDoc = await db.collection("organizations").doc(orgId).get();
            const orgData = orgDoc.data();

            console.log(`[Trigger] Nouveau collaborateur détecté: ${data.email} (${orgData?.name})`);
            const stats = await getPlatformStats(db);

            await sendAdminNotification(db, "institution", {
              firstName: data.firstName || "Inconnu",
              lastName: data.lastName || "Inconnu",
              email: data.email,
              phone: data.directPhone,
              createdAt: createdAt.toLocaleString("fr-FR"),
              organizationName: orgData?.name,
              organizationSiret: orgData?.siret,
              representativeName: "", // Optionnel
              jobTitle: data.jobTitle
            }, stats);
          }
        }
      } catch (innerErr: any) {
        console.error("[Trigger Error] Erreur dans la boucle members snapshot callback:", innerErr);
      }
    }, (err) => console.error("[Trigger Error] Members:", err));
  } else {
    console.warn("[Triggers] Les listeners de notification Admin ont été désactivés (Firebase inactif / Vercel détecté).");
  }
  return app;
}

let appInstancePromise: Promise<any> | null = null;

export async function getExpressApp() {
  if (!appInstancePromise) {
    appInstancePromise = startServer();
  }
  return appInstancePromise;
}

// Seulement en environnement autonome (ex: Cloud Run, Local), on déclenche l'écoute automatique
if (!process.env.VERCEL) {
  getExpressApp().catch((err) => {
    console.error("[Startup] Échec lors du démarrage automatique de l'application Express:", err);
  });
}
