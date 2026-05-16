import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown,
  Loader2,
  AlertCircle
} from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import OrganizationsTable from "../../components/admin/OrganizationsTable";
import { auth } from "../../firebase";

export default function AdminOrganizationsList() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  const fetchOrgs = async () => {
    setLoading(true);
    setError(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/admin/organizations', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      if (!response.ok) throw new Error("Erreur lors de la récupération des organisations");
      const data = await response.json();
      setOrganizations(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const handleAction = async (action: string, org: any) => {
    if (action === 'toggleStatus') {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const response = await fetch(`/api/admin/organizations/${org.id}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken, active: !org.active })
        });
        if (response.ok) {
          fetchOrgs(); // Refresh
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filteredOrgs = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(search.toLowerCase()) || org.siret.includes(search);
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? org.active : !org.active);
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white">Organisations clientes</h1>
            <p className="text-slate-500 mt-1">Gérez les institutions et marques utilisant SafeCallr.</p>
          </div>
          <Link 
            to="/admin/organizations/new"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-black px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
          >
            <Plus size={18} />
            Créer une organisation
          </Link>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text"
              placeholder="Rechercher par nom ou SIRET..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1e1e22] border border-[#2e2e34] focus:border-primary rounded-2xl pl-12 pr-4 py-3 text-white transition-all outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#1e1e22] border border-[#2e2e34] text-white text-xs font-black uppercase tracking-widest rounded-xl px-4 py-3 outline-none"
            >
              <option value="all">Tous les Statuts</option>
              <option value="active">Actives</option>
              <option value="inactive">Désactivées</option>
            </select>
            <button className="p-3 bg-[#1e1e22] border border-[#2e2e34] rounded-xl text-slate-500 hover:text-white transition-all">
              <Filter size={18} />
            </button>
            <button className="p-3 bg-[#1e1e22] border border-[#2e2e34] rounded-xl text-slate-500 hover:text-white transition-all">
              <ArrowUpDown size={18} />
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-slate-500 italic">Chargement des données...</p>
          </div>
        ) : (
          <OrganizationsTable 
            organizations={filteredOrgs} 
            onAction={handleAction}
          />
        )}
      </div>
    </AdminLayout>
  );
}
