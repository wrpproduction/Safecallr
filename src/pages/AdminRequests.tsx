import React, { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  History, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  ShieldCheck,
  Loader2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  Video
} from "lucide-react";
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  where,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  getCountFromServer
} from "firebase/firestore";
import { db } from "../firebase";
import AdminLayout from "../components/AdminLayout";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { handleFirestoreError, OperationType } from "../lib/firestore-errors";

const PAGE_SIZE = 20;

type RequestStatus = 'pending' | 'accepted' | 'refused' | 'verified' | 'caution' | 'code_generated' | 'validated' | 'expired' | 'failed';

interface VerificationRequest {
  id: string;
  fromProId: string;
  fromProName: string;
  fromCompanyName: string;
  toUserPhone: string;
  toUserName: string;
  status: RequestStatus;
  channel: string;
  createdAt: string;
  updatedAt?: string;
}

const statusConfig: Record<RequestStatus, { label: string; color: string; icon: any }> = {
  pending: { label: "En attente", color: "text-[#fbbf24] bg-[#fbbf24]/10 border-[#fbbf24]/20", icon: Clock },
  accepted: { label: "Acceptée", color: "text-[#60a5fa] bg-[#60a5fa]/10 border-[#60a5fa]/20", icon: CheckCircle2 },
  refused: { label: "Refusée", color: "text-[#f87171] bg-[#f87171]/10 border-[#f87171]/20", icon: XCircle },
  verified: { label: "Vérifiée", color: "text-[#4ade80] bg-[#4ade80]/10 border-[#4ade80]/20", icon: ShieldCheck },
  caution: { label: "Attention", color: "text-[#f87171] bg-[#f87171]/10 border-[#f87171]/20", icon: AlertTriangle },
  code_generated: { label: "Code Généré", color: "text-[#a78bfa] bg-[#a78bfa]/10 border-[#a78bfa]/20", icon: Clock },
  validated: { label: "Validée", color: "text-[#4ade80] bg-[#4ade80]/10 border-[#4ade80]/20", icon: CheckCircle2 },
  expired: { label: "Expirée", color: "text-[#9a9a9f] bg-[#9a9a9f]/10 border-[#9a9a9f]/20", icon: Clock },
  failed: { label: "Échouée", color: "text-[#f87171] bg-[#f87171]/10 border-[#f87171]/20", icon: XCircle },
};

export default function AdminRequests() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("all");
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const fetchCounts = async () => {
    const statuses: (RequestStatus | "all")[] = ["all", "pending", "validated", "refused"];
    const newCounts: Record<string, number> = {};
    
    try {
      for (const status of statuses) {
        let q = query(collection(db, "authRequests"));
        if (status !== "all") {
          q = query(q, where("status", "==", status));
        }
        const snapshot = await getCountFromServer(q);
        newCounts[status] = snapshot.data().count;
      }
      setCounts(newCounts);
    } catch (error) {
      console.error("Error fetching counts:", error);
      handleFirestoreError(error, OperationType.LIST, "authRequests");
    }
  };

  const fetchRequests = async (pageNumber = 1) => {
    setLoading(true);
    try {
      let q = query(
        collection(db, "authRequests"),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      );

      if (statusFilter !== "all") {
        q = query(q, where("status", "==", statusFilter));
      }

      if (pageNumber > 1 && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const fetchedRequests = snapshot.docs.map(doc => {
        const data = doc.data();
        let createdAt = data.createdAt;
        if (createdAt && typeof createdAt.toDate === 'function') {
          createdAt = createdAt.toDate();
        } else if (createdAt) {
          createdAt = new Date(createdAt);
        }
        
        return {
          id: doc.id,
          ...data,
          createdAt
        };
      }) as VerificationRequest[];

      setRequests(fetchedRequests);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (error) {
      console.error("Error fetching requests:", error);
      handleFirestoreError(error, OperationType.LIST, "authRequests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  useEffect(() => {
    setPage(1);
    setLastDoc(null);
    fetchRequests(1);
  }, [statusFilter]);

  const filteredRequests = requests.filter(req => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (req.fromProName?.toLowerCase() || "").includes(searchLower) ||
      (req.fromCompanyName?.toLowerCase() || "").includes(searchLower) ||
      (req.toUserPhone || "").includes(searchLower) ||
      req.id.toLowerCase().includes(searchLower)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Demandes des Pros</h1>
            <p className="text-[#9a9a9f] mt-1">Suivez l'activité d'authentification des professionnels</p>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: "Toutes" },
            { id: "pending", label: "En attente" },
            { id: "validated", label: "Validées" },
            { id: "refused", label: "Refusées" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border ${
                statusFilter === tab.id 
                  ? "bg-white text-black border-white" 
                  : "bg-[#1e1e22] text-[#9a9a9f] border-[#2e2e34] hover:border-[#9a9a9f] hover:text-white"
              }`}
            >
              {tab.label}
              {counts[tab.id] !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  statusFilter === tab.id ? "bg-black text-white" : "bg-[#2e2e34] text-[#e4e4e8]"
                }`}>
                  {counts[tab.id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9a9f] group-focus-within:text-[#4ade80] transition-colors" size={18} />
          <input
            type="text"
            placeholder="Rechercher par pro, entreprise, téléphone ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1e1e22] border border-[#2e2e34] rounded-xl py-3 pl-12 pr-4 text-[#e4e4e8] focus:outline-none focus:border-[#4ade80] transition-all"
          />
        </div>

        {/* Table */}
        <div className="bg-[#1e1e22] border border-[#2e2e34] rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#111113] border-bottom border-[#2e2e34]">
                  <th className="px-6 py-4 text-[11px] font-bold text-[#9a9a9f] uppercase tracking-widest">ID Demande</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#9a9a9f] uppercase tracking-widest">Professionnel / Entreprise</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#9a9a9f] uppercase tracking-widest">Client (Téléphone)</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#9a9a9f] uppercase tracking-widest">Canal</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#9a9a9f] uppercase tracking-widest">Statut</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#9a9a9f] uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#9a9a9f] uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e2e34]">
                {loading && requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-[#4ade80] animate-spin" />
                        <p className="text-[#9a9a9f]">Chargement des demandes...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center text-[#9a9a9f]">
                      Aucune demande trouvée.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req, idx) => {
                    const config = statusConfig[req.status] || statusConfig.pending;
                    const StatusIcon = config.icon;
                    
                    return (
                      <tr 
                        key={req.id} 
                        className={`${idx % 2 === 0 ? "bg-[#1a1a1e]" : "bg-[#1e1e22]"} hover:bg-[#252529] transition-colors group cursor-pointer`}
                      >
                        <td className="px-6 py-4">
                          <p className="text-xs font-mono text-[#9a9a9f]">{req.id.substring(0, 12)}...</p>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <ShieldCheck size={14} className="text-[#4ade80]" />
                              <p className="font-semibold text-[#e4e4e8]">{req.fromProName || "Pro"}</p>
                            </div>
                            <p className="text-[10px] text-[#9a9a9f] ml-5">{req.fromCompanyName || "Entreprise"}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-[#9a9a9f]" />
                            <div>
                              <p className="text-sm text-[#e4e4e8]">{req.toUserPhone}</p>
                              <p className="text-[10px] text-[#9a9a9f]">{req.toUserName || "Invité"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {req.channel === "video" ? <Video size={14} className="text-[#60a5fa]" /> : <Phone size={14} className="text-[#9a9a9f]" />}
                            <p className="text-xs text-[#e4e4e8] uppercase tracking-wider">{req.channel === "video" ? "Visio" : "Appel"}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${config.color}`}>
                            <StatusIcon size={12} />
                            {config.label}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#9a9a9f]">
                          {req.createdAt ? (
                            format(new Date(req.createdAt), "dd/MM HH:mm", { locale: fr })
                          ) : "N/A"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            className="p-2 bg-[#111113] text-[#9a9a9f] hover:text-white rounded-lg border border-[#2e2e34] transition-colors"
                            title="Voir détails"
                          >
                            <ExternalLink size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 bg-[#111113] border-t border-[#2e2e34] flex items-center justify-between">
            <p className="text-xs text-[#9a9a9f]">
              Affichage de <span className="text-white font-bold">{filteredRequests.length}</span> demandes
            </p>
            <div className="flex items-center gap-2">
              <button 
                disabled={page === 1 || loading}
                onClick={() => {
                  setPage(1);
                  setLastDoc(null);
                  fetchRequests(1);
                }}
                className="p-2 bg-[#1e1e22] border border-[#2e2e34] rounded-lg text-[#9a9a9f] hover:text-white disabled:opacity-50 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-bold px-4">Page {page}</span>
              <button 
                disabled={!hasMore || loading}
                onClick={() => {
                  setPage(p => p + 1);
                  fetchRequests(page + 1);
                }}
                className="p-2 bg-[#1e1e22] border border-[#2e2e34] rounded-xl text-[#9a9a9f] hover:text-white disabled:opacity-50 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
