import { Firestore, Timestamp } from "firebase-admin/firestore";

/**
 * Calculates platform statistics for notifications with maximum resilience.
 * Implemented with individual try-catch blocks and optimized fallbacks
 * to guarantee that a failure in one metric never brings down the whole stats output.
 */
export async function getPlatformStats(db: Firestore) {
  let totalPublic = 0;
  let totalPros = 0;
  let totalOrgs = 0;
  let last7Days = 0;

  // 1. Total Public
  try {
    const publicSnap = await db.collection("users").count().get();
    totalPublic = publicSnap.data().count;
  } catch (err) {
    console.warn("[PlatformStats] Failed to use count() for users, using fallback:", err);
    try {
      const snap = await db.collection("users").select().get();
      totalPublic = snap.size;
    } catch (innerErr) {
      console.error("[PlatformStats] Fallback failed for users:", innerErr);
    }
  }

  // 2. Total Pros
  try {
    const prosSnap = await db.collection("pros").count().get();
    totalPros = prosSnap.data().count;
  } catch (err) {
    console.warn("[PlatformStats] Failed to use count() for pros, using fallback:", err);
    try {
      const snap = await db.collection("pros").select().get();
      totalPros = snap.size;
    } catch (innerErr) {
      console.error("[PlatformStats] Fallback failed for pros:", innerErr);
    }
  }

  // 3. Total Orgs
  try {
    const orgsSnap = await db.collection("organizations").count().get();
    totalOrgs = orgsSnap.data().count;
  } catch (err) {
    console.warn("[PlatformStats] Failed to use count() for organizations, using fallback:", err);
    try {
      const snap = await db.collection("organizations").select().get();
      totalOrgs = snap.size;
    } catch (innerErr) {
      console.error("[PlatformStats] Fallback failed for organizations:", innerErr);
    }
  }

  // 4. Last 7 Days Registrations
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const last7DaysSnap = await db.collection("users")
      .where("createdAt", ">=", Timestamp.fromDate(sevenDaysAgo))
      .get();
    last7Days = last7DaysSnap.size;
  } catch (err) {
    console.warn("[PlatformStats] Failed to fetch users from last 7 days with range query:", err);
    try {
      const snap = await db.collection("users").select("createdAt").get();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      let count = 0;
      snap.docs.forEach(doc => {
        const createdAtData = doc.data().createdAt;
        if (createdAtData) {
          const dt = typeof createdAtData.toDate === "function" ? createdAtData.toDate() : new Date(createdAtData);
          if (dt >= sevenDaysAgo) {
            count++;
          }
        }
      });
      last7Days = count;
    } catch (innerErr) {
      console.error("[PlatformStats] Fallback for last7Days failed:", innerErr);
    }
  }

  return {
    totalPublic,
    totalPros,
    totalOrgs,
    last7Days
  };
}
