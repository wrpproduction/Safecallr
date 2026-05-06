import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { fileURLToPath } from "url";
import fs from "fs";

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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Serveur SafeCallr démarré sur http://localhost:${PORT}`);
  });
}

startServer();
