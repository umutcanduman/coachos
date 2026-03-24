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

const revenueData = [
  { month: "Oct", revenue: 4200 },
  { month: "Nov", revenue: 5100 },
  { month: "Dec", revenue: 4800 },
  { month: "Jan", revenue: 5600 },
  { month: "Feb", revenue: 6200 },
  { month: "Mar", revenue: 6850 },
];

const packageData = [
  { name: "Premium 12-Session", value: 14400, color: "#4A7C68" },
  { name: "Standard 8-Session", value: 8800, color: "#5B9BD5" },
  { name: "Intensive 6-Week", value: 7200, color: "#D4A843" },
  { name: "Single Sessions", value: 2450, color: "#9B72B0" },
];

const packageTotal = packageData.reduce((sum, p) => sum + p.value, 0);

function CustomLegend({ payload }: { payload?: Array<{ value: string; color: string }> }) {
  if (!payload) return null;
  return (
    <div className="flex flex-col gap-2.5 pl-2">
      {payload.map((entry, i) => {
        const pkg = packageData[i];
        const pct = ((pkg.value / packageTotal) * 100).toFixed(0);
        return (
          <div key={entry.value} className="flex items-start gap-2.5">
            <div
              className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <div>
              <div className="text-xs font-medium text-text">{entry.value}</div>
              <div className="text-[0.7rem] text-text-3">
                {pct}%
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MonthlyRevenueChart() {
  return (
    <div className="rounded-card border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <div className="text-sm font-medium text-text">Monthly Revenue</div>
          <div className="mt-0.5 text-xs text-text-3">Last 6 months</div>
        </div>
      </div>
      <div className="p-5">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={revenueData}>
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
      </div>
    </div>
  );
}

export function RevenueByPackageChart() {
  return (
    <div className="rounded-card border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <div className="text-sm font-medium text-text">Revenue by Package</div>
          <div className="mt-0.5 text-xs text-text-3">All time breakdown</div>
        </div>
      </div>
      <div className="flex items-center p-5">
        <ResponsiveContainer width="50%" height={220}>
          <PieChart>
            <Pie
              data={packageData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              dataKey="value"
              stroke="none"
            >
              {packageData.map((entry, index) => (
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
          <CustomLegend
            payload={packageData.map((p) => ({ value: p.name, color: p.color }))}
          />
        </div>
      </div>
    </div>
  );
}
