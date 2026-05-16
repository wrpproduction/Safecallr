import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Vérification du rôle admin
        const adminEmails = [
          "xdcam10@gmail.com", 
          "ulrich.vidal@gmail.com",
          "contact@wrpproduction.com",
          "contact@remiprevel.com"
        ];

        if (adminEmails.includes(user.email || "")) {
          setIsAdmin(true);
        } else {
          try {
            const adminDoc = await getDoc(doc(db, "admins", user.uid));
            setIsAdmin(adminDoc.exists() && adminDoc.data().role === "admin");
          } catch (err) {
            console.error("Admin verification error:", err);
            setIsAdmin(false);
          }
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#4ade80] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" />;
  }

  return <>{children}</>;
}
