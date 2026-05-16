import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  History, 
  ArrowRight, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  MapPin,
  Smartphone
} from "lucide-react";
import { Organization, Member, AuthRequest } from "../../lib/types";
import { db } from "../../firebase";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface RecentAuthsSummaryProps {
  member: Member;
  organization: Organization;
}

export default function RecentAuthsSummary({ member, organization }: RecentAuthsSummaryProps) {
  const [auths, setAuths] = useState<AuthRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "organizations", organization.id, "authRequests"),
      where("memberId", "==", member.id),
      orderBy("createdAt", "desc"),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuthRequest));
      setAuths(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [member.id, organization.id]);

  const maskPhone = (phone: string) => {
    return phone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 ** ** ** $5");
  };

  const getStatusIcon = (status: AuthRequest["status"]) => {
    switch (status) {
      case "success": return <ShieldCheck className="text-success" size={16} />;
      case "failed": return <ShieldAlert className="text-error" size={16} />;
      case "expired": return <Clock className="text-slate-500" size={16} />;
      default: return <Clock className="text-slate-500" size={16} />;
    }
  };

  const getStatusLabel = (status: AuthRequest["status"]) => {
    switch (status) {
      case "success": return "Succès";
      case "failed": return "Échec";
      case "expired": return "Expiré";
      default: return "En cours";
    }
  };

  return (
    <div className="bg-[#1e1e22] border border-[#2e2e34] rounded-[32px] p-8 md:p-10 space-y-8 shadow-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          <History className="text-slate-400" /> Mes dernières authentifications
        </h3>
        <Link 
          to="/me/history"
          className="text-primary text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all"
        >
          Voir tout <ArrowRight size={14} />
        </Link>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-[#111113] rounded-2xl" />)}
          </div>
        ) : auths.length === 0 ? (
          <div className="py-10 text-center space-y-3 bg-[#111113] rounded-3xl border border-dashed border-[#2e2e34]">
            <Smartphone className="text-slate-700 mx-auto" size={32} />
            <p className="text-slate-500 text-sm font-medium">Aucune authentification récente.</p>
          </div>
        ) : (
          auths.map((auth) => (
            <div 
              key={auth.id}
              className="flex items-center justify-between p-4 bg-[#111113] hover:bg-[#161619] border border-[#2e2e34] rounded-2xl transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  auth.status === 'success' ? 'bg-success/10 text-success' : 
                  auth.status === 'failed' ? 'bg-error/10 text-error' : 'bg-slate-800 text-slate-400'
                }`}>
                  {getStatusIcon(auth.status)}
                </div>
                <div>
                  <p className="text-sm font-black text-white">{maskPhone(auth.clientPhone)}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    {format(auth.createdAt.toDate(), "HH:mm", { locale: fr })} • {getStatusLabel(auth.status)}
                  </p>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <div className="flex items-center gap-1 text-[10px] text-slate-600 font-bold uppercase tracking-tight">
                  <MapPin size={10} /> {auth.ipAddress}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
