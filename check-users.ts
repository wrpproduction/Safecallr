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

async function checkUsers() {
  console.log("--- Checking Users Collection ---");
  try {
    const snapshot = await db.collection("users").get();
    console.log(`Total users found: ${snapshot.size}`);
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`ID: ${doc.id}, Name: ${data.displayName || data.firstName}, Email: ${data.email}, CreatedAt: ${data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : "MISSING"}`);
    });
  } catch (error) {
    console.error("Error checking users:", error);
  }
}

checkUsers();
