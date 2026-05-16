import React, { useState } from "react";
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Clock, 
  UserPlus,
  Loader2,
  X,
  UserX,
  UserCheck,
  Edit2
} from "lucide-react";
import { Member, Organization } from "../../lib/types";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { auth, getIdToken } from "../../firebase";

interface CollaboratorSectionProps {
  members: Member[];
  organization: Organization;
}

export default function CollaboratorSection({ members, organization }: CollaboratorSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddLoading, setIsAddLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtered members
  const filteredMembers = members.filter(m => {
    const matchesSearch = `${m.firstName} ${m.lastName} ${m.email}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsAddLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const jobTitle = formData.get("jobTitle") as string;

    const emailDomain = email.split("@")[1];
    if (!organization.allowedEmailDomains.includes(emailDomain)) {
      setError(`L'email doit appartenir à l'un des domaines autorisés : ${organization.allowedEmailDomains.join(", ")}`);
      setIsAddLoading(false);
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Non authentifié");
      const idToken = await getIdToken(user);

      const response = await fetch("/api/dashboard/create-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          orgId: organization.id,
          memberData: { firstName, lastName, email, jobTitle }
        })
      });

      if (!response.ok) {
        const res = await response.json();
        throw new Error(res.error || "Erreur lors de l'ajout");
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAddLoading(false);
    }
  };

  const updateMemberStatus = async (memberId: string, status: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const idToken = await getIdToken(user);

      await fetch("/api/dashboard/update-member-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, orgId: organization.id, memberId, status })
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-[#1e1e22] border border-[#2e2e34] rounded-[32px] p-8 shadow-xl space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="text-primary" size={24} />
            Collaborateurs
          </h3>
          <p className="text-xs text-[#9a9a9f]">Gérez les accès de votre équipe</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-black px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
        >
          <UserPlus size={18} />
          Ajouter un collaborateur
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 size-4" />
          <input 
            type="text" 
            placeholder="Rechercher par nom, prénom ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#111113] border-none rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary transition-all"
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#111113] border-none rounded-xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-primary transition-all text-slate-400"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="suspended">Suspendus</option>
            <option value="blocked">Bloqués</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-y-3">
          <thead>
            <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              <th className="px-4 pb-2">Membre</th>
              <th className="px-4 pb-2">Fonction</th>
              <th className="px-4 pb-2">Statut</th>
              <th className="px-4 pb-2">Dernière activité</th>
              <th className="px-4 pb-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((member) => (
              <tr key={member.id} className="group bg-[#111113] hover:bg-[#151517] transition-colors rounded-2xl">
                <td className="px-4 py-4 rounded-l-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-sm">
                      {member.firstName[0]}{member.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{member.firstName} {member.lastName}</p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Mail size={10} /> {member.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm text-slate-300 font-medium">{member.jobTitle || "—"}</p>
                </td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                    member.status === 'active' ? 'bg-success/10 text-success' : 
                    member.status === 'suspended' ? 'bg-warning/10 text-warning' : 
                    'bg-error/10 text-error'
                  }`}>
                    {member.status === 'active' ? 'Actif' : member.status === 'suspended' ? 'Suspendu' : 'Bloqué'}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock size={12} />
                    {member.lastActivityAt ? formatDistanceToNow(member.lastActivityAt.toDate(), { addSuffix: true, locale: fr }) : "Jamais"}
                  </p>
                </td>
                <td className="px-4 py-4 rounded-r-2xl text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {member.id !== auth.currentUser?.uid && (
                      <>
                        {member.status === 'active' ? (
                          <button onClick={() => updateMemberStatus(member.id, 'suspended')} title="Suspendre" className="p-2 text-warning hover:bg-warning/10 rounded-lg">
                            <UserX size={18} />
                          </button>
                        ) : (
                          <button onClick={() => updateMemberStatus(member.id, 'active')} title="Réactiver" className="p-2 text-success hover:bg-success/10 rounded-lg">
                            <UserCheck size={18} />
                          </button>
                        )}
                        <button onClick={() => updateMemberStatus(member.id, 'blocked')} title="Bloquer" className="p-2 text-error hover:bg-error/10 rounded-lg">
                          <X size={18} />
                        </button>
                      </>
                    )}
                    <button className="p-2 text-slate-400 hover:bg-slate-800 rounded-lg">
                      <Edit2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredMembers.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-600 italic">Aucun collaborateur trouvé.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#1e1e22] border border-[#2e2e34] w-full max-w-xl rounded-[32px] p-10 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-black text-white">Ajouter un collaborateur</h3>
                <p className="text-slate-500 text-sm">Il recevra une invitation par email pour activer son compte.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {error && (
              <div className="bg-error/10 border border-error/20 p-4 rounded-xl text-error text-xs font-bold flex items-center gap-2">
                <X size={16} /> {error}
              </div>
            )}

            <form onSubmit={handleAddMember} className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Prénom</label>
                <input required name="firstName" className="w-full bg-[#111113] border-none rounded-xl py-4 px-4 text-white font-bold" placeholder="Jean" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Nom</label>
                <input required name="lastName" className="w-full bg-[#111113] border-none rounded-xl py-4 px-4 text-white font-bold" placeholder="Dupont" />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Email professionnel</label>
                <input required name="email" type="email" className="w-full bg-[#111113] border-none rounded-xl py-4 px-4 text-white font-bold" placeholder="jean.dupont@banque.fr" />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Fonction / Titre</label>
                <input name="jobTitle" className="w-full bg-[#111113] border-none rounded-xl py-4 px-4 text-white font-bold" placeholder="Conseiller clientèle" />
              </div>

              <div className="col-span-2 pt-4">
                <button 
                  type="submit" 
                  disabled={isAddLoading}
                  className="w-full bg-primary text-black py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                >
                  {isAddLoading ? <Loader2 className="animate-spin" /> : <><UserPlus size={20} /> Créer et envoyer l'invitation</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
