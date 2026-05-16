import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  PlusCircle, 
  Settings, 
  Palette, 
  RotateCcw, 
  ShieldOff, 
  ShieldCheck, 
  Trash2, 
  AlertTriangle,
  UserCheck
} from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  actorEmail: string;
  createdAt: any;
  details: any;
}

interface AuditLogTimelineProps {
  logs: AuditLog[];
}

const ACTION_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  'create_organization': { label: 'Organisation créée', icon: PlusCircle, color: 'text-green-500' },
  'update_legal': { label: 'Infos légales modifiées', icon: Settings, color: 'text-blue-500' },
  'update_visual': { label: 'Identité visuelle modifiée', icon: Palette, color: 'text-purple-500' },
  'change_representative': { label: 'Changement de référent', icon: UserCheck, color: 'text-amber-500' },
  'deactivate': { label: 'Organisation désactivée', icon: ShieldOff, color: 'text-red-500' },
  'reactivate': { label: 'Organisation réactivée', icon: ShieldCheck, color: 'text-green-500' },
  'delete': { label: 'Organisation supprimée', icon: Trash2, color: 'text-red-600' },
  'emergency_block_member': { label: 'Blocage membre urgence', icon: AlertTriangle, color: 'text-red-500' },
};

export default function AuditLogTimeline({ logs }: AuditLogTimelineProps) {
  return (
    <div className="space-y-6">
      {logs.map((log, idx) => {
        const config = ACTION_CONFIG[log.action] || { label: log.action, icon: RotateCcw, color: 'text-slate-500' };
        const Icon = config.icon;

        return (
          <div key={log.id} className="relative pl-8">
            {/* Thread line */}
            {idx < logs.length - 1 && (
              <div className="absolute left-3.5 top-8 bottom-[-24px] w-0.5 bg-[#2e2e34]" />
            )}
            
            {/* Icon circle */}
            <div className={`absolute left-0 top-0 w-8 h-8 rounded-full bg-[#111113] border border-[#2e2e34] flex items-center justify-center ${config.color}`}>
              <Icon size={14} />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-white font-bold text-sm">{config.label}</p>
                <span className="text-[10px] text-slate-500">
                  {log.createdAt?.toDate ? format(log.createdAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: fr }) : 'Maintenant'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Par <span className="text-slate-300 font-mono italic">{log.actorEmail}</span>
              </p>
              
              {log.details && (
                <div className="mt-3 p-3 bg-[#111113] rounded-xl border border-[#2e2e34] overflow-hidden">
                  <pre className="text-[10px] font-mono text-slate-400 overflow-x-auto">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        );
      })}
      {logs.length === 0 && (
        <div className="text-center py-8 text-slate-500 italic text-sm">
          Aucun événement dans le journal d'audit.
        </div>
      )}
    </div>
  );
}
