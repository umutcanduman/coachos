"use client";

import { useState } from "react";
import { updateProfile, updatePractice, updateNotifications, sendPasswordReset, deleteAccount } from "./actions";
import { updateCoachSettings } from "@/app/dashboard/today-actions";
import Toast from "@/components/Toast";

interface CoachSettings {
  name: string;
  email: string;
  phone: string | null;
  bio: string | null;
  timezone: string | null;
  photo_url: string | null;
  practice_name: string | null;
  website_url: string | null;
  default_session_duration: number | null;
  default_session_type: string | null;
  currency: string | null;
  notify_session_reminders: boolean | null;
  notify_homework_completed: boolean | null;
  notify_weekly_summary: boolean | null;
}

const inputClass = "w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 font-sans text-sm text-text outline-none transition-colors placeholder:text-text-3 focus:border-border-2";
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-[0.06em] text-text-2";
const btnClass = "inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[0.8125rem] font-medium text-white transition-all hover:bg-accent-hover disabled:opacity-50";
const sectionClass = "rounded-card border border-border bg-surface p-6";

interface CapacitySettings {
  max_client_capacity: number;
  target_monthly_revenue: number | null;
}

export default function SettingsForm({ coach, capacitySettings }: { coach: CoachSettings; capacitySettings?: CapacitySettings }) {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  async function handleProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving("profile");
    const result = await updateProfile(new FormData(e.currentTarget));
    setToast({ message: result.success ? "Profile updated" : (result.error ?? "Failed"), type: result.success ? "success" : "error" });
    setSaving(null);
  }

  async function handlePractice(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving("practice");
    const result = await updatePractice(new FormData(e.currentTarget));
    setToast({ message: result.success ? "Practice settings updated" : (result.error ?? "Failed"), type: result.success ? "success" : "error" });
    setSaving(null);
  }

  async function handleNotifications(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving("notifications");
    const result = await updateNotifications(new FormData(e.currentTarget));
    setToast({ message: result.success ? "Notification preferences saved" : (result.error ?? "Failed"), type: result.success ? "success" : "error" });
    setSaving(null);
  }

  async function handlePasswordReset() {
    setSaving("password");
    const result = await sendPasswordReset();
    setToast({ message: result.success ? "Password reset email sent" : (result.error ?? "Failed"), type: result.success ? "success" : "error" });
    setSaving(null);
  }

  return (
    <div className="space-y-6">
      {/* Profile Settings */}
      <div className={sectionClass}>
        <h2 className="mb-1 text-[0.9375rem] font-semibold text-text">Profile Settings</h2>
        <p className="mb-5 text-[0.8125rem] text-text-3">Your personal information</p>
        <form onSubmit={handleProfile}>
          <div className="mb-4">
            <label className={labelClass}>Full name</label>
            <input name="name" type="text" required defaultValue={coach.name} className={inputClass} />
          </div>
          <div className="mb-4">
            <label className={labelClass}>Email</label>
            <input type="email" disabled value={coach.email} className={`${inputClass} cursor-not-allowed opacity-60`} />
          </div>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Phone</label>
              <input name="phone" type="tel" defaultValue={coach.phone ?? ""} placeholder="+31 6 12345678" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Timezone</label>
              <select name="timezone" defaultValue={coach.timezone ?? "Europe/Amsterdam"} className={inputClass}>
                <option value="Europe/Amsterdam">Europe/Amsterdam</option>
                <option value="Europe/London">Europe/London</option>
                <option value="Europe/Istanbul">Europe/Istanbul</option>
                <option value="America/New_York">America/New York</option>
                <option value="America/Los_Angeles">America/Los Angeles</option>
                <option value="Asia/Tokyo">Asia/Tokyo</option>
                <option value="Australia/Sydney">Australia/Sydney</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className={labelClass}>Bio</label>
            <textarea name="bio" rows={3} defaultValue={coach.bio ?? ""} placeholder="Tell clients about your coaching approach…" className={inputClass} />
          </div>
          <div className="mb-5">
            <label className={labelClass}>Profile photo URL</label>
            <input name="photo_url" type="url" defaultValue={coach.photo_url ?? ""} placeholder="https://example.com/photo.jpg" className={inputClass} />
          </div>
          <button type="submit" disabled={saving === "profile"} className={btnClass}>
            {saving === "profile" ? "Saving…" : "Save Profile"}
          </button>
        </form>
      </div>

      {/* Practice Settings */}
      <div className={sectionClass}>
        <h2 className="mb-1 text-[0.9375rem] font-semibold text-text">Practice Settings</h2>
        <p className="mb-5 text-[0.8125rem] text-text-3">Configure your coaching practice defaults</p>
        <form onSubmit={handlePractice}>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Practice name</label>
              <input name="practice_name" type="text" defaultValue={coach.practice_name ?? ""} placeholder="My Coaching Practice" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Website</label>
              <input name="website_url" type="url" defaultValue={coach.website_url ?? ""} placeholder="https://yoursite.com" className={inputClass} />
            </div>
          </div>
          <div className="mb-4 grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Default duration</label>
              <select name="default_session_duration" defaultValue={coach.default_session_duration ?? 60} className={inputClass}>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">60 min</option>
                <option value="90">90 min</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Default type</label>
              <select name="default_session_type" defaultValue={coach.default_session_type ?? "one-on-one"} className={inputClass}>
                <option value="one-on-one">One-on-One</option>
                <option value="discovery">Discovery</option>
                <option value="group">Group</option>
                <option value="follow-up">Follow-up</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Currency</label>
              <select name="currency" defaultValue={coach.currency ?? "EUR"} className={inputClass}>
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="TRY">TRY (₺)</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={saving === "practice"} className={btnClass}>
            {saving === "practice" ? "Saving…" : "Save Practice Settings"}
          </button>
        </form>
      </div>

      {/* Capacity Planning */}
      <div className={sectionClass}>
        <h2 className="mb-1 text-[0.9375rem] font-semibold text-text">Capacity & Goals</h2>
        <p className="mb-5 text-[0.8125rem] text-text-3">Set your practice capacity for the acquisition page</p>
        <form onSubmit={async (e) => {
          e.preventDefault();
          setSaving("capacity");
          const r = await updateCoachSettings(new FormData(e.currentTarget));
          setToast({ message: r.success ? "Capacity settings saved" : (r.error ?? "Failed"), type: r.success ? "success" : "error" });
          setSaving(null);
        }}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-5">
            <div>
              <label className={labelClass}>Max client capacity</label>
              <input name="max_client_capacity" type="number" min={1} max={100} defaultValue={capacitySettings?.max_client_capacity ?? 10} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Target monthly revenue (€)</label>
              <input name="target_monthly_revenue" type="number" min={0} step="0.01" defaultValue={capacitySettings?.target_monthly_revenue ?? ""} placeholder="e.g. 5000" className={inputClass} />
            </div>
          </div>
          <button type="submit" disabled={saving === "capacity"} className={btnClass}>
            {saving === "capacity" ? "Saving…" : "Save capacity settings"}
          </button>
        </form>
      </div>

      {/* Notification Preferences */}
      <div className={sectionClass}>
        <h2 className="mb-1 text-[0.9375rem] font-semibold text-text">Notification Preferences</h2>
        <p className="mb-5 text-[0.8125rem] text-text-3">Choose which emails you receive</p>
        <form onSubmit={handleNotifications}>
          <div className="space-y-4 mb-5">
            <ToggleRow name="notify_session_reminders" label="Email reminders for upcoming sessions" defaultChecked={coach.notify_session_reminders ?? true} />
            <ToggleRow name="notify_homework_completed" label="Email when client completes homework" defaultChecked={coach.notify_homework_completed ?? true} />
            <ToggleRow name="notify_weekly_summary" label="Weekly summary email" defaultChecked={coach.notify_weekly_summary ?? true} />
          </div>
          <button type="submit" disabled={saving === "notifications"} className={btnClass}>
            {saving === "notifications" ? "Saving…" : "Save Preferences"}
          </button>
        </form>
      </div>

      {/* Account */}
      <div className={sectionClass}>
        <h2 className="mb-1 text-[0.9375rem] font-semibold text-text">Account</h2>
        <p className="mb-5 text-[0.8125rem] text-text-3">Manage your account security</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePasswordReset}
            disabled={saving === "password"}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-4 py-2 text-[0.8125rem] font-medium text-text-2 transition-all hover:bg-surface-3 disabled:opacity-50"
          >
            {saving === "password" ? "Sending…" : "Change Password"}
          </button>
        </div>
        <div className="mt-6 rounded-lg border border-c-red/20 bg-c-red-dim p-4">
          <h3 className="text-[0.8125rem] font-medium text-c-red">Danger Zone</h3>
          <p className="mt-1 text-[0.75rem] text-text-2">Deleting your account is permanent and cannot be undone.</p>
          <button
            type="button"
            onClick={async () => {
              if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                const result = await deleteAccount();
                if (result.success) {
                  window.location.href = "/login";
                } else {
                  setToast({ message: result.error ?? "Failed to delete account", type: "error" });
                }
              }
            }}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-c-red/30 bg-transparent px-4 py-2 text-[0.8125rem] font-medium text-c-red transition-all hover:bg-c-red hover:text-white"
          >
            Delete Account
          </button>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function ToggleRow({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between">
      <span className="text-[0.8125rem] text-text-2">{label}</span>
      <input type="hidden" name={name} value={checked ? "on" : ""} />
      <button
        type="button"
        onClick={() => setChecked(!checked)}
        className="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
        style={{ backgroundColor: checked ? "#4A7C68" : "#F0EDE8" }}
        role="switch"
        aria-checked={checked}
      >
        <span className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200" style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }} />
      </button>
    </div>
  );
}
