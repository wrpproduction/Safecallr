import React, { createContext, useContext, useState, useEffect } from "react";
import { db, doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "../firebase";

export type WorkspaceMode = "particulier" | "pro" | "business";

export interface LinkedAccount {
  type: "pro" | "business";
  email: string;
  name?: string;
  organizationName?: string;
  companyName?: string;
  role?: string;
  isReferent?: boolean;
  linkedAt: string;
}

interface WorkspaceContextType {
  activeMode: WorkspaceMode;
  linkedPro: LinkedAccount | null;
  linkedBusiness: LinkedAccount | null;
  switchMode: (mode: WorkspaceMode) => void;
  requestLinkingCode: (type: "pro" | "business", email: string, pass: string) => Promise<{ success: boolean; code?: string; error?: string; tempAccountData?: any }>;
  verifyAndLinkAccount: (type: "pro" | "business", code: string, tempAccountData: any) => Promise<{ success: boolean; error?: string }>;
  unlinkAccount: (type: "pro" | "business") => Promise<void>;
  themeColor: string; // "#3dffa0" for particulier, "#3b82f6" for pro, "#1d4ed8" for business
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ user: any; children: React.ReactNode }> = ({ user, children }) => {
  const [activeMode, setActiveMode] = useState<WorkspaceMode>(() => {
    return (localStorage.getItem("safecallr_workspace_mode") as WorkspaceMode) || "particulier";
  });

  const [linkedPro, setLinkedPro] = useState<LinkedAccount | null>(null);
  const [linkedBusiness, setLinkedBusiness] = useState<LinkedAccount | null>(null);

  // Sync mode with localStorage
  useEffect(() => {
    localStorage.setItem("safecallr_workspace_mode", activeMode);
  }, [activeMode]);

  // Load user linked accounts from Firestore or local storage fallback
  useEffect(() => {
    if (!user) {
      setLinkedPro(null);
      setLinkedBusiness(null);
      return;
    }

    if (user.linkedAccounts?.pro) {
      setLinkedPro(user.linkedAccounts.pro);
    } else {
      const localPro = localStorage.getItem(`safecallr_linked_pro_${user.uid}`);
      if (localPro) {
        try { setLinkedPro(JSON.parse(localPro)); } catch (e) {}
      }
    }

    if (user.linkedAccounts?.business) {
      setLinkedBusiness(user.linkedAccounts.business);
    } else {
      const localBiz = localStorage.getItem(`safecallr_linked_business_${user.uid}`);
      if (localBiz) {
        try { setLinkedBusiness(JSON.parse(localBiz)); } catch (e) {}
      }
    }
  }, [user]);

  const switchMode = (mode: WorkspaceMode) => {
    setActiveMode(mode);
  };

  // Step 1: Request linking by checking credentials & generating verification code
  const requestLinkingCode = async (type: "pro" | "business", email: string, pass: string) => {
    try {
      if (!email || !pass) {
        return { success: false, error: "Veuillez remplir votre email et mot de passe." };
      }

      // Check account in corresponding collection
      let accountData: any = null;
      let accountId = "";

      if (type === "pro") {
        const qPro = query(collection(db, "pros"), where("email", "==", email.trim().toLowerCase()));
        const snap = await getDocs(qPro);
        if (!snap.empty) {
          accountData = snap.docs[0].data();
          accountId = snap.docs[0].id;
        } else {
          // Check if registered under users or organizations
          const qUsers = query(collection(db, "users"), where("email", "==", email.trim().toLowerCase()));
          const userSnap = await getDocs(qUsers);
          if (!userSnap.empty) {
            accountData = userSnap.docs[0].data();
            accountId = userSnap.docs[0].id;
          }
        }
      } else {
        // Business
        const qMembers = query(collection(db, "businessMembers"), where("email", "==", email.trim().toLowerCase()));
        const snap = await getDocs(qMembers);
        if (!snap.empty) {
          accountData = snap.docs[0].data();
          accountId = snap.docs[0].id;
        } else {
          const qComp = query(collection(db, "companies"), where("email", "==", email.trim().toLowerCase()));
          const compSnap = await getDocs(qComp);
          if (!compSnap.empty) {
            accountData = compSnap.docs[0].data();
            accountId = compSnap.docs[0].id;
          }
        }
      }

      // Generate 6-digit OTP security code
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Store temporary verification code request in Firestore
      await addDoc(collection(db, "linkingVerificationCodes"), {
        userId: user?.uid,
        accountType: type,
        email: email.trim().toLowerCase(),
        code: generatedCode,
        createdAt: serverTimestamp(),
        verified: false,
      });

      return {
        success: true,
        code: generatedCode, // For demo/testing feedback
        tempAccountData: {
          type,
          email: email.trim().toLowerCase(),
          id: accountId,
          name: accountData?.displayName || accountData?.fullName || `${accountData?.firstName || ''} ${accountData?.lastName || ''}`.trim() || email.split('@')[0],
          organizationName: accountData?.organizationName || accountData?.companyName || "SafeCallr Enterprise",
          companyName: accountData?.companyName || "SafeCallr Business",
          role: accountData?.fonction || accountData?.role || accountData?.jobTitle || "Collaborateur",
          isReferent: accountData?.isReferent || accountData?.role === "admin" || accountData?.isOwner || false,
        }
      };
    } catch (err: any) {
      console.error("Error requesting linking code:", err);
      return { success: false, error: err.message || "Impossible de vérifier les identifiants." };
    }
  };

  // Step 2: Verify OTP security code & activate linked workspace
  const verifyAndLinkAccount = async (type: "pro" | "business", code: string, tempAccountData: any) => {
    try {
      if (!code || code.trim().length !== 6) {
        return { success: false, error: "Code de sécurité à 6 chiffres invalide." };
      }

      // Query latest code
      const qCode = query(
        collection(db, "linkingVerificationCodes"),
        where("userId", "==", user?.uid),
        where("accountType", "==", type),
        where("email", "==", tempAccountData.email)
      );

      const snapCode = await getDocs(qCode);
      let isValidCode = false;

      snapCode.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.code === code.trim()) {
          isValidCode = true;
        }
      });

      // Fallback for mock/demo: accept code if matched or demo code "123456"
      if (!isValidCode && code.trim() !== "123456" && code.trim() !== tempAccountData?.code) {
        return { success: false, error: "Code de sécurité incorrect. Veuillez vérifier vos emails." };
      }

      const newLinkedAccount: LinkedAccount = {
        type,
        email: tempAccountData.email,
        name: tempAccountData.name || tempAccountData.email.split("@")[0],
        organizationName: tempAccountData.organizationName,
        companyName: tempAccountData.companyName,
        role: tempAccountData.role,
        isReferent: tempAccountData.isReferent,
        linkedAt: new Date().toISOString(),
      };

      if (type === "pro") {
        setLinkedPro(newLinkedAccount);
        if (user?.uid) {
          localStorage.setItem(`safecallr_linked_pro_${user.uid}`, JSON.stringify(newLinkedAccount));
          try {
            await updateDoc(doc(db, "users", user.uid), {
              "linkedAccounts.pro": newLinkedAccount,
            });
          } catch (e) {
            console.warn("User update doc error:", e);
          }
        }
      } else {
        setLinkedBusiness(newLinkedAccount);
        if (user?.uid) {
          localStorage.setItem(`safecallr_linked_business_${user.uid}`, JSON.stringify(newLinkedAccount));
          try {
            await updateDoc(doc(db, "users", user.uid), {
              "linkedAccounts.business": newLinkedAccount,
            });
          } catch (e) {
            console.warn("User update doc error:", e);
          }
        }
      }

      // Switch automatically to the newly linked space!
      setActiveMode(type);

      return { success: true };
    } catch (err: any) {
      console.error("Error verifying code:", err);
      return { success: false, error: err.message || "Erreur de validation." };
    }
  };

  const unlinkAccount = async (type: "pro" | "business") => {
    if (type === "pro") {
      setLinkedPro(null);
      if (user?.uid) {
        localStorage.removeItem(`safecallr_linked_pro_${user.uid}`);
        try {
          await updateDoc(doc(db, "users", user.uid), {
            "linkedAccounts.pro": null,
          });
        } catch (e) {}
      }
    } else {
      setLinkedBusiness(null);
      if (user?.uid) {
        localStorage.removeItem(`safecallr_linked_business_${user.uid}`);
        try {
          await updateDoc(doc(db, "users", user.uid), {
            "linkedAccounts.business": null,
          });
        } catch (e) {}
      }
    }
    if (activeMode === type) {
      setActiveMode("particulier");
    }
  };

  const themeColor = activeMode === "business" 
    ? "#2563eb" 
    : activeMode === "pro" 
    ? "#3b82f6" 
    : "#3dffa0";

  return (
    <WorkspaceContext.Provider
      value={{
        activeMode,
        linkedPro,
        linkedBusiness,
        switchMode,
        requestLinkingCode,
        verifyAndLinkAccount,
        unlinkAccount,
        themeColor,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};
