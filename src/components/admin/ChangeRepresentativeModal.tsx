import React, { useState } from "react";
import { UserPlus, UserCheck, Search, Loader2, Mail, ShieldAlert } from "lucide-react";

interface ChangeRepresentativeModalProps {
  currentRep: any;
  members: any[];
  onClose: () => void;
  onConfirm: (mode: 'promote' | 'create', data: any) => Promise<void>;
}

export default function ChangeRepresentativeModal({ currentRep, members, onClose, onConfirm }: ChangeRepresentativeModalProps) {
  const [mode, setMode] = useState<'promote' | 'create'>('promote');
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  
  // New rep form
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: ""
  });

  const filteredMembers = members.filter(m => 
    m.role !== 'representative' && 
    (m.firstName.toLowerCase().includes(search.toLowerCase()) || 
     m.lastName.toLowerCase().includes(search.toLowerCase()) || 
     m.email.toLowerCase().includes(search.toLowerCase()))
  );

  const handleConfirm = async (selectedData: any) => {
    setLoading(true);
    try {
      await onConfirm(mode, selectedData);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1e1e22] border border-[#2e2e34] w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-[#2e2e34] bg-[#111113]">
          <h3 className="text-xl font-bold text-white mb-2">Changer de Représentant</h3>
          <p className="text-xs text-slate-500">Le représentant actuel est <span className="text-primary">{currentRep?.firstName} {currentRep?.lastName}</span>.</p>
        </div>

        <div className="p-8 space-y-8">
          <div className="flex p-1 bg-[#111113] rounded-xl border border-[#2e2e34]">
            <button 
              onClick={() => setMode('promote')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${mode === 'promote' ? 'bg-primary text-black' : 'text-slate-500 hover:text-white'}`}
            >
              Promouvoir un membre
            </button>
            <button 
              onClick={() => setMode('create')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${mode === 'create' ? 'bg-primary text-black' : 'text-slate-500 hover:text-white'}`}
            >
              Créer un nouvel accès
            </button>
          </div>

          {mode === 'promote' ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type="text"
                  placeholder="Rechercher par nom ou email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#111113] border border-[#2e2e34] rounded-xl pl-12 pr-4 py-3 text-white outline-none focus:border-primary transition-all text-sm"
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {filteredMembers.map(member => (
                  <button
                    key={member.id}
                    onClick={() => handleConfirm(member)}
                    className="w-full flex items-center justify-between p-4 bg-[#111113] border border-[#2e2e34] rounded-2xl hover:border-primary transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white">
                        {member.firstName[0]}{member.lastName[0]}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-white">{member.firstName} {member.lastName}</p>
                        <p className="text-[10px] text-slate-500">{member.email}</p>
                      </div>
                    </div>
                    <UserCheck size={16} className="text-slate-700 group-hover:text-primary transition-colors" />
                  </button>
                ))}
                {filteredMembers.length === 0 && (
                  <p className="text-center py-8 text-slate-500 text-xs italic">Aucun membre éligible trouvé.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Prénom</label>
                <input 
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="w-full bg-[#111113] border border-[#2e2e34] rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nom</label>
                <input 
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="w-full bg-[#111113] border border-[#2e2e34] rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email Professionnel</label>
                <input 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-[#111113] border border-[#2e2e34] rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-all"
                />
              </div>
            </div>
          )}

          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3">
            <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={18} />
            <p className="text-[11px] text-amber-500/80 leading-relaxed uppercase font-bold tracking-tight">
              L'ancien représentant sera automatiquement rétrogradé au rôle de collaborateur. Le nouveau recevra un email d'activation.
            </p>
          </div>
        </div>

        <div className="p-8 border-t border-[#2e2e34] bg-[#111113] flex items-center justify-end gap-4">
          <button onClick={onClose} className="px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
            Annuler
          </button>
          {mode === 'create' && (
            <button 
              disabled={!formData.firstName || !formData.lastName || !formData.email || loading}
              onClick={() => handleConfirm(formData)}
              className="bg-primary hover:bg-primary/90 text-black px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <UserPlus size={16} />}
              Créer & Définir Référent
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
