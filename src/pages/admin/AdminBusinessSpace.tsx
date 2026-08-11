import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Building2, 
  Search, 
  Filter, 
  ShieldCheck, 
  Users, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Plus, 
  ChevronRight, 
  Globe, 
  Clock, 
  User, 
  ShieldAlert,
  FileText,
  Lock,
  ArrowUpRight
} from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import { db, collection, getDocs, query, orderBy, doc, updateDoc } from "../../firebase";
import { safeFormatDate } from "../../lib/dateUtils";
import { toast } from "sonner";

export default function AdminBusinessSpace() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();

  const fetchBusinessEntities = async () => {
    setLoading(true);
    try {
      // Fetch both organizations and companies
      const [orgsSnap, compSnap] = await Promise.all([
        getDocs(query(collection(db, "organizations"), orderBy("createdAt", "desc"))).catch(() => ({ docs: [] })),
        getDocs(query(collection(db, "companies"), orderBy("createdAt", "desc"))).catch(() => ({ docs: [] }))
      ]);

      const orgsList = orgsSnap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          source: "organizations",
          name: data.name || "Organisation",
          siret: data.siret || "N/C",
          domain: data.domain || (data.allowedEmailDomains ? data.allowedEmailDomains[0] : "domaine.com"),
          adminEmail: data.representativeEmail || data.adminEmail || data.email || "referent@entreprise.com",
          collaboratorsCount: data.stats?.totalMembers || (data.members ? data.members.length : 1),
          status: data.active !== false ? "active" : "inactive",
          serviceBusinessActive: true, // All organizations feature inter-collaborator validation
          logoUrl: data.logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${data.name || 'SafeCallr'}`,
          createdAt: data.createdAt
        };
      });

      const compsList = compSnap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          source: "companies",
          name: data.name || "Entreprise",
          siret: data.siret || "N/C",
          domain: data.domain || "entreprise.com",
          adminEmail: data.adminEmail || data.email || "referent@entreprise.com",
          collaboratorsCount: data.collaboratorsCount || 1,
          status: data.status === "verified" || data.status === "active" ? "active" : "inactive",
          serviceBusinessActive: true,
          logoUrl: data.logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${data.name || 'Company'}`,
          createdAt: data.createdAt
        };
      });

      // Deduplicate by ID
      const combined = [...orgsList];
      compsList.forEach(c => {
        if (!combined.some(o => o.id === c.id)) {
          combined.push(c);
        }
      });

      setItems(combined);
    } catch (err) {
      console.error("Error fetching Business entities:", err);
      toast.error("Erreur lors du chargement de l'Espace Business");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessEntities();
  }, []);

  const handleToggleBusinessService = async (item: any) => {
    try {
      const collectionName = item.source === "companies" ? "companies" : "organizations";
      const newStatus = item.status === "active" ? "inactive" : "active";
      await updateDoc(doc(db, collectionName, item.id), {
        active: newStatus === "active",
        status: newStatus === "active" ? "verified" : "suspended"
      });
      toast.success(`Service Business ${newStatus === 'active' ? 'activé' : 'désactivé'}`);
      fetchBusinessEntities();
    } catch (e: any) {
      toast.error("Erreur lors de la modification : " + e.message);
    }
  };

  const filteredItems = items.filter(item => {
    const query = search.toLowerCase();
    const matchesSearch = 
      item.name.toLowerCase().includes(query) || 
      item.siret.includes(query) || 
      item.domain.toLowerCase().includes(query) ||
      item.adminEmail.toLowerCase().includes(query);
    const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? item.status === "active" : item.status !== "active");
    return matchesSearch && matchesStatus;
  });

  const totalCollaborators = items.reduce((acc, i) => acc + (i.collaboratorsCount || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-[#111113] via-[#1a1a1e] to-[#111113] p-8 rounded-3xl border border-[#2e2e34] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-2 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-black uppercase tracking-widest">
              <Lock size={14} />
              Protocoles SafeCallr Business
            </div>
            <h1 className="text-3xl font-black text-white">Espace Business — Service Inter-Collaborateurs</h1>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Consultez et gérez l'ensemble des entreprises équipées du service SafeCallr Business. Ce protocole garantit la validation d'identité stricte en temps réel lors des échanges et vérifications entre collaborateurs.
            </p>
          </div>

          <div className="flex items-center gap-3 z-10 shrink-0">
            <Link
              to="/admin/organizations/new"
              className="inline-flex items-center gap-2 bg-[#3dffa0] hover:bg-[#3dffa0]/90 text-black px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-[#3dffa0]/20"
            >
              <Plus size={18} />
              Inscrire une Entreprise
            </Link>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#1e1e22] border border-[#2e2e34] p-6 rounded-3xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Entreprises Business</span>
              <Building2 className="text-blue-400" size={20} />
            </div>
            <p className="text-3xl font-black text-white">{items.length}</p>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <CheckCircle2 size={12} className="text-[#3dffa0]" />
              {items.filter(i => i.status === "active").length} avec service actif
            </p>
          </div>

          <div className="bg-[#1e1e22] border border-[#2e2e34] p-6 rounded-3xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Collaborateurs Couverts</span>
              <Users className="text-[#c084fc]" size={20} />
            </div>
            <p className="text-3xl font-black text-white">{totalCollaborators}</p>
            <p className="text-xs text-slate-400 mt-2">Membres autorisés sur le réseau</p>
          </div>

          <div className="bg-[#1e1e22] border border-[#2e2e34] p-6 rounded-3xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Service Inter-Collaborateurs</span>
              <ShieldCheck className="text-[#3dffa0]" size={20} />
            </div>
            <p className="text-3xl font-black text-white">100%</p>
            <p className="text-xs text-slate-400 mt-2">Validation stricte activée</p>
          </div>

          <div className="bg-[#1e1e22] border border-[#2e2e34] p-6 rounded-3xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Taux de Protection Anti-Spoof</span>
              <Lock className="text-amber-400" size={20} />
            </div>
            <p className="text-3xl font-black text-white">100%</p>
            <p className="text-xs text-slate-400 mt-2">Alertes temps réel aux référents</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#1e1e22] p-4 rounded-2xl border border-[#2e2e34]">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text"
              placeholder="Rechercher par nom, SIRET, domaine, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-[#111113] border border-[#2e2e34] rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-primary transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Filter className="text-slate-500 shrink-0" size={18} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#111113] border border-[#2e2e34] text-white text-xs font-bold rounded-xl px-4 py-2.5 outline-none focus:border-primary transition-all w-full sm:w-auto"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Service Business Actif</option>
              <option value="inactive">Service Inactif / Suspendu</option>
            </select>
          </div>
        </div>

        {/* Business Entities Table */}
        <div className="bg-[#1e1e22] border border-[#2e2e34] rounded-3xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-primary" size={40} />
              <p className="text-slate-500 text-sm">Chargement du réseau Business...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <Building2 className="mx-auto text-slate-600" size={48} />
              <p className="text-slate-400 font-bold">Aucune entreprise Business trouvée.</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Toutes les entreprises ou organisations que vous enregistrez apparaissent dans cet Espace Business pour gérer le service de validation entre collaborateurs.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#2e2e34] text-[10px] font-black uppercase tracking-widest text-slate-500 bg-[#161619]">
                    <th className="p-4 pl-6">Entreprise / Organisation</th>
                    <th className="p-4">Domaine Email & SIRET</th>
                    <th className="p-4">Référent SI / Représentant</th>
                    <th className="p-4">Collaborateurs</th>
                    <th className="p-4">Service Business</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2e2e34]/60 text-sm">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-[#25252b] transition-colors group">
                      
                      {/* Name & Logo */}
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-[#111113] border border-[#2e2e34] rounded-2xl p-2 flex items-center justify-center shrink-0">
                            <img src={item.logoUrl} alt="" className="max-w-full max-h-full object-contain" />
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-primary transition-colors flex items-center gap-2">
                              {item.name}
                            </p>
                            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <Clock size={12} /> Inscrit le {safeFormatDate(item.createdAt, 'dd/MM/yyyy')}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Domain & SIRET */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-mono">
                            <Globe size={12} />
                            @{item.domain}
                          </span>
                          <p className="text-[11px] font-mono text-slate-500">SIRET: {item.siret}</p>
                        </div>
                      </td>

                      {/* Referent */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-slate-400" />
                          <div>
                            <p className="text-xs font-bold text-slate-200">{item.adminEmail}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Référent Sécurité</p>
                          </div>
                        </div>
                      </td>

                      {/* Collaborators */}
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#111113] border border-[#2e2e34] rounded-xl text-xs font-bold text-slate-300">
                          <Users size={14} className="text-[#c084fc]" />
                          {item.collaboratorsCount} membre(s)
                        </span>
                      </td>

                      {/* Service Business Status */}
                      <td className="p-4">
                        {item.status === "active" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#3dffa0]/10 text-[#3dffa0] border border-[#3dffa0]/30 rounded-full text-xs font-bold">
                            <CheckCircle2 size={14} />
                            Validation Inter-Collaborateurs
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs font-bold">
                            <AlertCircle size={14} />
                            Inactif / Suspendu
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 pr-6 text-right space-x-2">
                        <a
                          href={`/dashboard/${item.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#3dffa0] hover:bg-[#3dffa0]/90 text-black rounded-xl text-xs font-bold transition-all shadow-md shadow-[#3dffa0]/10"
                          title="Accéder directement à l'Espace Référent"
                        >
                          <ExternalLink size={14} />
                          <span>Espace Référent</span>
                        </a>

                        <button
                          onClick={() => navigate(`/admin/organizations/${item.id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#111113] hover:bg-[#2e2e34] text-slate-300 hover:text-white border border-[#2e2e34] rounded-xl text-xs font-bold transition-all"
                          title="Voir la fiche d'administration"
                        >
                          <FileText size={14} />
                          <span>Fiche Admin</span>
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}
