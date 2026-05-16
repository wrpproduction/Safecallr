import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#1e1e22] border border-[#2e2e34] rounded-[32px] p-10 text-center space-y-6 shadow-2xl">
        <div className="w-20 h-20 bg-error/10 text-error rounded-3xl flex items-center justify-center mx-auto">
          <ShieldAlert size={40} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white">Accès Non Autorisé</h1>
          <p className="text-slate-500 text-sm">
            Désolé, vous n'avez pas les permissions nécessaires pour accéder à ce tableau de bord. 
            Si vous pensez qu'il s'agit d'une erreur, contactez votre administrateur SafeCallr.
          </p>
        </div>
        <Link 
          to="/login"
          className="inline-flex items-center gap-2 bg-primary text-black px-8 py-3 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-lg shadow-primary/20"
        >
          <ArrowLeft size={18} />
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}
