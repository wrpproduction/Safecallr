import React from "react";
import { Link } from "react-router-dom";
import { Users, LayoutDashboard, History, Settings, Shield } from "lucide-react";

export default function AdminSettings() {
  return (
    <div className="min-h-screen bg-slate-50 flex text-[#0F1B3D] font-sans">
      <aside className="w-64 bg-[#0F1B3D] shrink-0 min-h-screen text-white flex flex-col justify-between border-r border-[#1a2d5e]">
        <div>
          <div className="p-6 border-b border-[#1a2d5e] flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#3DFFA0] flex items-center justify-center">
              <Shield className="text-[#0F1B3D] w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm uppercase tracking-wider text-white">SafeCallr</h2>
              <span className="text-[10px] text-[#3DFFA0] uppercase font-bold tracking-widest block -mt-1">Business</span>
            </div>
          </div>
          <nav className="p-4 space-y-1">
            <Link to="/business/admin/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-[#1a2d5e] font-medium text-sm transition-all">
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>
            <Link to="/business/admin/members" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-[#1a2d5e] font-medium text-sm transition-all">
              <Users size={18} />
              <span>Collaborateurs</span>
            </Link>
            <Link to="/business/admin/history" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-[#1a2d5e] font-medium text-sm transition-all">
              <History size={18} />
              <span>Historique</span>
            </Link>
            <Link to="/business/admin/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#3DFFA0] text-[#0F1B3D] font-bold text-sm transition-all shadow-md shadow-[#3DFFA0]/10">
              <Settings size={18} />
              <span>Paramètres</span>
            </Link>
          </nav>
        </div>
      </aside>

      <main className="flex-1 p-8 space-y-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-4xl">
          <h1 className="text-2xl font-black text-[#0F1B3D] mb-2">Paramètres de l'organisation</h1>
          <p className="text-slate-500 text-sm mb-6">Cette page de configuration (PAGE 7) sera implémentée en détail lors des prochaines étapes de développement.</p>
          <div className="p-4 bg-[#3DFFA0]/10 border border-[#3DFFA0]/30 rounded-xl flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3DFFA0] animate-pulse" />
            <p className="text-sm font-bold text-[#0F1B3D]">Prêt pour la validation de la PAGE 1 !</p>
          </div>
        </div>
      </main>
    </div>
  );
}
