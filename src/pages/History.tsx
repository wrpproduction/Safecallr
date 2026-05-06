import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db, collection, query, where, onSnapshot, orderBy } from "../firebase";
import { Shield, CheckCircle, AlertTriangle, Clock, XCircle, ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function History({ user }: { user: any }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // On écoute les demandes envoyées ET reçues
    const q = query(
      collection(db, "verification_requests"),
      where("requesterId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
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
                    <h3 className="font-headline font-bold text-on-surface text-lg">{req.targetPhone}</h3>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{req.type}</p>
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
