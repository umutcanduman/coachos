"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveSessionTool } from "@/app/dashboard/today-actions";
import Toast from "@/components/Toast";

interface Props {
  clients: { id: string; name: string }[];
}

const TOOLS = [
  {
    key: "wheel_of_life",
    name: "Wheel of Life",
    desc: "Assess 8 life areas on a 1-10 scale. Compare over time.",
    icon: "◎",
  },
  {
    key: "grow",
    name: "GROW Session",
    desc: "Goal, Reality, Options, Will — structured coaching framework.",
    icon: "◈",
  },
  {
    key: "checkin",
    name: "Weekly Check-in",
    desc: "Quick pulse on energy, progress, and focus areas.",
    icon: "◑",
  },
  {
    key: "smart_goal",
    name: "Goal Builder",
    desc: "Build structured goals with milestones and tracking.",
    icon: "◇",
  },
];

const WHEEL_AREAS = ["Career", "Finance", "Health", "Relationships", "Personal Growth", "Fun", "Environment", "Family"];

const inputClass = "w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 font-sans text-sm text-text outline-none placeholder:text-text-3 focus:border-border-2";
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-[0.06em] text-text-2";

export default function ToolsView({ clients }: Props) {
  const router = useRouter();
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Wheel of Life state
  const [wheelScores, setWheelScores] = useState<Record<string, number>>(
    Object.fromEntries(WHEEL_AREAS.map((a) => [a, 5]))
  );

  // GROW state
  const [growGoal, setGrowGoal] = useState("");
  const [growReality, setGrowReality] = useState("");
  const [growOptions, setGrowOptions] = useState("");
  const [growWill, setGrowWill] = useState("");

  // Check-in state
  const [checkinScore, setCheckinScore] = useState(5);
  const [checkinEnergy, setCheckinEnergy] = useState(5);
  const [checkinProgress, setCheckinProgress] = useState(5);
  const [checkinWell, setCheckinWell] = useState("");
  const [checkinWork, setCheckinWork] = useState("");

  // Goal Builder state
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDesc, setGoalDesc] = useState("");
  const [goalWhy, setGoalWhy] = useState("");
  const [goalDate, setGoalDate] = useState("");
  const [goalProgress, setGoalProgress] = useState(0);

  async function handleSave() {
    if (!clientId) { setToast({ message: "Select a client", type: "error" }); return; }
    setSaving(true);
    let toolData: Record<string, unknown> = {};

    if (activeTool === "wheel_of_life") toolData = { scores: wheelScores };
    else if (activeTool === "grow") toolData = { goal: growGoal, reality: growReality, options: growOptions, will: growWill };
    else if (activeTool === "checkin") toolData = { score: checkinScore, energy: checkinEnergy, progress: checkinProgress, going_well: checkinWell, to_work_on: checkinWork };
    else if (activeTool === "smart_goal") toolData = { title: goalTitle, description: goalDesc, why: goalWhy, target_date: goalDate, progress: goalProgress };

    const r = await saveSessionTool(clientId, activeTool!, toolData);
    setSaving(false);
    if (r.success) {
      setToast({ message: "Saved", type: "success" });
      setActiveTool(null);
      router.refresh();
    } else {
      setToast({ message: r.error ?? "Failed", type: "error" });
    }
  }

  if (activeTool) {
    return (
      <>
        <button type="button" onClick={() => setActiveTool(null)} className="mb-4 text-sm text-text-3 hover:text-text-2">← Back to tools</button>
        <div className="mb-4">
          <label className={labelClass}>Client</label>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={inputClass}>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="rounded-card border border-border bg-surface p-5">
          <h2 className="mb-4 font-serif text-xl text-text">{TOOLS.find((t) => t.key === activeTool)?.name}</h2>

          {activeTool === "wheel_of_life" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {WHEEL_AREAS.map((area) => (
                <div key={area}>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-[0.8125rem] text-text-2">{area}</label>
                    <span className="text-sm font-medium text-accent">{wheelScores[area]}</span>
                  </div>
                  <input type="range" min={1} max={10} value={wheelScores[area]} onChange={(e) => setWheelScores((p) => ({ ...p, [area]: Number(e.target.value) }))} className="w-full accent-accent" />
                </div>
              ))}
            </div>
          )}

          {activeTool === "grow" && (
            <div className="flex flex-col gap-4">
              <div><label className={labelClass}>Goal — What do you want to achieve?</label><textarea value={growGoal} onChange={(e) => setGrowGoal(e.target.value)} rows={3} className={`${inputClass} resize-y`} placeholder="Describe the goal..." /></div>
              <div><label className={labelClass}>Reality — What is happening now?</label><textarea value={growReality} onChange={(e) => setGrowReality(e.target.value)} rows={3} className={`${inputClass} resize-y`} placeholder="Current situation..." /></div>
              <div><label className={labelClass}>Options — What could you do?</label><textarea value={growOptions} onChange={(e) => setGrowOptions(e.target.value)} rows={3} className={`${inputClass} resize-y`} placeholder="Possible actions..." /></div>
              <div><label className={labelClass}>Will — What will you do?</label><textarea value={growWill} onChange={(e) => setGrowWill(e.target.value)} rows={3} className={`${inputClass} resize-y`} placeholder="Committed action..." /></div>
            </div>
          )}

          {activeTool === "checkin" && (
            <div className="flex flex-col gap-4">
              <SliderField label="Overall score (1-10)" value={checkinScore} onChange={setCheckinScore} />
              <SliderField label="Energy level (1-10)" value={checkinEnergy} onChange={setCheckinEnergy} />
              <SliderField label="Progress on main goal (1-10)" value={checkinProgress} onChange={setCheckinProgress} />
              <div><label className={labelClass}>One thing going well</label><input type="text" value={checkinWell} onChange={(e) => setCheckinWell(e.target.value)} className={inputClass} placeholder="What's working?" /></div>
              <div><label className={labelClass}>One thing to work on</label><input type="text" value={checkinWork} onChange={(e) => setCheckinWork(e.target.value)} className={inputClass} placeholder="Area for improvement" /></div>
            </div>
          )}

          {activeTool === "smart_goal" && (
            <div className="flex flex-col gap-4">
              <div><label className={labelClass}>Goal title</label><input type="text" value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} className={inputClass} placeholder="Goal name" /></div>
              <div><label className={labelClass}>Description</label><textarea value={goalDesc} onChange={(e) => setGoalDesc(e.target.value)} rows={2} className={`${inputClass} resize-y`} placeholder="Details..." /></div>
              <div><label className={labelClass}>Why it matters</label><textarea value={goalWhy} onChange={(e) => setGoalWhy(e.target.value)} rows={2} className={`${inputClass} resize-y`} placeholder="Motivation..." /></div>
              <div><label className={labelClass}>Target date</label><input type="date" value={goalDate} onChange={(e) => setGoalDate(e.target.value)} className={inputClass} /></div>
              <SliderField label="Current progress %" value={goalProgress} onChange={setGoalProgress} max={100} />
            </div>
          )}

          <div className="mt-6 flex justify-end gap-2.5">
            <button type="button" onClick={() => setActiveTool(null)} className="inline-flex min-h-[44px] items-center rounded-lg border border-border bg-surface-2 px-4 py-2 text-[0.8125rem] font-medium text-text-2 hover:bg-surface-3">Cancel</button>
            <button type="button" onClick={handleSave} disabled={saving} className="inline-flex min-h-[44px] items-center rounded-lg bg-accent px-5 py-2 text-[0.8125rem] font-medium text-white hover:bg-accent-hover disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
          </div>
        </div>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  return (
    <>
      {clients.length === 0 ? (
        <div className="rounded-card border border-border bg-surface p-10 text-center">
          <div className="mb-2 text-2xl opacity-30">◈</div>
          <p className="text-[0.8125rem] text-text-3">Add active clients first to use coaching tools.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((tool) => (
            <button
              key={tool.key}
              type="button"
              onClick={() => setActiveTool(tool.key)}
              className="flex flex-col items-start rounded-card border border-border bg-surface p-5 text-left transition-colors hover:border-border-2 hover:bg-surface-2"
            >
              <div className="mb-3 text-2xl text-accent">{tool.icon}</div>
              <div className="mb-1 text-[0.8125rem] font-medium text-text">{tool.name}</div>
              <div className="text-[0.72rem] text-text-3">{tool.desc}</div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function SliderField({ label, value, onChange, max = 10 }: { label: string; value: number; onChange: (v: number) => void; max?: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-[0.8125rem] text-text-2">{label}</label>
        <span className="text-sm font-medium text-accent">{value}</span>
      </div>
      <input type="range" min={0} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-accent" />
    </div>
  );
}
