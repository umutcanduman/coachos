import { redirect } from "next/navigation";

// Finance page — redirects to the Payments tab by default.
// Tabs are handled via search params on the payments/referrals pages themselves,
// but for this combined view we use a simple redirect pattern.
export default function FinancePage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const tab = searchParams.tab ?? "payments";
  if (tab === "referrals") {
    redirect("/dashboard/finance/referrals");
  }
  redirect("/dashboard/finance/payments");
}
