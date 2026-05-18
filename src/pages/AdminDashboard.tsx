import React, { useState, useEffect } from "react";
import { 
  Users, 
  ShieldCheck, 
  Building2, 
  History, 
  CheckCircle2, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Plus
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area
} from "recharts";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";
import AdminLayout from "../components/AdminLayout";
import { Link } from "react-router-dom";

// Mock data for the chart
const chartData = [
  { name: "Lun", requests: 45 },
  { name: "Mar", requests: 52 },
  { name: "Mer", requests: 38 },
  { name: "Jeu", requests: 65 },
  { name: "Ven", requests: 48 },
  { name: "Sam", requests: 25 },
  { name: "Dim", requests: 30 },
];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [recentOrgs, setRecentOrgs] = useState<any[]>([]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [realStats, setRealStats] = useState({
    users: 0,
    pros: 0,
    orgs: 0,
    requests: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const response = await fetch('/api/admin/stats/global', {
          headers: { 'Authorization': `Bearer ${idToken}` }
        });
        const stats = await response.json();
        
        const orgsResponse = await fetch('/api/admin/organizations', {
          headers: { 'Authorization': `Bearer ${idToken}` }
        });
        const orgs = await orgsResponse.json();

        // Fetch recent requests for global vision
        try {
          const { query, collection, orderBy, limit, getDocs } = await import("firebase/firestore");
          const requestsSnap = await getDocs(query(collection(db, "authRequests"), orderBy("createdAt", "desc"), limit(5)));
          const reqs = requestsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          setRecentRequests(reqs);
        } catch (err) {
          console.error("Error fetching recent requests:", err);
        }

        setRealStats({
          users: stats.totalUsers || 0,
          pros: stats.totalPros || 0,
          orgs: stats.activeOrganizations || 0,
          requests: stats.totalAuths30d || 0
        });
        setOrganizations(orgs.slice(0, 5));
        setRecentOrgs(orgs.slice(0, 10));
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const displayStats = [
    { label: "Utilisateurs Totaux", value: realStats.users.toLocaleString(), icon: Users, color: "#60a5fa", trend: "+12%", trendUp: true, path: "/admin/users" },
    { label: "Pros Actifs", value: realStats.pros.toLocaleString(), icon: ShieldCheck, color: "#4ade80", trend: "+5%", trendUp: true, path: "/admin/pros" },
    { label: "Organisations", value: realStats.orgs.toString(), icon: Building2, color: "#a78bfa", trend: "+2", trendUp: true, path: "/admin/organizations" },
    { label: "Demandes (Total)", value: realStats.requests.toLocaleString(), icon: History, color: "var(--color-primary)", trend: "+18%", trendUp: true, path: "/admin/requests" },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="w-12 h-12 border-4 border-[#4ade80] border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-[#9a9a9f] mt-1">Vue d'ensemble de l'activité SafeCallr</p>
          </div>
          <div className="flex items-center gap-3">
            {debugInfo && (
              <div className="px-4 py-2 bg-[#1e1e22] border border-[#2e2e34] rounded-lg text-[10px] font-mono text-[#4ade80]">
                Admin: {debugInfo.email} ({debugInfo.uid.substring(0, 8)}...)
              </div>
            )}
            <div className="px-4 py-2 bg-[#1e1e22] border border-[#2e2e34] rounded-lg text-sm font-medium">
              Derniers 7 jours
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayStats.map((stat, index) => (
            <Link 
              key={index}
              to={stat.path}
              className="bg-[#1e1e22] border border-[#2e2e34] p-6 rounded-2xl hover:border-[#4ade80]/30 transition-all group block shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div 
                  className="p-3 rounded-xl bg-[#111113] group-hover:scale-110 transition-transform"
                  style={{ color: stat.color }}
                >
                  <stat.icon size={24} />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${stat.trendUp ? "text-[#4ade80]" : "text-[#f87171]"}`}>
                  {stat.trend}
                  {stat.trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[#9a9a9f] text-sm font-medium uppercase tracking-wider">{stat.label}</p>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </div>
            </Link>
          ))}
        </div>        {/* Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-[#1e1e22] border border-[#2e2e34] p-8 rounded-3xl">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-bold">Croissance de la plateforme</h2>
                  <p className="text-xs text-[#9a9a9f] mt-1 font-bold uppercase tracking-widest">Évolution du nombre d'organisations sur 12 mois</p>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { name: 'Jan', orgs: 2 },
                    { name: 'Fév', orgs: 5 },
                    { name: 'Mar', orgs: 8 },
                    { name: 'Avr', orgs: 15 },
                    { name: 'Mai', orgs: 22 },
                  ]}>
                    <defs>
                      <linearGradient id="colorOrgs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 12}} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2e2e34" />
                    <Tooltip contentStyle={{ backgroundColor: '#111113', border: '1px solid #2e2e34', borderRadius: '12px' }} />
                    <Area type="monotone" dataKey="orgs" stroke="#60a5fa" fillOpacity={1} fill="url(#colorOrgs)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#1e1e22] border border-[#2e2e34] rounded-3xl overflow-hidden">
               <div className="p-8 border-b border-[#2e2e34] flex items-center justify-between">
                  <h3 className="font-bold">Dernières Demandes d'Authentification</h3>
                  <Link to="/admin/requests" className="text-[10px] font-black uppercase tracking-widest text-[#4ade80] hover:underline">Voir Tout</Link>
               </div>
               <div className="divide-y divide-[#2e2e34]">
                  {recentRequests.length === 0 ? (
                    <div className="p-10 text-center text-[#9a9a9f]">Aucune demande récente</div>
                  ) : (
                    recentRequests.map((req, i) => (
                      <div key={req.id} className="flex items-center justify-between p-6 hover:bg-[#111113] transition-colors group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#111113] border border-[#2e2e34] flex items-center justify-center text-[#4ade80]">
                              <ShieldCheck size={20} />
                            </div>
                            <div>
                              <p className="text-white font-bold text-sm tracking-tight">{req.fromProName || "Pro Inconnu"}</p>
                              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
                                {req.fromCompanyName || "Indépendant"} • {req.toUserPhone}
                              </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                              req.status === 'verified' || req.status === 'validated' ? 'text-[#4ade80] border-[#4ade80]/20 bg-[#4ade80]/10' :
                              req.status === 'pending' ? 'text-[#fbbf24] border-[#fbbf24]/20 bg-[#fbbf24]/10' :
                              'text-[#f87171] border-[#f87171]/20 bg-[#f87171]/10'
                            }`}>
                              {req.status}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1 uppercase font-black">
                              {req.createdAt?.seconds ? format(new Date(req.createdAt.seconds * 1000), 'HH:mm', { locale: fr }) : "Maintenant"}
                            </p>
                        </div>
                      </div>
                    ))
                  )}
               </div>
            </div>
          </div>

          {/* Quick Actions / Recent Orgs */}
          <div className="space-y-8">
            <div className="bg-[#1e1e22] border border-[#2e2e34] p-8 rounded-3xl flex flex-col">
              <h2 className="text-xl font-bold mb-6">Nouvelles Organisations</h2>
              <div className="space-y-4">
                {recentOrgs.map(org => (
                   <Link key={org.id} to={`/admin/organizations/${org.id}`} className="block p-4 bg-[#111113] border border-[#2e2e34] rounded-2xl hover:border-primary transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-lg bg-[#1e1e22] p-1 flex items-center justify-center">
                          <img src={org.logoUrl} alt="" className="max-w-full max-h-full object-contain" />
                        </div>
                        <span className="text-[10px] text-slate-500">{format(new Date(org.createdAt?.seconds * 1000), 'dd/MM', { locale: fr })}</span>
                      </div>
                      <p className="text-sm font-bold text-white truncate">{org.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{org.siret}</p>
                   </Link>
                ))}
              </div>
              <Link to="/admin/organizations" className="mt-6 text-center text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                 Voir toutes les organisations
              </Link>
            </div>

            <div className="bg-primary/5 border border-primary/20 p-8 rounded-3xl">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <AlertCircle size={18} className="text-primary" /> Note Admin
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed uppercase font-black tracking-tight italic">
                Ce dashboard consolide les données de toutes les institutions clientes. Les chiffres d'authentification sont mis à jour en temps réel via le protocole SafeCallr.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
