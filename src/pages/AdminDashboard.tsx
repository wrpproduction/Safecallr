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
  AlertCircle
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
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
  const [realStats, setRealStats] = useState({
    users: 0,
    pros: 0,
    companies: 0,
    requests: 0
  });

  useEffect(() => {
    // Get debug info
    const user = auth.currentUser;
    if (user) {
      user.getIdTokenResult().then(result => {
        setDebugInfo({
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          claims: result.claims
        });
      });
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersSnap, prosSnap, companiesSnap, requestsSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "pros")),
          getDocs(collection(db, "companies")),
          getDocs(collection(db, "authRequests"))
        ]);

        setRealStats({
          users: usersSnap.size,
          pros: prosSnap.size,
          companies: companiesSnap.size,
          requests: requestsSnap.size
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const displayStats = [
    { label: "Utilisateurs", value: realStats.users.toLocaleString(), icon: Users, color: "#60a5fa", trend: "+12%", trendUp: true },
    { label: "Pros", value: realStats.pros.toLocaleString(), icon: ShieldCheck, color: "#4ade80", trend: "+5%", trendUp: true },
    { label: "Entreprises", value: realStats.companies.toLocaleString(), icon: Building2, color: "#fbbf24", trend: "+2", trendUp: true },
    { label: "Demandes Totales", value: realStats.requests.toLocaleString(), icon: History, color: "#e4e4e8", trend: "+18%", trendUp: true },
    { label: "Validées", value: "7,120", icon: CheckCircle2, color: "#4ade80", trend: "+14%", trendUp: true },
    { label: "Taux de Validation", value: "83.8%", icon: TrendingUp, color: "#4ade80", trend: "-2%", trendUp: false },
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayStats.map((stat, index) => (
            <div 
              key={index}
              className="bg-[#1e1e22] border border-[#2e2e34] p-6 rounded-2xl hover:border-[#4ade80]/30 transition-all group"
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
            </div>
          ))}
        </div>

        {/* Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#1e1e22] border border-[#2e2e34] p-8 rounded-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold">Activité des Demandes</h2>
              <div className="flex items-center gap-4 text-xs font-medium text-[#9a9a9f] uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#4ade80] rounded-full" />
                  <span>Demandes</span>
                </div>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2e2e34" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9a9a9f', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9a9a9f', fontSize: 12 }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#111113' }}
                    contentStyle={{ 
                      backgroundColor: '#1e1e22', 
                      borderColor: '#2e2e34',
                      borderRadius: '12px',
                      color: '#e4e4e8'
                    }}
                  />
                  <Bar dataKey="requests" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.requests > 50 ? '#4ade80' : '#60a5fa'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions / Recent Activity */}
          <div className="bg-[#1e1e22] border border-[#2e2e34] p-8 rounded-2xl flex flex-col">
            <h2 className="text-xl font-bold mb-6">Actions Rapides</h2>
            <div className="space-y-4 flex-1">
              <Link to="/admin/companies" className="w-full p-4 bg-[#111113] border border-[#2e2e34] rounded-xl flex items-center justify-between hover:border-[#4ade80] transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#fbbf24]/10 text-[#fbbf24] rounded-lg">
                    <Building2 size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">Entreprises en attente</p>
                    <p className="text-xs text-[#9a9a9f]">12 dossiers à valider</p>
                  </div>
                </div>
                <ArrowUpRight size={18} className="text-[#9a9a9f] group-hover:text-[#4ade80] transition-colors" />
              </Link>

              <Link to="/admin/pros" className="w-full p-4 bg-[#111113] border border-[#2e2e34] rounded-xl flex items-center justify-between hover:border-[#60a5fa] transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#60a5fa]/10 text-[#60a5fa] rounded-lg">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">Vérifier des Pros</p>
                    <p className="text-xs text-[#9a9a9f]">8 nouveaux inscrits</p>
                  </div>
                </div>
                <ArrowUpRight size={18} className="text-[#9a9a9f] group-hover:text-[#60a5fa] transition-colors" />
              </Link>

              <button className="w-full p-4 bg-[#111113] border border-[#2e2e34] rounded-xl flex items-center justify-between hover:border-[#f87171] transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#f87171]/10 text-[#f87171] rounded-lg">
                    <AlertCircle size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">Signalements</p>
                    <p className="text-xs text-[#9a9a9f]">3 alertes de vigilance</p>
                  </div>
                </div>
                <ArrowUpRight size={18} className="text-[#9a9a9f] group-hover:text-[#f87171] transition-colors" />
              </button>
            </div>
            
            <div className="mt-8 pt-6 border-t border-[#2e2e34]">
              <div className="flex items-center justify-between text-xs text-[#9a9a9f] uppercase tracking-widest font-bold">
                <span>Statut Système</span>
                <span className="text-[#4ade80] flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-[#4ade80] rounded-full animate-pulse" />
                  Opérationnel
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
