import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, getIdToken } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, onSnapshot, addDoc, updateDoc, serverTimestamp, orderBy, deleteDoc, writeBatch } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Configuration Firebase
// Note: Dans cet environnement, on utilise le fichier de config injecté
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Messaging (FCM)
let fcmMessaging: any = null;
if (typeof window !== "undefined") {
  try {
    fcmMessaging = getMessaging(app);
  } catch (err) {
    console.warn("FCM or service workers are not supported in this browser:", err);
  }
}
export const messaging = fcmMessaging;

export const requestFCMToken = async (userId: string) => {
  if (!messaging) return null;
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: (import.meta as any).env.VITE_FCM_VAPID_PUBLIC_KEY,
      });
      if (token) {
        await setDoc(doc(db, "users", userId), { fcmToken: token }, { merge: true });
        return token;
      }
    }
  } catch (error) {
    console.error("FCM Token Error:", error);
  }
  return null;
};

export { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  getIdToken,
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  serverTimestamp, 
  orderBy, 
  deleteDoc, 
  writeBatch,
  ref,
  uploadBytes,
  getDownloadURL
};
