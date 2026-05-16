import React from "react";
import { Link } from "react-router-dom";
import { MoreHorizontal, Building2, ExternalLink, ShieldCheck, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface OrganizationsTableProps {
  organizations: any[];
  onAction?: (action: string, org: any) => void;
}

export default function OrganizationsTable({ organizations, onAction }: OrganizationsTableProps) {
  return (
    <div className="bg-[#1e1e22] border border-[#2e2e34] rounded-2xl overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#161618] border-b border-[#2e2e34]">
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Organisation</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">SIRET</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Statut</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Création</th>
            <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2e2e34]">
          {organizations.map((org) => (
            <tr key={org.id} className="hover:bg-[#111113] transition-colors group">
              <td className="px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#111113] border border-[#2e2e34] p-1.5 flex items-center justify-center shrink-0">
                    <img src={org.logoUrl} alt="" className="max-w-full max-h-full object-contain" />
                  </div>
                  <div>
                    <Link to={`/admin/organizations/${org.id}`} className="text-white font-bold hover:text-primary transition-colors block">
                      {org.name}
                    </Link>
                    <p className="text-xs text-slate-500">Représentant ID: {org.representativeUserId?.substring(0, 8)}...</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm font-mono text-slate-400">
                {org.siret}
              </td>
              <td className="px-6 py-4">
                {org.active ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-black uppercase rounded">
                    <ShieldCheck size={12} /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 text-red-500 text-[10px] font-black uppercase rounded">
                    <ShieldAlert size={12} /> Désactivée
                  </span>
                )}
              </td>
              <td className="px-6 py-4 text-sm text-slate-500">
                {org.createdAt?.toDate ? format(org.createdAt.toDate(), 'dd/MM/yy', { locale: fr }) : 'N/A'}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link 
                    to={`/admin/organizations/${org.id}`}
                    className="p-2 text-slate-500 hover:text-white transition-colors"
                    title="Voir le détail"
                  >
                    <ExternalLink size={18} />
                  </Link>
                  <button 
                    onClick={() => onAction?.('toggleStatus', org)}
                    className={`p-2 transition-colors ${org.active ? 'text-red-500 hover:text-red-400' : 'text-green-500 hover:text-green-400'}`}
                    title={org.active ? "Désactiver" : "Réactiver"}
                  >
                    {org.active ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {organizations.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-20 text-center text-slate-500 italic">
                Aucune organisation trouvée.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
