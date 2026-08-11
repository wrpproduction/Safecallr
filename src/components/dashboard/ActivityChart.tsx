import React, { useMemo } from "react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { AuthRequest } from "../../lib/types";

interface ActivityChartProps {
  authRequests?: AuthRequest[];
  timeRange?: "7d" | "30d";
}

function parseToDate(val: any): Date | null {
  if (!val) return null;
  if (typeof val.toDate === "function") return val.toDate();
  if (typeof val.seconds === "number") return new Date(val.seconds * 1000);
  if (val instanceof Date) return val;
  if (typeof val === "number") return new Date(val);
  if (typeof val === "string") {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

export default function ActivityChart({ authRequests = [], timeRange = "7d" }: ActivityChartProps) {
  const chartData = useMemo(() => {
    const now = new Date();
    const days: { dateStr: string; name: string; fullDate: string; success: number; fail: number }[] = [];

    const numDays = timeRange === "30d" ? 30 : 7;

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      
      let name = "";
      if (timeRange === "7d") {
        const dayName = d.toLocaleDateString("fr-FR", { weekday: "long" });
        name = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      } else {
        name = d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
      }

      days.push({
        dateStr,
        name,
        fullDate: d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
        success: 0,
        fail: 0
      });
    }

    if (authRequests && authRequests.length > 0) {
      authRequests.forEach(req => {
        const d = parseToDate(req.createdAt);
        if (!d) return;
        const reqDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const match = days.find(item => item.dateStr === reqDateStr);
        if (match) {
          const st = (req.status || "").toLowerCase();
          if (st === "failed" || st === "refused" || st === "rejected" || st === "expired") {
            match.fail += 1;
          } else if (st === "success" || st === "validated" || st === "verified" || st === "completed") {
            match.success += 1;
          }
        }
      });
    }

    return days;
  }, [authRequests, timeRange]);

  const totalInPeriod = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.success + curr.fail, 0);
  }, [chartData]);

  return (
    <div className="bg-[#1e1e22] border border-[#2e2e34] rounded-[32px] p-8 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-xl font-bold text-white">Graphique d'activité</h3>
          <p className="text-xs text-[#9a9a9f] mt-0.5">
            Volume d'authentifications sur les {timeRange === "30d" ? "30 derniers jours" : "7 derniers jours"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider px-3 py-1 bg-black/40 border border-[#2e2e34] text-slate-400 rounded-full">
            {totalInPeriod} événement{totalInPeriod > 1 ? "s" : ""} enregistré{totalInPeriod > 1 ? "s" : ""}
          </span>
        </div>
      </div>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorFail" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2e2e34" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#606067" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              dy={10}
              interval={timeRange === "30d" ? 4 : 0}
            />
            <YAxis 
              stroke="#606067" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              dx={-5}
              allowDecimals={false}
              domain={[0, (dataMax: number) => Math.max(dataMax + 2, 5)]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "#111113", 
                border: "1px solid #2e2e34", 
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: "bold"
              }}
              labelStyle={{ color: "#3dffa0", marginBottom: "4px" }}
              itemStyle={{ padding: "2px 0" }}
            />
            <Legend iconType="circle" />
            <Area 
              type="monotone" 
              dataKey="success" 
              name="Succès"
              stroke="#22c55e" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorSuccess)" 
            />
            <Area 
              type="monotone" 
              dataKey="fail" 
              name="Échecs"
              stroke="#ef4444" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorFail)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

