import React, { useState, useEffect } from "react";
import { 
  AlertTriangle, 
  CheckCircle, 
  Trash2, 
  Loader2, 
  Search, 
  Filter,
  User,
  Clock,
  ExternalLink
} from "lucide-react";
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc,
  where
} from "firebase/firestore";
import { db } from "../firebase";
import AdminLayout from "../components/AdminLayout";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AdminAlerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      let q = query(
        collection(db, "alerts"),
        orderBy("createdAt", "desc")
      );

      if (statusFilter !== "all") {
        q = query(collection(db, "alerts"), where("status", "==", statusFilter), orderBy("createdAt", "desc"));
      }

      const snapshot = await getDocs(q);
      const fetchedAlerts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));

      setAlerts(fetchedAlerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter]);

  const handleResolve = async (alertId: string) => {
    try {
      await updateDoc(doc(db, "alerts", alertId), {
        status: "resolved",
        updatedAt: new Date().toISOString()
      });
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: "resolved" } : a));
    } catch (error) {
      console.error("Error resolving alert:", error);
    }
  };

  const handleDelete = async (alertId: string) => {
    if (!window.confirm("Supprimer cette alerte ?")) return;
    try {
      await deleteDoc(doc(db, "alerts", alertId));
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (error) {
      console.error("Error deleting alert:", error);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (alert.userName || "").toLowerCase().includes(searchLower) ||
      (alert.details || "").toLowerCase().includes(searchLower) ||
      (alert.type || "").toLowerCase().includes(searchLower)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Alertes de Sécurité</h1>
            <p className="text-[#9a9a9f] mt-1">Gérez les signalements d'activités suspectes.</p>
          </div>
          <button 
            onClick={fetchAlerts}
            className="px-4 py-2 bg-[#1e1e22] border border-[#2e2e34] rounded-xl text-[#e4e4e8] hover:bg-[#2e2e34] transition-all flex items-center gap-2"
          >
            <Loader2 className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9a9f] group-focus-within:text-error transition-colors" size={18} />
            <input
              type="text"
              placeholder="Rechercher une alerte..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1e1e22] border border-[#2e2e34] rounded-xl py-3 pl-12 pr-4 text-[#e4e4e8] focus:outline-none focus:border-error transition-all"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9a9f]" size={18} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#1e1e22] border border-[#2e2e34] rounded-xl py-3 pl-12 pr-4 text-[#e4e4e8] appearance-none focus:outline-none focus:border-error transition-all cursor-pointer"
            >
              <option value="all">Tous les statuts</option>
              <option value="new">Nouvelles</option>
              <option value="resolved">Résolues</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 text-error animate-spin" />
              <p className="text-[#9a9a9f]">Chargement des alertes...</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-20 bg-[#1e1e22] border border-[#2e2e34] rounded-2xl">
              <CheckCircle size={48} className="mx-auto text-[#4ade80] mb-4 opacity-20" />
              <p className="text-[#9a9a9f]">Aucune alerte détectée.</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div 
                key={alert.id}
                className={`bg-[#1e1e22] border p-6 rounded-2xl transition-all shadow-lg ${
                  alert.status === "new" ? "border-error/30 shadow-error/5" : "border-[#2e2e34] opacity-70"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className={`p-3 rounded-xl h-fit ${alert.status === "new" ? "bg-error/20 text-error" : "bg-slate-500/20 text-slate-500"}`}>
                      <AlertTriangle size={24} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                          alert.type === "too_many_sensitive_updates" ? "bg-error text-white" : "bg-warning text-black"
                        }`}>
                          {alert.type === "too_many_sensitive_updates" ? "Modification Abusive" : "Alerte"}
                        </span>
                        {alert.status === "new" && (
                          <span className="flex h-2 w-2 rounded-full bg-error animate-pulse"></span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-white leading-tight">{alert.details}</h3>
                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#9a9a9f]">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-error" />
                          <span className="font-bold text-[#e4e4e8]">{alert.userName}</span>
                          <span className="text-xs opacity-60">(ID: {alert.userId.substring(0, 8)}...)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={14} />
                          {format(alert.createdAt, "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 self-end md:self-start">
                    {alert.status === "new" && (
                      <button 
                        onClick={() => handleResolve(alert.id)}
                        className="px-4 py-2 bg-[#4ade80] text-[#111113] rounded-lg font-bold text-sm hover:bg-[#34d399] transition-all flex items-center gap-2"
                      >
                        <CheckCircle size={16} />
                        Marquer résolue
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(alert.id)}
                      className="p-2 bg-[#1e1e22] border border-[#2e2e34] rounded-lg text-slate-500 hover:text-error hover:border-error transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
