"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { month: "Oct", revenue: 2800 },
  { month: "Nov", revenue: 3200 },
  { month: "Dec", revenue: 2900 },
  { month: "Jan", revenue: 3600 },
  { month: "Feb", revenue: 3850 },
  { month: "Mar", revenue: 4320 },
];

export default function RevenueChart() {
  return (
    <div className="rounded-card border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <div className="text-sm font-medium text-text">Revenue</div>
          <div className="mt-0.5 text-xs text-text-3">Last 6 months</div>
        </div>
      </div>
      <div className="p-5">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data}>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#B8B0A6" }}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: "#FFFFFF",
                border: "1px solid rgba(0,0,0,0.09)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value) => [`€${Number(value).toLocaleString()}`, "Revenue"]}
            />
            <Bar dataKey="revenue" fill="#D5EBE1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
