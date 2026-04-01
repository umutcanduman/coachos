import { createClient } from "@/lib/supabase/server";
import Topbar from "@/components/Topbar";
import StatCard from "@/components/StatCard";
import { MonthlyRevenueChart, RevenueByPackageChart } from "./PaymentCharts";
import PaymentFilters from "./PaymentFilters";
import { ReminderButton } from "./PaymentActions";

export const dynamic = "force-dynamic";

type PaymentRow = {
  id: string;
  amount: number;
  status: string;
  due_date: string | null;
  paid_date: string | null;
  description: string | null;
  client_id: string;
  created_at: string;
  clients: { name: string; package_type: string | null } | null;
};

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

  /* ── Fetch payments with client data ── */
  let allPayments: PaymentRow[] = [];

  if (coachId) {
    try {
      const { data } = await supabase
        .from("payments")
        .select("id, amount, status, due_date, paid_date, description, client_id, created_at, clients(name, package_type)")
        .eq("coach_id", coachId)
        .order("created_at", { ascending: false });
      allPayments = (data ?? []) as unknown as PaymentRow[];
    } catch { /* payments table may not exist */ }
  }

  /* ── KPI calculations ── */
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const paidPayments = allPayments.filter((p) => p.status === "paid");
  const paidTotal = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  const revenueYTD = paidPayments
    .filter((p) => p.paid_date && new Date(p.paid_date).getFullYear() === currentYear)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const revenueMonth = paidPayments
    .filter(
      (p) =>
        p.paid_date &&
        new Date(p.paid_date).getFullYear() === currentYear &&
        new Date(p.paid_date).getMonth() === currentMonth
    )
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const outstanding = allPayments
    .filter((p) => p.status === "pending" || p.status === "overdue")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const paidCount = paidPayments.length;
  const totalCount = allPayments.length;
  const collectionRate = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 100;
  const avgPackage = paidCount > 0 ? Math.round(paidTotal / paidCount) : 0;

  /* ── Monthly revenue chart data (last 6 months) ── */
  const monthlyChartData: { month: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const label = d.toLocaleDateString("en-US", { month: "short" });
    const yr = d.getFullYear();
    const mo = d.getMonth();
    const rev = paidPayments
      .filter((p) => {
        if (!p.paid_date) return false;
        const pd = new Date(p.paid_date);
        return pd.getFullYear() === yr && pd.getMonth() === mo;
      })
      .reduce((sum, p) => sum + Number(p.amount), 0);
    monthlyChartData.push({ month: label, revenue: rev });
  }

  /* ── Monthly analysis table data ── */
  type MonthRow = { month: string; revenue: number; sessions: number; mom: number | null };
  const monthlyAnalysis: MonthRow[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    const yr = d.getFullYear();
    const mo = d.getMonth();
    const rev = paidPayments
      .filter((p) => {
        if (!p.paid_date) return false;
        const pd = new Date(p.paid_date);
        return pd.getFullYear() === yr && pd.getMonth() === mo;
      })
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const txCount = allPayments.filter((p) => {
      const cd = new Date(p.created_at);
      return cd.getFullYear() === yr && cd.getMonth() === mo;
    }).length;
    monthlyAnalysis.push({ month: label, revenue: rev, sessions: txCount, mom: null });
  }
  // Compute MoM growth
  for (let i = 1; i < monthlyAnalysis.length; i++) {
    const prev = monthlyAnalysis[i - 1].revenue;
    const curr = monthlyAnalysis[i].revenue;
    monthlyAnalysis[i].mom = prev > 0 ? Math.round(((curr - prev) / prev) * 1000) / 10 : null;
  }

  /* ── Revenue by package (donut chart) ── */
  const packageMap = new Map<string, number>();
  for (const p of paidPayments) {
    const pkgName = (p.clients as { name: string; package_type: string | null } | null)?.package_type ?? "Other";
    packageMap.set(pkgName, (packageMap.get(pkgName) ?? 0) + Number(p.amount));
  }
  const packageChartData = Array.from(packageMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  /* ── Insights ── */
  const bestMonth = monthlyAnalysis.reduce((best, m) =>
    m.revenue > best.revenue ? m : best
  );
  const recentWithMom = monthlyAnalysis.slice(-3).filter((m) => m.mom !== null);
  const avgGrowth = recentWithMom.length > 0
    ? recentWithMom.reduce((sum, m) => sum + (m.mom ?? 0), 0) / recentWithMom.length
    : 0;
  const lastMonthRev = monthlyAnalysis[monthlyAnalysis.length - 1]?.revenue ?? 0;
  const q2Projected = lastMonthRev > 0
    ? Math.round(lastMonthRev * 3 * (1 + avgGrowth / 100))
    : 0;

  /* ── Overdue payments for sidebar ── */
  const overduePayments = allPayments
    .filter((p) => p.status === "overdue")
    .slice(0, 3);

  /* ── Filter transactions ── */
  const filter = searchParams.filter ?? "all";
  const filteredPayments = filter === "all"
    ? allPayments
    : allPayments.filter((p) => p.status === filter);

  const currentMonthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <>
      <Topbar title="Payments" subtitle={`Financial overview · ${currentMonthLabel}`} />
      <div className="flex-1 p-7">
        {/* ── KPI stat cards ── */}
        <div className="mb-6 grid grid-cols-5 gap-4">
          <StatCard label="Revenue YTD" value={`€${revenueYTD.toLocaleString()}`} delta={`${currentYear} total`} deltaType="up" />
          <StatCard label={`Revenue (${now.toLocaleDateString("en-US", { month: "short" })})`} value={`€${revenueMonth.toLocaleString()}`} delta="This month" deltaType="up" />
          <StatCard label="Outstanding" value={`€${outstanding.toLocaleString()}`} delta={outstanding > 0 ? "Requires follow-up" : "All clear"} deltaType={outstanding > 0 ? "down" : "neutral"} />
          <StatCard label="Avg Package" value={`€${avgPackage.toLocaleString()}`} delta="Per transaction" deltaType="neutral" />
          <StatCard label="Collection Rate" value={`${collectionRate}%`} delta={collectionRate >= 90 ? "Healthy" : "Needs attention"} deltaType={collectionRate >= 90 ? "up" : "down"} />
        </div>

        {/* ── Charts ── */}
        <div className="mb-6 grid grid-cols-2 gap-5">
          <MonthlyRevenueChart data={monthlyChartData} />
          <RevenueByPackageChart data={packageChartData} />
        </div>

        {/* ── Monthly Analysis + Insights ── */}
        <div className="mb-6 grid grid-cols-[1fr_320px] gap-5">
          {/* Monthly Analysis Table */}
          <div className="overflow-hidden rounded-card border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <div className="text-sm font-medium text-text">Monthly Analysis</div>
                <div className="mt-0.5 text-xs text-text-3">Revenue and transaction trends</div>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] items-center gap-4 px-5 py-2.5 text-[0.7rem] font-medium uppercase tracking-[0.1em] text-text-3">
                <div>Month</div>
                <div className="text-right">Revenue</div>
                <div className="text-right">Transactions</div>
                <div className="text-right">MoM</div>
              </div>
              {monthlyAnalysis.length === 0 ? (
                <div className="py-12 text-center text-sm text-text-3">No data yet</div>
              ) : (
                monthlyAnalysis.map((row, i) => {
                  const isCurrent = i === monthlyAnalysis.length - 1;
                  return (
                    <div
                      key={row.month}
                      className={`grid grid-cols-[1.5fr_1fr_1fr_1fr] items-center gap-4 border-b border-border px-5 py-3.5 last:border-b-0 ${
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
                })
              )}
            </div>
          </div>

          {/* Key Insights */}
          <div className="flex flex-col gap-4">
            <div className="rounded-card border border-border bg-accent-lt p-5">
              <div className="mb-1 text-xs font-medium uppercase tracking-[0.08em] text-accent">Best Month</div>
              <div className="mb-1 font-serif text-[1.375rem] leading-none text-text">{bestMonth.month}</div>
              <div className="text-xs text-text-2">€{bestMonth.revenue.toLocaleString()} revenue</div>
            </div>
            <div className="rounded-card border border-border bg-c-blue-dim p-5">
              <div className="mb-1 text-xs font-medium uppercase tracking-[0.08em] text-c-blue">Growth Rate</div>
              <div className="mb-1 font-serif text-[1.375rem] leading-none text-text">{avgGrowth > 0 ? "+" : ""}{avgGrowth.toFixed(1)}%</div>
              <div className="text-xs text-text-2">Average MoM over last 3 months</div>
            </div>
            <div className="rounded-card border border-border bg-c-amber-dim p-5">
              <div className="mb-1 text-xs font-medium uppercase tracking-[0.08em] text-c-amber">Q2 Projected</div>
              <div className="mb-1 font-serif text-[1.375rem] leading-none text-text">€{q2Projected.toLocaleString()}</div>
              <div className="text-xs text-text-2">Based on current growth trend</div>
            </div>
            {overduePayments.length > 0 && (
              <div className="rounded-card border border-border bg-surface p-5">
                <div className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-c-red">
                  Overdue {overduePayments.length > 1 ? `(${overduePayments.length})` : ""}
                </div>
                {overduePayments.map((op) => {
                  const clientName = (op.clients as { name: string } | null)?.name ?? "Client";
                  const initials = clientName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                  return (
                    <div key={op.id} className="mb-2 flex items-center gap-3 last:mb-0">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-c-red-dim text-xs font-semibold text-c-red">{initials}</div>
                      <div>
                        <div className="text-sm font-medium text-text">{clientName}</div>
                        <div className="text-xs text-text-3">€{Number(op.amount).toLocaleString()}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── All Transactions ── */}
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <div className="text-sm font-medium text-text">All Transactions</div>
              <div className="mt-0.5 text-xs text-text-3">{allPayments.length} total transactions</div>
            </div>
          </div>
          <div className="border-b border-border px-5 py-3">
            <PaymentFilters activeFilter={filter} />
          </div>
          <div className="flex flex-col">
            <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_90px] items-center gap-4 px-5 py-2.5 text-[0.7rem] font-medium uppercase tracking-[0.1em] text-text-3">
              <div>Client &amp; Package</div>
              <div>Date</div>
              <div className="text-right">Amount</div>
              <div>Status</div>
              <div>Action</div>
            </div>
            {filteredPayments.length === 0 ? (
              <div className="py-16 text-center text-sm text-text-3">
                <div className="mb-3 text-2xl opacity-40">◎</div>
                No transactions found
              </div>
            ) : (
              filteredPayments.map((tx) => {
                const clientData = tx.clients as { name: string; package_type: string | null } | null;
                const clientName = clientData?.name ?? "Client";
                const pkgType = clientData?.package_type ?? tx.description ?? "Payment";
                const initials = clientName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                const displayDate = tx.paid_date ?? tx.due_date ?? tx.created_at;
                const statusStyles: Record<string, string> = {
                  paid: "bg-accent-lt text-accent",
                  pending: "bg-c-amber-dim text-c-amber",
                  overdue: "bg-c-red-dim text-c-red",
                  refunded: "bg-surface-3 text-text-3",
                };

                return (
                  <div
                    key={tx.id}
                    className="grid grid-cols-[2fr_1.2fr_1fr_1fr_90px] items-center gap-4 border-b border-border px-5 py-3.5 transition-colors last:border-b-0 hover:bg-surface-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full bg-accent-dim text-xs font-semibold text-accent">{initials}</div>
                      <div>
                        <div className="text-sm font-medium text-text">{clientName}</div>
                        <div className="text-xs text-text-3">{pkgType}</div>
                      </div>
                    </div>
                    <div className="text-[0.8125rem] text-text-2">
                      {new Date(displayDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                    <div className="text-right text-[0.8125rem] font-medium text-text">€{Number(tx.amount).toLocaleString()}</div>
                    <div>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.7rem] font-medium capitalize ${statusStyles[tx.status] ?? "bg-surface-3 text-text-3"}`}>
                        {tx.status}
                      </span>
                    </div>
                    <div>
                      {tx.status === "paid" ? (
                        <span className="text-xs text-text-3">Receipt</span>
                      ) : (
                        <ReminderButton clientName={clientName} />
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
