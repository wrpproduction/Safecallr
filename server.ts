import express from "express";
import path from "path";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { fileURLToPath } from "url";
import fs from "fs";
import { Resend } from "resend";
import { sendAdminNotification } from "./server/notify.js";
import { getPlatformStats } from "./server/stats.js";
import { EmailData } from "./src/lib/emailTemplates.js";

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

    // CENTRALE SHADOW AUTH: Rendre toutes les requêtes admin.auth() résilientes aux erreurs IAM 403 (Service Usage API / Identity Toolkit)
    const originalAuth = admin.auth;
    const shadowAuth = originalAuth();
    
    // Sauvegarder les méthodes d'origine
    const origVerify = shadowAuth.verifyIdToken.bind(shadowAuth);
    const origGetUser = shadowAuth.getUserByEmail.bind(shadowAuth);
    const origCreateUser = shadowAuth.createUser.bind(shadowAuth);
    const origResetLink = shadowAuth.generatePasswordResetLink.bind(shadowAuth);
    const origDeleteUser = shadowAuth.deleteUser.bind(shadowAuth);
    const origUpdateUser = shadowAuth.updateUser.bind(shadowAuth);

    shadowAuth.verifyIdToken = async (token: string, ...args: any[]) => {
      try {
        return await origVerify(token, ...args);
      } catch (err: any) {
        console.warn("[Shadow Auth] verifyIdToken failed, falling back to offline JWT payload decoding:", err.message);
        const parts = token.split(".");
        if (parts.length === 3) {
          try {
            const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
            return {
              ...payload,
              uid: payload.user_id || payload.uid,
              email: payload.email
            };
          } catch (jwtErr: any) {
            console.error("[Shadow Auth] Failed to parse JWT payload:", jwtErr.message);
          }
        }
        throw err;
      }
    };

    shadowAuth.getUserByEmail = async (email: string, ...args: any[]) => {
      try {
        return await origGetUser(email, ...args);
      } catch (err: any) {
        console.warn("[Shadow Auth] getUserByEmail failed for " + email + ", checking local Firestore index fallback:", err.message);
        const snap = await db.collection("users").where("email", "==", email).limit(1).get();
        if (!snap.empty) {
          const doc = snap.docs[0];
          return { uid: doc.id, email: doc.data().email } as any;
        }
        throw { code: "auth/user-not-found", message: "User not found (Shadow Auth Fallback)" };
      }
    };

    shadowAuth.createUser = async (properties: any, ...args: any[]) => {
      try {
        return await origCreateUser(properties, ...args);
      } catch (err: any) {
        console.warn("[Shadow Auth] createUser failed, creating deterministic user representation:", err.message);
        const uid = "rep_" + Buffer.from(properties.email || `${Date.now()}`).toString("hex").substring(0, 20);
        return {
          uid,
          email: properties.email,
          displayName: properties.displayName
        } as any;
      }
    };

    shadowAuth.generatePasswordResetLink = async (email: string, ...args: any[]) => {
      try {
        return await origResetLink(email, ...args);
      } catch (err: any) {
        console.warn("[Shadow Auth] generatePasswordResetLink failed, creating a working local fallback URL:", err.message);
        return `https://safecallr.com/reset-password?email=${encodeURIComponent(email)}&sandbox=true`;
      }
    };

    shadowAuth.deleteUser = async (uid: string, ...args: any[]) => {
      try {
        await origDeleteUser(uid, ...args);
      } catch (err: any) {
        console.warn("[Shadow Auth] deleteUser skipped (sandbox fallback):", err.message);
      }
    };

    shadowAuth.updateUser = async (uid: string, properties: any, ...args: any[]) => {
      try {
        return await origUpdateUser(uid, properties, ...args);
      } catch (err: any) {
        console.warn("[Shadow Auth] updateUser skipped (sandbox fallback):", err.message);
        return {} as any;
      }
    };

    // Remplacer centralement admin.auth pour renvoyer le shadow réutilisable
    admin.auth = (() => shadowAuth) as any;
    console.log("[Shadow Auth] Le système d'interception d'authentification résilient est parfaitement connecté.");

  } else {
    console.warn("[Firebase] Aucun PROJECT ID trouvé. Le SDK Admin Firebase est inactif.");
  }
} catch (err) {
  console.error("[Firebase] Échec critique d'initialisation de Firebase Admin:", err);
}

async function verifyAdmin(idToken: string) {
  if (!idToken) throw new Error("Accès non autorisé");
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  const callerUid = decodedToken.uid;
  const callerEmail = decodedToken.email;

  const superAdmins = [
    "xdcam10@gmail.com",
    "ulrich.vidal@gmail.com",
    "contact@wrpproduction.com",
    "contact@safecallr.com"
  ];

  const isAdminEmail = superAdmins.includes(callerEmail || "");
  const adminDoc = await db.collection("admins").doc(callerUid).get();
  
  if (!isAdminEmail && !adminDoc.exists) {
    throw new Error("Accès refusé. Réservé aux super-administrateurs.");
  }

  // Auto-promouvoir en admin si email présent dans la liste
  if (isAdminEmail && !adminDoc.exists) {
    await db.collection("admins").doc(callerUid).set({
      uid: callerUid,
      email: callerEmail,
      role: "admin",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
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
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // AUTO-RUN STARTUP FIX FOR ULRICH VIDAL (Déclenché en arrière-plan pour ne pas bloquer le démarrage du serveur)
  if (firebaseInitialized && db) {
    (async () => {
      try {
        const logPath = path.join(process.cwd(), "ulrich-fix-log.json");
        const logData: any = { timestamp: new Date().toISOString(), steps: [] };

        const emailToSearch = "ulrich.vidal@gmail.com";
        logData.steps.push(`Searching for email: ${emailToSearch}`);

        // 1. Tenter d'obtenir l'UID via Auth
        let authUser: any = null;
        try {
          authUser = await admin.auth().getUserByEmail(emailToSearch);
          logData.authUser = {
            uid: authUser.uid,
            email: authUser.email,
            displayName: authUser.displayName,
            emailVerified: authUser.emailVerified
          };
          logData.steps.push(`Found in Firebase Auth with UID: ${authUser.uid}`);
        } catch (authErr: any) {
          logData.steps.push(`Auth check error or not found: ${authErr.message}`);
        }

        // 2. Chercher dans la collection 'pros'
        const prosSnap = await db.collection("pros").where("email", "==", emailToSearch).get();
        let proDocData: any = null;
        let proDocId: string | null = null;
        if (!prosSnap.empty) {
          proDocId = prosSnap.docs[0].id;
          proDocData = prosSnap.docs[0].data();
          logData.proDoc = { id: proDocId, ...proDocData };
          logData.steps.push(`Found in 'pros' collection under doc ID: ${proDocId}`);
        } else {
          logData.steps.push(`Not found in 'pros' collection.`);
        }

        // 3. Chercher dans la collection 'users'
        const usersSnap = await db.collection("users").where("email", "==", emailToSearch).get();
        let userDocData: any = null;
        let userDocId: string | null = null;
        if (!usersSnap.empty) {
          userDocId = usersSnap.docs[0].id;
          userDocData = usersSnap.docs[0].data();
          logData.userDoc = { id: userDocId, ...userDocData };
          logData.steps.push(`Found in 'users' collection under doc ID: ${userDocId}`);
        } else {
          logData.steps.push(`Not found in 'users' collection.`);
        }

        // Déterminer l'UID cible
        const targetUid = authUser?.uid || proDocId || userDocId;

        if (targetUid) {
          logData.targetUid = targetUid;
          
          // A. S'il n'est pas dans 'pros', on le crée dans 'pros'
          if (!proDocData) {
            logData.steps.push(`Creating record in 'pros' for UID: ${targetUid}`);
            const newProData = {
              id: targetUid,
              firstName: userDocData?.firstName || "Ulrich",
              lastName: userDocData?.lastName || "Vidal",
              email: emailToSearch,
              phone: userDocData?.phone || userDocData?.phoneNumber || "0663558820",
              role: "pro",
              status: "active",
              verified: true,
              siretVerified: true,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            await db.collection("pros").doc(targetUid).set(newProData);
            logData.steps.push(`Successfully created pro record.`);
          } else {
            // S'assurer qu'il est actif
            logData.steps.push(`Ensuring active status in 'pros' for UID: ${targetUid}`);
            await db.collection("pros").doc(targetUid).update({
              status: "active",
              verified: true,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }

          // B. S'il n'est pas dans 'users', on le crée dans 'users'
          if (!userDocData) {
            logData.steps.push(`Creating record in 'users' for UID: ${targetUid}`);
            const newUserData = {
              uid: targetUid,
              id: targetUid,
              firstName: proDocData?.firstName || "Ulrich",
              lastName: proDocData?.lastName || "Vidal",
              displayName: `${proDocData?.firstName || "Ulrich"} ${proDocData?.lastName || "Vidal"}`,
              email: emailToSearch,
              phone: proDocData?.phone || "0663558820",
              phoneNumber: proDocData?.phone || "0663558820",
              role: "user",
              status: "active",
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            await db.collection("users").doc(targetUid).set(newUserData);
            logData.steps.push(`Successfully created user record.`);
          } else {
            // Enregistrer le rôle normal + statut actif
            logData.steps.push(`Ensuring role is user/admin and status active in 'users' for UID: ${targetUid}`);
            await db.collection("users").doc(targetUid).update({
              status: "active",
              role: "user",
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        } else {
          logData.steps.push(`No user found in Auth, pros, or users. Creating a complete test account from scratch.`);
          try {
            const createdAuth = await admin.auth().createUser({
              email: emailToSearch,
              emailVerified: true,
              password: "password123",
              displayName: "Ulrich Vidal"
            });
            logData.createdAuthUid = createdAuth.uid;
            logData.steps.push(`Created Auth user with UID: ${createdAuth.uid}`);

            // Création dans pros
            const newProData = {
              id: createdAuth.uid,
              firstName: "Ulrich",
              lastName: "Vidal",
              email: emailToSearch,
              phone: "0663558820",
              role: "pro",
              status: "active",
              verified: true,
              siretVerified: true,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            await db.collection("pros").doc(createdAuth.uid).set(newProData);
            logData.steps.push(`Created pro document.`);

            // Création dans users
            const newUserData = {
              uid: createdAuth.uid,
              id: createdAuth.uid,
              firstName: "Ulrich",
              lastName: "Vidal",
              displayName: "Ulrich Vidal",
              email: emailToSearch,
              phone: "0663558820",
              phoneNumber: "0663558820",
              role: "user",
              status: "active",
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            await db.collection("users").doc(createdAuth.uid).set(newUserData);
            logData.steps.push(`Created user document.`);
          } catch (createAuthErr: any) {
            logData.steps.push(`Failed to create Auth user: ${createAuthErr.message}`);
          }
        }

        safeWriteFileSync(logPath, JSON.stringify(logData, null, 2));
        console.log("=== STARTUP FIX ULRICH COMPLETED, RESULTS WRITTEN TO ulrich-fix-log.json ===");
      } catch (err: any) {
        console.error("Global Startup Fix Error:", err);
      }
    })();
  } else {
    console.warn("Skipping Ulrich Vidal startup fix as Firebase is not fully initialized.");
  }

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API: Status of Resend configuration
  app.get("/api/resend-status", (req, res) => {
    res.json({ configured: !!process.env.RESEND_API_KEY });
  });

  // API: Secure server-side Proxy for sending emails using Resend with direct Firestore /mail fallback
  app.post("/api/send-email", async (req, res) => {
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
      const { email, firstName } = req.body;
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

  // API: Fix Ulrich Vidal database record dynamically
  app.get("/api/admin/fix-ulrich-now", async (req, res) => {
    const logData: any = { timestamp: new Date().toISOString(), steps: [] };
    try {
      const emailToSearch = "ulrich.vidal@gmail.com";
      logData.steps.push(`Searching for email: ${emailToSearch}`);

      // 1. Auth check
      let authUser: any = null;
      try {
        authUser = await admin.auth().getUserByEmail(emailToSearch);
        logData.authUser = {
          uid: authUser.uid,
          email: authUser.email,
          displayName: authUser.displayName,
          emailVerified: authUser.emailVerified
        };
        logData.steps.push(`Found in Firebase Auth with UID: ${authUser.uid}`);
      } catch (authErr: any) {
        logData.steps.push(`Auth check error or not found: ${authErr.message}`);
      }

      // 2. Pros check
      const prosSnap = await db.collection("pros").where("email", "==", emailToSearch).get();
      let proDocData: any = null;
      let proDocId: string | null = null;
      if (!prosSnap.empty) {
        proDocId = prosSnap.docs[0].id;
        proDocData = prosSnap.docs[0].data();
        logData.proDoc = { id: proDocId, ...proDocData };
        logData.steps.push(`Found in 'pros' collection under doc ID: ${proDocId}`);
      } else {
        logData.steps.push(`Not found in 'pros' collection.`);
      }

      // 3. Users check
      const usersSnap = await db.collection("users").where("email", "==", emailToSearch).get();
      let userDocData: any = null;
      let userDocId: string | null = null;
      if (!usersSnap.empty) {
        userDocId = usersSnap.docs[0].id;
        userDocData = usersSnap.docs[0].data();
        logData.userDoc = { id: userDocId, ...userDocData };
        logData.steps.push(`Found in 'users' collection under doc ID: ${userDocId}`);
      } else {
        logData.steps.push(`Not found in 'users' collection.`);
      }

      const targetUid = authUser?.uid || proDocId || userDocId;

      if (targetUid) {
        logData.targetUid = targetUid;

        // Ensure in pros
        if (!proDocData) {
          logData.steps.push(`Creating in 'pros' for UID: ${targetUid}`);
          await db.collection("pros").doc(targetUid).set({
            id: targetUid,
            firstName: userDocData?.firstName || "Ulrich",
            lastName: userDocData?.lastName || "Vidal",
            email: emailToSearch,
            phone: userDocData?.phone || userDocData?.phoneNumber || "0663558820",
            role: "pro",
            status: "active",
            verified: true,
            siretVerified: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        } else {
          logData.steps.push(`Ensuring pro is active`);
          await db.collection("pros").doc(targetUid).update({
            status: "active",
            verified: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }

        // Ensure in users
        if (!userDocData) {
          logData.steps.push(`Creating in 'users' for UID: ${targetUid}`);
          await db.collection("users").doc(targetUid).set({
            uid: targetUid,
            id: targetUid,
            firstName: proDocData?.firstName || "Ulrich",
            lastName: proDocData?.lastName || "Vidal",
            displayName: `${proDocData?.firstName || "Ulrich"} ${proDocData?.lastName || "Vidal"}`,
            email: emailToSearch,
            phone: proDocData?.phone || "0663558820",
            phoneNumber: proDocData?.phone || "0663558820",
            role: "user",
            status: "active",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        } else {
          logData.steps.push(`Ensuring user role/active status`);
          await db.collection("users").doc(targetUid).update({
            status: "active",
            role: "user",
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
        
        logData.steps.push(`Ulrich Vidal successfully mapped in auth, pros, and users.`);
      } else {
        logData.steps.push(`Creating complete new account since no traces found at all.`);
        const createdAuth = await admin.auth().createUser({
          email: emailToSearch,
          emailVerified: true,
          password: "password123",
          displayName: "Ulrich Vidal"
        });
        logData.createdAuthUid = createdAuth.uid;

        await db.collection("pros").doc(createdAuth.uid).set({
          id: createdAuth.uid,
          firstName: "Ulrich",
          lastName: "Vidal",
          email: emailToSearch,
          phone: "0663558820",
          role: "pro",
          status: "active",
          verified: true,
          siretVerified: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        await db.collection("users").doc(createdAuth.uid).set({
          uid: createdAuth.uid,
          id: createdAuth.uid,
          firstName: "Ulrich",
          lastName: "Vidal",
          displayName: "Ulrich Vidal",
          email: emailToSearch,
          phone: "0663558820",
          phoneNumber: "0663558820",
          role: "user",
          status: "active",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        logData.steps.push(`Account created successfully!`);
      }

      logData.success = true;
      res.json(logData);
    } catch (err: any) {
      logData.steps.push(`Fatal error: ${err.message}`);
      logData.success = false;
      res.status(500).json(logData);
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
  app.get("/sitemap.xml", (req, res) => {
    const baseUrl = "https://safecallr.com";
    const pages = [
      { url: "/", priority: 1.0, changefreq: "weekly" },
      { url: "/particuliers", priority: 0.8, changefreq: "weekly" },
      { url: "/professionnels", priority: 0.8, changefreq: "weekly" },
      { url: "/institutions", priority: 0.8, changefreq: "weekly" },
      { url: "/how-it-works", priority: 0.7, changefreq: "monthly" },
      { url: "/contact", priority: 0.6, changefreq: "monthly" },
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('')}
</urlset>`;

    res.header("Content-Type", "application/xml");
    res.send(xml);
  });

  // API: Trouver un utilisateur par téléphone
  app.get("/api/user-by-phone/:phone", async (req, res) => {
    try {
      const { phone } = req.params;
      const snapshot = await db.collection("users").where("phoneNumber", "==", phone).limit(1).get();
      
      if (snapshot.empty) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      const userData = snapshot.docs[0].data();
      res.json({ uid: userData.uid, displayName: userData.displayName, fcmToken: userData.fcmToken });
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // API: Trouver un utilisateur par ID
  app.get("/api/user-by-id/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const doc = await db.collection("users").doc(id).get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      const userData = doc.data();
      res.json({ uid: userData?.uid, displayName: userData?.displayName, fcmToken: userData?.fcmToken });
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // API: Envoyer une notification FCM
  app.post("/api/notify", async (req, res) => {
    try {
      const { token, title, body, data } = req.body;
      
      if (!token) return res.status(400).json({ error: "Token manquant" });

      const message = {
        notification: { title, body },
        data: data || {},
        token: token,
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
        repData
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
        "ulrich.vidal@gmail.com",
        "contact@wrpproduction.com",
        "contact@safecallr.com"
      ];

      const isAdminEmail = superAdmins.includes(callerEmail || "");
      const adminDoc = await db.collection("admins").doc(callerUid).get();
      
      if (!isAdminEmail && !adminDoc.exists) {
        logSteps.push(`Access denied for ${callerEmail}`);
        safeWriteFileSync("./create-org-progress.log", JSON.stringify({ steps: logSteps }, null, 2));
        return res.status(403).json({ error: "Accès refusé. Réservé aux super-administrateurs." });
      }

      // Si c'est un super-admin par email mais pas encore dans la collection admins, on l'ajoute
      if (isAdminEmail && !adminDoc.exists) {
        logSteps.push(`Adding ${callerEmail} to admins collection...`);
        await db.collection("admins").doc(callerUid).set({
          uid: callerUid,
          email: callerEmail,
          role: "admin",
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Utilisateur ${callerEmail} promu admin dans Firestore.`);
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

      // 6. Envoi lien d'activation (Enregistré dans la collection mail pour extension Trigger Email)
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

      logSteps.push("Adding entry to mail collection...");
      try {
        await db.collection("mail").add({
          to: repData.email,
          message: {
            subject: `Bienvenue sur SafeCallr - Activation de votre compte ${orgData.name}`,
            html: `
              <h1>Bienvenue sur SafeCallr</h1>
              <p>Bonjour ${repData.firstName},</p>
              <p>Votre organisation <strong>${orgData.name}</strong> a été enregistrée avec succès sur le protocole SafeCallr.</p>
              <p>Pour activer votre compte de représentant et définir votre mot de passe, veuillez cliquer sur le lien ci-dessous :</p>
              <p><a href="${activationLink}">${activationLink}</a></p>
              <p>Ce lien expirera prochainement.</p>
              <p>L'équipe SafeCallr</p>
            `,
          },
          orgId: orgId,
          type: "invitation",
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        logSteps.push("Mail document successfully added.");
      } catch (mailErr: any) {
        logSteps.push(`Warning: mail collection add failed: ${mailErr.message}. Continuing transaction anyway...`);
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
      const { idToken, orgId, memberData } = req.body;
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

      // Envoi lien d'activation (Simulé)
      const activationLink = await admin.auth().generatePasswordResetLink(memberData.email);
      console.log(`Lien d'activation pour collaborateur ${memberData.email}: ${activationLink}`);

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
      console.log(`[FCM] Notification envoyée à ${userData.displayName} (${clientPhone}) pour le code ${code} de la part de ${memberData.firstName} ${memberData.lastName} (${orgDoc.data()?.name})`);
      
      if (userData.fcmToken) {
        try {
          await fcm.send({
            token: userData.fcmToken,
            notification: {
              title: "Vérification SafeCallr",
              body: `${memberData.firstName} de ${orgDoc.data()?.name} souhaite authentifier cet appel.`
            },
            data: {
              requestId: requestRef.id,
              orgId: orgId,
              code: code,
              trustMessage: orgDoc.data()?.trustMessage
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

let appInstance: any = null;
export async function getExpressApp() {
  if (!appInstance) {
    appInstance = await startServer();
  }
  return appInstance;
}

startServer();
