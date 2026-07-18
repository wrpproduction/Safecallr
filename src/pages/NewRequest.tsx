import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, collection, addDoc, serverTimestamp, query, where, onSnapshot } from "../firebase";
import { Shield, Phone, User, ChevronRight, AlertCircle, Banknote, Home, MoreHorizontal, Users, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";

export default function NewRequest({ user }: { user: any }) {
  const { t } = useLanguage();
  const [validatedContacts, setValidatedContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fetchingContacts, setFetchingContacts] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    // Fetch User to User Connections (Validated Contacts)
    const qA = query(collection(db, "userConnections"), where("userAId", "==", user.uid));
    const qB = query(collection(db, "userConnections"), where("userBId", "==", user.uid));

    const unsubA = onSnapshot(qA, (snapA) => {
      const connsA = snapA.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setValidatedContacts(prev => {
        const other = prev.filter(c => c.userBId === user.uid);
        const combined = [...connsA, ...other];
        // Deduplicate by ID and filter for verified (or legacy without status)
        const filtered = combined.filter(c => !c.status || c.status === "verified");
        return Array.from(new Map(filtered.map(item => [item.id, item])).values());
      });
      setFetchingContacts(false);
    });

    const unsubB = onSnapshot(qB, (snapB) => {
      const connsB = snapB.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setValidatedContacts(prev => {
        const other = prev.filter(c => c.userAId === user.uid);
        const combined = [...other, ...connsB];
        // Deduplicate by ID and filter for verified (or legacy without status)
        const filtered = combined.filter(c => !c.status || c.status === "verified");
        return Array.from(new Map(filtered.map(item => [item.id, item])).values());
      });
      setFetchingContacts(false);
    });

    return () => {
      unsubA();
      unsubB();
    };
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact) {
      setError(t("request.selectContactError"));
      return;
    }
    setError("");
    setLoading(true);

    try {
      const isUserA = selectedContact.userAId === user.uid;
      const targetId = isUserA ? selectedContact.userBId : selectedContact.userAId;
      const targetName = isUserA ? selectedContact.userBName : selectedContact.userAName;
      const targetPhone = isUserA ? selectedContact.userBPhone : selectedContact.userAPhone;

      // 1. On cherche le token FCM de la cible (sécurisé pour éviter les erreurs de parsing d'URL dans Safari)
      let targetFCMToken: string | undefined = undefined;
      if (targetId && typeof targetId === "string" && !targetId.includes("[") && !targetId.includes("]")) {
        try {
          const userDoc = await fetch(`/api/user-by-id/${encodeURIComponent(targetId)}`).then(res => res.ok ? res.json() : null);
          targetFCMToken = userDoc?.fcmToken;
        } catch (fetchErr) {
          console.warn("Could not fetch target user FCM token:", fetchErr);
        }
      }

      // 2. On crée la requête dans Firestore
      const codeA = Math.floor(1000 + Math.random() * 9000).toString();
      const codeB = Math.floor(1000 + Math.random() * 9000).toString();
      
      const docRef = await addDoc(collection(db, "verification_requests"), {
        requesterId: user.uid,
        requesterName: user.displayName || `${user.firstName} ${user.lastName}`,
        requesterPhone: user.phoneNumber || "",
        targetPhone,
        targetName,
        targetId: targetId || "",
        type: "Appel",
        useCode: true,
        codeA,
        codeB,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 3. On envoie la notification push via le serveur si B existe (encapsulé pour éviter de bloquer le flux principal en cas de défaillance réseau/Safari)
      if (targetFCMToken && typeof targetFCMToken === "string" && targetFCMToken !== "undefined" && targetFCMToken !== "null") {
        try {
          await fetch("/api/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: targetFCMToken,
              title: "Demande de vérification",
              body: `${user.displayName || user.firstName} souhaite vérifier votre identité.`,
              data: { requestId: docRef.id },
            }),
          });
        } catch (fetchErr) {
          console.warn("Could not send push notification:", fetchErr);
        }
      }

      navigate(`/request/${docRef.id}`);
    } catch (err: any) {
      console.error("New request error:", err);
      setError(t("request.sendError", { error: err.message || err.toString() }));
    } finally {
      setLoading(false);
    }
  };

  const getContactDisplay = (conn: any) => {
    const isUserA = conn.userAId === user.uid;
    return {
      name: isUserA ? conn.userBName : conn.userAName,
      phone: isUserA ? conn.userBPhone : conn.userAPhone
    };
  };

  return (
    <div className="space-y-8 pb-12">
      <section className="space-y-4">
        <h1 className="font-headline font-extrabold text-3xl tracking-tight text-on-surface leading-tight">
          {t("request.title").includes("vérification") || t("request.title").includes("verificación") || t("request.title").includes("Verification") ? (
            t("request.title").includes("vérification") ? <>Nouvelle <span className="text-primary">vérification</span></> : 
            t("request.title").includes("Verification") ? <>New <span className="text-primary">Verification</span></> : 
            <>Nueva <span className="text-primary">verificación</span></>
          ) : t("request.title")}
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          {t("request.subtitle")}
        </p>
      </section>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Contact Selection */}
        <div className="group">
          <label className="block text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-3 px-1">
            {t("request.selectContact")}
          </label>
          
          {fetchingContacts ? (
            <div className="bg-surface-container-low p-8 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
              <p className="text-slate-500 text-xs">{t("request.loadingContacts")}</p>
            </div>
          ) : validatedContacts.length === 0 ? (
            <div className="bg-surface-container-low p-8 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-on-surface font-bold text-sm mb-1">{t("request.noContactsTitle")}</h4>
                <p className="text-slate-500 text-xs leading-relaxed max-w-[240px]">
                  {t("request.noContactsDesc")}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => navigate("/contacts")}
                className="text-primary text-xs font-bold uppercase tracking-widest hover:underline"
              >
                {t("request.manageContacts")}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {validatedContacts.map((conn) => {
                const display = getContactDisplay(conn);
                const isSelected = selectedContact?.id === conn.id;
                return (
                  <button
                    key={conn.id}
                    type="button"
                    onClick={() => setSelectedContact(conn)}
                    className={`p-4 rounded-2xl border flex items-center gap-4 transition-all text-left ${
                      isSelected 
                        ? "bg-primary/10 border-primary shadow-lg shadow-primary/5" 
                        : "bg-surface-container-low border-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isSelected ? "bg-primary text-on-primary" : "bg-surface-container-highest text-slate-400"}`}>
                      <User className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-bold text-sm truncate ${isSelected ? "text-primary" : "text-on-surface"}`}>
                        {display.name}
                      </h4>
                      <p className="text-slate-500 text-xs truncate">{display.phone}</p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="text-primary w-6 h-6 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-surface-container-low p-6 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Shield className="text-primary w-6 h-6" />
            </div>
            <div>
              <h4 className="text-on-surface font-bold text-sm mb-1">{t("request.secureExchange")}</h4>
              <p className="text-slate-500 text-xs leading-relaxed">
                {t("request.secureExchangeDesc")}
              </p>
            </div>
          </div>
        </div>

        {error && <p className="text-error text-xs font-medium">{error}</p>}

        {/* Action */}
        <div className="pt-4">
          <button 
            type="submit" disabled={loading}
            className="w-full bg-primary-gradient py-6 rounded-2xl text-on-primary font-headline font-extrabold text-lg tracking-wide shadow-xl shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {loading ? <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-on-primary"></div> : (
              <>
                {t("request.sendRequest")}
                <ChevronRight className="w-6 h-6" />
              </>
            )}
          </button>
          <p className="text-center mt-6 text-slate-500 text-[10px] font-bold tracking-[0.2em] uppercase">
            {t("request.securedBy")}
          </p>
        </div>
      </form>
    </div>
  );
}
