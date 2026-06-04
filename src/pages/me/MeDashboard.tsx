import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCollaboratorAuth } from "../../hooks/useCollaboratorAuth";
import { 
  Loader2, 
  User, 
  History, 
  LogOut, 
  Settings, 
  ShieldCheck, 
  Bell,
  ChevronDown,
  LayoutDashboard
} from "lucide-react";
import { auth, signOut } from "../../firebase";
import TriggerAuthBlock from "../../components/me/TriggerAuthBlock";
import ProfileEditCard from "../../components/me/ProfileEditCard";
import RecentAuthsSummary from "../../components/me/RecentAuthsSummary";

export default function MeDashboard() {
  const { member, organization, loading, error } = useCollaboratorAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
        <Loader2 className="text-primary animate-spin" size={40} />
      </div>
    );
  }

  if (error || !member || !organization) {
    return (
      <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center p-6 text-center">
        <div className="space-y-6">
          <p className="text-error font-bold">{error || "Une erreur est survenue."}</p>
          <button 
            onClick={() => signOut(auth)}
            className="bg-primary text-black px-8 py-3 rounded-xl font-black"
          >
            Déconnexion
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#0d0d0f]/80 backdrop-blur-xl border-b border-[#1e1e22] px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/me" className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#1e1e22] rounded-xl border border-[#2e2e34] p-2">
              <img src={organization.logoUrl} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-black tracking-tight leading-none uppercase">{organization.name}</h1>
              <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-1">Espace Collaborateur</p>
            </div>
          </Link>

          <div className="flex items-center gap-4 sm:gap-6">
            <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-error rounded-full" />
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 sm:gap-3 p-1 pr-3 bg-[#1e1e22] border border-[#2e2e34] rounded-full hover:border-slate-600 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-[#111113] border border-[#2e2e34] flex items-center justify-center overflow-hidden">
                  {member.photoUrl ? (
                    <img src={member.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={16} className="text-slate-600" />
                  )}
                </div>
                <span className="text-xs font-bold text-slate-300 hidden sm:block">
                  {member.firstName}
                </span>
                <ChevronDown size={14} className="text-slate-500" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-[#1e1e22] border border-[#2e2e34] rounded-[24px] shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-3 border-b border-[#2e2e34] mb-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Connecté en tant que</p>
                    <p className="text-sm font-bold text-white truncate">{member.firstName} {member.lastName}</p>
                  </div>
                  <Link 
                    to="/me/history"
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-bold text-slate-300 hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <History size={18} /> Mon historique
                  </Link>
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-bold text-slate-300 hover:bg-slate-800 rounded-xl transition-colors">
                    <Settings size={18} /> Paramètres
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

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-12">
        {/* Trigger Block */}
        <section>
          <TriggerAuthBlock organization={organization} member={member} />
        </section>

        {/* Profile and History Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-3">
            <ProfileEditCard member={member} organization={organization} />
          </div>
          <div className="lg:col-span-2">
            <RecentAuthsSummary member={member} organization={organization} />
          </div>
        </div>
      </main>

      <footer className="max-w-2xl mx-auto px-6 py-12 border-t border-[#1e1e22] flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3 grayscale opacity-30">
          <ShieldCheck size={20} />
          <p className="text-xs font-bold uppercase tracking-widest leading-none">SafeCallr Protocol</p>
        </div>
        <p className="text-[10px] font-medium text-slate-600">Protection active des communications bancaires • v2.1.0</p>
      </footer>
    </div>
  );
}
