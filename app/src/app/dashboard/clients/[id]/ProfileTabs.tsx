"use client";

import { useState } from "react";

interface Session {
  id: string;
  date: string;
  duration: number;
  type: string;
  status: string;
  notes: string | null;
}

interface Homework {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string;
  category: string | null;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  due_date: string | null;
  paid_date: string | null;
  description: string | null;
}

interface ProfileTabsProps {
  sessions: Session[];
  homework: Homework[];
  payments: Payment[];
  clientCreatedAt: string;
}

export default function ProfileTabs({
  sessions,
  homework,
  payments,
  clientCreatedAt,
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState("sessions");

  const tabs = [
    { key: "sessions", label: "Session Notes" },
    { key: "homework", label: "Homework" },
    { key: "payments", label: "Payments" },
    { key: "timeline", label: "Timeline" },
  ];

  return (
    <div>
      {/* Tabs */}
      <div className="mb-5 flex gap-0 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-[0.8125rem] font-medium transition-colors ${
              activeTab === tab.key
                ? "border-accent text-accent"
                : "border-transparent text-text-3 hover:text-text-2"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Session Notes */}
      {activeTab === "sessions" && (
        <div>
          {sessions.length === 0 ? (
            <EmptyState icon="◷" message="No sessions yet" />
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className="mb-3.5 rounded-lg border border-border bg-surface-2 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-medium text-text">
                    {session.type} Session
                  </h4>
                  <time className="text-[0.72rem] text-text-3">
                    {new Date(session.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                </div>
                {session.notes ? (
                  <p className="mb-3.5 text-[0.8125rem] leading-relaxed text-text-2">
                    {session.notes}
                  </p>
                ) : (
                  <p className="text-[0.8125rem] italic text-text-3">No notes</p>
                )}
                <div className="flex gap-1.5">
                  <span className="rounded-full bg-accent-lt px-2.5 py-1 text-[0.7rem] font-medium text-accent">
                    {session.status}
                  </span>
                  <span className="rounded-full bg-surface-3 px-2.5 py-1 text-[0.7rem] font-medium text-text-3">
                    {session.duration} min
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Homework */}
      {activeTab === "homework" && (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          {homework.length === 0 ? (
            <EmptyState icon="✓" message="No homework assigned" />
          ) : (
            homework.map((hw) => {
              const isOverdue =
                hw.due_date &&
                new Date(hw.due_date) < new Date() &&
                hw.status !== "completed";
              return (
                <div
                  key={hw.id}
                  className="flex items-start gap-3.5 border-b border-border px-5 py-4 last:border-b-0"
                >
                  <div
                    className={`mt-0.5 flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full border-[1.5px] text-[0.65rem] ${
                      hw.status === "completed"
                        ? "border-accent bg-accent text-white"
                        : "border-border-2"
                    }`}
                  >
                    {hw.status === "completed" ? "✓" : ""}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm text-text">{hw.title}</h4>
                    {hw.description && (
                      <p className="text-xs text-text-3">{hw.description}</p>
                    )}
                  </div>
                  <div
                    className={`flex-shrink-0 text-right text-[0.72rem] ${
                      isOverdue ? "text-c-red" : "text-text-3"
                    }`}
                  >
                    {hw.due_date
                      ? `Due ${new Date(hw.due_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}`
                      : ""}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Payments */}
      {activeTab === "payments" && (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          {/* Header */}
          <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_80px] items-center gap-4 px-5 py-2.5 text-[0.7rem] font-medium uppercase tracking-[0.08em] text-text-3">
            <div>Description</div>
            <div>Date</div>
            <div>Amount</div>
            <div>Status</div>
            <div></div>
          </div>
          {payments.length === 0 ? (
            <EmptyState icon="◎" message="No payments recorded" />
          ) : (
            payments.map((payment) => (
              <div
                key={payment.id}
                className="grid grid-cols-[2fr_1.5fr_1fr_1fr_80px] items-center gap-4 border-b border-border px-5 py-3.5 text-[0.8125rem] last:border-b-0"
              >
                <div className="text-text-2">
                  {payment.description ?? "Payment"}
                </div>
                <div className="text-text-3">
                  {payment.paid_date
                    ? new Date(payment.paid_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : payment.due_date
                    ? `Due ${new Date(payment.due_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}`
                    : "—"}
                </div>
                <div className="font-medium text-text">
                  €{Number(payment.amount).toLocaleString()}
                </div>
                <div>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[0.7rem] font-medium ${
                      payment.status === "paid"
                        ? "bg-accent-lt text-accent"
                        : payment.status === "overdue"
                        ? "bg-c-red-dim text-c-red"
                        : "bg-c-amber-dim text-c-amber"
                    }`}
                  >
                    {payment.status}
                  </span>
                </div>
                <div></div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Timeline */}
      {activeTab === "timeline" && (
        <div className="overflow-hidden rounded-card border border-border bg-surface p-5">
          <div className="flex flex-col gap-4">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-start gap-3.5">
                <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-accent-lt text-xs text-accent">
                  ◷
                </div>
                <div>
                  <p className="text-[0.8125rem] text-text-2">
                    <strong className="font-medium text-text">{session.type}</strong>{" "}
                    session — {session.status}
                  </p>
                  <time className="text-[0.7rem] text-text-3">
                    {new Date(session.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                </div>
              </div>
            ))}
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-start gap-3.5">
                <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-c-blue-dim text-xs text-c-blue">
                  ◎
                </div>
                <div>
                  <p className="text-[0.8125rem] text-text-2">
                    Payment of{" "}
                    <strong className="font-medium text-text">
                      €{Number(payment.amount).toLocaleString()}
                    </strong>{" "}
                    — {payment.status}
                  </p>
                  <time className="text-[0.7rem] text-text-3">
                    {(payment.paid_date || payment.due_date)
                      ? new Date(
                          (payment.paid_date ?? payment.due_date)!
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </time>
                </div>
              </div>
            ))}
            <div className="flex items-start gap-3.5">
              <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-c-purple-dim text-xs text-c-purple">
                ◉
              </div>
              <div>
                <p className="text-[0.8125rem] text-text-2">Client created</p>
                <time className="text-[0.7rem] text-text-3">
                  {new Date(clientCreatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="py-12 text-center text-sm text-text-3">
      <div className="mb-3 text-2xl opacity-40">{icon}</div>
      {message}
    </div>
  );
}
