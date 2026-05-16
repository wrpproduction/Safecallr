import React, { useState } from "react";
import { 
  ShieldCheck, 
  Download, 
  Search, 
  ChevronRight,
  ShieldAlert,
  Loader2,
  Calendar
} from "lucide-react";
import { AuthRequest, Organization } from "../../lib/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { auth, getIdToken } from "../../firebase";

interface AuthHistorySectionProps {
  authRequests: AuthRequest[];
  organization: Organization;
}

export default function AuthHistorySection({ authRequests, organization }: AuthHistorySectionProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      const idToken = await getIdToken(user);
      
      const response = await fetch(`/api/dashboard/export-auth-requests/${organization.id}`, {
        headers: { "Authorization": `Bearer ${idToken}` }
      });
      
      if (!response.ok) throw new Error("Erreur export");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `safecallr-export-${organization.name}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "success": return { color: "text-success bg-success/10", label: "Validé", icon: ShieldCheck };
      case "failed": return { color: "text-error bg-error/10", label: "Échec", icon: ShieldAlert };
      case "expired": return { color: "text-warning bg-warning/10", label: "Expiré", icon: ShieldAlert };
      default: return { color: "text-blue-400 bg-blue-400/10", label: "En cours", icon: Loader2 };
    }
  };

  const maskPhone = (phone: string) => {
    return phone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 ** ** ** $5");
  };

  return (
    <div className="bg-[#1e1e22] border border-[#2e2e34] rounded-[32px] p-8 shadow-xl space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="text-[#60a5fa]" size={24} />
            Dernières authentifications
          </h3>
          <p className="text-xs text-[#9a9a9f]">Journal complet des interventions</p>
        </div>
        <button 
          onClick={handleExport}
          disabled={isExporting}
          className="bg-[#111113] border border-[#2e2e34] text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-3 hover:border-primary transition-all active:scale-95 disabled:opacity-50"
        >
          {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
          Exporter CSV
        </button>
      </div>

      <div className="space-y-3">
        {authRequests.map((req) => {
          const status = getStatusInfo(req.status);
          const Icon = status.icon;
          
          return (
            <div key={req.id} className="flex items-center justify-between p-4 bg-[#111113] border border-[#2e2e34] rounded-2xl hover:border-primary/30 transition-colors group">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${status.color}`}>
                  <Icon size={20} className={req.status === 'pending' ? 'animate-spin' : ''} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white">{maskPhone(req.clientPhone)}</p>
                    <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-widest ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1"><User size={10} /> {req.memberName}</span>
                    <span className="flex items-center gap-1"><Calendar size={10} /> {format(req.createdAt.toDate(), "dd MMM, HH:mm", { locale: fr })}</span>
                    <span>IP: {req.ipAddress}</span>
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-700 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          );
        })}
        {authRequests.length === 0 && (
          <div className="py-10 text-center text-slate-600 italic">Aucune authentification récente.</div>
        )}
      </div>

      {authRequests.length >= 20 && (
        <div className="pt-4 text-center">
          <button className="text-primary font-bold text-sm hover:underline">Voir plus de résultats</button>
        </div>
      )}
    </div>
  );
}

// Fixed import for History and User which were missing
import { History, User } from "lucide-react";
