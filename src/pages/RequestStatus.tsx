import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, doc, onSnapshot, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, addDoc } from "../firebase";
import { Shield, CheckCircle, AlertTriangle, Clock, XCircle, Phone, User, ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function RequestStatus({ user }: { user: any }) {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inputCode, setInputCode] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [fetchedRequesterPhone, setFetchedRequesterPhone] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(doc(db, "verification_requests", id), async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setRequest({ id: snap.id, ...data });

        // If target (B), fetch requesterPhone from users collection if not stored in the document
        if (data.requesterId && data.requesterId !== user.uid && !data.requesterPhone) {
          try {
            const userSnap = await getDoc(doc(db, "users", data.requesterId));
            if (userSnap.exists()) {
              const uData = userSnap.data();
              if (uData.phoneNumber) {
                setFetchedRequesterPhone(uData.phoneNumber);
              }
            }
          } catch (err) {
            console.error("Error fetching requester phone fallback:", err);
          }
        }
      } else {
        navigate("/dashboard");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, navigate, user.uid]);

  useEffect(() => {
    if (request?.status !== "accepted" || !request?.respondedAt) return;
    
    const calculateTimeLeft = () => {
      const respondedAt = request.respondedAt.toDate();
      const now = new Date();
      const diff = Math.floor((now.getTime() - respondedAt.getTime()) / 1000);
      return Math.max(0, 60 - diff);
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [request?.status, request?.respondedAt]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  const isRequester = request.requesterId === user.uid;
  const isTarget = request.targetId === user.uid || request.targetPhone === user.phoneNumber;

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending": return { label: "En attente", color: "text-slate-400", icon: Clock, bg: "bg-slate-400/10", border: "border-slate-400/20" };
      case "accepted": return { label: "Handshake 1/2", color: "text-primary", icon: ShieldQuestion, bg: "bg-primary/10", border: "border-primary/20" };
      case "step1_verified": return { label: "Handshake 2/2", color: "text-primary", icon: ShieldQuestion, bg: "bg-primary/10", border: "border-primary/20" };
      case "verified": return { label: "Vérifiée", color: "text-primary", icon: ShieldCheck, bg: "bg-primary/10", border: "border-primary/20" };
      case "refused": return { label: "Refusée", color: "text-error", icon: XCircle, bg: "bg-error/10", border: "border-error/20" };
      case "caution": return { label: "Vigilance", color: "text-tertiary-container", icon: ShieldAlert, bg: "bg-tertiary-container/10", border: "border-tertiary-container/20" };
      default: return { label: "Inconnu", color: "text-slate-400", icon: ShieldQuestion, bg: "bg-slate-400/10", border: "border-slate-400/20" };
    }
  };

  const statusInfo = getStatusInfo(request.status);

  const createConnection = async () => {
    if (!request) return;
    try {
      const connectionsRef = collection(db, "userConnections");
      const q = query(
        connectionsRef,
        where("userAId", "in", [request.requesterId, request.targetId]),
        where("userBId", "in", [request.requesterId, request.targetId])
      );
      
      const querySnapshot = await getDocs(q);
      const existing = querySnapshot.docs.find(doc => {
        const d = doc.data();
        return (d.userAId === request.requesterId && d.userBId === request.targetId) ||
               (d.userAId === request.targetId && d.userBId === request.requesterId);
      });

      if (!existing) {
        await addDoc(connectionsRef, {
          userAId: request.requesterId,
          userAName: request.requesterName,
          userAPhone: user.uid === request.requesterId ? user.phoneNumber : "",
          userBId: request.targetId,
          userBName: request.targetName || "",
          userBPhone: request.targetPhone,
          status: "verified",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error("Error creating user connection:", err);
    }
  };

  const handleAction = async (newStatus: string) => {
    if (!id) return;
    try {
      await updateDoc(doc(db, "verification_requests", id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
        ...(newStatus === "accepted" ? { respondedAt: serverTimestamp(), targetId: user.uid } : {}),
        ...(newStatus === "verified" ? { verifiedAt: serverTimestamp() } : {}),
      });
      if (newStatus === "verified") {
        await createConnection();
      }
    } catch (error) {
      console.error("Action error:", error);
    }
  };

  // Dynamic variables for visual timer feedback
  let timerThemeArgs = {
    colorClass: "text-[#10b981]", 
    borderClass: "border-[#10b981]/20",
    bgClass: "bg-[#10b981]/5",
    alertLabel: null as any,
    showCode: true
  };

  if (request?.status === "accepted") {
    if (timeLeft > 30) {
      // 1 min to 30s: Green
      timerThemeArgs = {
        colorClass: "text-[#10b981]",
        borderClass: "border-[#10b981]/20",
        bgClass: "bg-[#10b981]/5",
        alertLabel: null,
        showCode: true
      };
    } else if (timeLeft > 10) {
      // 30s to 10s: Orange with "attention" alert
      timerThemeArgs = {
        colorClass: "text-[#f59e0b]",
        borderClass: "border-[#f59e0b]/40",
        bgClass: "bg-[#f59e0b]/5",
        alertLabel: (
          <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#f59e0b] px-4 py-2 rounded-2xl font-bold text-xs uppercase tracking-wider animate-pulse flex items-center justify-center gap-1.5 shadow-sm">
            <AlertTriangle className="w-4 h-4" />
            ATTENTION
          </div>
        ),
        showCode: true
      };
    } else if (timeLeft > 0) {
      // 10s to 1s: Red with "danger suspicion arnaque"
      timerThemeArgs = {
        colorClass: "text-[#ef4444]",
        borderClass: "border-[#ef4444]/60",
        bgClass: "bg-[#ef4444]/5",
        alertLabel: (
          <div className="bg-[#ef4444]/15 border border-[#ef4444]/30 text-[#ef4444] px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-wider animate-bounce flex items-center justify-center gap-1.5 shadow-md">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
            DANGER SUSPICION ARNAQUE
          </div>
        ),
        showCode: true
      };
    } else {
      // 0: Red, code disappears, "danger suspicion d'arnaque"
      timerThemeArgs = {
        colorClass: "text-[#ef4444]",
        borderClass: "border-[#ef4444]/80",
        bgClass: "bg-[#ef4444]/10",
        alertLabel: (
          <div className="bg-[#ef4444]/20 border border-[#ef4444]/50 text-[#ef4444] px-5 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest text-center shadow-lg animate-pulse flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-6 h-6" />
              <span>DANGER : SUSPICION D'ARNAQUE</span>
            </div>
            <p className="text-[10px] font-bold text-[#ef4444]/80 tracking-normal normal-case font-sans mt-1">
              Délai expiré. Raccrochez immédiatement, ne donnez aucun code !
            </p>
          </div>
        ),
        showCode: false
      };
    }
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Status Hero */}
      <section className="flex flex-col items-center text-center space-y-6 pt-8">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`relative w-40 h-40 rounded-full ${statusInfo.bg} flex items-center justify-center border-2 ${statusInfo.border}`}
        >
          <div className={`absolute inset-0 rounded-full ${statusInfo.bg} animate-ping opacity-20`}></div>
          <statusInfo.icon className={`w-20 h-20 ${statusInfo.color}`} />
          <div className="absolute -right-2 top-0 bg-surface-container-highest px-3 py-1.5 rounded-xl border border-white/5 flex items-center gap-2 shadow-2xl">
            <div className={`w-2 h-2 rounded-full ${statusInfo.color} animate-pulse`}></div>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${statusInfo.color}`}>Live Scan</span>
          </div>
        </motion.div>

        <div className="space-y-2">
          <h2 className="font-headline font-extrabold text-3xl tracking-tight text-on-surface">
            {request.status === "pending" && (isRequester ? "En attente de B..." : "Demande reçue")}
            {request.status === "accepted" && "Handshake en cours"}
            {request.status === "step1_verified" && "Handshake final"}
            {request.status === "verified" && "Identité confirmée"}
            {request.status === "refused" && "Demande refusée"}
          </h2>
          <p className="text-slate-400 text-sm max-w-[280px] mx-auto">
            {request.status === "pending" && (isRequester ? "Attendez que votre interlocuteur accepte." : "Acceptez pour voir le code de sécurité.")}
            {request.status === "accepted" && (
              timeLeft > 0 ? (
                isRequester ? "Votre interlocuteur doit vous donner le code." : "Donnez ce code à votre interlocuteur."
              ) : (
                "Session interrompue par sécurité."
              )
            )}
            {request.status === "step1_verified" && (isRequester ? "Donnez ce nouveau code à votre interlocuteur." : "Votre interlocuteur doit vous donner le code.")}
          </p>
        </div>

        {/* STEP 1: A sees codeA, B sees codeA after accepting */}
        {request.status === "pending" && isRequester && (
          <div className="bg-surface-container-low p-6 rounded-3xl border border-white/5 text-center space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Votre code de sécurité</p>
            <div className="text-4xl font-black tracking-widest text-primary font-mono">{request.codeA}</div>
          </div>
        )}

        {request.status === "accepted" && (
          <div className="w-full space-y-4">
            <div className={`p-8 rounded-3xl border text-center space-y-4 transition-colors duration-500 ${timerThemeArgs.bgClass} ${timerThemeArgs.borderClass}`}>
              <p className={`text-[10px] uppercase tracking-widest font-bold ${timerThemeArgs.colorClass}`}>
                {timeLeft > 0 ? (
                  isTarget ? "Dites ce code à votre interlocuteur" : "Votre interlocuteur doit dire ce code"
                ) : (
                  "Code de sécurité expiré"
                )}
              </p>
              
              {timerThemeArgs.showCode ? (
                <div className={`text-6xl font-black tracking-[0.2em] font-mono ${timerThemeArgs.colorClass}`}>
                  {request.codeA}
                </div>
              ) : (
                <div className="text-4xl font-black tracking-widest text-slate-500 font-mono select-none my-2 py-2 animate-pulse">
                  ••••
                </div>
              )}

              {timerThemeArgs.alertLabel && (
                <div className="py-2">
                  {timerThemeArgs.alertLabel}
                </div>
              )}

              <div className={`flex items-center justify-center gap-2 ${timerThemeArgs.colorClass} font-mono transition-colors duration-500`}>
                <Clock className="w-4 h-4 animate-pulse" />
                <span className="text-sm font-bold">{timeLeft}s</span>
              </div>
            </div>
            
            {isRequester && timeLeft > 0 && (
              <button 
                onClick={() => handleAction("step1_verified")}
                className="w-full bg-primary-gradient text-on-primary font-headline font-extrabold text-xl py-6 rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-all"
              >
                Code Correct
              </button>
            )}
          </div>
        )}

        {/* STEP 2: B sees codeB, A gives codeB to B */}
        {request.status === "step1_verified" && (
          <div className="w-full space-y-4">
            <div className="bg-primary/5 p-8 rounded-3xl border border-primary/20 text-center space-y-4">
              <p className="text-[10px] uppercase tracking-widest text-primary font-bold">
                {isRequester ? "Dites ce nouveau code à votre interlocuteur" : "Votre interlocuteur doit dire ce code"}
              </p>
              <div className="text-6xl font-black tracking-[0.2em] text-primary font-mono">
                {request.codeB}
              </div>
            </div>
            
            {isTarget && (
              <button 
                onClick={() => handleAction("verified")}
                className="w-full bg-primary-gradient text-on-primary font-headline font-extrabold text-xl py-6 rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-all"
              >
                Code Correct
              </button>
            )}
          </div>
        )}
      </section>

      {/* Details Card */}
      <div className="bg-surface-container-low p-6 rounded-3xl border border-white/5 space-y-4 font-sans">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center">
              <Phone className="text-primary w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Contact</p>
              {(() => {
                const contactName = isRequester ? request.targetName : request.requesterName;
                const contactPhone = isRequester ? request.targetPhone : (request.requesterPhone || fetchedRequesterPhone || "—");
                return (
                  <>
                    {contactName && <p className="text-sm font-bold text-on-surface leading-tight mb-0.5">{contactName}</p>}
                    <p className={`font-mono text-on-surface ${contactName ? "text-xs text-slate-400 font-medium" : "text-sm font-semibold"}`}>{contactPhone}</p>
                  </>
                );
              })()}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold font-sans">Type</p>
            <p className="text-sm font-semibold text-on-surface">{request.type}</p>
          </div>
        </div>
      </div>

      {/* Actions pour la cible (B) au début */}
      {isTarget && request.status === "pending" && (
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => handleAction("refused")}
            className="bg-surface-container-highest text-error font-headline font-bold py-5 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <XCircle className="w-5 h-5" />
            Refuser
          </button>
          <button 
            onClick={() => handleAction("accepted")}
            className="bg-primary-gradient text-on-primary font-headline font-bold py-5 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Accepter
          </button>
        </div>
      )}

      <p className="text-center text-slate-500 text-[10px] font-bold tracking-[0.2em] uppercase">
        SafeCallr Encrypted Handshake Protocol v4.0
      </p>
    </div>
  );
}
