import admin from "firebase-admin";

/**
 * Calculates platform statistics for notifications.
 */
export async function getPlatformStats() {
  const db = admin.firestore();
  
  try {
    const [publicSnap, prosSnap, orgsSnap] = await Promise.all([
      db.collection("users").count().get(),
      db.collection("pros").count().get(),
      db.collection("organizations").count().get()
    ]);

    // Calculate last 7 days registrations
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // This is a bit heavy for a quick notification but manageable for low volume
    const last7DaysSnap = await db.collection("users")
      .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(sevenDaysAgo))
      .get();

    return {
      totalPublic: publicSnap.data().count,
      totalPros: prosSnap.data().count,
      totalOrgs: orgsSnap.data().count,
      last7Days: last7DaysSnap.size
    };
  } catch (error) {
    console.error("Error fetching platform stats:", error);
    return {
      totalPublic: 0,
      totalPros: 0,
      totalOrgs: 0,
      last7Days: 0
    };
  }
}
