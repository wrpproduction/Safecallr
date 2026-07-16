import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, indexedDBLocalPersistence, GoogleAuthProvider, signInWithPopup as fbSignInWithPopup, signOut, onAuthStateChanged, getIdToken } from "firebase/auth";
import { initializeFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, onSnapshot, addDoc, updateDoc, serverTimestamp, orderBy, deleteDoc, writeBatch } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { Capacitor } from "@capacitor/core";

// Configuration Firebase
// Note: Dans cet environnement, on utilise le fichier de config injecté
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);

// Initialize Auth based on platform to prevent background gapi loading or redirect setups on native mobile apps
export const auth = (() => {
  if (Capacitor.isNativePlatform()) {
    console.log("[SafeCallr] Native platform detected. Initializing Auth with indexedDBLocalPersistence...");
    return initializeAuth(app, {
      persistence: indexedDBLocalPersistence,
    });
  } else {
    console.log("[SafeCallr] Web platform detected. Initializing Auth with getAuth...");
    return getAuth(app);
  }
})();

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);
export const googleProvider = Capacitor.isNativePlatform() ? null : new GoogleAuthProvider();

// Safe wrapper for Google popup sign in to prevent crashes on native Capacitor platforms
export const signInWithPopup = async (authInstance: any, provider: any) => {
  if (Capacitor.isNativePlatform()) {
    throw new Error(
      "La connexion par popup Google n'est pas prise en charge sur l'application mobile native. " +
      "Veuillez utiliser la connexion par e-mail et mot de passe."
    );
  }
  return fbSignInWithPopup(authInstance, provider);
};

// Messaging (FCM)
let fcmMessaging: any = null;

const canUseWebFCM = async (): Promise<boolean> => {
  if (typeof window === "undefined") return false;
  
  // Guard 1: Skip if native platform (iOS/Android Capacitor shell)
  try {
    if (Capacitor.isNativePlatform()) {
      console.log("[SafeCallr] Native platform. Skipping Web FCM.");
      return false;
    }
  } catch (e) {
    console.warn("Failed platform check:", e);
  }

  // Guard 2: Verify service worker support in the browser
  if (!('serviceWorker' in navigator)) {
    console.warn("[SafeCallr] Service workers not supported in this environment.");
    return false;
  }

  // Guard 3: Use official Firebase SDK isSupported() check
  try {
    const supported = await isSupported();
    return supported;
  } catch (err) {
    console.warn("[SafeCallr] FCM isSupported() check failed:", err);
    return false;
  }
};

// Asynchronously initialize FCM Messaging so it doesn't block module load
if (typeof window !== "undefined") {
  canUseWebFCM().then((supported) => {
    if (supported) {
      try {
        fcmMessaging = getMessaging(app);
      } catch (err) {
        console.warn("[SafeCallr] Error getting Messaging instance:", err);
      }
    }
  }).catch((err) => {
    console.warn("[SafeCallr] Error checking FCM support:", err);
  });
}

export const messaging = fcmMessaging;

export const requestFCMToken = async (userId: string) => {
  try {
    if (typeof window === "undefined" || Capacitor.isNativePlatform()) {
      return null;
    }

    const supported = await canUseWebFCM();
    if (!supported) return null;

    if (!fcmMessaging) {
      try {
        fcmMessaging = getMessaging(app);
      } catch (err) {
        console.error("[SafeCallr] Lazy init getMessaging failed:", err);
        return null;
      }
    }

    if (!fcmMessaging) return null;

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(fcmMessaging, {
        vapidKey: (import.meta as any).env.VITE_FCM_VAPID_PUBLIC_KEY,
      });
      if (token) {
        await setDoc(doc(db, "users", userId), { 
          fcmToken: token, 
          platform: "web",
          tokenUpdatedAt: serverTimestamp()
        }, { merge: true });
        return token;
      }
    }
  } catch (error) {
    console.error("[SafeCallr] FCM Token Error:", error);
  }
  return null;
};

export { 
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
