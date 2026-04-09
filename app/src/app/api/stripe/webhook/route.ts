import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import Stripe from "stripe";

// Use service role key for webhook — bypasses RLS
function getAdminSupabase() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  const supabase = getAdminSupabase();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const coachId = session.metadata?.coach_id;
    const moduleKey = session.metadata?.module_key;

    if (!coachId || !moduleKey) {
      console.error("Missing metadata in checkout session:", session.id);
      return NextResponse.json({ received: true });
    }

    // Idempotency: if this session has already been processed, exit early.
    // Stripe retries webhooks on transient failures and we must not double
    // activate / double credit a module.
    const { data: existingPayment } = await supabase
      .from("module_payments")
      .select("status")
      .eq("stripe_session_id", session.id)
      .maybeSingle();
    if (existingPayment?.status === "paid") {
      return NextResponse.json({ received: true, idempotent: true });
    }

    // Update payment record
    await supabase
      .from("module_payments")
      .update({
        status: "paid",
        stripe_payment_intent_id:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null,
      })
      .eq("stripe_session_id", session.id);

    // Activate the module
    await supabase.from("coach_modules").upsert(
      {
        coach_id: coachId,
        module_key: moduleKey,
        is_enabled: true,
        payment_status: "paid",
        payment_amount: (session.amount_total ?? 0) / 100,
        payment_date: new Date().toISOString(),
        payment_reference: session.id,
        activated_at: new Date().toISOString(),
        deactivated_at: null,
        activated_by: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "coach_id,module_key" }
    );
  }

  return NextResponse.json({ received: true });
}
