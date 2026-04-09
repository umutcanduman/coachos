"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  LIFECYCLE_STAGES,
  STAGE_LABELS,
  STAGE_BADGE_CLASS,
  nextStage,
  type LifecycleStage,
} from "@/lib/lifecycle";
import {
  moveClientStage,
  toggleOnboardingItem,
  completeOnboarding,
  toggleOffboardingItem,
  completeOffboarding,
  saveResultsSummary,
  reengageClient,
  updateLeadFields,
  convertLeadToActive,
} from "@/app/dashboard/pipeline/actions";
import Toast from "@/components/Toast";

export interface LifecycleClientData {
  id: string;
  lifecycle_stage: LifecycleStage;
  source: string | null;
  lead_date: string | null;
  discovery_call_date: string | null;
  discovery_call_outcome: string | null;
  proposal_sent_date: string | null;
  proposal_package: string | null;
  proposal_price: number | null;
  proposal_status: string | null;
  alumni_since: string | null;
  reengagement_date: string | null;
  exit_reason: string | null;
}

export interface OnboardingChecklistData {
  welcome_email_sent: boolean;
  agreement_sent: boolean;
  goals_set: boolean;
  first_session_scheduled: boolean;
  intake_homework_assigned: boolean;
  completed_at: string | null;
}

export interface OffboardingChecklistData {
  results_summary_written: boolean;
  testimonial_requested: boolean;
  referral_asked: boolean;
  alumni_status_set: boolean;
  farewell_sent: boolean;
  results_summary: string | null;
  completed_at: string | null;
}

interface Props {
  client: LifecycleClientData;
  onboarding: OnboardingChecklistData | null;
  offboarding: OffboardingChecklistData | null;
}

const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-[0.06em] text-text-2";
const inputClass = "w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2 font-sans text-sm text-text outline-none transition-colors placeholder:text-text-3 focus:border-border-2";

export default function LifecyclePanels({ client, onboarding, offboarding }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const stage = client.lifecycle_stage;
  const next = nextStage(stage);

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function handleAdvance() {
    if (!next) return;
    const r = await moveClientStage(client.id, next);
    if (!r.success) {
      setToast({ message: r.error ?? "Failed", type: "error" });
      return;
    }
    setToast({ message: `Moved to ${STAGE_LABELS[next]}`, type: "success" });
    refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Stage indicator */}
      <div className="rounded-card border border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[0.7rem] uppercase tracking-[0.08em] text-text-3">Lifecycle stage</div>
            <div className="mt-1.5 flex items-center gap-2">
              <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.75rem] font-medium ${STAGE_BADGE_CLASS[stage]}`}>
                {STAGE_LABELS[stage]}
              </span>
            </div>
          </div>
          {next && (
            <button
              type="button"
              onClick={handleAdvance}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-4 py-2 text-[0.8125rem] font-medium text-text-2 transition-all hover:bg-surface-3"
            >
              Move to {STAGE_LABELS[next]} →
            </button>
          )}
        </div>
        {/* Stage rail */}
        <div className="mt-4 hidden gap-1 sm:flex">
          {LIFECYCLE_STAGES.map((s) => {
            const idx = LIFECYCLE_STAGES.indexOf(stage);
            const sIdx = LIFECYCLE_STAGES.indexOf(s);
            const reached = sIdx <= idx;
            return (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full ${reached ? "bg-accent" : "bg-surface-3"}`}
                title={STAGE_LABELS[s]}
              />
            );
          })}
        </div>
      </div>

      {(stage === "lead" || stage === "discovery" || stage === "proposal") && (
        <LeadPanel client={client} onSaved={(msg) => { setToast({ message: msg, type: "success" }); refresh(); }} />
      )}

      {stage === "onboarding" && (
        <OnboardingPanel
          clientId={client.id}
          checklist={onboarding}
          onChange={(msg) => { setToast({ message: msg, type: "success" }); refresh(); }}
          onError={(msg) => setToast({ message: msg, type: "error" })}
        />
      )}

      {(stage === "completing" || stage === "offboarding") && (
        <OffboardingPanel
          clientId={client.id}
          checklist={offboarding}
          onChange={(msg) => { setToast({ message: msg, type: "success" }); refresh(); }}
          onError={(msg) => setToast({ message: msg, type: "error" })}
        />
      )}

      {stage === "alumni" && (
        <AlumniPanel
          client={client}
          onChange={(msg) => { setToast({ message: msg, type: "success" }); refresh(); }}
          onError={(msg) => setToast({ message: msg, type: "error" })}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ---------- Lead / Discovery / Proposal panel ----------
function LeadPanel({ client, onSaved }: { client: LifecycleClientData; onSaved: (m: string) => void }) {
  const [saving, setSaving] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const r = await updateLeadFields(client.id, fd);
    setSaving(false);
    if (r.success) onSaved("Lead details saved");
  }

  return (
    <div className="rounded-card border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="text-sm font-medium text-text">Lead information</div>
        <button
          type="button"
          onClick={() => setConvertOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-1.5 text-[0.75rem] font-medium text-white transition-all hover:bg-accent-hover"
        >
          Convert to active
        </button>
      </div>
      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
        <InfoStatic label="Source" value={client.source ?? "—"} />
        <InfoStatic
          label="Lead date"
          value={client.lead_date ? new Date(client.lead_date).toLocaleDateString() : "—"}
        />
        <div>
          <label className={labelClass}>Discovery call date</label>
          <input
            type="date"
            name="discovery_call_date"
            defaultValue={client.discovery_call_date ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Discovery outcome</label>
          <select
            name="discovery_call_outcome"
            defaultValue={client.discovery_call_outcome ?? ""}
            className={inputClass}
          >
            <option value="">—</option>
            <option value="converted">Converted</option>
            <option value="not_ready">Not ready</option>
            <option value="not_a_fit">Not a fit</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Proposal sent</label>
          <input
            type="date"
            name="proposal_sent_date"
            defaultValue={client.proposal_sent_date ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Proposal status</label>
          <select
            name="proposal_status"
            defaultValue={client.proposal_status ?? ""}
            className={inputClass}
          >
            <option value="">—</option>
            <option value="sent">Sent</option>
            <option value="negotiating">Negotiating</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Proposal package</label>
          <input
            type="text"
            name="proposal_package"
            defaultValue={client.proposal_package ?? ""}
            placeholder="e.g. Growth Journey"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Proposal price (€)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            name="proposal_price"
            defaultValue={client.proposal_price ?? ""}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-4 py-2 text-[0.8125rem] font-medium text-text-2 transition-all hover:bg-surface-3 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save lead details"}
          </button>
        </div>
      </form>

      {convertOpen && (
        <ConvertLeadModal
          clientId={client.id}
          defaultPackage={client.proposal_package ?? ""}
          defaultPrice={client.proposal_price ?? null}
          onClose={() => setConvertOpen(false)}
          onConverted={() => { setConvertOpen(false); onSaved("Converted to active client"); }}
        />
      )}
    </div>
  );
}

function ConvertLeadModal({
  clientId,
  defaultPackage,
  defaultPrice,
  onClose,
  onConverted,
}: {
  clientId: string;
  defaultPackage: string;
  defaultPrice: number | null;
  onClose: () => void;
  onConverted: () => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const r = await convertLeadToActive(clientId, fd);
    setBusy(false);
    if (!r.success) {
      setError(r.error ?? "Failed");
      return;
    }
    onConverted();
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-8">
      <div className="relative w-full overflow-y-auto rounded-t-[14px] border border-border-2 bg-surface p-5 shadow-2xl sm:max-w-[480px] sm:rounded-[14px] sm:p-7">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-text-3 hover:text-text"
        >✕</button>
        <h2 className="mb-1 font-serif text-2xl text-text">Convert to active client</h2>
        <p className="mb-5 text-[0.8125rem] text-text-3">Creates a package and moves the client into onboarding.</p>
        {error && (
          <div className="mb-4 rounded-lg border border-[rgba(184,50,50,0.15)] bg-c-red-dim px-4 py-3 text-[0.8125rem] text-c-red">{error}</div>
        )}
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Package name</label>
            <input
              name="package_type"
              type="text"
              required
              defaultValue={defaultPackage}
              className={inputClass}
              placeholder="Growth Journey"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Total sessions</label>
              <input
                name="total_sessions"
                type="number"
                min="1"
                required
                defaultValue={10}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Price (€)</label>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                required
                defaultValue={defaultPrice ?? ""}
                className={inputClass}
              />
            </div>
          </div>
          <div className="mt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-4 py-2 text-[0.8125rem] font-medium text-text-2 transition-all hover:bg-surface-3"
            >Cancel</button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[0.8125rem] font-medium text-white transition-all hover:bg-accent-hover disabled:opacity-50"
            >{busy ? "Converting…" : "Convert"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------- Onboarding panel ----------
const ONBOARDING_ITEMS: { key: keyof OnboardingChecklistData; label: string }[] = [
  { key: "welcome_email_sent",       label: "Welcome email sent" },
  { key: "agreement_sent",           label: "Agreement sent" },
  { key: "goals_set",                label: "Goals set" },
  { key: "first_session_scheduled",  label: "First session scheduled" },
  { key: "intake_homework_assigned", label: "Intake homework assigned" },
];

function OnboardingPanel({
  clientId,
  checklist,
  onChange,
  onError,
}: {
  clientId: string;
  checklist: OnboardingChecklistData | null;
  onChange: (m: string) => void;
  onError: (m: string) => void;
}) {
  const items = ONBOARDING_ITEMS.map((it) => ({
    ...it,
    value: checklist?.[it.key] === true,
  }));
  const done = items.filter((i) => i.value).length;
  const pct = Math.round((done / items.length) * 100);
  const allDone = done === items.length;

  async function handleToggle(field: string, current: boolean) {
    const r = await toggleOnboardingItem(clientId, field, !current);
    if (!r.success) onError(r.error ?? "Failed");
    else onChange("Updated");
  }

  async function handleComplete() {
    const r = await completeOnboarding(clientId);
    if (!r.success) onError(r.error ?? "Failed");
    else onChange("Onboarding complete");
  }

  return (
    <div className="rounded-card border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <div className="text-sm font-medium text-text">Onboarding checklist</div>
          <div className="mt-0.5 text-xs text-text-3">{done} of {items.length} done</div>
        </div>
        <span className="text-[0.75rem] font-medium text-accent">{pct}%</span>
      </div>
      <div className="px-5 pt-3">
        <div className="h-[5px] overflow-hidden rounded-full bg-surface-3">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="flex flex-col p-3">
        {items.map((it) => (
          <label
            key={it.key}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-surface-2"
          >
            <input
              type="checkbox"
              checked={it.value}
              onChange={() => handleToggle(it.key, it.value)}
              className="h-4 w-4 cursor-pointer accent-accent"
            />
            <span className={`text-[0.8125rem] ${it.value ? "text-text-3 line-through" : "text-text-2"}`}>
              {it.label}
            </span>
          </label>
        ))}
      </div>
      <div className="flex justify-end border-t border-border px-5 py-4">
        <button
          type="button"
          onClick={handleComplete}
          disabled={!allDone}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[0.8125rem] font-medium text-white transition-all hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          Complete onboarding
        </button>
      </div>
    </div>
  );
}

// ---------- Offboarding panel ----------
const OFFBOARDING_ITEMS: { key: keyof OffboardingChecklistData; label: string }[] = [
  { key: "results_summary_written", label: "Results summary written" },
  { key: "testimonial_requested",   label: "Testimonial requested" },
  { key: "referral_asked",          label: "Referral asked" },
  { key: "alumni_status_set",       label: "Alumni status set" },
  { key: "farewell_sent",           label: "Farewell sent" },
];

function OffboardingPanel({
  clientId,
  checklist,
  onChange,
  onError,
}: {
  clientId: string;
  checklist: OffboardingChecklistData | null;
  onChange: (m: string) => void;
  onError: (m: string) => void;
}) {
  const [summary, setSummary] = useState(checklist?.results_summary ?? "");
  const [exitReason, setExitReason] = useState("");
  const items = OFFBOARDING_ITEMS.map((it) => ({
    ...it,
    value: checklist?.[it.key] === true,
  }));
  const done = items.filter((i) => i.value).length;
  const pct = Math.round((done / items.length) * 100);
  const allDone = done === items.length;

  async function handleToggle(field: string, current: boolean) {
    const r = await toggleOffboardingItem(clientId, field, !current);
    if (!r.success) onError(r.error ?? "Failed");
    else onChange("Updated");
  }

  async function handleSaveSummary() {
    const r = await saveResultsSummary(clientId, summary);
    if (!r.success) onError(r.error ?? "Failed");
    else onChange("Summary saved");
  }

  async function handleComplete() {
    const r = await completeOffboarding(clientId, exitReason);
    if (!r.success) onError(r.error ?? "Failed");
    else onChange("Offboarding complete");
  }

  return (
    <div className="rounded-card border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <div className="text-sm font-medium text-text">Offboarding checklist</div>
          <div className="mt-0.5 text-xs text-text-3">{done} of {items.length} done</div>
        </div>
        <span className="text-[0.75rem] font-medium text-accent">{pct}%</span>
      </div>
      <div className="px-5 pt-3">
        <div className="h-[5px] overflow-hidden rounded-full bg-surface-3">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="flex flex-col p-3">
        {items.map((it) => (
          <label
            key={it.key}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-surface-2"
          >
            <input
              type="checkbox"
              checked={it.value}
              onChange={() => handleToggle(it.key, it.value)}
              className="h-4 w-4 cursor-pointer accent-accent"
            />
            <span className={`text-[0.8125rem] ${it.value ? "text-text-3 line-through" : "text-text-2"}`}>
              {it.label}
            </span>
          </label>
        ))}
      </div>
      <div className="border-t border-border px-5 py-4">
        <label className={labelClass}>Results summary</label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={3}
          maxLength={5000}
          placeholder="What did this client achieve?"
          className={`${inputClass} resize-y`}
        />
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={handleSaveSummary}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3.5 py-1.5 text-[0.75rem] font-medium text-text-2 transition-all hover:bg-surface-3"
          >Save summary</button>
        </div>
      </div>
      <div className="border-t border-border px-5 py-4">
        <label className={labelClass}>Exit reason (optional)</label>
        <input
          type="text"
          value={exitReason}
          onChange={(e) => setExitReason(e.target.value)}
          maxLength={500}
          placeholder="e.g. Goals achieved"
          className={inputClass}
        />
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={handleComplete}
            disabled={!allDone}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[0.8125rem] font-medium text-white transition-all hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Complete offboarding
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Alumni panel ----------
function AlumniPanel({
  client,
  onChange,
  onError,
}: {
  client: LifecycleClientData;
  onChange: (m: string) => void;
  onError: (m: string) => void;
}) {
  async function handleReengage() {
    const r = await reengageClient(client.id);
    if (!r.success) onError(r.error ?? "Failed");
    else onChange("Moved back to lead");
  }

  return (
    <div className="rounded-card border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="text-sm font-medium text-text">Alumni</div>
        <button
          type="button"
          onClick={handleReengage}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-1.5 text-[0.75rem] font-medium text-white transition-all hover:bg-accent-hover"
        >Re-engage</button>
      </div>
      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
        <InfoStatic
          label="Alumni since"
          value={client.alumni_since ? new Date(client.alumni_since).toLocaleDateString() : "—"}
        />
        <InfoStatic
          label="Re-engagement reminder"
          value={client.reengagement_date ? new Date(client.reengagement_date).toLocaleDateString() : "—"}
        />
        <InfoStatic label="Exit reason" value={client.exit_reason ?? "—"} />
      </div>
    </div>
  );
}

function InfoStatic({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1 text-[0.65rem] uppercase tracking-[0.08em] text-text-3">{label}</div>
      <div className="text-[0.8125rem] text-text-2">{value}</div>
    </div>
  );
}
