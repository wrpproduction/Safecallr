import React, { useState } from "react";
import { ShieldAlert, Trash2, Loader2 } from "lucide-react";

interface DangerZoneProps {
  orgName: string;
  onDeactivate: () => Promise<void>;
  onDelete: () => Promise<void>;
  isActive: boolean;
}

export default function DangerZone({ orgName, onDeactivate, onDelete, isActive }: DangerZoneProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== orgName) return;
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await onDeactivate();
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="bg-red-500/5 border border-red-500/20 rounded-3xl overflow-hidden">
      <div className="bg-red-500/10 px-8 py-4 border-b border-red-500/20 flex items-center gap-3 text-red-500">
        <ShieldAlert size={20} />
        <h3 className="font-black uppercase tracking-widest text-xs">Zone de Danger</h3>
      </div>
      
      <div className="p-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <p className="text-white font-bold">{isActive ? "Désactiver l'organisation" : "Réactiver l'organisation"}</p>
            <p className="text-xs text-slate-500 max-w-md">
              {isActive 
                ? "Empêche toute nouvelle authentification de la part des collaborateurs. Les données sont conservées."
                : "Rétablit l'accès complet pour tous les collaborateurs de cette organisation."}
            </p>
          </div>
          <button 
            disabled={isToggling}
            onClick={handleToggle}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 border transition-all ${
              isActive 
                ? "bg-transparent border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white"
                : "bg-green-500 text-black border-green-500 hover:bg-green-400"
            }`}
          >
            {isToggling && <Loader2 className="animate-spin" size={14} />}
            {isActive ? "Désactiver" : "Réactiver"}
          </button>
        </div>

        <div className="pt-8 border-t border-red-500/10 space-y-6">
          <div className="space-y-1">
            <p className="text-white font-bold text-red-500">Supprimer définitivement</p>
            <p className="text-xs text-slate-500 max-w-md">
              Cette action est irréversible. Toutes les données, membres et historiques seront supprimés du protocole SafeCallr.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Tapez <span className="text-white font-mono">"{orgName}"</span> pour confirmer
              </label>
              <input 
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Nom de l'organisation"
                className="w-full bg-[#111113] border border-[#2e2e34] focus:border-red-500 rounded-xl px-4 py-3 text-white transition-all outline-none"
              />
            </div>
            
            <button 
              disabled={confirmText !== orgName || isDeleting}
              onClick={handleDelete}
              className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:hover:bg-red-600 text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl flex items-center justify-center gap-3 transition-all"
            >
              {isDeleting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
              Détruire définitivement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
