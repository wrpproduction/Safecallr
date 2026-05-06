import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, doc, onSnapshot, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, addDoc } from "../firebase";
import { Shield, ShieldCheck, Building2, User, Phone, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { motion } from "motion/react";

export default function AuthRequestDetails({ user }: { user: any }) {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<any>(null);
  const [pro, setPro] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(doc(db, "authRequests", id), async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRequest({ id: docSnap.id, ...data });

        // Fetch pro details
        if (data.fromProId) {
          const proDoc = await getDoc(doc(db, "pros", data.fromProId));
          if (proDoc.exists()) {
            setPro(proDoc.data());
          }
        }
      } else {
        navigate("/dashboard");
      }
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
      const currentServerTime = calculateTimeLeft();
      if (currentServerTime !== null) {
        setTimeLeft(currentServerTime);
        if (currentServerTime <= 0) {
          clearInterval(timer);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [request]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  const handleValidate = async () => {
    if (!id || !request) return;
    try {
      // 1. Update the auth request status
      await updateDoc(doc(db, "authRequests", id), {
        status: "validated",
        validatedAt: serverTimestamp()
      });

      // 2. Create or update a permanent connection in proClientConnections
      const connectionsRef = collection(db, "proClientConnections");
      const q = query(
        connectionsRef, 
        where("proId", "==", request.fromProId),
        where("userId", "==", user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Create new connection
        await addDoc(connectionsRef, {
          proId: request.fromProId,
          proName: request.fromProName,
          companyName: request.fromCompanyName,
          companyCategory: request.fromCompanyCategory || "",
          userId: user.uid,
          clientPhone: user.phoneNumber || request.toUserPhone,
          clientEmail: user.email || "",
          status: "connected",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        // Update existing connection to "connected"
        const connectionDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, "proClientConnections", connectionDoc.id), {
          status: "connected",
          companyCategory: request.fromCompanyCategory || "",
          updatedAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error("Validate auth request error:", err);
    }
  };

  const getCategoryLabel = (cat: string) => {
    const categories: Record<string, string> = {
      "banque": "Banque",
      "notaire": "Notaire",
      "avocat": "Avocat",
      "courtier": "Courtier",
      "agent immobilier": "Agent Immobilier",
      "autres": "Autres"
    };
    return categories[cat] || cat;
  };

  if (!request) return null;

  const isExpired = request.status === "expired";
  const isValidated = request.status === "validated";
  const isPending = request.status === "pending" || request.status === "code_generated";

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <section className="text-center space-y-4 pt-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-widest border border-primary/20">
          <Shield size={14} />
          Authentification Professionnelle
        </div>
        <h1 className="font-headline font-extrabold text-3xl tracking-tight text-on-surface">
          {isValidated ? "Identité validée" : isExpired ? "Session expirée" : "Vérification en cours"}
        </h1>
        <p className="text-slate-400 text-sm max-w-[280px] mx-auto">
          {isValidated 
            ? "L'échange a été sécurisé avec succès." 
            : isExpired 
              ? "Cette demande n'est plus valide." 
              : "Un professionnel souhaite confirmer son identité auprès de vous."}
        </p>
      </section>

      {/* Pro Profile Card */}
      <div className="bg-surface-container-low p-6 rounded-3xl border border-white/5 space-y-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <Building2 size={32} />
          </div>
          <div className="flex-1">
            <h3 className="font-headline font-bold text-xl text-on-surface leading-tight">{request.fromCompanyName}</h3>
            <p className="text-primary text-xs font-bold uppercase tracking-widest mt-1">
              {request.fromCompanyCategory ? getCategoryLabel(request.fromCompanyCategory) : "Professionnel"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center text-slate-400">
              <User size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Contact</p>
              <p className="text-sm font-semibold text-on-surface">{request.fromProName}</p>
            </div>
          </div>
          
          {pro?.email && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center text-slate-400">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Statut</p>
                <p className="text-sm font-semibold text-primary">Certifié SafeCallr</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Code Section */}
      {isPending && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-primary-gradient p-8 rounded-3xl text-center space-y-6 shadow-2xl shadow-primary/20"
        >
          <div className="space-y-2">
            <p className="text-on-primary/70 text-[10px] uppercase tracking-widest font-bold">Code de sécurité à vérifier</p>
            <h2 className="text-on-primary text-sm font-medium leading-relaxed">
              Le professionnel doit vous communiquer ce code oralement.
            </h2>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl py-6 border border-white/10 relative overflow-hidden">
            {request.code ? (
              <>
                <div className="text-5xl font-black tracking-[0.3em] text-on-primary font-mono relative z-10">
                  {request.code}
                </div>
                {timeLeft !== null && (
                  <div className="absolute bottom-0 left-0 h-1 bg-white/30 transition-all duration-1000" style={{ width: `${(timeLeft / 45) * 100}%` }} />
                )}
              </>
            ) : (
              <div className="flex items-center justify-center gap-2 text-on-primary/50 italic">
                <Clock size={20} className="animate-spin" />
                <span>En attente du code...</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-on-primary/60 text-[10px] font-bold uppercase tracking-widest">
            {timeLeft !== null && timeLeft > 0 ? (
              <span className={timeLeft < 10 ? "text-red-300 animate-pulse" : ""}>
                Expire dans {timeLeft}s
              </span>
            ) : (
              <>
                <AlertTriangle size={14} />
                Ne partagez pas ce code
              </>
            )}
          </div>

          <button 
            onClick={handleValidate}
            className="w-full bg-white text-primary py-4 rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-all mt-4"
          >
            Confirmer l'identité
          </button>
        </motion.div>
      )}

      {isValidated && (
        <div className="bg-primary/10 p-6 rounded-3xl border border-primary/20 text-center space-y-4">
          <ShieldCheck className="w-12 h-12 text-primary mx-auto" />
          <h3 className="text-lg font-bold text-on-surface">Identité confirmée</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Vous avez validé l'identité de ce professionnel. Vous pouvez poursuivre votre échange en toute confiance.
          </p>
        </div>
      )}

      {isExpired && (
        <div className="bg-error/10 p-6 rounded-3xl border border-error/20 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-error mx-auto" />
          <h3 className="text-lg font-bold text-on-surface">Session expirée</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Cette demande de vérification n'est plus valide. Veuillez demander au professionnel de relancer une nouvelle vérification.
          </p>
        </div>
      )}

      <button 
        onClick={() => navigate("/dashboard")}
        className="w-full bg-surface-container-highest text-on-surface py-4 rounded-2xl font-bold text-sm active:scale-95 transition-all"
      >
        Retour au tableau de bord
      </button>
    </div>
  );
}
