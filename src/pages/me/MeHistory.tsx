import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, 
  History, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Search, 
  Filter,
  Smartphone,
  MapPin,
  Calendar,
  Loader2
} from "lucide-react";
import { useCollaboratorAuth } from "../../hooks/useCollaboratorAuth";
import { Organization, Member, AuthRequest } from "../../lib/types";
import { db } from "../../firebase";
import { collection, query, where, orderBy, getDocs, limit, startAfter } from "firebase/firestore";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function MeHistory() {
  const { member, organization, loading: authLoading } = useCollaboratorAuth();
  const [auths, setAuths] = useState<AuthRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!member || !organization) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        let q = query(
          collection(db, "organizations", organization.id, "authRequests"),
          where("memberId", "==", member.id),
          orderBy("createdAt", "desc"),
          limit(50)
        );

        const snap = await getDocs(q);
        const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuthRequest));
        setAuths(docs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [member, organization]);

  const filteredAuths = auths.filter(a => {
    const matchesStatus = filterStatus === "all" || a.status === filterStatus;
    const matchesSearch = a.clientPhone.includes(searchTerm) || a.id.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: AuthRequest["status"]) => {
    switch (status) {
      case "success":
        return <span className="px-3 py-1 rounded-full bg-success/10 text-success text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={12} /> Succès</span>;
      case "failed":
        return <span className="px-3 py-1 rounded-full bg-error/10 text-error text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><ShieldAlert size={12} /> Échec</span>;
      case "expired":
        return <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Clock size={12} /> Expiré</span>;
      default:
        return <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Clock size={12} /> En attente</span>;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
        <Loader2 className="text-primary animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
            <Link 
              to="/me"
              className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest"
            >
              <ArrowLeft size={14} /> Retour au tableau de bord
            </Link>
            <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
              <History className="text-primary" size={32} /> Historique complet
            </h1>
          </div>

          <div className="flex items-center gap-4 bg-[#1e1e22] p-2 rounded-2xl border border-[#2e2e34]">
            {["all", "success", "failed", "expired"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filterStatus === s ? "bg-primary text-black" : "text-slate-500 hover:text-white"
                }`}
              >
                {s === "all" ? "Tous" : s === "success" ? "Succès" : s === "failed" ? "Échecs" : "Expirés"}
              </button>
            ))}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-[#1e1e22]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
            <input 
              type="text"
              placeholder="Rechercher par téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1e1e22] border border-[#2e2e34] rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white focus:border-primary/50 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
              <button className="w-full bg-[#1e1e22] border border-[#2e2e34] rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-slate-500 text-left">
                Toutes les dates
              </button>
            </div>
            <button className="p-4 bg-[#1e1e22] border border-[#2e2e34] rounded-2xl text-slate-400 hover:text-white transition-colors">
              <Filter size={20} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="text-primary animate-spin" size={32} />
            </div>
          ) : filteredAuths.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-[#1e1e22] rounded-3xl flex items-center justify-center mx-auto text-slate-700">
                <Smartphone size={40} />
              </div>
              <p className="text-slate-500 font-medium italic">Aucun résultat trouvé pour cette recherche.</p>
            </div>
          ) : (
            <div className="bg-[#1e1e22] border border-[#2e2e34] rounded-[32px] overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#2e2e34] bg-[#111113]">
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Date & Heure</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Client</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Statut</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Adresse IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2e2e34]">
                    {filteredAuths.map((auth) => (
                      <tr key={auth.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-8 py-6">
                          <p className="text-sm font-black text-white">{format(auth.createdAt.toDate(), "d MMM yyyy", { locale: fr })}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">{format(auth.createdAt.toDate(), "HH:mm:ss")}</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-sm font-mono font-black text-slate-300">
                            {auth.clientPhone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 ** ** ** $5")}
                          </p>
                        </td>
                        <td className="px-8 py-6">
                          {getStatusBadge(auth.status)}
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
                            <MapPin size={12} /> {auth.ipAddress}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
