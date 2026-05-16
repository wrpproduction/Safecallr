import React, { useState, useEffect } from "react";
import { 
  Zap, 
  Send, 
  Loader2, 
  ShieldCheck, 
  XCircle,
  RefreshCw,
  CheckCircle2,
  Lock
} from "lucide-react";
import PhoneInput from "./PhoneInput";
import AuthCodeDisplay from "./AuthCodeDisplay";
import { Organization, Member, AuthRequest } from "../../lib/types";
import { auth, db } from "../../firebase";
import { doc, onSnapshot, getDoc, updateDoc } from "firebase/firestore";
import { animate, motion, AnimatePresence } from "motion/react";

interface TriggerAuthBlockProps {
  organization: Organization;
  member: Member;
}

type AuthStatus = "idle" | "sending" | "waiting" | "success" | "failed" | "expired";

export default function TriggerAuthBlock({ organization, member }: TriggerAuthBlockProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [activeRequest, setActiveRequest] = useState<AuthRequest | null>(null);

  useEffect(() => {
    if (activeRequest?.id && status === "waiting") {
      const unsub = onSnapshot(doc(db, "organizations", organization.id, "authRequests", activeRequest.id), (snap) => {
        if (snap.exists()) {
          const data = snap.data() as AuthRequest;
          if (data.status === "success") {
            setStatus("success");
          } else if (data.status === "failed") {
            setStatus("failed");
          } else if (data.status === "expired") {
            setStatus("expired");
          }
        }
      });

      // Client-side auto-expiration as fallback/timer
      const timer = setTimeout(async () => {
        const snap = await getDoc(doc(db, "organizations", organization.id, "authRequests", activeRequest.id));
        if (snap.exists() && snap.data()?.status === "pending") {
          await updateDoc(doc(db, "organizations", organization.id, "authRequests", activeRequest.id), {
            status: "expired",
            completedAt: new Date()
          });
          setStatus("expired");
        }
      }, 60000);

      return () => {
        unsub();
        clearTimeout(timer);
      };
    }
  }, [activeRequest?.id, status, organization.id]);

  const handleTrigger = async () => {
    if (phoneNumber.replace(/\s/g, "").length < 10) return;

    setStatus("sending");
    setError(null);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      // Clean phone number: replace 0 with +33 if needed, or just normalize
      let cleanPhone = phoneNumber.replace(/\s/g, "");
      if (cleanPhone.startsWith("0")) {
        cleanPhone = "+33" + cleanPhone.slice(1);
      }

      const response = await fetch("/api/auth/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          orgId: organization.id,
          clientPhone: cleanPhone
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors du déclenchement");
      }

      setActiveRequest({
        id: data.requestId,
        code: data.code,
        status: "pending",
        memberId: member.id,
        memberName: `${member.firstName} ${member.lastName}`,
        clientPhone: cleanPhone,
        createdAt: new Date(),
        completedAt: null,
        ipAddress: "..."
      });
      setStatus("waiting");

    } catch (err: any) {
      setError(err.message);
      setStatus("idle");
    }
  };

  const handleCancel = async () => {
    if (!activeRequest) return;
    
    try {
      const idToken = await auth.currentUser?.getIdToken();
      await fetch("/api/auth/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          orgId: organization.id,
          requestId: activeRequest.id
        })
      });
      setStatus("idle");
      setActiveRequest(null);
    } catch (err) {
      console.error(err);
    }
  };

  const reset = () => {
    setStatus("idle");
    setPhoneNumber("");
    setActiveRequest(null);
    setError(null);
  };

  return (
    <div className="relative">
      <div className="bg-[#1e1e22] border border-[#2e2e34] rounded-[40px] p-10 md:p-14 shadow-2xl relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -mr-32 -mt-32 rounded-full" />
        
        <AnimatePresence mode="wait">
          {status === "idle" || status === "sending" ? (
            <motion.div 
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10 relative z-10"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Zap size={24} />
                  </div>
                  <h3 className="text-3xl font-black text-white tracking-tight">Authentifier un appel client</h3>
                </div>
                <p className="text-slate-500 font-medium max-w-md">
                  Confirmez votre identité auprès de votre client avant de poursuivre la conversation sensible.
                </p>
              </div>

              <div className="space-y-6">
                <PhoneInput 
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                  className="max-w-md"
                />

                {error && (
                  <div className="flex items-center gap-3 text-error font-bold text-sm bg-error/10 p-4 rounded-2xl border border-error/20 max-w-md">
                    <XCircle size={18} />
                    {error}
                  </div>
                )}

                <button
                  disabled={status === "sending" || phoneNumber.replace(/\s/g, "").length < 10}
                  onClick={handleTrigger}
                  style={{ backgroundColor: organization.primaryColor }}
                  className="w-full max-w-md flex items-center justify-center gap-4 py-6 rounded-[28px] text-black font-black text-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-primary/20 disabled:grayscale disabled:opacity-50"
                >
                  {status === "sending" ? (
                    <Loader2 className="animate-spin" size={28} />
                  ) : (
                    <>
                      <Send size={24} />
                      Envoyer le code
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : status === "success" ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-10 space-y-8"
            >
              <div className="w-24 h-24 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={56} />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-white">Identité confirmée</h3>
                <p className="text-slate-500">Votre client a validé l'authentification avec succès.</p>
              </div>
              <button 
                onClick={reset}
                className="bg-white/10 hover:bg-white/20 text-white px-10 py-4 rounded-2xl font-black transition-all"
              >
                Nouvelle authentification
              </button>
            </motion.div>
          ) : (status === "failed" || status === "expired") ? (
            <motion.div 
              key="failed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-10 space-y-8"
            >
              <div className="w-24 h-24 bg-error/20 text-error rounded-full flex items-center justify-center mx-auto">
                <XCircle size={56} />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-white">
                  {status === "expired" ? "Code expiré" : "Échec de l'authentification"}
                </h3>
                <p className="text-slate-500">
                  {status === "expired" 
                    ? "Le délai de 60 secondes est dépassé." 
                    : "Le client a refusé la demande ou une erreur est survenue."}
                </p>
              </div>
              <button 
                onClick={reset}
                className="bg-primary text-black px-10 py-4 rounded-2xl font-black transition-all"
              >
                Réessayer
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Info label */}
        <div className="mt-10 pt-10 border-t border-[#2e2e34] flex items-center gap-3 text-slate-600">
          <Lock size={14} />
          <p className="text-[10px] font-black uppercase tracking-widest leading-none">Protocole de sécurité SafeCallr v2.5</p>
        </div>
      </div>

      <AnimatePresence>
        {status === "waiting" && activeRequest && (
          <AuthCodeDisplay 
            code={activeRequest.code}
            onCancel={handleCancel}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
