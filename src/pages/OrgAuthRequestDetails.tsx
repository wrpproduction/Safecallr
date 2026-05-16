import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2, 
  Lock,
  ArrowLeft,
  Building2,
  Info
} from "lucide-react";
import { Organization, AuthRequest } from "../lib/types";
import { motion, AnimatePresence } from "motion/react";

export default function OrgAuthRequestDetails() {
  const { orgId, requestId } = useParams<{ orgId: string, requestId: string }>();
  const [request, setRequest] = useState<AuthRequest | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!orgId || !requestId) return;

    const fetchOrg = async () => {
      const orgDoc = await getDoc(doc(db, "organizations", orgId));
      if (orgDoc.exists()) {
        setOrganization(orgDoc.data() as Organization);
      }
    };
    fetchOrg();

    const unsub = onSnapshot(doc(db, "organizations", orgId, "authRequests", requestId), (snap) => {
      if (snap.exists()) {
        setRequest({ id: snap.id, ...snap.data() } as AuthRequest);
        setLoading(false);
      } else {
        setError("Demande introuvable ou expirée.");
        setLoading(false);
      }
    }, (err) => {
      setError("Erreur d'accès à la demande.");
      setLoading(false);
    });

    return () => unsub();
  }, [orgId, requestId]);

  const handleResponse = async (status: "success" | "failed") => {
    if (!orgId || !requestId) return;
    try {
      await updateDoc(doc(db, "organizations", orgId, "authRequests", requestId), {
        status,
        completedAt: new Date()
      });
      if (status === "failed") navigate("/dashboard");
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
        <Loader2 className="text-primary animate-spin" size={40} />
      </div>
    );
  }

  if (error || !request || !organization) {
    return (
      <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center p-6 text-center">
        <div className="space-y-6">
          <p className="text-error font-bold">{error || "Erreur de chargement."}</p>
          <button onClick={() => navigate("/dashboard")} className="bg-primary text-black px-8 py-3 rounded-xl font-black">
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0f] flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest">
            <ArrowLeft size={14} /> Annuler
        </button>

        <div className="bg-[#1e1e22] border border-[#2e2e34] rounded-[40px] p-10 space-y-8 shadow-2xl relative overflow-hidden">
          {/* Logo Brand Header */}
          <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-white/5 to-transparent" />
          
          <div className="relative z-10 flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-[#111113] border-4 border-[#2e2e34] rounded-[28px] p-4 shadow-xl">
              <img src={organization.logoUrl} alt={organization.name} className="w-full h-full object-contain" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white leading-none">{organization.name}</h2>
              <div className="flex items-center justify-center gap-2 text-primary">
                <Shield size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Identité confirmée par SafeCallr</span>
              </div>
            </div>

            <p className="text-slate-400 font-medium text-sm leading-relaxed">
              {request.memberName} souhaite s'identifier auprès de vous pour sécuriser cet appel.
            </p>

            {organization.trustMessage && (
              <div className="bg-[#c084fc]/5 border border-[#c084fc]/20 p-4 rounded-2xl text-left">
                <div className="flex items-center gap-2 text-[#c084fc] mb-2">
                  <Info size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Message de confiance</span>
                </div>
                <p className="text-[#c084fc] text-xs font-bold leading-relaxed italic">
                  "{organization.trustMessage}"
                </p>
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {request.status === "pending" || request.status === "code_generated" ? (
              <motion.div 
                key="waiting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div className="bg-[#111113] rounded-3xl p-8 border-2 border-primary/20 shadow-inner text-center space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Votre code secret</p>
                  <div className="text-6xl font-black text-primary tracking-[10px]">
                    {request.code}
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <button 
                    onClick={() => handleResponse("success")}
                    className="w-full bg-primary text-black py-5 rounded-[28px] font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    C'est bien mon conseiller
                  </button>
                  <button 
                    onClick={() => handleResponse("failed")}
                    className="w-full bg-slate-800 text-slate-400 py-5 rounded-[28px] font-black text-lg hover:bg-error/10 hover:text-error transition-all"
                  >
                    Je ne reconnais pas ce code
                  </button>
                </div>
              </motion.div>
            ) : request.status === "success" ? (
              <motion.div 
                key="success"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-10 space-y-6"
              >
                <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={40} />
                </div>
                <h3 className="text-2xl font-black text-white">Authentification Réussie</h3>
                <p className="text-slate-500 font-medium">Vous pouvez poursuivre votre conversation en toute sécurité.</p>
                <button onClick={() => navigate("/dashboard")} className="text-primary font-black uppercase tracking-widest text-xs">Fermer</button>
              </motion.div>
            ) : (
              <motion.div 
                key="error"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-10 space-y-6"
              >
                <div className="w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto">
                    <XCircle size={40} />
                </div>
                <h3 className="text-2xl font-black text-white">
                  {request.status === "expired" ? "Délai Expiré" : "Authentification Refusée"}
                </h3>
                <p className="text-slate-500 font-medium">L'appel ne peut pas être authentifié via SafeCallr.</p>
                <button onClick={() => navigate("/dashboard")} className="text-primary font-black uppercase tracking-widest text-xs">Retour</button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-8 border-t border-[#2e2e34] flex items-center justify-center gap-3 text-slate-700">
            <Lock size={12} />
            <p className="text-[10px] font-black uppercase tracking-widest">Communication Chiffrée • SafeCallr Protocol</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
