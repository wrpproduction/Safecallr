import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="max-w-md w-full bg-slate-900/60 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-400">
          <ShieldX size={32} />
        </div>
        
        <div className="space-y-2">
          <p className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">Erreur 404</p>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Page introuvable</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            La page demandée n'existe pas ou a été déplacée.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl bg-white text-slate-950 font-bold text-sm hover:bg-slate-200 transition-colors shadow-lg"
          >
            <ArrowLeft size={16} />
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
