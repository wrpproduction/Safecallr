import React, { useEffect, useState } from "react";
import { 
  ShieldCheck, 
  Clock, 
  XCircle, 
  CheckCircle2, 
  Loader2,
  AlertCircle,
  ArrowLeft,
  RefreshCw
} from "lucide-react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db } from "../../firebase";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";

export default function ProRequestCode() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(45);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(doc(db, "authRequests", id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRequest({ id: docSnap.id, ...data });
        setLoading(false);

        // Si le code n'est pas encore généré, on retourne à l'attente
        if (data.status === "pending") {
          navigate(`/pro/request/${id}/wait`);
        }
      } else {
        setError("Demande introuvable.");
        setLoading(false);
      }
    }, (err) => {
      console.error("Snapshot error:", err);
      setError("Erreur lors du suivi de la demande.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, navigate]);

  useEffect(() => {
    if (!request || request.status !== "code_generated") return;

    const calculateTimeLeft = () => {
      if (request.codeExpiresAt) {
        const expiresAt = request.codeExpiresAt.toDate();
        const now = new Date();
        const diff = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
        return diff;
      }
      return null;
    };

    const initialTime = calculateTimeLeft();
    if (initialTime !== null) {
      setTimeLeft(initialTime);
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const currentServerTime = calculateTimeLeft();
        if (currentServerTime !== null) {
          if (currentServerTime <= 0) {
            clearInterval(timer);
            handleExpire();
            return 0;
          }
          return currentServerTime;
        }

        // Fallback local timer
        if (prev <= 1) {
          clearInterval(timer);
          handleExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [request]);

  const handleExpire = async () => {
    if (!id || request?.status !== "code_generated") return;
    try {
      await updateDoc(doc(db, "authRequests", id), {
        status: "expired",
      });
    } catch (err) {
      console.error("Expire error:", err);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    try {
      await updateDoc(doc(db, "authRequests", id), {
        status: "refused",
        refusedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Cancel error:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-[#4ade80] mb-4" size={40} />
        <p className="text-[#9a9a9f] font-medium">Chargement du code...</p>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-6">
        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle size={40} />
        </div>
        <h1 className="text-2xl font-bold text-[#e4e4e8]">{error || "Erreur"}</h1>
        <Link to="/pro/search" className="inline-flex items-center gap-2 text-[#4ade80] font-bold hover:underline">
          <ArrowLeft size={20} />
          Retour à la recherche
        </Link>
      </div>
    );
  }

  // Success Screen
  if (request.status === "validated") {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-8 animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-[#4ade80]/10 text-[#4ade80] rounded-full flex items-center justify-center mx-auto shadow-sm border-4 border-[#1e1e22]">
          <CheckCircle2 size={48} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#e4e4e8]">Identité validée ✓</h1>
          <p className="text-[#9a9a9f] mt-3 leading-relaxed">
            Le client a été authentifié avec succès. Vous pouvez poursuivre votre échange en toute sécurité.
          </p>
        </div>
        <div className="p-4 bg-[#4ade80]/10 rounded-2xl border border-[#4ade80]/20 text-[#4ade80] text-sm font-medium">
          Session sécurisée par SafeCallr
        </div>
        <Link
          to="/pro/search"
          className="block w-full bg-[#4ade80] text-black py-4 rounded-2xl font-bold hover:bg-[#22c55e] transition-all shadow-lg shadow-[#4ade80]/10"
        >
          Terminer
        </Link>
      </div>
    );
  }

  // Expired / Failed Screen
  if (request.status === "expired" || request.status === "failed" || request.status === "refused") {
    const isRefused = request.status === "refused";
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-8 animate-in zoom-in duration-300">
        <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-sm border-4 border-[#1e1e22]">
          <XCircle size={48} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#e4e4e8]">
            {isRefused ? "Demande refusée" : request.status === "expired" ? "Code expiré" : "Échec de validation"}
          </h1>
          <p className="text-[#9a9a9f] mt-3 leading-relaxed">
            {isRefused ? "Le client a annulé la demande." : "La session a expiré ou le code saisi était incorrect."}
          </p>
        </div>
        <Link
          to="/pro/search"
          className="block w-full bg-[#4ade80] text-black py-4 rounded-2xl font-bold hover:bg-[#22c55e] transition-all shadow-lg shadow-[#4ade80]/10"
        >
          Nouvelle vérification
        </Link>
      </div>
    );
  }

  const code = request.code || "123456"; // Mocked if not present
  const codeDigits = code.split("");

  return (
    <div className="max-w-2xl mx-auto space-y-10 py-6 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#4ade80]/10 text-[#4ade80] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4ade80]/20">
          <ShieldCheck size={14} />
          Code de sécurité généré
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[#e4e4e8]">Lisez le code au client</h1>
        <p className="text-[#9a9a9f]">
          Lisez ces 6 chiffres lentement et clairement pour que le client puisse les saisir.
        </p>
      </div>

      {/* Code Display */}
      <div className="flex justify-center gap-3 sm:gap-4">
        {codeDigits.map((digit, i) => (
          <div 
            key={i} 
            className="w-12 h-16 sm:w-16 sm:h-20 bg-[#111113] border-2 border-[#2e2e34] rounded-2xl flex items-center justify-center text-3xl sm:text-4xl font-black text-[#e4e4e8] shadow-sm"
          >
            {digit}
          </div>
        ))}
      </div>

      {/* Timer & Status */}
      <div className="bg-[#1e1e22] rounded-3xl border border-[#2e2e34] shadow-sm p-8 text-center space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm font-bold mb-2">
            <span className="text-[#9a9a9f] uppercase tracking-widest">Temps restant</span>
            <span className={timeLeft < 15 ? "text-red-500 animate-pulse" : "text-[#e4e4e8]"}>
              {timeLeft} secondes
            </span>
          </div>
          <div className="h-2 bg-[#111113] rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${timeLeft < 10 ? 'bg-red-500' : 'bg-[#4ade80]'}`}
              style={{ width: `${(timeLeft / 45) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 text-[#9a9a9f] font-medium">
          <Loader2 className="animate-spin" size={18} />
          <span>En attente de la saisie par le client...</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6">
        <button
          onClick={handleCancel}
          className="text-sm font-bold text-[#9a9a9f] hover:text-red-500 transition-colors flex items-center gap-2"
        >
          <XCircle size={18} />
          Annuler la session
        </button>
      </div>

      <div className="p-6 bg-amber-500/10 rounded-2xl border border-amber-500/20 flex items-start gap-4 text-amber-500 text-sm">
        <AlertCircle className="shrink-0 mt-0.5" size={20} />
        <p className="leading-relaxed">
          <strong>Important :</strong> Ne partagez jamais ce code par écrit (SMS, Email). Il doit être communiqué uniquement de vive voix pendant l'échange.
        </p>
      </div>
    </div>
  );
}
