import React from "react";
import { ShieldAlert, Phone, ArrowLeft, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

interface InstitutionErrorPageProps {
  type: "suspended" | "inactive";
}

export default function InstitutionErrorPage({ type }: InstitutionErrorPageProps) {
  const content = {
    suspended: {
      title: "Compte Suspendu",
      description: "Votre accès collaborateur a été restreint par votre administrateur institutionnel ou par SafeCallr. Vous ne pouvez plus déclencher d'authentification.",
      cta: "Contacter mon représentant",
      icon: <ShieldAlert size={48} className="text-error" />
    },
    inactive: {
      title: "Institution Inactive",
      description: "Votre organisation n'est plus active sur le protocole SafeCallr. L'accès aux outils d'authentification est temporairement coupé.",
      cta: "Consulter le support SafeCallr",
      icon: <ShieldAlert size={48} className="text-error" />
    }
  }[type];

  const handleLogout = () => signOut(auth);

  return (
    <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#1e1e22] border border-[#2e2e34] rounded-[40px] p-10 text-center space-y-8 shadow-2xl">
        <div className="w-24 h-24 bg-error/10 text-error rounded-3xl flex items-center justify-center mx-auto">
          {content.icon}
        </div>
        
        <div className="space-y-3">
          <h1 className="text-3xl font-black text-white tracking-tight">{content.title}</h1>
          <p className="text-slate-500 font-medium leading-relaxed">
            {content.description}
          </p>
        </div>

        <div className="space-y-4">
          <button className="w-full bg-white text-black py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:scale-105 transition-all">
            <Phone size={18} /> {content.cta}
          </button>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-white transition-colors py-2 font-bold text-sm"
          >
            <LogOut size={16} /> Déconnexion
          </button>
        </div>

        <div className="pt-6 border-t border-[#2e2e34]">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">SafeCallr Protocol Security Guard</p>
        </div>
      </div>
    </div>
  );
}
