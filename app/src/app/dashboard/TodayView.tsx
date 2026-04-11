"use client";

import { useState } from "react";
import Link from "next/link";
import PreSessionModal from "./PreSessionModal";
import PostSessionModal from "./PostSessionModal";
import ActivityFeed from "./ActivityFeed";

export interface TodaySession {
  id: string;
  date: string;
  duration: number;
  type: string;
  status: string;
  notes: string | null;
  prepNotes: string | null;
  clientId: string;
  clientName: string;
  packageName: string | null;
  sessionNumber: number;
  totalSessions: number;
  lastSessionDate: string | null;
  lastSessionNotes: string | null;
  homework: { title: string; status: string }[];
  goals: { title: string; progress: number }[];
  pendingPayment: { id: string; amount: number } | null;
}

export interface AttentionItem {
  type: "overdue_followup" | "overdue_payment" | "unscheduled" | "homework" | "package_ending";
  label: string;
  clientName: string;
  clientId: string;
  href: string;
}

export interface WeekDay {
  label: string;
  dateKey: string;
  sessions: { time: string; clientName: string; id: string }[];
}

interface Props {
  coachName: string;
  todaySessions: TodaySession[];
  attention: AttentionItem[];
  weekDays: WeekDay[];
  pipelineSnapshot: { leads: number; proposals: number; proposalValue: number; active: number; alumni: number };
  activities: { id: string; action: string; description: string; created_at: string; metadata: { from_stage?: string; to_stage?: string } | null }[];
  stats: { sessionsToday: number; overdueFollowups: number; homeworkToReview: number; unscheduled: number };
}

export default function TodayView({ coachName, todaySessions, attention, weekDays, pipelineSnapshot, activities, stats }: Props) {
  const [prepSession, setPrepSession] = useState<TodaySession | null>(null);
  const [completeSession, setCompleteSession] = useState<TodaySession | null>(null);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = coachName.split(" ")[0];

  return (
    <div className="flex flex-col gap-5">
      {/* Daily summary bar */}
      <div>
        <h2 className="mb-4 font-serif text-2xl text-text">{greeting}, {firstName}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat label="Sessions today" value={stats.sessionsToday} />
          <MiniStat label="Follow-ups overdue" value={stats.overdueFollowups} alert={stats.overdueFollowups > 0} />
          <MiniStat label="Homework to review" value={stats.homeworkToReview} />
          <MiniStat label="Unscheduled" value={stats.unscheduled} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
        {/* Left column */}
        <div className="flex flex-col gap-5">
          {/* Today's sessions */}
          <Section title="Today&apos;s sessions" subtitle={`${todaySessions.length} session${todaySessions.length !== 1 ? "s" : ""}`}>
            {todaySessions.length === 0 ? (
              <div className="py-10 text-center text-[0.8125rem] text-text-3">
                <div className="mb-2 text-2xl opacity-30">◷</div>
                No sessions today. Enjoy your day or use the time to follow up with leads.
              </div>
            ) : (
              <div className="flex flex-col">
                {todaySessions.map((s) => {
                  const time = new Date(s.date);
                  const initials = s.clientName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                  return (
                    <div key={s.id} className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3.5 last:border-b-0 sm:flex-nowrap">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="text-[0.8125rem] font-medium text-text w-[52px] flex-shrink-0">
                          {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                        </div>
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent-dim text-[0.65rem] font-semibold text-accent">{initials}</div>
                        <div className="min-w-0">
                          <Link href={`/dashboard/clients/${s.clientId}`} className="truncate text-[0.8125rem] font-medium text-text hover:underline">{s.clientName}</Link>
                          <div className="text-[0.7rem] text-text-3">{s.type} · {s.duration}min · Session {s.sessionNumber}/{s.totalSessions}</div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-auto">
                        <button
                          type="button"
                          onClick={() => setPrepSession(s)}
                          className="inline-flex min-h-[36px] items-center rounded-md border border-border bg-surface-2 px-3 py-1.5 text-[0.72rem] font-medium text-text-2 hover:bg-surface-3"
                        >Prepare</button>
                        {s.status === "scheduled" && (
                          <button
                            type="button"
                            onClick={() => setCompleteSession(s)}
                            className="inline-flex min-h-[36px] items-center rounded-md bg-accent px-3 py-1.5 text-[0.72rem] font-medium text-white hover:bg-accent-hover"
                          >Complete</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          {/* Needs attention */}
          {attention.length > 0 && (
            <Section title="Needs attention" subtitle={`${attention.length} item${attention.length !== 1 ? "s" : ""}`}>
              <div className="flex flex-col">
                {attention.map((item, i) => (
                  <Link
                    key={i}
                    href={item.href}
                    className="flex items-center gap-3 border-b border-border px-5 py-3 text-[0.8125rem] transition-colors last:border-b-0 hover:bg-surface-2"
                  >
                    <span className={`h-2 w-2 flex-shrink-0 rounded-full ${
                      item.type === "overdue_followup" || item.type === "overdue_payment" ? "bg-c-red" :
                      item.type === "package_ending" ? "bg-c-amber" : "bg-c-blue"
                    }`} />
                    <span className="flex-1 text-text-2">{item.label}</span>
                    <span className="text-[0.72rem] text-text-3">{item.clientName}</span>
                  </Link>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          {/* This week */}
          <Section title="This week" link={{ href: "/dashboard/sessions", label: "All sessions →" }}>
            {weekDays.every((d) => d.sessions.length === 0) ? (
              <div className="px-5 py-8 text-center text-[0.78rem] text-text-3">No sessions this week</div>
            ) : (
              <div className="flex flex-col">
                {weekDays.map((day) => {
                  if (day.sessions.length === 0) return null;
                  return (
                    <div key={day.dateKey} className="border-b border-border px-5 py-2.5 last:border-b-0">
                      <div className="mb-1.5 text-[0.65rem] font-medium uppercase tracking-[0.08em] text-text-3">{day.label}</div>
                      {day.sessions.map((sess) => (
                        <div key={sess.id} className="flex items-center gap-2 py-1 text-[0.78rem]">
                          <span className="w-[44px] text-text-3">{sess.time}</span>
                          <span className="truncate text-text-2">{sess.clientName}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          {/* Pipeline snapshot */}
          <Section title="Pipeline" link={{ href: "/dashboard/pipeline", label: "View →" }}>
            <div className="grid grid-cols-2 gap-3 px-5 py-4">
              <div><span className="text-lg font-serif text-text">{pipelineSnapshot.leads}</span> <span className="text-[0.7rem] text-text-3">leads</span></div>
              <div><span className="text-lg font-serif text-text">{pipelineSnapshot.proposals}</span> <span className="text-[0.7rem] text-text-3">proposals</span>{pipelineSnapshot.proposalValue > 0 && <span className="ml-1 text-[0.7rem] text-text-3">€{pipelineSnapshot.proposalValue.toLocaleString()}</span>}</div>
              <div><span className="text-lg font-serif text-text">{pipelineSnapshot.active}</span> <span className="text-[0.7rem] text-text-3">active</span></div>
              <div><span className="text-lg font-serif text-text">{pipelineSnapshot.alumni}</span> <span className="text-[0.7rem] text-text-3">alumni</span></div>
            </div>
          </Section>

          {/* Activity */}
          <Section title="Activity" subtitle="Recent events">
            <div className="px-5 py-2">
              <ActivityFeed activities={activities} />
            </div>
          </Section>
        </div>
      </div>

      {/* Modals */}
      {prepSession && (
        <PreSessionModal
          brief={{
            sessionId: prepSession.id,
            clientName: prepSession.clientName,
            packageName: prepSession.packageName,
            sessionNumber: prepSession.sessionNumber,
            totalSessions: prepSession.totalSessions,
            date: prepSession.date,
            lastSessionDate: prepSession.lastSessionDate,
            lastSessionNotes: prepSession.lastSessionNotes,
            homework: prepSession.homework,
            goals: prepSession.goals,
            prepNotes: prepSession.prepNotes,
          }}
          open
          onClose={() => setPrepSession(null)}
        />
      )}
      {completeSession && (
        <PostSessionModal
          sessionId={completeSession.id}
          clientName={completeSession.clientName}
          pendingPayment={completeSession.pendingPayment}
          open
          onClose={() => setCompleteSession(null)}
        />
      )}
    </div>
  );
}

function MiniStat({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className="rounded-card border border-border bg-surface px-4 py-3">
      <div className="text-[0.65rem] uppercase tracking-[0.08em] text-text-3">{label}</div>
      <div className={`mt-1 font-serif text-2xl ${alert ? "text-c-red" : "text-text"}`}>{value}</div>
    </div>
  );
}

function Section({ title, subtitle, link, children }: { title: string; subtitle?: string; link?: { href: string; label: string }; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <div className="text-sm font-medium text-text">{title}</div>
          {subtitle && <div className="mt-0.5 text-xs text-text-3">{subtitle}</div>}
        </div>
        {link && <Link href={link.href} className="text-xs text-accent hover:underline">{link.label}</Link>}
      </div>
      {children}
    </div>
  );
}
