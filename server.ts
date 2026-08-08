import express from "express";
import path from "path";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { fileURLToPath } from "url";
import fs from "fs";
import { Resend } from "resend";
import { sendAdminNotification } from "./server/notify";
import { getPlatformStats } from "./server/stats";
import { EmailData, buildActivationEmail, buildOrganizationEmail } from "./src/lib/emailTemplates";

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

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API: Status of Resend configuration
  app.get("/api/resend-status", (req, res) => {
    res.json({ configured: !!process.env.RESEND_API_KEY });
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

      const apiKey = process.env.RESEND_API_KEY;
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
      
      const emailResult = await resend.emails.send({
        from: `${fromName} <${fromAddress}>`,
        to: to,
        subject: subject,
        html: html || text,
        text: text || ""
      });

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
          // Ignorer l'erreur d'écriture en base de données si l'admin n'a pas les droits en écriture sur Firestore
          console.warn("[Resend Backend] Sauvegarde de l'audit logFirestore ignorée (Droits Firestore Admin limités).");
        }
      }

      return res.json({ success: true, sentVia: "resend", emailId: emailResult.data?.id });
    } catch (err: any) {
      console.error("[Resend Backend] Échec d'envoi d'email via l'API Resend:", err);
      return res.status(500).json({ error: err.message, sentVia: "error" });
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
  app.get("/sitemap.xml", async (req, res) => {
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

    let dynamicArticleUrls: string[] = [];
    if (firebaseInitialized && db) {
      try {
        const blogSnap = await db.collection("blog_posts").get();
        blogSnap.forEach((doc: any) => {
          const data = doc.data();
          if (data.slug || data.metaTitle || doc.id) {
            const slug = data.slug || encodeURIComponent(data.metaTitle || doc.id);
            dynamicArticleUrls.push(`/actualite/${slug}`);
          }
        });
      } catch (err) {
        console.warn("[Sitemap] Unable to fetch blog posts for sitemap:", err);
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${todayStr}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('')}
${dynamicArticleUrls.map(url => `
  <url>
    <loc>${baseUrl}${url}</loc>
    <lastmod>${todayStr}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
</urlset>`;

    res.header("Content-Type", "application/xml");
    res.send(xml);
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
      logSteps.push(`Generating password reset link for ${repData?.email}...`);
      let activationLink = "";
      try {
        activationLink = await admin.auth().generatePasswordResetLink(repData.email);
        logSteps.push(`Password reset link generated successfully.`);
      } catch (linkErr: any) {
        logSteps.push(`Warning: could not generate password reset link via SDK: ${linkErr.message}. Formatting a fallback.`);
        // Fallback or handle it
        activationLink = `https://safecallr.com/reset-password?email=${encodeURIComponent(repData.email)}`;
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
      
      batch.set(orgRef, {
        ...orgData,
        id: orgId,
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
        // Optionnel : compter les membres en parallèle?
        orgs.push({ id: doc.id, ...data });
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

  // API: Changer statut organisation (Admin)
  app.post("/api/admin/organizations/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { idToken, active } = req.body;
      const actor = await verifyAdmin(idToken);

      await db.collection("organizations").doc(id).update({ active });
      await createAuditLog(id, actor, active ? 'reactivate' : 'deactivate', { active });

      res.json({ success: true });
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
      const activationLink = await admin.auth().generatePasswordResetLink(memberData.email);
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

      // 2. Vérifier l'organisation
      const orgDoc = await db.collection("organizations").doc(orgId).get();
      if (!orgDoc.exists || !orgDoc.data()?.active) {
        return res.status(403).json({ error: "Votre institution est inactive." });
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
      try {
        let template = fs.readFileSync(path.resolve(resolvedDirname, "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".webmanifest") || filePath.endsWith("manifest.webmanifest")) {
          res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
        }
      }
    }));

    // Routes prérendues : On vérifie si un fichier .html existe par dossier
    const prerenderedRoutes = [
      "/",
      "/particuliers",
      "/professionnels",
      "/institutions",
      "/how-it-works",
      "/contact",
      "/mentions-legales",
      "/cgu",
      "/confidentialite"
    ];

    app.get("*", (req, res) => {
      const url = req.path;
      
      // Si c'est une route prérendue, on essaie de servir le index.html correspondant dans le dossier
      if (prerenderedRoutes.includes(url) || (url === "/" && prerenderedRoutes.includes("/"))) {
        const filePath = url === "/" 
          ? path.join(distPath, "index.html")
          : path.join(distPath, url, "index.html");
        
        if (fs.existsSync(filePath)) {
          return res.sendFile(filePath);
        }
      }

      // Fallback SPA classique pour le reste (dashboard, admin, me, etc.)
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
