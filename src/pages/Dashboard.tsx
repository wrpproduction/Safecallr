import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db, collection, query, where, onSnapshot, orderBy, auth, signOut, updateDoc, doc, serverTimestamp, getDocs, addDoc } from "../firebase";
import { Shield, PlusCircle, History, HelpCircle, LogOut, CheckCircle, AlertTriangle, Clock, XCircle, UserPlus, Check, X, Users, User, Building2, ShieldQuestion, ArrowRight, MonitorSmartphone } from "lucide-react";
import { motion } from "motion/react";

export default function Dashboard({ user }: { user: any }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [authRequests, setAuthRequests] = useState<any[]>([]);
  const [personalRequests, setPersonalRequests] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [myContacts, setMyContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [showFloatingBanner, setShowFloatingBanner] = useState(true);
  const [isStandalone, setIsStandalone] = useState(false);
  const [userConnections, setUserConnections] = useState<any[]>([]);
  const [personalContacts, setPersonalContacts] = useState<any[]>([]);
  const [pros, setPros] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);
  }, []);

  const pendingAuthRequest = authRequests.find(r => r.status === "pending" || r.status === "code_generated");
  const pendingIncomingVerification = requests.find(r => r.status === "pending" && r.requesterId !== user.uid);
  const pendingConnections = [...connections, ...personalRequests];
  const hasAnyPending = !!pendingAuthRequest || !!pendingIncomingVerification || pendingConnections.length > 0;

  const requestIdsString = [
    pendingAuthRequest?.id,
    pendingIncomingVerification?.id,
    pendingConnections.map(c => c.id).join(",")
  ].filter(Boolean).join("|");

  useEffect(() => {
    if (requestIdsString) {
      setShowFloatingBanner(true);
    }
  }, [requestIdsString]);

  useEffect(() => {
    if (pendingAuthRequest || pendingIncomingVerification) {
      // Play a subtle notification sound when a new request arrives
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
      } catch (e) {
        // Audio context might be blocked by browser policy until user interaction
      }
      
      // Vibrate if supported
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  }, [pendingAuthRequest?.id, pendingIncomingVerification?.id]);

  useEffect(() => {
    if (!user || !user.phoneNumber) return;

    // Nettoyer le numéro de téléphone de l'utilisateur pour la recherche
    const cleanUserPhone = user.phoneNumber?.replace(/\s/g, "").replace(/-/g, "");

    // On écoute les demandes de connexion pro (Mise en relation)
    // On cherche par userId OU par numéro de téléphone/email
    const qConnections = query(
      collection(db, "proClientConnections")
    );

    const unsubConnections = onSnapshot(qConnections, (snapshot) => {
      const allConns = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const userConns = allConns.filter((c: any) => 
        (c.userId === user.uid || 
        (cleanUserPhone && c.clientPhone?.replace(/\s/g, "").replace(/-/g, "") === cleanUserPhone) ||
        c.clientEmail === user.email)
      );
      
      setConnections(userConns.filter((c: any) => c.status === "pending"));
      setMyContacts(userConns.filter((c: any) => c.status === "connected"));
      setLoadingConnections(false);
    });

    // On écoute les demandes d'authentification pro (authRequests)
    const qAuth = query(
      collection(db, "authRequests"),
      orderBy("createdAt", "desc")
    );

    const unsubAuth = onSnapshot(qAuth, (snapshot) => {
      const allAuths = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const userAuths = allAuths.filter((r: any) => 
        r.toUserId === user.uid || 
        (cleanUserPhone && r.toUserPhone?.replace(/\s/g, "").replace(/-/g, "") === cleanUserPhone)
      );
      setAuthRequests(userAuths);
    });

    // On écoute les demandes de contacts personnels
    const qPersoReq = query(
      collection(db, "personalContactRequests"),
      where("toUserId", "==", user.uid),
      where("status", "==", "pending")
    );

    const unsubPersoReq = onSnapshot(qPersoReq, (snapshot) => {
      setPersonalRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // On écoute les demandes envoyées
    const qSent = query(
      collection(db, "verification_requests"),
      where("requesterId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    // On écoute les demandes reçues (via numéro de téléphone)
    const qReceived = query(
      collection(db, "verification_requests"),
      where("targetPhone", "==", user.phoneNumber),
      orderBy("createdAt", "desc")
    );

    const unsubSent = onSnapshot(qSent, (snapshot) => {
      const sent = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(prev => {
        const others = prev.filter(r => (r as any).requesterId !== user.uid);
        const combined = [...sent, ...others].sort((a: any, b: any) => 
          (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
        );
        return combined;
      });
      setLoading(false);
    });

    const unsubReceived = onSnapshot(qReceived, (snapshot) => {
      const received = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(prev => {
        const others = prev.filter(r => (r as any).targetPhone !== user.phoneNumber);
        const combined = [...received, ...others].sort((a: any, b: any) => 
          (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
        );
        return combined;
      });
      setLoading(false);
    });

    const qUserConn = query(
      collection(db, "userConnections"),
      where("userAId", "==", user.uid)
    );
    const qUserConnB = query(
      collection(db, "userConnections"),
      where("userBId", "==", user.uid)
    );

    const unsubscribeUserConnA = onSnapshot(qUserConn, (snapshot) => {
      const connsA = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserConnections(prev => {
        const other = prev.filter(c => c.userBId === user.uid);
        return [...connsA, ...other];
      });
    });

    const unsubscribeUserConnB = onSnapshot(qUserConnB, (snapshot) => {
      const connsB = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserConnections(prev => {
        const other = prev.filter(c => c.userAId === user.uid);
        return [...other, ...connsB];
      });
    });

    const qPerso = query(
      collection(db, "personalContacts"),
      where("ownerId", "==", user.uid)
    );
    const unsubscribePerso = onSnapshot(qPerso, (snapshot) => {
      setPersonalContacts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubscribePros = onSnapshot(collection(db, "pros"), (snapshot) => {
      setPros(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubscribeCompanies = onSnapshot(collection(db, "companies"), (snapshot) => {
      setCompanies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubSent();
      unsubReceived();
      unsubConnections();
      unsubAuth();
      unsubPersoReq();
      unsubscribeUserConnA();
      unsubscribeUserConnB();
      unsubscribePerso();
      unsubscribePros();
      unsubscribeCompanies();
    };
  }, [user]);

  const handleAcceptConnection = async (connectionId: string) => {
    try {
      await updateDoc(doc(db, "proClientConnections", connectionId), {
        status: "connected",
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Accept connection error:", err);
    }
  };

  const handleRejectConnection = async (connectionId: string) => {
    try {
      await updateDoc(doc(db, "proClientConnections", connectionId), {
        status: "rejected",
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Reject connection error:", err);
    }
  };

  const handleAcceptPersonalRequest = async (request: any) => {
    try {
      await addDoc(collection(db, "userConnections"), {
        userAId: request.fromUserId,
        userAName: request.fromUserName,
        userAPhone: request.fromUserPhone,
        userBId: request.toUserId,
        userBName: request.toUserName,
        userBPhone: request.toUserPhone,
        status: "verified",
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, "personalContactRequests", request.id), {
        status: "accepted",
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Accept personal request error:", err);
    }
  };

  const handleRejectPersonalRequest = async (requestId: string) => {
    try {
      await updateDoc(doc(db, "personalContactRequests", requestId), {
        status: "rejected",
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Reject personal request error:", err);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending": return { label: "En attente", color: "text-slate-400", icon: Clock };
      case "accepted": return { label: "Handshake 1/2", color: "text-primary", icon: ShieldQuestion };
      case "step1_verified": return { label: "Handshake 2/2", color: "text-primary", icon: ShieldQuestion };
      case "refused": return { label: "Refusée", color: "text-error", icon: XCircle };
      case "verified": return { label: "Vérifiée", color: "text-primary", icon: Shield };
      case "caution": return { label: "Vigilance", color: "text-tertiary-container", icon: AlertTriangle };
      default: return { label: "Inconnu", color: "text-slate-400", icon: Clock };
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

  return (
    <div className="space-y-8">
      {/* Floating Notification Banner */}
      {hasAnyPending && showFloatingBanner && (
        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed top-4 left-4 right-4 z-[100] pointer-events-none"
        >
          <div className="max-w-md mx-auto pointer-events-auto">
            <div className="bg-primary-gradient p-4 rounded-2xl shadow-2xl shadow-primary/40 border border-white/20 flex items-center gap-4 relative overflow-hidden">
              <motion.div 
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-white"
              />
              <div className="w-10 h-10 rounded-full bg-on-primary/20 flex items-center justify-center text-on-primary shrink-0 animate-bounce">
                <Shield size={20} />
              </div>
              <div className="flex-1 min-w-0 relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-on-primary/80">Notification Prioritaire</p>
                <h4 className="text-sm font-bold text-on-primary truncate">
                  {pendingAuthRequest 
                    ? `Authentification : ${pendingAuthRequest.fromCompanyName || "Pro"}` 
                    : pendingIncomingVerification 
                      ? `Demande de vérification par ${pendingIncomingVerification.requesterName || "un contact"}` 
                      : "Nouvelle mise en relation"}
                </h4>
              </div>
              <div className="flex items-center gap-2 relative z-10">
                <button 
                  onClick={() => {
                    if (pendingAuthRequest) {
                      navigate(`/auth-request/${pendingAuthRequest.id}`);
                    } else if (pendingIncomingVerification) {
                      navigate(`/request/${pendingIncomingVerification.id}`);
                    }
                  }}
                  className="bg-on-primary text-primary px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all font-bold"
                >
                  Voir
                </button>
                <button 
                  onClick={() => setShowFloatingBanner(false)}
                  className="p-2 text-on-primary/60 hover:text-on-primary transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

        {/* URGENT ALERT - Top of page if pending auth */}
        {pendingAuthRequest && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="px-2 animate-pulse"
          >
            <Link 
              to={`/auth-request/${pendingAuthRequest.id}`} 
              className="w-full bg-primary-gradient p-10 rounded-[40px] flex flex-col items-center justify-center gap-6 shadow-2xl shadow-primary/50 group relative overflow-hidden border-4 border-white/20"
            >
              <motion.div 
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.1, 0.3, 0.1]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 bg-white rounded-full blur-[100px]"
              />
              
              <div className="relative z-10 flex flex-col items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-on-primary flex items-center justify-center shadow-2xl animate-bounce">
                  <Shield className="text-primary w-12 h-12" />
                </div>
                <div className="text-center space-y-2">
                  <div className="inline-block bg-on-primary text-primary text-[12px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-full shadow-lg">
                    ALERTE SÉCURITÉ
                  </div>
                  <h3 className="font-headline font-black text-3xl text-on-primary uppercase tracking-tighter leading-none mt-2">
                    Demande d'authentification
                  </h3>
                  <p className="text-on-primary/90 text-lg font-bold">
                    {pendingAuthRequest.fromCompanyName}
                  </p>
                </div>
                <div className="bg-on-primary text-primary px-10 py-5 rounded-3xl font-black text-lg uppercase tracking-widest shadow-2xl group-hover:scale-110 transition-transform">
                  Vérifier l'identité
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* URGENT ALERT - Top of page if pending incoming individual verification */}
        {pendingIncomingVerification && !pendingAuthRequest && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="px-2 animate-pulse"
          >
            <Link 
              to={`/request/${pendingIncomingVerification.id}`} 
              className="w-full bg-primary-gradient p-10 rounded-[40px] flex flex-col items-center justify-center gap-6 shadow-2xl shadow-primary/50 group relative overflow-hidden border-4 border-white/20"
            >
              <motion.div 
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.1, 0.3, 0.1]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 bg-white rounded-full blur-[100px]"
              />
              
              <div className="relative z-10 flex flex-col items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-on-primary flex items-center justify-center shadow-2xl animate-bounce">
                  <Shield className="text-primary w-12 h-12" />
                </div>
                <div className="text-center space-y-2">
                  <div className="inline-block bg-on-primary text-primary text-[12px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-full shadow-lg">
                    DEMANDE DE VÉRIFICATION
                  </div>
                  <h3 className="font-headline font-black text-3xl text-on-primary uppercase tracking-tighter leading-none mt-2">
                    Confirmation d'identité reçue
                  </h3>
                  <p className="text-on-primary/95 text-lg font-bold">
                    Demande de vérification par : {pendingIncomingVerification.requesterName || "un contact"}
                  </p>
                </div>
                <div className="bg-on-primary text-primary px-10 py-5 rounded-3xl font-black text-lg uppercase tracking-widest shadow-2xl group-hover:scale-110 transition-transform">
                  Répondre / Voir le code
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Hero Section */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="font-headline font-extrabold text-2xl tracking-tight text-on-surface">
              Bonjour, <span className="text-primary truncate">
                {user.firstName ? `${user.firstName} ${user.lastName || ""}` : (user.displayName || "Utilisateur")}
              </span>
            </h1>
            <Link to="/profile" className="p-2 rounded-xl bg-surface-container-low text-slate-500 active:scale-90 transition-transform border border-white/5">
              <User className="w-5 h-5" />
            </Link>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            Protégez vos échanges. Vérifiez l'identité de votre interlocuteur en un clic.
          </p>
        </section>

        {/* PRO SPACE ACCESS */}
        {user.orgId && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-2"
          >
            <Link 
              to={user.role === 'pro_representative' ? `/dashboard/${user.orgId}` : "/me"} 
              className="w-full bg-[#c084fc]/10 p-6 rounded-3xl border-2 border-[#c084fc] flex items-center justify-between group active:scale-95 transition-all shadow-xl shadow-[#c084fc]/10"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#c084fc] flex items-center justify-center text-black shadow-lg">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="font-headline font-black text-[#c084fc] text-lg uppercase tracking-tighter">Espace Professionnel</h3>
                  <p className="text-[#c084fc]/60 text-[10px] font-black uppercase tracking-widest">Gérer vos authentifications clients</p>
                </div>
              </div>
              <ArrowRight className="text-[#c084fc] group-hover:translate-x-1 transition-transform" size={20} />
            </Link>
          </motion.div>
        )}

        {/* Navigation Tabs (Unified with main navigation) */}
        <div className="flex bg-surface-container-low p-1 rounded-2xl border border-white/5">
          <button 
            className="flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest bg-primary text-on-primary shadow-lg"
          >
            Accueil
          </button>
          <Link 
            to="/contacts"
            className="flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center justify-center gap-2"
          >
            Mes contacts
            {myContacts.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-primary-container" />
            )}
          </Link>
        </div>

        {/* Main Action */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link to="/new-request" className="w-full bg-primary-gradient p-8 rounded-3xl flex flex-col items-center justify-center gap-4 shadow-xl shadow-primary/20 group">
            <div className="w-16 h-16 rounded-full bg-on-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <PlusCircle className="text-on-primary w-10 h-10" />
            </div>
            <div className="text-center">
              <h3 className="font-headline font-bold text-xl text-on-primary">Demander une vérification</h3>
              <p className="text-on-primary/80 text-xs font-medium uppercase tracking-widest mt-1">Lancer le protocole sécurisé</p>
            </div>
          </Link>
        </motion.div>

          {/* Connection Requests */}
          {(connections.length > 0 || personalRequests.length > 0) && (
            <section className="space-y-4 animate-in slide-in-from-top duration-500">
              <div className="flex justify-between items-center px-2">
                <h3 className="font-headline font-bold text-lg text-on-surface">Mise en relation</h3>
                <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest">
                  {connections.length + personalRequests.length} demande{connections.length + personalRequests.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {/* Pro Connections */}
                {connections.map((conn) => (
                  <motion.div 
                    key={conn.id} 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-[#facc15]/10 p-5 rounded-3xl border-2 border-[#facc15] flex flex-col gap-4 shadow-xl shadow-[#facc15]/10 relative overflow-hidden group"
                  >
                    {/* Pulsing highlight */}
                    <motion.div 
                      animate={{ opacity: [0, 0.1, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-[#facc15]"
                    />
                    
                    <div className="relative z-10 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#facc15] flex items-center justify-center text-[#111113] shadow-lg shadow-[#facc15]/20">
                        <UserPlus className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-headline font-black text-on-surface text-lg">
                            {conn.companyName}
                          </h4>
                          <span className="bg-[#facc15] text-[#111113] text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">
                            Nouveau
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs font-bold">
                          Contact : {conn.proName}
                        </p>
                      </div>
                    </div>
                    <p className="relative z-10 text-on-surface/80 text-xs font-medium leading-relaxed px-1">
                      Ce professionnel souhaite vous ajouter à sa base de clients pour sécuriser vos futurs échanges.
                    </p>
                    <div className="relative z-10 flex gap-3 mt-1">
                      <button 
                        onClick={() => handleAcceptConnection(conn.id)}
                        className="flex-1 bg-[#facc15] text-[#111113] py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-[#facc15]/20"
                      >
                        <Check size={16} />
                        Autoriser
                      </button>
                      <button 
                        onClick={() => handleRejectConnection(conn.id)}
                        className="flex-1 bg-surface-container-highest text-slate-400 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-error/10 hover:text-error active:scale-95 transition-all"
                      >
                        <X size={16} />
                        Refuser
                      </button>
                    </div>
                  </motion.div>
                ))}

                {/* Personal Connections */}
                {personalRequests.map((req) => (
                  <motion.div 
                    key={req.id} 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-[#38bdf8]/10 p-5 rounded-3xl border-2 border-[#38bdf8] flex flex-col gap-4 shadow-xl shadow-[#38bdf8]/10 relative overflow-hidden"
                  >
                    <motion.div 
                      animate={{ opacity: [0, 0.1, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-[#38bdf8]"
                    />
                    <div className="relative z-10 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#38bdf8] flex items-center justify-center text-[#111113] shadow-lg shadow-[#38bdf8]/20">
                        <UserPlus className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-headline font-black text-on-surface text-lg">
                            {req.fromUserName}
                          </h4>
                          <span className="bg-[#38bdf8] text-[#111113] text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">
                            Nouveau
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs font-bold">
                          Souhaite vous ajouter à ses contacts personnels
                        </p>
                      </div>
                    </div>
                    <div className="relative z-10 flex gap-3 mt-1">
                      <button 
                        onClick={() => handleAcceptPersonalRequest(req)}
                        className="flex-1 bg-[#38bdf8] text-[#111113] py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-[#38bdf8]/20"
                      >
                        <Check size={16} />
                        Accepter
                      </button>
                      <button 
                        onClick={() => handleRejectPersonalRequest(req.id)}
                        className="flex-1 bg-surface-container-highest text-slate-400 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-error/10 hover:text-error active:scale-95 transition-all"
                      >
                        <X size={16} />
                        Décliner
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Active Auth Requests (Pro to User) */}
          {authRequests.filter(r => r.status === "pending" || r.status === "code_generated").length > 0 && (
            <section className="space-y-4 animate-in slide-in-from-top duration-500">
              <div className="flex justify-between items-center px-2">
                <h3 className="font-headline font-bold text-lg text-on-surface">Vérification en cours</h3>
                <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest animate-pulse">
                  En direct
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {authRequests.filter(r => r.status === "pending" || r.status === "code_generated").map((req) => (
                  <Link key={req.id} to={`/auth-request/${req.id}`} className="bg-primary-gradient p-5 rounded-3xl flex flex-col gap-4 shadow-xl shadow-primary/20 group active:scale-[0.98] transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-on-primary/20 flex items-center justify-center text-on-primary">
                        <Shield className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-headline font-bold text-on-primary text-lg">
                          {req.fromCompanyName}
                        </h4>
                        <p className="text-on-primary/80 text-xs font-medium">
                          Contact : {req.fromProName}
                        </p>
                        {req.fromCompanyCategory && (
                          <span className="inline-block mt-1 text-[9px] font-bold bg-on-primary/20 text-on-primary px-2 py-0.5 rounded-full uppercase tracking-widest">
                            {getCategoryLabel(req.fromCompanyCategory)}
                          </span>
                        )}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-on-primary/10 flex items-center justify-center text-on-primary">
                        <Check className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-1">
                      <p className="text-on-primary/80 text-xs font-medium">
                        Souhaite confirmer son identité
                      </p>
                      <span className="text-on-primary text-[10px] font-black uppercase tracking-widest bg-on-primary/20 px-2 py-1 rounded-lg">
                        Voir le code
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Quick Access Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Link to="/history" className="bg-surface-container-low p-6 rounded-2xl border border-white/5 flex flex-col gap-3 group active:scale-95 transition-all">
              <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <History className="text-primary w-6 h-6" />
              </div>
              <h3 className="font-headline font-bold text-on-surface text-sm">Mes demandes</h3>
            </Link>
            <Link to="/how-it-works" className="bg-surface-container-low p-6 rounded-2xl border border-white/5 flex flex-col gap-3 group active:scale-95 transition-all">
              <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <HelpCircle className="text-primary w-6 h-6" />
              </div>
              <h3 className="font-headline font-bold text-on-surface text-sm">Aide</h3>
            </Link>
          </div>



          {/* Latest Requests */}
          <section className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="font-headline font-bold text-lg text-on-surface">Dernières vérifications</h3>
              <Link to="/history" className="text-primary text-xs font-bold uppercase tracking-widest">Voir tout</Link>
            </div>

            <div className="flex flex-col gap-3">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-12 bg-surface-container-low rounded-3xl border border-dashed border-white/10">
                  <Shield className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500 text-sm">Aucune demande en cours</p>
                </div>
              ) : (
                requests.slice(0, 5).map((req) => {
                  const status = getStatusInfo(req.status);
                  const isSent = req.requesterId === user.uid;

                  // Normalize targetPhone for comparison
                  const normalizePhone = (phone: string | undefined | null) => {
                    if (!phone) return "";
                    let cleaned = phone.replace(/[\s\-\(\)\.]/g, "");
                    if (cleaned.startsWith("+33")) {
                      cleaned = "0" + cleaned.slice(3);
                    } else if (cleaned.startsWith("33") && cleaned.length === 11) {
                      cleaned = "0" + cleaned.slice(2);
                    }
                    return cleaned;
                  };

                  const cleanTargetPhone = normalizePhone(req.targetPhone);

                  // A. Look up in pros & companies
                  const matchedPro = pros.find(p => p.phone && normalizePhone(p.phone) === cleanTargetPhone);
                  const matchedCompany = matchedPro?.companyId 
                    ? companies.find(c => c.id === matchedPro.companyId) 
                    : companies.find(c => c.phone && normalizePhone(c.phone) === cleanTargetPhone);

                  let displayName = "";
                  if (matchedCompany && matchedPro) {
                    displayName = `${matchedCompany.name} (Contact: ${matchedPro.firstName} ${matchedPro.lastName})`;
                  } else if (matchedCompany) {
                    displayName = matchedCompany.name;
                  } else if (matchedPro) {
                    displayName = `${matchedPro.firstName} ${matchedPro.lastName}`;
                  } else {
                    // B. Look up in userConnections (verified personal)
                    const matchedConn = userConnections.find(c => {
                      const otherPhone = c.userAId === user.uid ? c.userBPhone : c.userAPhone;
                      return otherPhone && normalizePhone(otherPhone) === cleanTargetPhone;
                    });

                    if (matchedConn) {
                      displayName = matchedConn.userAId === user.uid ? matchedConn.userBName : matchedConn.userAName;
                    } else {
                      // C. Look up in personalContacts (manual personal)
                      const matchedPerso = personalContacts.find(p => p.phone && normalizePhone(p.phone) === cleanTargetPhone);
                      if (matchedPerso) {
                        displayName = matchedPerso.name;
                      }
                    }
                  }

                  return (
                    <Link 
                      key={req.id} to={`/request/${req.id}`}
                      className="bg-surface-container-low p-4 rounded-2xl border border-white/5 flex items-center justify-between group active:scale-[0.98] transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center ${status.color}`}>
                          <status.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-headline font-bold text-on-surface text-sm">
                            {isSent ? (displayName || req.targetPhone) : req.requesterName}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            {isSent && displayName && (
                              <p className="text-slate-400 text-[11px] font-semibold">
                                {req.targetPhone}
                              </p>
                            )}
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                              {isSent ? `Envoi • ${req.type}` : `Réception • ${req.type}`}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-bold uppercase tracking-widest ${status.color}`}>{status.label}</p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </section>
    </div>
  );
}
