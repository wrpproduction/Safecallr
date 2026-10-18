import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf-8"));

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: config.projectId,
  });
}

const db = getFirestore(config.firestoreDatabaseId || "(default)");

async function checkDetails() {
  console.log("=== DETAILS DES UTILISATEURS ===");
  const targetEmails = ["contact@motioon.com", "contact@safecallr.com", "contact@remiprevel.com"];
  
  for (const email of targetEmails) {
    const snap = await db.collection("users").where("email", "==", email).get();
    if (snap.empty) {
      console.log(`[USER NOT FOUND]: ${email}`);
    } else {
      snap.docs.forEach(doc => {
        console.log(`User ${email} (${doc.id}):`, doc.data());
      });
    }
  }

  console.log("\n=== USER CONNECTIONS ===");
  const userConnSnap = await db.collection("userConnections").get();
  console.log(`Total userConnections: ${userConnSnap.size}`);
  userConnSnap.docs.forEach(doc => {
    console.log(`[userConnections] ${doc.id}:`, doc.data());
  });

  console.log("\n=== PERSONAL CONTACT REQUESTS ===");
  const pReqSnap = await db.collection("personalContactRequests").get();
  console.log(`Total personalContactRequests: ${pReqSnap.size}`);
  pReqSnap.docs.forEach(doc => {
    console.log(`[personalContactRequests] ${doc.id}:`, doc.data());
  });

  console.log("\n=== PERSONAL CONTACTS ===");
  const pContactsSnap = await db.collection("personalContacts").get();
  console.log(`Total personalContacts: ${pContactsSnap.size}`);
  pContactsSnap.docs.forEach(doc => {
    console.log(`[personalContacts] ${doc.id}:`, doc.data());
  });

  console.log("\n=== PRO CLIENT CONNECTIONS ===");
  const proConnSnap = await db.collection("proClientConnections").get();
  console.log(`Total proClientConnections: ${proConnSnap.size}`);
  proConnSnap.docs.forEach(doc => {
    console.log(`[proClientConnections] ${doc.id}:`, doc.data());
  });

  console.log("\n=== PROS ===");
  const prosSnap = await db.collection("pros").get();
  console.log(`Total pros: ${prosSnap.size}`);
  prosSnap.docs.forEach(doc => {
    console.log(`[pros] ${doc.id}:`, doc.data());
  });
}

checkDetails().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
