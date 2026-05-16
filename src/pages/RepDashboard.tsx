import React, { useState, useMemo } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useOrgDashboard } from "../hooks/useOrgDashboard";
import { auth } from "../firebase";
import { 
  Loader2, 
  Menu, 
  X, 
  LogOut, 
  User, 
  Bell, 
  ShieldCheck,
  ChevronDown
} from "lucide-react";
import KPIGrid from "../components/dashboard/KPICards";
import ActivityChart from "../components/dashboard/ActivityChart";
import CollaboratorSection from "../components/dashboard/CollaboratorSection";
import AuthHistorySection from "../components/dashboard/AuthHistorySection";
import BrandSettingsSection from "../components/dashboard/BrandSettingsSection";
import { signOut } from "../firebase";

export default function RepDashboard() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const { organization, members, authRequests, loading, error } = useOrgDashboard(orgId);
  const [timeRange, setTimeRange] = useState<"7d" | "30d">("7d");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Stats calculation
  const stats = useMemo(() => {
    const total = authRequests.length;
    const success = authRequests.filter(r => r.status === "success").length;
    const successRate = total > 0 ? Math.round((success / total) * 100) : 0;
    const activeMembers = members.filter(m => m.status === "active").length;
    const failCount = authRequests.filter(r => r.status === "failed").length;

    return {
      authCount: total,
      authTrend: 12, // Stubbed trend
      successRate,
      successTrend: 5, // Stubbed trend
      activeMembers,
      totalMembers: members.filter(m => m.status !== "blocked").length,
      failCount
    };
  }, [authRequests, members]);

  // Auth Guard
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
        <Loader2 className="text-primary animate-spin" size={40} />
      </div>
    );
  }

  if (error || !organization) {
    return <Navigate to="/unauthorized" />;
  }

  // Check if current user is the representative
  const isRep = organization.representativeUserId === auth.currentUser?.uid;
  if (!isRep) {
    return <Navigate to="/unauthorized" />;
  }

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#0d0d0f]/80 backdrop-blur-xl border-b border-[#1e1e22] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-10 h-10 bg-[#1e1e22] rounded-xl border border-[#2e2e34] p-2">
              <img src={organization.logoUrl} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none">{organization.name}</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Dashboard Partenaire</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full" />
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 p-1 pr-3 bg-[#1e1e22] border border-[#2e2e34] rounded-full hover:border-slate-600 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-black font-black text-xs">
                  {members.find(m => m.id === auth.currentUser?.uid)?.firstName?.[0] || <User size={16} />}
                </div>
                <span className="text-xs font-bold text-slate-300">
                  {members.find(m => m.id === auth.currentUser?.uid)?.firstName || "Membres"}
                </span>
                <ChevronDown size={14} className="text-slate-500" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-[#1e1e22] border border-[#2e2e34] rounded-[20px] shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200">
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-bold text-slate-300 hover:bg-slate-800 rounded-xl transition-colors">
                    <User size={18} /> Mon profil
                  </button>
                  <div className="h-px bg-[#2e2e34] my-2" />
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-bold text-error hover:bg-error/10 rounded-xl transition-colors"
                  >
                    <LogOut size={18} /> Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-12">
        {/* Toggle & Welcome */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-4xl font-black text-white tracking-tighter">Ravi de vous revoir 👋</h2>
            <p className="text-slate-500 mt-2">Voici un aperçu des performances de sécurité de {organization.name}.</p>
          </div>
          <div className="flex bg-[#1e1e22] p-1 rounded-2xl border border-[#2e2e34]">
            <button 
              onClick={() => setTimeRange("7d")}
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${timeRange === '7d' ? 'bg-primary text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
              7 JOURS
            </button>
            <button 
              onClick={() => setTimeRange("30d")}
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${timeRange === '30d' ? 'bg-primary text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
              30 JOURS
            </button>
          </div>
        </section>

        {/* KPIs */}
        <KPIGrid stats={stats} />

        {/* Chart & History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ActivityChart />
          </div>
          <div className="lg:col-span-1">
            <AuthHistorySection authRequests={authRequests} organization={organization} />
          </div>
        </div>

        {/* Collaborators */}
        <CollaboratorSection members={members} organization={organization} />

        {/* Branding Settings */}
        <BrandSettingsSection organization={organization} />
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-[#1e1e22] flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3 grayscale opacity-30">
          <ShieldCheck size={20} />
          <p className="text-xs font-bold uppercase tracking-widest leading-none">SafeCallr Protocol</p>
        </div>
        <p className="text-[10px] font-medium text-slate-600">© 2026 SafeCallr. Module Institutions v2.1. Protection des données bancaires active.</p>
      </footer>
    </div>
  );
}
