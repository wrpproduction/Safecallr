import { db, collection, query, where, getDocs, updateDoc, doc } from "../firebase";

/**
 * Links any pending professional connection requests to a user based on their phone number or email.
 * @param userId The UID of the newly registered or updated user.
 * @param phoneNumber The phone number of the user.
 * @param email The email of the user.
 */
export async function linkPendingConnections(userId: string, phoneNumber?: string, email?: string) {
  if (!userId) return;

  try {
    const results: any[] = [];

    // Search by phone if provided
    if (phoneNumber) {
      const qPhone = query(
        collection(db, "proClientConnections"),
        where("clientPhone", "==", phoneNumber),
        where("status", "==", "pending")
      );
      const snapPhone = await getDocs(qPhone);
      results.push(...snapPhone.docs);
    }

    // Search by email if provided
    if (email) {
      const qEmail = query(
        collection(db, "proClientConnections"),
        where("clientEmail", "==", email),
        where("status", "==", "pending")
      );
      const snapEmail = await getDocs(qEmail);
      results.push(...snapEmail.docs);
    }

    // Remove duplicates (if a doc matches both phone and email)
    const uniqueDocs = Array.from(new Set(results.map(d => d.id)))
      .map(id => results.find(d => d.id === id));
    
    const updates = uniqueDocs.map(docSnap => {
      return updateDoc(doc(db, "proClientConnections", docSnap.id), {
        userId: userId
      });
    });

    await Promise.all(updates);
    console.log(`Linked ${updates.length} pending connections for user ${userId}`);
  } catch (err) {
    console.error("Error linking pending connections:", err);
  }
}
