import { createClient } from "@/lib/supabase/server";
import Topbar from "@/components/Topbar";
import StatCard from "@/components/StatCard";
import { MonthlyRevenueChart, RevenueByPackageChart } from "./PaymentCharts";
import PaymentFilters from "./PaymentFilters";

export const dynamic = "force-dynamic";

/* ── static fallback data ── */
const monthlyAnalysis = [
  { month: "Oct 2025", revenue: 4200, sessions: 28, newClients: 3, avgSession: 150, mom: null as number | null },
  { month: "Nov 2025", revenue: 5100, sessions: 32, newClients: 4, avgSession: 159, mom: 21.4 },
  { month: "Dec 2025", revenue: 4800, sessions: 30, newClients: 2, avgSession: 160, mom: -5.9 },
  { month: "Jan 2026", revenue: 5600, sessions: 35, newClients: 5, avgSession: 160, mom: 16.7 },
  { month: "Feb 2026", revenue: 6200, sessions: 38, newClients: 4, avgSession: 163, mom: 10.7 },
  { month: "Mar 2026", revenue: 6850, sessions: 42, newClients: 6, avgSession: 163, mom: 10.5 },
];

const transactions = [
  { id: "1", client: "Sarah Chen", pkg: "Premium 12-Session", date: "2026-03-20", amount: 1200, type: "Package", status: "paid" },
  { id: "2", client: "Marcus Rivera", pkg: "Standard 8-Session", date: "2026-03-18", amount: 800, type: "Package", status: "paid" },
  { id: "3", client: "Elena Vogt", pkg: "Intensive 6-Week", date: "2026-03-15", amount: 1800, type: "Package", status: "pending" },
  { id: "4", client: "James Okafor", pkg: "Single Session", date: "2026-03-12", amount: 150, type: "Session", status: "paid" },
  { id: "5", client: "Anya Petrova", pkg: "Premium 12-Session", date: "2026-03-10", amount: 1200, type: "Package", status: "overdue" },
  { id: "6", client: "David Kim", pkg: "Standard 8-Session", date: "2026-03-08", amount: 800, type: "Package", status: "paid" },
  { id: "7", client: "Lisa Moreau", pkg: "Single Session", date: "2026-03-05", amount: 150, type: "Session", status: "pending" },
  { id: "8", client: "Thomas Braun", pkg: "Intensive 6-Week", date: "2026-03-01", amount: 1800, type: "Package", status: "paid" },
];

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <>
        <Topbar title="Payments" />
        <div className="flex-1 p-7">
          <div className="rounded-card border border-border bg-surface py-16 text-center text-sm text-text-3">
            Session expired. Please refresh.
          </div>
        </div>
      </>
    );
  }

  let coachId: string | null = null;
  try {
    const { data: coach } = await supabase
      .from("coaches")
      .select("id")
      .eq("user_id", user.id)
      .single();
    coachId = coach?.id ?? null;
  } catch { /* coaches table may not exist */ }

  /* ── Fetch payments data ── */
  let allPayments: { id: string; amount: number; status: string; due_date: string | null; paid_date: string | null; description: string | null; client_id: string }[] = [];

  if (coachId) {
    try {
      const { data } = await supabase
        .from("payments")
        .select("id, amount, status, due_date, paid_date, description, client_id")
        .eq("coach_id", coachId)
        .order("created_at", { ascending: false });
      allPayments = data ?? [];
    } catch { /* payments table may not exist */ }
  }

  const paidTotal = allPayments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const revenueYTD = allPayments
    .filter(
      (p) =>
        p.status === "paid" &&
        p.paid_date &&
        new Date(p.paid_date).getFullYear() === currentYear
    )
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const revenueMonth = allPayments
    .filter(
      (p) =>
        p.status === "paid" &&
        p.paid_date &&
        new Date(p.paid_date).getFullYear() === currentYear &&
        new Date(p.paid_date).getMonth() === currentMonth
    )
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const outstanding = allPayments
    .filter((p) => p.status === "pending" || p.status === "overdue")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const paidCount = allPayments.filter((p) => p.status === "paid").length;
  const totalCount = allPayments.length;
  const collectionRate = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 100;
  const avgPackage = paidCount > 0 ? Math.round(paidTotal / paidCount) : 0;

  /* ── Use static data if DB is empty ── */
  const hasData = allPayments.length > 0;
  const displayRevenueYTD = hasData ? revenueYTD : 32850;
  const displayRevenueMonth = hasData ? revenueMonth : 6850;
  const displayOutstanding = hasData ? outstanding : 3150;
  const displayAvgPackage = hasData ? avgPackage : 985;
  const displayCollectionRate = hasData ? collectionRate : 91;

  const filter = searchParams.filter ?? "all";

  const filteredTransactions =
    filter === "all"
      ? transactions
      : transactions.filter((t) => t.status === filter);

  const currentMonthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const bestMonth = monthlyAnalysis.reduce((best, m) =>
    m.revenue > best.revenue ? m : best
  );
  const recentMonths = monthlyAnalysis.slice(-3);
  const avgGrowth =
    recentMonths.filter((m) => m.mom !== null).reduce((sum, m) => sum + (m.mom ?? 0), 0) /
    recentMonths.filter((m) => m.mom !== null).length;
  const q2Projected = Math.round(
    monthlyAnalysis[monthlyAnalysis.length - 1].revenue * 3 * (1 + avgGrowth / 100)
  );

  return (
    <>
      <Topbar title="Payments" subtitle={`Financial overview · ${currentMonthLabel}`} />
      <div className="flex-1 p-7">
        {/* ── KPI stat cards ── */}
        <div className="mb-6 grid grid-cols-5 gap-4">
          <StatCard label="Revenue YTD" value={`€${displayRevenueYTD.toLocaleString()}`} delta={`${currentYear} total`} deltaType="up" />
          <StatCard label="Revenue (Mar)" value={`€${displayRevenueMonth.toLocaleString()}`} delta="+10.5% vs last month" deltaType="up" />
          <StatCard label="Outstanding" value={`€${displayOutstanding.toLocaleString()}`} delta={displayOutstanding > 0 ? "Requires follow-up" : "All clear"} deltaType={displayOutstanding > 0 ? "down" : "neutral"} />
          <StatCard label="Avg Package" value={`€${displayAvgPackage.toLocaleString()}`} delta="Per transaction" deltaType="neutral" />
          <StatCard label="Collection Rate" value={`${displayCollectionRate}%`} delta={displayCollectionRate >= 90 ? "Healthy" : "Needs attention"} deltaType={displayCollectionRate >= 90 ? "up" : "down"} />
        </div>

        {/* ── Charts ── */}
        <div className="mb-6 grid grid-cols-2 gap-5">
          <MonthlyRevenueChart />
          <RevenueByPackageChart />
        </div>

        {/* ── Monthly Analysis + Insights ── */}
        <div className="mb-6 grid grid-cols-[1fr_320px] gap-5">
          {/* Monthly Analysis Table */}
          <div className="overflow-hidden rounded-card border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <div className="text-sm font-medium text-text">Monthly Analysis</div>
                <div className="mt-0.5 text-xs text-text-3">Revenue and session trends</div>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr] items-center gap-4 px-5 py-2.5 text-[0.7rem] font-medium uppercase tracking-[0.1em] text-text-3">
                <div>Month</div>
                <div className="text-right">Revenue</div>
                <div className="text-right">Sessions</div>
                <div className="text-right">New Clients</div>
                <div className="text-right">Avg/Session</div>
                <div className="text-right">MoM</div>
              </div>
              {monthlyAnalysis.map((row, i) => {
                const isCurrent = i === monthlyAnalysis.length - 1;
                return (
                  <div
                    key={row.month}
                    className={`grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr] items-center gap-4 border-b border-border px-5 py-3.5 last:border-b-0 ${
                      isCurrent ? "bg-accent-lt" : ""
                    }`}
                  >
                    <div className="text-sm font-medium text-text">
                      {row.month}
                      {isCurrent && (
                        <span className="ml-2 inline-flex rounded-full bg-accent-dim px-2 py-0.5 text-[0.65rem] font-medium text-accent">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-right text-[0.8125rem] text-text">€{row.revenue.toLocaleString()}</div>
                    <div className="text-right text-[0.8125rem] text-text-2">{row.sessions}</div>
                    <div className="text-right text-[0.8125rem] text-text-2">{row.newClients}</div>
                    <div className="text-right text-[0.8125rem] text-text-2">€{row.avgSession}</div>
                    <div className="text-right text-[0.8125rem]">
                      {row.mom === null ? (
                        <span className="text-text-3">&mdash;</span>
                      ) : row.mom > 0 ? (
                        <span className="text-accent">+{row.mom}%</span>
                      ) : (
                        <span className="text-c-red">{row.mom}%</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key Insights */}
          <div className="flex flex-col gap-4">
            <div className="rounded-card border border-border bg-accent-lt p-5">
              <div className="mb-1 text-xs font-medium uppercase tracking-[0.08em] text-accent">Best Month</div>
              <div className="mb-1 font-serif text-[1.375rem] leading-none text-text">{bestMonth.month}</div>
              <div className="text-xs text-text-2">€{bestMonth.revenue.toLocaleString()} revenue · {bestMonth.sessions} sessions</div>
            </div>
            <div className="rounded-card border border-border bg-c-blue-dim p-5">
              <div className="mb-1 text-xs font-medium uppercase tracking-[0.08em] text-c-blue">Growth Rate</div>
              <div className="mb-1 font-serif text-[1.375rem] leading-none text-text">+{avgGrowth.toFixed(1)}%</div>
              <div className="text-xs text-text-2">Average MoM over last 3 months</div>
            </div>
            <div className="rounded-card border border-border bg-c-amber-dim p-5">
              <div className="mb-1 text-xs font-medium uppercase tracking-[0.08em] text-c-amber">Q2 Projected</div>
              <div className="mb-1 font-serif text-[1.375rem] leading-none text-text">€{q2Projected.toLocaleString()}</div>
              <div className="text-xs text-text-2">Based on current growth trend</div>
            </div>
            <div className="rounded-card border border-border bg-surface p-5">
              <div className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-c-red">Overdue Payment</div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-c-red-dim text-xs font-semibold text-c-red">AP</div>
                <div>
                  <div className="text-sm font-medium text-text">Anya Petrova</div>
                  <div className="text-xs text-text-3">Premium 12-Session · €1,200</div>
                </div>
              </div>
              <div className="mt-3">
                <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3.5 py-1.5 text-[0.75rem] font-medium text-text-2 transition-all hover:bg-surface-3">
                  Send Reminder
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── All Transactions ── */}
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <div className="text-sm font-medium text-text">All Transactions</div>
              <div className="mt-0.5 text-xs text-text-3">{transactions.length} total transactions</div>
            </div>
          </div>
          <div className="border-b border-border px-5 py-3">
            <PaymentFilters activeFilter={filter} />
          </div>
          <div className="flex flex-col">
            <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_90px] items-center gap-4 px-5 py-2.5 text-[0.7rem] font-medium uppercase tracking-[0.1em] text-text-3">
              <div>Client &amp; Package</div>
              <div>Date</div>
              <div className="text-right">Amount</div>
              <div>Type</div>
              <div>Status</div>
              <div>Action</div>
            </div>
            {filteredTransactions.length === 0 ? (
              <div className="py-16 text-center text-sm text-text-3">
                <div className="mb-3 text-2xl opacity-40">◎</div>
                No transactions found
              </div>
            ) : (
              filteredTransactions.map((tx) => {
                const initials = tx.client.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                const statusStyles: Record<string, string> = {
                  paid: "bg-accent-lt text-accent",
                  pending: "bg-c-amber-dim text-c-amber",
                  overdue: "bg-c-red-dim text-c-red",
                };
                const typeStyles: Record<string, string> = {
                  Package: "bg-c-blue-dim text-c-blue",
                  Session: "bg-c-purple-dim text-c-purple",
                };

                return (
                  <div
                    key={tx.id}
                    className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_90px] items-center gap-4 border-b border-border px-5 py-3.5 transition-colors last:border-b-0 hover:bg-surface-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full bg-accent-dim text-xs font-semibold text-accent">{initials}</div>
                      <div>
                        <div className="text-sm font-medium text-text">{tx.client}</div>
                        <div className="text-xs text-text-3">{tx.pkg}</div>
                      </div>
                    </div>
                    <div className="text-[0.8125rem] text-text-2">
                      {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                    <div className="text-right text-[0.8125rem] font-medium text-text">€{tx.amount.toLocaleString()}</div>
                    <div>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.7rem] font-medium ${typeStyles[tx.type] ?? "bg-surface-3 text-text-3"}`}>
                        {tx.type}
                      </span>
                    </div>
                    <div>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.7rem] font-medium capitalize ${statusStyles[tx.status] ?? "bg-surface-3 text-text-3"}`}>
                        {tx.status}
                      </span>
                    </div>
                    <div>
                      {tx.status === "paid" ? (
                        <span className="text-xs text-text-3">Receipt</span>
                      ) : (
                        <button className="text-xs font-medium text-accent hover:underline">Remind</button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
