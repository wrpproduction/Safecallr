import React from "react";
import { 
  ShieldCheck, 
  Users, 
  AlertTriangle, 
  BarChart3,
  TrendingUp,
  TrendingDown
} from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  label: string;
  trend?: number;
  icon: React.ElementType;
  variant?: "default" | "warning" | "error" | "success";
}

function KPICard({ title, value, label, trend, icon: Icon, variant = "default" }: KPICardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "error": return "border-error/20 bg-error/5 text-error";
      case "warning": return "border-warning/20 bg-warning/5 text-warning";
      case "success": return "border-success/20 bg-success/5 text-success";
      default: return "border-[#2e2e34] bg-[#1e1e22] text-primary";
    }
  };

  return (
    <div className={`p-6 rounded-[24px] border ${getVariantStyles()} flex flex-col justify-between h-full shadow-lg transition-all hover:scale-[1.02]`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${variant === "default" ? "bg-primary/10" : "bg-current/10"}`}>
          <Icon size={24} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-bold ${trend >= 0 ? "text-success" : "text-error"}`}>
            {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-[#9a9a9f] mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-black text-white">{value}</h3>
          <p className="text-xs text-[#606067] font-medium">{label}</p>
        </div>
      </div>
    </div>
  );
}

interface KPIGridProps {
  stats: {
    authCount: number;
    authTrend: number;
    successRate: number;
    successTrend: number;
    activeMembers: number;
    totalMembers: number;
    failCount: number;
  };
}

export default function KPIGrid({ stats }: KPIGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <KPICard 
        title="Authentifications"
        value={stats.authCount}
        label="ces 7 derniers jours"
        trend={stats.authTrend}
        icon={ShieldCheck}
      />
      <KPICard 
        title="Taux de succès"
        value={`${stats.successRate}%`}
        label="moyenne période"
        trend={stats.successTrend}
        icon={BarChart3}
        variant={stats.successRate > 90 ? "success" : "default"}
      />
      <KPICard 
        title="Collaborateurs"
        value={`${stats.activeMembers} / ${stats.totalMembers}`}
        label="utilisateurs actifs"
        icon={Users}
      />
      <KPICard 
        title="Échecs"
        value={stats.failCount}
        label="blocages détectés"
        icon={AlertTriangle}
        variant={stats.failCount > 10 ? "error" : stats.failCount > 5 ? "warning" : "default"}
      />
    </div>
  );
}
