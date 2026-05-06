import React, { useEffect, useState } from "react";
import { 
  Loader2, 
  Clock, 
  XCircle, 
  CheckCircle2, 
  ShieldCheck,
  ArrowLeft,
  AlertCircle
} from "lucide-react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db } from "../../firebase";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";

export default function ProRequestWait() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(doc(db, "authRequests", id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRequest({ id: docSnap.id, ...data });
        setLoading(false);

        // Redirection automatique si le code est généré
        if (data.status === "code_generated") {
          navigate(`/pro/request/${id}/code`);
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
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        <p className="text-[#9a9a9f] font-medium">Chargement de la demande...</p>
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

  if (request.status === "refused") {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-8 animate-in zoom-in duration-300">
        <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <XCircle size={48} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#e4e4e8]">Demande refusée</h1>
          <p className="text-[#9a9a9f] mt-3 leading-relaxed">
            Le client a refusé la demande d'authentification ou celle-ci a été annulée.
          </p>
        </div>
        <Link
          to="/pro/search"
          className="block w-full bg-[#4ade80] text-black py-4 rounded-2xl font-bold hover:bg-[#22c55e] transition-all shadow-lg shadow-[#4ade80]/10"
        >
          Nouvelle tentative
        </Link>
      </div>
    );
  }

  const steps = [
    { label: "Demande envoyée", status: "completed" },
    { label: "Client accepte", status: request.status === "pending" ? "active" : "completed" },
    { label: "Code généré", status: "pending" },
    { label: "Client saisit le code", status: "pending" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-10 py-6 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <div className="relative inline-block">
          <div className="w-32 h-32 rounded-full border-4 border-[#2e2e34] flex items-center justify-center">
            <Loader2 className="animate-spin text-[#4ade80]" size={48} />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-[#1e1e22] p-2 rounded-full shadow-md border border-[#2e2e34]">
            <ShieldCheck className="text-[#4ade80]" size={24} />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#e4e4e8]">En attente de réponse...</h1>
          <p className="text-[#9a9a9f] mt-2">
            Une notification a été envoyée au client sur son application SafeCallr.
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-[#1e1e22] rounded-3xl border border-[#2e2e34] shadow-sm p-8">
        <div className="space-y-8">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-4 relative">
              {i < steps.length - 1 && (
                <div className={`absolute left-4 top-10 w-0.5 h-6 ${
                  step.status === 'completed' ? 'bg-[#4ade80]' : 'bg-[#2e2e34]'
                }`} />
              )}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                step.status === 'completed' ? 'bg-[#4ade80] text-black' :
                step.status === 'active' ? 'bg-white text-black animate-pulse' :
                'bg-[#111113] text-[#9a9a9f] border border-[#2e2e34]'
              }`}>
                {step.status === 'completed' ? <CheckCircle2 size={18} /> : <span className="text-xs font-bold">{i + 1}</span>}
              </div>
              <div className="pt-1">
                <p className={`font-bold ${step.status === 'pending' ? 'text-[#9a9a9f]' : 'text-[#e4e4e8]'}`}>
                  {step.label}
                </p>
                {step.status === 'active' && (
                  <p className="text-xs text-[#9a9a9f] mt-1">Le client consulte la notification...</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-2 px-6 py-3 bg-[#111113] border border-[#2e2e34] rounded-full text-[#e4e4e8] font-mono font-bold text-lg">
          <Clock size={20} />
          {formatTime(elapsedTime)}
        </div>

        <button
          onClick={handleCancel}
          className="text-sm font-bold text-red-500 hover:text-red-400 transition-colors flex items-center gap-2"
        >
          <XCircle size={18} />
          Annuler la demande
        </button>
      </div>

      <div className="p-6 bg-blue-500/10 rounded-2xl border border-blue-500/20 flex items-start gap-4 text-blue-400 text-sm">
        <AlertCircle className="shrink-0 mt-0.5" size={20} />
        <p className="leading-relaxed">
          <strong>Conseil :</strong> Si le client ne reçoit pas la notification, vérifiez qu'il est bien connecté à Internet et que ses notifications SafeCallr sont activées.
        </p>
      </div>
    </div>
  );
}
