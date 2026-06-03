import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RAZORPAY_API = "https://api.razorpay.com/v1";

function rzpAuthHeader() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay not configured.");
  return {
    keyId,
    header: "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64"),
  };
}

async function rzpFetch(path: string, init: RequestInit = {}) {
  const { header } = rzpAuthHeader();
  const res = await fetch(`${RAZORPAY_API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: header,
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`Razorpay ${path} failed:`, res.status, text);
    throw new Error(`Razorpay error (${res.status})`);
  }
  return res.json();
}

async function getOrCreateMonthlyPlan(): Promise<string> {
  const envPlan = process.env.RAZORPAY_PLAN_ID;
  if (envPlan) return envPlan;
  // Create a fresh plan if none configured. Idempotent enough for MVP.
  const plan = await rzpFetch("/plans", {
    method: "POST",
    body: JSON.stringify({
      period: "monthly",
      interval: 1,
      item: {
        name: "MathNest Monthly",
        amount: 29900,
        currency: "INR",
        description: "MathNest monthly subscription",
      },
    }),
  });
  return plan.id as string;
}

export const createMonthlySubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { keyId } = rzpAuthHeader();
    const planId = await getOrCreateMonthlyPlan();

    const sub = await rzpFetch("/subscriptions", {
      method: "POST",
      body: JSON.stringify({
        plan_id: planId,
        total_count: 120,
        customer_notify: 1,
        notes: { user_id: userId },
      }),
    });

    return {
      subscription_id: sub.id as string,
      key_id: keyId,
    };
  });

export const cancelMySubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("subscription_id, plan, billing_cycle_end")
      .eq("id", userId)
      .single();
    if (error) throw new Error(error.message);
    if (!profile?.subscription_id) throw new Error("No active subscription.");

    // Cancel at cycle end so the student keeps access.
    await rzpFetch(`/subscriptions/${profile.subscription_id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ cancel_at_cycle_end: 1 }),
    });

    const { error: upErr } = await supabaseAdmin
      .from("profiles")
      .update({ plan_status: "lapsing" })
      .eq("id", userId);
    if (upErr) throw new Error(upErr.message);

    return { ok: true, billing_cycle_end: profile.billing_cycle_end };
  });

/**
 * Runs on every student dashboard load — if their paid period ended and they
 * cancelled, downgrade them to free. Safe for free users (no-op).
 */
export const reconcileMyPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("plan, plan_status, billing_cycle_end")
      .eq("id", userId)
      .single();
    if (error) throw new Error(error.message);
    if (!profile) return { changed: false };

    const expired =
      profile.billing_cycle_end &&
      new Date(profile.billing_cycle_end).getTime() < Date.now();

    if (profile.plan === "paid" && profile.plan_status === "lapsing" && expired) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("profiles")
        .update({
          plan: "free",
          plan_status: "active",
          subscription_id: null,
          billing_cycle_end: null,
        })
        .eq("id", userId);
      return { changed: true };
    }
    return { changed: false };
  });
