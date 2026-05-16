import admin from "firebase-admin";
import { sendAdminNotification } from "./server/notify.js";
import { getPlatformStats } from "./server/stats.js";

// Initialisation
if (!admin.apps.length) {
  admin.initializeApp();
}

async function testNotification() {
  console.log("🚀 Lancement du test de notification...");
  
  const fakeData = {
    firstName: "Test",
    lastName: "Admin",
    email: "test@safecallr.com",
    phone: "0102030405",
    createdAt: new Date().toLocaleString("fr-FR"),
    profession: "Testeur de génie",
    companyName: "SafeCallr Testing Lab",
    siret: "123 456 789 00012"
  };

  const stats = await getPlatformStats();
  
  const success = await sendAdminNotification("pro_solo", fakeData, stats);
  
  if (success) {
    console.log("✅ Document créé dans la collection 'mail'. Consultez votre console Firebase !");
  } else {
    console.log("❌ Échec de la création du document.");
  }
  process.exit();
}

testNotification();
