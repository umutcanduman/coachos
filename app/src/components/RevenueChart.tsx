"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface RevenueChartProps {
  data: { month: string; revenue: number }[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="rounded-card border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <div className="text-sm font-medium text-text">Revenue</div>
          <div className="mt-0.5 text-xs text-text-3">Last 6 months</div>
        </div>
      </div>
      <div className="p-5">
        {data.length === 0 ? (
          <div className="flex h-[160px] items-center justify-center text-sm text-text-3">
            No revenue data yet
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
