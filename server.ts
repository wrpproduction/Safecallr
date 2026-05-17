import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { fileURLToPath } from "url";
import fs from "fs";
import { sendAdminNotification } from "./server/notify.js";
import { getPlatformStats } from "./server/stats.js";
import { EmailData } from "./src/lib/emailTemplates.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger la config pour avoir le databaseId
const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf-8"));

// Initialisation Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: config.projectId,
  });
}

// Utiliser le databaseId de la config s'il existe, sinon la base par défaut
const db = getFirestore(config.firestoreDatabaseId || "(default)");
const fcm = admin.messaging();

async function verifyAdmin(idToken: string) {
  if (!idToken) throw new Error("Accès non autorisé");
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  const callerUid = decodedToken.uid;
  const callerEmail = decodedToken.email;

  const superAdmins = [
    "xdcam10@gmail.com",
    "ulrich.vidal@gmail.com",
    "contact@wrpproduction.com",
    "contact@remiprevel.com"
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
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
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
        targetEmail: "contact@remiprevel.com",
        status: "new",
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection("companyContactRequests").add(requestData);

      // 2. Déclencher l'envoi d'un email via l'extension Trigger Email (collection 'mail')
      await db.collection("mail").add({
        to: "contact@remiprevel.com",
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
    try {
      const { 
        idToken,
        orgData,
        repData
      } = req.body;

      if (!idToken) return res.status(401).json({ error: "Non authentifié" });

      // 1. Vérifier l'identité et le rôle de l'appelant
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const callerUid = decodedToken.uid;
      const callerEmail = decodedToken.email;

      const superAdmins = [
        "xdcam10@gmail.com",
        "ulrich.vidal@gmail.com",
        "contact@wrpproduction.com",
        "contact@remiprevel.com"
      ];

      const isAdminEmail = superAdmins.includes(callerEmail || "");
      const adminDoc = await db.collection("admins").doc(callerUid).get();
      
      if (!isAdminEmail && !adminDoc.exists) {
        return res.status(403).json({ error: "Accès refusé. Réservé aux super-administrateurs." });
      }

      // Si c'est un super-admin par email mais pas encore dans la collection admins, on l'ajoute
      if (isAdminEmail && !adminDoc.exists) {
        await db.collection("admins").doc(callerUid).set({
          uid: callerUid,
          email: callerEmail,
          role: "admin",
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Utilisateur ${callerEmail} promu admin dans Firestore.`);
      }

      // 2. Vérifier si le SIRET existe déjà
      const siretSnapshot = await db.collection("organizations").where("siret", "==", orgData.siret).limit(1).get();
      if (!siretSnapshot.empty) {
        return res.status(400).json({ error: "Une organisation avec ce SIRET existe déjà." });
      }

      // 3. Vérifier si l'email du représentant existe déjà
      try {
        await admin.auth().getUserByEmail(repData.email);
        return res.status(400).json({ error: "L'email du représentant est déjà utilisé." });
      } catch (authErr: any) {
        // User not found is what we want
        if (authErr.code !== "auth/user-not-found") throw authErr;
      }

      // 4. Création de l'organisation
      const orgRef = db.collection("organizations").doc();
      const orgId = orgRef.id;

      // 5. Création du compte représentant
      const userRecord = await admin.auth().createUser({
        email: repData.email,
        displayName: `${repData.firstName} ${repData.lastName}`,
        emailVerified: false,
      });
      const repUid = userRecord.uid;

      // 6. Envoi lien d'activation (Enregistré dans la collection mail pour extension Trigger Email)
      const activationLink = await admin.auth().generatePasswordResetLink(repData.email);
      console.log(`Lien d'activation pour ${repData.email}: ${activationLink}`);

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

      // 7. Transactionnelle : Création documents Firestore
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
        role: "representative",
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

      await batch.commit();

      res.json({ success: true, orgId, activationLink });

    } catch (error: any) {
      console.error("Create Org Error:", error);
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
      
      // On pourrait calculer le total des auths de toutes les orgs, mais c'est lourd.
      // Pour le MVP on peut peut-être avoir une collection globale stats ou agréger si possible.
      // Ici on fait simple.
      
      res.json({
        totalOrganizations: orgsCount.data().count,
        activeOrganizations: activeOrgsCount.data().count,
        // Autres stats simulées ou calculées si besoin
        totalCollaborators: 0, // À calculer
        totalAuths30d: 0 // À calculer
      });
    } catch (error: any) {
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
        let template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));

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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Serveur SafeCallr démarré sur http://localhost:${PORT}`);
  });

  // --- TRIGGERS NOTIFICATIONS ADMIN ---
  const startTime = Date.now();
  console.log("[Triggers] Démarrage des listeners de notification...");

  // 1. Nouvel utilisateur Grand Public
  db.collection("users").orderBy("createdAt", "desc").limit(1).onSnapshot(async (snapshot) => {
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
  }, (err) => console.error("[Trigger Error] Users:", err));

  // 2. Nouveau Professionnel Solo
  db.collection("pros").orderBy("createdAt", "desc").limit(1).onSnapshot(async (snapshot) => {
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
  }, (err) => console.error("[Trigger Error] Pros:", err));

  // 3. Nouveau Collaborateur Institution (via collectionGroup pour members)
  db.collectionGroup("members").orderBy("createdAt", "desc").limit(1).onSnapshot(async (snapshot) => {
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
  }, (err) => console.error("[Trigger Error] Members:", err));
}

startServer();
