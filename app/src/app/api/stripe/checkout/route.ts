import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { AVAILABLE_MODULES } from "@/lib/modules";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: coach } = await supabase
      .from("coaches")
      .select("id, email, name")
      .eq("user_id", user.id)
      .single();

    if (!coach) {
      return NextResponse.json(
        { error: "Coach profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { moduleKey } = body;

    if (!moduleKey || typeof moduleKey !== "string") {
      return NextResponse.json(
        { error: "Invalid module key" },
        { status: 400 }
      );
    }

    const moduleDef = AVAILABLE_MODULES.find(
      (m) => m.key === moduleKey && m.available
    );
    if (!moduleDef) {
      return NextResponse.json(
        { error: "Module not found or unavailable" },
        { status: 400 }
      );
    }

    // Prevent duplicate purchases for an already-active module.
    const { data: existingModule } = await supabase
      .from("coach_modules")
      .select("payment_status, is_enabled")
      .eq("coach_id", coach.id)
      .eq("module_key", moduleKey)
      .maybeSingle();
    if (existingModule?.payment_status === "paid" && existingModule.is_enabled) {
      return NextResponse.json(
        { error: "Module already active" },
        { status: 409 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: coach.email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `${moduleDef.name} — CoachOS Pro Tool`,
              description: moduleDef.description,
            },
            unit_amount: moduleDef.price * 100,
          },
          quantity: 1,
        },
      ],
      metadata: {
        coach_id: coach.id,
        module_key: moduleKey,
        coach_user_id: user.id,
      },
      success_url: `${appUrl}/dashboard/pro-tools?success=true&module=${moduleKey}`,
      cancel_url: `${appUrl}/dashboard/pro-tools?cancelled=true`,
    });

    // Create a pending payment record
    await supabase.from("module_payments").insert({
      coach_id: coach.id,
      module_key: moduleKey,
      amount: moduleDef.price,
      stripe_session_id: session.id,
      status: "pending",
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
