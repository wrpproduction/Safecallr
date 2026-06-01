import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db, collection, query, where, onSnapshot, orderBy } from "../firebase";
import { Shield, CheckCircle, AlertTriangle, Clock, XCircle, ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function History({ user }: { user: any }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [userConnections, setUserConnections] = useState<any[]>([]);
  const [personalContacts, setPersonalContacts] = useState<any[]>([]);
  const [pros, setPros] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // 1. Verification requests
    const q = query(
      collection(db, "verification_requests"),
      where("requesterId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    // 2. User to User Connections
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

    // 3. Personal Contacts
    const qPerso = query(
      collection(db, "personalContacts"),
      where("ownerId", "==", user.uid)
    );
    const unsubscribePerso = onSnapshot(qPerso, (snapshot) => {
      setPersonalContacts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 4. Pros
    const unsubscribePros = onSnapshot(collection(db, "pros"), (snapshot) => {
      setPros(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 5. Companies
    const unsubscribeCompanies = onSnapshot(collection(db, "companies"), (snapshot) => {
      setCompanies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribe();
      unsubscribeUserConnA();
      unsubscribeUserConnB();
      unsubscribePerso();
      unsubscribePros();
      unsubscribeCompanies();
    };
  }, [user]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending": return { label: "En attente", color: "text-slate-400", icon: Clock };
      case "accepted": return { label: "Acceptée", color: "text-primary", icon: CheckCircle };
      case "refused": return { label: "Refusée", color: "text-error", icon: XCircle };
      case "verified": return { label: "Vérifiée", color: "text-primary", icon: ShieldCheck };
      case "caution": return { label: "Vigilance", color: "text-tertiary-container", icon: ShieldAlert };
      default: return { label: "Inconnu", color: "text-slate-400", icon: ShieldQuestion };
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <section className="space-y-4">
        <h1 className="font-headline font-extrabold text-3xl tracking-tight text-on-surface leading-tight">
          Historique des <span className="text-primary">vérifications</span>
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          Consultez l'historique de vos échanges sécurisés et identifiez les menaces potentielles.
        </p>
      </section>

      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-low rounded-3xl border border-dashed border-white/10">
            <Shield className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 text-sm">Aucun historique disponible</p>
          </div>
        ) : (
          requests.map((req) => {
            const status = getStatusInfo(req.status);
            
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
                className="bg-surface-container-low p-5 rounded-2xl border border-white/5 flex items-center justify-between group active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center ${status.color}`}>
                    <status.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-on-surface text-lg">
                      {displayName || req.targetPhone}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {displayName && (
                        <p className="text-slate-400 text-xs font-semibold">
                          {req.targetPhone}
                        </p>
                      )}
                      <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full">
                        {req.type}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-on-surface font-semibold text-sm">
                    {req.createdAt?.toDate ? format(req.createdAt.toDate(), "d MMM", { locale: fr }) : "Aujourd'hui"}
                  </p>
                  <p className={`text-xs font-bold uppercase tracking-widest ${status.color}`}>{status.label}</p>
                </div>
              </Link>
            );
          })
        )}
      </div>

      <div className="mt-12 mb-8 flex flex-col items-center">
        <div className="w-12 h-1 bg-surface-container-highest rounded-full mb-4"></div>
        <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-bold">Fin du journal — Chiffré</p>
      </div>
    </div>
  );
}
