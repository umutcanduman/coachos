import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import { isModuleEnabled } from "@/lib/modules";
import AgreementActions from "./AgreementActions";

export const dynamic = "force-dynamic";

type Agreement = {
  id: string;
  title: string;
  content: string | null;
  key_terms: {
    start_date?: string;
    end_date?: string;
    session_count?: string;
    cancellation_policy?: string;
    payment_terms?: string;
  };
  status: string;
  signed_at: string | null;
  expires_at: string | null;
  created_at: string;
  client_id: string;
  clients: { name: string; email: string }[] | { name: string; email: string } | null;
};

export default async function AgreementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <>
        <Topbar title="Agreements" />
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
  } catch { /* */ }

  if (!coachId) redirect("/dashboard");

  // Check if module is enabled
  const enabled = await isModuleEnabled(coachId, "agreements");
  if (!enabled) {
    return (
      <>
        <Topbar title="Agreements" />
        <div className="flex-1 p-7">
          <div className="rounded-card border border-border bg-surface py-16 text-center">
            <div className="mb-3 text-2xl opacity-40">📄</div>
            <p className="mb-2 text-sm font-medium text-text">Agreements module is not enabled</p>
            <p className="mb-4 text-xs text-text-3">
              Enable it in{" "}
              <Link href="/dashboard/pro-tools" className="text-accent hover:underline">
                Pro Tools
              </Link>{" "}
              to start managing coaching agreements.
            </p>
          </div>
        </div>
      </>
    );
  }

  // Fetch agreements with client names
  let agreements: Agreement[] = [];
  try {
    const { data } = await supabase
      .from("agreements")
      .select("id, title, content, key_terms, status, signed_at, expires_at, created_at, client_id, clients ( name, email )")
      .eq("coach_id", coachId)
      .order("created_at", { ascending: false });
    agreements = (data ?? []) as Agreement[];
  } catch { /* */ }

  // Fetch clients for the create modal
  let clients: { id: string; name: string }[] = [];
  try {
    const { data } = await supabase
      .from("clients")
      .select("id, name")
      .eq("coach_id", coachId)
      .order("name", { ascending: true });
    clients = data ?? [];
  } catch { /* */ }

  const statusStyles: Record<string, string> = {
    draft: "bg-surface-3 text-text-3",
    active: "bg-accent-lt text-accent",
    expired: "bg-c-red-dim text-c-red",
  };

  return (
    <>
      <Topbar title="Agreements" subtitle={`${agreements.length} agreements`} />
      <div className="flex-1 p-7">
        <div className="mb-5 flex items-center justify-between">
          <div />
          <AgreementActions clients={clients} />
        </div>

        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <div className="flex flex-col">
            {/* Header */}
            <div className="grid grid-cols-[2.5fr_1.2fr_1fr_1.2fr_1fr_90px] items-center gap-4 px-5 py-2.5 text-[0.7rem] font-medium uppercase tracking-[0.1em] text-text-3">
              <div>Agreement</div>
              <div>Client</div>
              <div>Status</div>
              <div>Key Terms</div>
              <div>Created</div>
              <div></div>
            </div>

            {agreements.length === 0 ? (
              <div className="py-16 text-center text-sm text-text-3">
                <div className="mb-3 text-2xl opacity-40">📄</div>
                No agreements yet. Create your first one.
              </div>
            ) : (
              agreements.map((agreement) => {
                const clientRaw = agreement.clients;
                const client = Array.isArray(clientRaw) ? clientRaw[0] : clientRaw;
                const clientName = client?.name ?? "Unknown";
                const initials = clientName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                const terms = agreement.key_terms ?? {};
                const termCount = Object.values(terms).filter(Boolean).length;

                return (
                  <div
                    key={agreement.id}
                    className="grid grid-cols-[2.5fr_1.2fr_1fr_1.2fr_1fr_90px] items-center gap-4 border-b border-border px-5 py-3.5 transition-colors last:border-b-0 hover:bg-surface-2"
                  >
                    {/* Title */}
                    <div>
                      <div className="text-sm font-medium text-text">
                        {agreement.title}
                      </div>
                      {agreement.content && (
                        <div className="mt-0.5 truncate text-xs text-text-3">
                          {agreement.content.slice(0, 80)}
                          {agreement.content.length > 80 ? "…" : ""}
                        </div>
                      )}
                    </div>

                    {/* Client */}
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full bg-accent-dim text-[0.65rem] font-semibold text-accent">
                        {initials}
                      </div>
                      <Link
                        href={`/dashboard/clients/${agreement.client_id}`}
                        className="text-sm text-text-2 hover:text-accent hover:underline"
                      >
                        {clientName}
                      </Link>
                    </div>

                    {/* Status */}
                    <div>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[0.7rem] font-medium capitalize ${
                          statusStyles[agreement.status] ?? "bg-surface-3 text-text-3"
                        }`}
                      >
                        {agreement.status}
                      </span>
                    </div>

                    {/* Key Terms summary */}
                    <div className="flex flex-wrap gap-1.5">
                      {terms.session_count && (
                        <span className="rounded bg-surface-3 px-1.5 py-0.5 text-[0.65rem] text-text-3">
                          {terms.session_count} sessions
                        </span>
                      )}
                      {terms.payment_terms && (
                        <span className="rounded bg-surface-3 px-1.5 py-0.5 text-[0.65rem] text-text-3">
                          {terms.payment_terms}
                        </span>
                      )}
                      {termCount === 0 && (
                        <span className="text-xs text-text-3">—</span>
                      )}
                    </div>

                    {/* Created date */}
                    <div className="text-[0.8125rem] text-text-3">
                      {new Date(agreement.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>

                    {/* Actions */}
                    <div>
                      <span className="text-xs text-text-3">View</span>
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
