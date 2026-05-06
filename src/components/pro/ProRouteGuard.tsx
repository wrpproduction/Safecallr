import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Loader2, ShieldAlert } from "lucide-react";

interface ProRouteGuardProps {
  children: React.ReactNode;
}

export default function ProRouteGuard({ children }: ProRouteGuardProps) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      try {
        const proDoc = await getDoc(doc(db, "pros", user.uid));
        if (proDoc.exists()) {
          const data = proDoc.data();
          if (data.status === "active") {
            setAuthorized(true);
          } else {
            setStatus(data.status);
            setAuthorized(false);
          }
        } else {
          setAuthorized(false);
        }
      } catch (error) {
        console.error("Error checking pro status:", error);
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#18181b]" size={40} />
      </div>
    );
  }

  if (!authorized) {
    // Si l'utilisateur est connecté mais pas actif, on le redirige vers login avec le message approprié
    // Pour simplifier ici, on redirige vers login
    return <Navigate to="/pro/login" replace />;
  }

  return <>{children}</>;
}
