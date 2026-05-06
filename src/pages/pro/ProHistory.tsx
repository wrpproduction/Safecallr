import React, { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  Download, 
  Phone, 
  Video, 
  Clock, 
  ChevronRight, 
  ChevronLeft,
  X,
  Calendar,
  ShieldCheck,
  Loader2,
  AlertCircle,
  ArrowRight,
  Plus,
  History as HistoryIcon
} from "lucide-react";
import { db, auth } from "../../firebase";
import { collection, query, where, orderBy, limit, getDocs, startAfter, queryEqual, getCountFromServer } from "firebase/firestore";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { fr } from "date-fns/locale";

const STATUS_FILTERS = [
  { id: "all", label: "Tout", color: "bg-[#2e2e34] text-[#9a9a9f]" },
  { id: "validated", label: "Validées", color: "bg-[#4ade80]/10 text-[#4ade80]" },
  { id: "pending", label: "En cours", color: "bg-blue-500/10 text-blue-400" },
  { id: "refused", label: "Refusées", color: "bg-[#f87171]/10 text-[#f87171]" },
  { id: "expired", label: "Expirées", color: "bg-amber-500/10 text-amber-500" },
];

export default function ProHistory() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.currentUser) {
      fetchRequests(true);
    }
  }, [filter, search, auth.currentUser]);

  const fetchRequests = async (isInitial = false) => {
    setLoading(true);
    try {
      const proId = auth.currentUser?.uid;
      if (!proId) return;

      let q = query(
        collection(db, "authRequests"),
        where("fromProId", "==", proId)
      );

      if (filter !== "all") {
        q = query(q, where("status", "==", filter));
      }

      // We add orderBy and limit. 
      // If it fails because of a missing index, we'll catch it and try without orderBy.
      let querySnapshot;
      try {
        let sortedQ = query(q, orderBy("createdAt", "desc"), limit(20));
        if (!isInitial && lastDoc) {
          sortedQ = query(sortedQ, startAfter(lastDoc));
        }
        querySnapshot = await getDocs(sortedQ);
      } catch (indexErr) {
        console.warn("Query with orderBy failed (likely missing index), falling back to unsorted query:", indexErr);
        querySnapshot = await getDocs(query(q, limit(100)));
      }

      let newRequests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Client-side search for the demo
      if (search) {
        const searchLower = search.toLowerCase();
        newRequests = newRequests.filter(r => 
          r.toUserPhone?.toLowerCase().includes(searchLower) ||
          r.toUserName?.toLowerCase().includes(searchLower) ||
          r.id.toLowerCase().includes(searchLower)
        );
      }

      if (isInitial) {
        setRequests(newRequests);
        setPage(1);
      } else {
        setRequests(prev => [...prev, ...newRequests]);
      }

      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === 20);
    } catch (err) {
      console.error("Fetch requests error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    // Basic CSV export logic
    const headers = ["ID,Date,Client,Canal,Statut,Duree"];
    const rows = requests.map(r => {
      const date = r.createdAt ? format(r.createdAt.toDate(), "dd/MM/yyyy HH:mm") : "-";
      return `${r.id},${date},${r.toUserPhone},${r.channel},${r.status},0`;
    });
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `historique_safecallr_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openDetails = (request: any) => {
    setSelectedRequest(request);
    setIsDrawerOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#e4e4e8]">Historique des demandes</h1>
          <p className="text-[#9a9a9f] mt-2">Retrouvez toutes vos vérifications d'identité.</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1e1e22] border border-[#2e2e34] rounded-2xl font-bold text-[#9a9a9f] hover:bg-[#2e2e34] transition-all shadow-sm"
        >
          <Download size={18} />
          Exporter CSV
        </button>
      </header>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full lg:w-auto no-scrollbar">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                filter === f.id 
                  ? "bg-[#4ade80] text-black shadow-lg shadow-[#4ade80]/10" 
                  : "bg-[#1e1e22] border border-[#2e2e34] text-[#9a9a9f] hover:border-[#4ade80]/30"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9a9f]" size={18} />
          <input
            type="text"
            placeholder="Rechercher un numéro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1e1e22] border border-[#2e2e34] rounded-2xl py-3 pl-12 pr-4 text-[#e4e4e8] focus:border-[#4ade80] focus:ring-1 focus:ring-[#4ade80] outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1e1e22] rounded-3xl border border-[#2e2e34] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#111113] text-[#9a9a9f] text-[10px] font-black uppercase tracking-widest border-b border-[#2e2e34]">
                <th className="px-6 py-4">Date / Heure</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Canal</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2e2e34]">
              {requests.length === 0 && !loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-[#9a9a9f]">
                      <HistoryIcon size={48} className="opacity-20" />
                      <p className="font-medium">Aucune demande trouvée</p>
                    </div>
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr 
                    key={request.id} 
                    onClick={() => openDetails(request)}
                    className="hover:bg-[#2e2e34]/30 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <Calendar size={16} className="text-[#9a9a9f]" />
                        <span className="text-sm font-medium text-[#e4e4e8]">
                          {request.createdAt ? format(request.createdAt.toDate(), "dd MMM yyyy, HH:mm", { locale: fr }) : "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-[#4ade80]">{request.toUserPhone}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-[#9a9a9f]">
                        {request.channel === "phone" ? <Phone size={14} /> : <Video size={14} />}
                        <span className="text-xs font-medium capitalize">{request.channel === "phone" ? "Appel" : "Visio"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        STATUS_FILTERS.find(f => f.id === request.status)?.color || "bg-[#2e2e34] text-[#9a9a9f]"
                      }`}>
                        {request.status === "validated" ? "Validée" :
                         request.status === "pending" ? "En cours" :
                         request.status === "refused" ? "Refusée" :
                         request.status === "expired" ? "Expirée" :
                         request.status === "failed" ? "Échouée" :
                         request.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="p-2 text-[#9a9a9f] group-hover:text-[#4ade80] transition-colors">
                        <ChevronRight size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {hasMore && (
          <div className="p-6 border-t border-[#2e2e34] text-center">
            <button 
              onClick={() => fetchRequests()}
              disabled={loading}
              className="text-sm font-bold text-[#9a9a9f] hover:text-[#4ade80] flex items-center gap-2 mx-auto transition-colors"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
              Charger plus
            </button>
          </div>
        )}
      </div>

      {/* Drawer Details */}
      {isDrawerOpen && selectedRequest && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
          <div className="relative w-full max-w-md bg-[#1e1e22] h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col border-l border-[#2e2e34]">
            <div className="p-6 border-b border-[#2e2e34] flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#e4e4e8]">Détails de la demande</h2>
              <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-[#2e2e34] rounded-full transition-colors text-[#9a9a9f]">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center ${
                  selectedRequest.status === 'validated' ? 'bg-[#4ade80]/10 text-[#4ade80]' :
                  selectedRequest.status === 'refused' ? 'bg-[#f87171]/10 text-[#f87171]' :
                  'bg-[#111113] text-[#9a9a9f] border border-[#2e2e34]'
                }`}>
                  {selectedRequest.status === 'validated' ? <ShieldCheck size={40} /> : <HistoryIcon size={40} />}
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#e4e4e8]">{selectedRequest.toUserPhone}</p>
                  <p className="text-[#9a9a9f] text-sm">ID: {selectedRequest.id}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#111113] rounded-2xl border border-[#2e2e34]">
                    <p className="text-[10px] font-bold text-[#9a9a9f] uppercase tracking-widest mb-1">Statut</p>
                    <p className="font-bold text-sm capitalize text-[#e4e4e8]">{selectedRequest.status}</p>
                  </div>
                  <div className="p-4 bg-[#111113] rounded-2xl border border-[#2e2e34]">
                    <p className="text-[10px] font-bold text-[#9a9a9f] uppercase tracking-widest mb-1">Canal</p>
                    <p className="font-bold text-sm capitalize text-[#e4e4e8]">{selectedRequest.channel}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-[#9a9a9f] uppercase tracking-widest">Chronologie</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#9a9a9f]">Créée le</span>
                      <span className="font-medium text-[#e4e4e8]">{selectedRequest.createdAt ? format(selectedRequest.createdAt.toDate(), "dd/MM/yyyy HH:mm") : "-"}</span>
                    </div>
                    {selectedRequest.acceptedAt && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#9a9a9f]">Acceptée le</span>
                        <span className="font-medium text-[#e4e4e8]">{format(selectedRequest.acceptedAt.toDate(), "dd/MM/yyyy HH:mm")}</span>
                      </div>
                    )}
                    {selectedRequest.validatedAt && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#9a9a9f]">Validée le</span>
                        <span className="font-medium text-[#4ade80] font-bold">{format(selectedRequest.validatedAt.toDate(), "dd/MM/yyyy HH:mm")}</span>
                      </div>
                    )}
                    {selectedRequest.refusedAt && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#9a9a9f]">Refusée le</span>
                        <span className="font-medium text-[#f87171] font-bold">{format(selectedRequest.refusedAt.toDate(), "dd/MM/yyyy HH:mm")}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#2e2e34]">
              <button 
                onClick={() => {
                  setIsDrawerOpen(false);
                  navigate("/pro/search", { state: { phone: selectedRequest.toUserPhone } });
                }}
                className="w-full bg-[#4ade80] text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#22c55e] transition-all shadow-lg shadow-[#4ade80]/10"
              >
                Renvoyer une demande
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
