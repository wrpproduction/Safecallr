import React from "react";
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

const data = [
  { name: "Lundi", success: 45, fail: 2 },
  { name: "Mardi", success: 52, fail: 5 },
  { name: "Mercredi", success: 48, fail: 3 },
  { name: "Jeudi", success: 61, fail: 1 },
  { name: "Vendredi", success: 55, fail: 8 },
  { name: "Samedi", success: 32, fail: 2 },
  { name: "Dimanche", success: 28, fail: 0 },
];

export default function ActivityChart() {
  return (
    <div className="bg-[#1e1e22] border border-[#2e2e34] rounded-[32px] p-8 shadow-xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-white">Graphique d'activité</h3>
          <p className="text-xs text-[#9a9a9f]">Volume d'authentifications sur la période</p>
        </div>
      </div>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
            />
            <YAxis 
              stroke="#606067" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              dx={-5}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "#1e1e22", 
                border: "1px solid #2e2e34", 
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: "bold"
              }}
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
