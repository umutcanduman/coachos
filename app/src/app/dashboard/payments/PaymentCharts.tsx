"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface MonthlyRevenueChartProps {
  data: { month: string; revenue: number }[];
}

const PIE_COLORS = ["#4A7C68", "#5B9BD5", "#D4A843", "#9B72B0", "#E07B6C", "#6BBFA3"];

interface PackageChartProps {
  data: { name: string; value: number }[];
}

function CustomLegend({ data, total }: { data: { name: string; value: number; color: string }[]; total: number }) {
  return (
    <div className="flex flex-col gap-2.5 pl-2">
      {data.map((entry) => {
        const pct = total > 0 ? ((entry.value / total) * 100).toFixed(0) : "0";
        return (
          <div key={entry.name} className="flex items-start gap-2.5">
            <div
              className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <div>
              <div className="text-xs font-medium text-text">{entry.name}</div>
              <div className="text-[0.7rem] text-text-3">{pct}%</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MonthlyRevenueChart({ data }: MonthlyRevenueChartProps) {
  return (
    <div className="rounded-card border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <div className="text-sm font-medium text-text">Monthly Revenue</div>
          <div className="mt-0.5 text-xs text-text-3">Last 6 months</div>
        </div>
      </div>
      <div className="p-5">
        {data.length === 0 ? (
          <div className="flex h-[220px] items-center justify-center text-sm text-text-3">No revenue data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data}>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#B8B0A6" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#B8B0A6" }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                width={36}
              />
              <Tooltip
                contentStyle={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(0,0,0,0.09)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value) => [`\u20AC${Number(value).toLocaleString()}`, "Revenue"]}
              />
              <Bar dataKey="revenue" fill="#4A7C68" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export function RevenueByPackageChart({ data }: PackageChartProps) {
  const coloredData = data.map((d, i) => ({ ...d, color: PIE_COLORS[i % PIE_COLORS.length] }));
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="rounded-card border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <div className="text-sm font-medium text-text">Revenue by Package</div>
          <div className="mt-0.5 text-xs text-text-3">All time breakdown</div>
        </div>
      </div>
      <div className="flex items-center p-5">
        {data.length === 0 ? (
          <div className="flex h-[220px] w-full items-center justify-center text-sm text-text-3">No package data yet</div>
        ) : (
          <>
            <ResponsiveContainer width="50%" height={220}>
              <PieChart>
                <Pie
                  data={coloredData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="value"
                  stroke="none"
                >
                  {coloredData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#FFFFFF",
                    border: "1px solid rgba(0,0,0,0.09)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value) => [`\u20AC${Number(value).toLocaleString()}`, "Revenue"]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1">
              <CustomLegend data={coloredData} total={total} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
