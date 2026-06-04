import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

async function diagnose() {
  console.log("--- Diagnostic Firebase Admin ---");
  
  try {
    const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
    console.log("Config Project ID:", config.projectId);
    console.log("Config Database ID:", config.firestoreDatabaseId);

    // Initialisation avec le projectId du message d'erreur
    if (!admin.apps.length) {
      admin.initializeApp({
        projectId: config.projectId,
      });
    }
    
    const app = admin.app();
    console.log("App Name:", app.name);
    // @ts-ignore
    console.log("Project ID (from app):", app.options.projectId || "Default");

    const db = getFirestore(app, config.firestoreDatabaseId);
    console.log("Tentative de lecture de la collection 'pros'...");
    
    const snapshot = await db.collection("pros").limit(1).get();
    console.log("Succès ! Nombre de documents trouvés (limit 1):", snapshot.size);
    
    if (snapshot.size > 0) {
      console.log("Premier document ID:", snapshot.docs[0].id);
    } else {
      console.log("La collection 'pros' est vide.");
    }

  } catch (error: any) {
    console.error("ERREUR DIAGNOSTIC:");
    console.error("Code:", error.code);
    console.error("Message:", error.message);
    if (error.stack) console.error(error.stack);
  }
}

diagnose();
