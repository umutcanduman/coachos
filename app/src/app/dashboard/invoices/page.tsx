import { createClient } from "@/lib/supabase/server";
import Topbar from "@/components/Topbar";
import InvoicesView from "./InvoicesView";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (<><Topbar title="Invoices" /><div className="flex-1 p-4 lg:p-7"><div className="rounded-card border border-border bg-surface py-16 text-center text-sm text-text-3">Session expired.</div></div></>);
  }

  let coachId: string | null = null;
  try {
    const { data: coach } = await supabase.from("coaches").select("id").eq("user_id", user.id).single();
    coachId = coach?.id ?? null;
  } catch { /* ok */ }

  type InvoiceRow = { id: string; invoice_number: string; amount: number; issued_date: string; due_date: string | null; status: string; notes: string | null; created_at: string; clients: { id: string; name: string } | null };
  let invoices: InvoiceRow[] = [];
  let clients: { id: string; name: string }[] = [];
  let outstanding = 0;

  if (coachId) {
    try {
      const { data } = await supabase.from("invoices")
        .select("id, invoice_number, amount, issued_date, due_date, status, notes, created_at, clients(id, name)")
        .eq("coach_id", coachId).order("created_at", { ascending: false });
      invoices = (data ?? []).map((d) => ({
        ...d,
        clients: Array.isArray(d.clients) ? d.clients[0] ?? null : d.clients,
      })) as InvoiceRow[];
      outstanding = invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + Number(i.amount), 0);
    } catch { /* ok */ }

    try {
      const { data } = await supabase.from("clients").select("id, name").eq("coach_id", coachId).order("name");
      clients = data ?? [];
    } catch { /* ok */ }
  }

  return (
    <>
      <Topbar title="Invoices" subtitle={`${invoices.length} total · €${outstanding.toLocaleString()} outstanding`} />
      <div className="flex-1 p-4 lg:p-7">
        <InvoicesView invoices={invoices} clients={clients} />
      </div>
    </>
  );
}
