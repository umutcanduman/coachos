import { createClient } from "@/lib/supabase/server";
import Topbar from "@/components/Topbar";
import StatCard from "@/components/StatCard";
import CopyButton from "./CopyButton";

export const dynamic = "force-dynamic";

type Referral = {
  id: string;
  referrer_name: string;
  referrer_email: string;
  referred_name: string;
  referred_email: string;
  status: string;
  gift_status: string;
  created_at: string;
};

export default async function ReferralsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <>
        <Topbar title="Referrals" />
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

  let allReferrals: Referral[] = [];

  if (coachId) {
    try {
      const { data } = await supabase
        .from("referrals")
        .select("id, referrer_name, referrer_email, referred_name, referred_email, status, gift_status, created_at")
        .eq("coach_id", coachId)
        .order("created_at", { ascending: false });
      allReferrals = (data ?? []) as Referral[];
    } catch { /* referrals table may not exist */ }
  }

  const totalReferrals = allReferrals.length;
  const convertedCount = allReferrals.filter((r) => r.status === "converted").length;
  const conversionRate = totalReferrals > 0 ? Math.round((convertedCount / totalReferrals) * 100) : 0;
  const giftsSent = allReferrals.filter((r) => r.gift_status === "sent" || r.gift_status === "delivered").length;

  // Build gift tracker data: group by referrer
  const referrerMap = new Map<string, { name: string; email: string; count: number; giftStatus: string }>();
  for (const r of allReferrals) {
    const existing = referrerMap.get(r.referrer_email);
    if (existing) {
      existing.count += 1;
      if (r.gift_status === "pending") existing.giftStatus = "pending";
      else if (r.gift_status === "sent" && existing.giftStatus !== "pending") existing.giftStatus = "sent";
    } else {
      referrerMap.set(r.referrer_email, {
        name: r.referrer_name,
        email: r.referrer_email,
        count: 1,
        giftStatus: r.gift_status ?? "pending",
      });
    }
  }
  const giftTrackerList = Array.from(referrerMap.values());

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const statusBadge = (status: string) => {
    switch (status) {
      case "converted": return "bg-accent-lt text-accent";
      case "pending": return "bg-c-amber-dim text-c-amber";
      case "declined": return "bg-c-red-dim text-c-red";
      default: return "bg-surface-3 text-text-3";
    }
  };

  const giftBadge = (status: string) => {
    switch (status) {
      case "delivered": return "bg-accent-lt text-accent";
      case "sent": return "bg-c-purple-dim text-c-purple";
      case "pending": return "bg-c-amber-dim text-c-amber";
      default: return "bg-surface-3 text-text-3";
    }
  };

  return (
    <>
      <Topbar title="Referrals" subtitle="Track referrals, conversions, and thank-you gifts" />
      <div className="flex-1 p-7">
        {/* Stat Cards */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <StatCard label="Total Referrals" value={totalReferrals} delta={`${totalReferrals} referrals received`} deltaType="neutral" />
          <StatCard label="Conversion Rate" value={`${conversionRate}%`} delta={`${convertedCount} converted out of ${totalReferrals}`} deltaType={conversionRate >= 50 ? "up" : "neutral"} />
          <StatCard label="Gifts Sent" value={giftsSent} delta={`${giftsSent} thank-you gifts sent`} deltaType={giftsSent > 0 ? "up" : "neutral"} />
        </div>

        <div className="grid grid-cols-[1fr_340px] gap-5">
          {/* Left column */}
          <div className="flex flex-col gap-5">
            {/* Referral Network Table */}
            <div className="overflow-hidden rounded-card border border-border bg-surface">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <div className="text-sm font-medium text-text">Referral Network</div>
                  <div className="mt-0.5 text-xs text-text-3">Clients who have referred others to your practice</div>
                </div>
              </div>
              <div className="flex flex-col">
                <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr] items-center gap-4 px-5 py-2.5 text-[0.7rem] font-medium uppercase tracking-[0.1em] text-text-3">
                  <div>Referrer</div>
                  <div>Referred Client</div>
                  <div>Status</div>
                  <div>Gift Status</div>
                </div>

                {allReferrals.length === 0 ? (
                  <div className="py-16 text-center text-sm text-text-3">
                    <div className="mb-3 text-2xl opacity-40">◌</div>
                    No referrals yet. Share your referral link to get started.
                  </div>
                ) : (
                  allReferrals.map((referral) => (
                    <div
                      key={referral.id}
                      className="grid grid-cols-[2fr_1.5fr_1fr_1fr] items-center gap-4 border-b border-border px-5 py-3.5 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full bg-accent-dim text-xs font-semibold text-accent">
                          {getInitials(referral.referrer_name)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-text">{referral.referrer_name}</div>
                          <div className="text-xs text-text-3">{referral.referrer_email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full bg-c-purple-dim text-xs font-semibold text-c-purple">
                          {getInitials(referral.referred_name)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-text">{referral.referred_name}</div>
                          <div className="text-xs text-text-3">{referral.referred_email}</div>
                        </div>
                      </div>
                      <div>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.7rem] font-medium capitalize ${statusBadge(referral.status)}`}>
                          {referral.status}
                        </span>
                      </div>
                      <div>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.7rem] font-medium capitalize ${giftBadge(referral.gift_status)}`}>
                          {referral.gift_status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">
            {/* Gift Tracker Panel */}
            <div className="overflow-hidden rounded-card border border-border bg-surface">
              <div className="border-b border-border px-5 py-4">
                <div className="text-sm font-medium text-text">Gift Tracker</div>
                <div className="mt-0.5 text-xs text-text-3">Thank-you gifts by referrer</div>
              </div>
              <div className="p-4">
                {giftTrackerList.length === 0 ? (
                  <div className="py-8 text-center text-sm text-text-3">No gifts to track yet</div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {giftTrackerList.map((referrer) => (
                      <div key={referrer.email} className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-2">
                        <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full bg-accent-dim text-xs font-semibold text-accent">
                          {getInitials(referrer.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-text">{referrer.name}</div>
                          <div className="text-xs text-text-3">{referrer.count} {referrer.count === 1 ? "referral" : "referrals"}</div>
                        </div>
                        <span className={`inline-flex flex-shrink-0 rounded-full px-2.5 py-1 text-[0.7rem] font-medium capitalize ${giftBadge(referrer.giftStatus)}`}>
                          {referrer.giftStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Referral Programme Card */}
            <div className="overflow-hidden rounded-card border border-border bg-surface">
              <div className="border-b border-border px-5 py-4">
                <div className="text-sm font-medium text-text">Referral Programme</div>
                <div className="mt-0.5 text-xs text-text-3">Encourage your clients to spread the word</div>
              </div>
              <div className="p-5">
                <p className="mb-4 text-[0.8125rem] leading-relaxed text-text-2">
                  When a client refers someone who books a session, they receive a personalised
                  thank-you gift as a token of appreciation.
                </p>
                <div className="mb-4 rounded-lg bg-accent-lt p-4">
                  <div className="mb-1.5 text-xs font-medium uppercase tracking-[0.08em] text-accent">How it works</div>
                  <ol className="flex flex-col gap-2 text-[0.8125rem] text-text-2">
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-accent text-[0.6rem] font-medium text-white">1</span>
                      Share your referral link with existing clients
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-accent text-[0.6rem] font-medium text-white">2</span>
                      They refer a friend or colleague
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-accent text-[0.6rem] font-medium text-white">3</span>
                      Once converted, a thank-you gift is sent
                    </li>
                  </ol>
                </div>
                <div>
                  <div className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-text-3">Your referral link</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 truncate rounded-lg border border-border bg-surface-2 px-3.5 py-2 font-mono text-xs text-text-3">
                      https://coachos.app/refer/{coachId ?? "..."}
                    </div>
                    <CopyButton text={`https://coachos.app/refer/${coachId ?? ""}`} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
