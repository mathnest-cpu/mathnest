import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

type RzpSub = {
  id: string;
  status?: string;
  current_end?: number;
  charge_at?: number;
  notes?: { user_id?: string; email?: string };
};
type RzpPayment = {
  id: string;
  email?: string;
  contact?: string;
  notes?: { user_id?: string; email?: string };
  subscription_id?: string;
};
type RzpPayload = {
  event: string;
  payload?: {
    subscription?: { entity?: RzpSub };
    payment?: { entity?: RzpPayment };
  };
};

type SupabaseAdmin = Awaited<
  ReturnType<typeof import("@/integrations/supabase/client.server")["supabaseAdmin"]["from"]>
> extends never
  ? never
  : typeof import("@/integrations/supabase/client.server")["supabaseAdmin"];

async function updateProfile(
  admin: SupabaseAdmin,
  match: { userId?: string | null; email?: string | null; subscriptionId?: string | null },
  patch: Record<string, unknown>,
  context: string,
): Promise<boolean> {
  // Try by user_id first (from notes), then subscription_id, then email.
  const attempts: Array<{ col: string; val: string }> = [];
  if (match.userId) attempts.push({ col: "id", val: match.userId });
  if (match.subscriptionId) attempts.push({ col: "subscription_id", val: match.subscriptionId });
  if (match.email) attempts.push({ col: "email", val: match.email.toLowerCase() });

  for (const a of attempts) {
    const q = admin.from("profiles").update(patch);
    const { data, error } =
      a.col === "email"
        ? await q.ilike(a.col, a.val).select("id")
        : await q.eq(a.col, a.val).select("id");
    if (error) {
      console.error(`[razorpay-webhook] ${context} update by ${a.col} failed:`, error.message);
      continue;
    }
    if (data && data.length > 0) {
      console.log(`[razorpay-webhook] ${context} matched ${data.length} profile(s) by ${a.col}`);
      return true;
    }
  }
  console.warn(`[razorpay-webhook] ${context} no profile matched`, match);
  return false;
}

export const Route = createFileRoute("/api/public/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) {
          console.error("[razorpay-webhook] RAZORPAY_WEBHOOK_SECRET not configured");
          return new Response("Server misconfigured", { status: 500 });
        }

        const signature = request.headers.get("x-razorpay-signature");
        const body = await request.text();
        if (!signature) return new Response("Missing signature", { status: 401 });

        const expected = createHmac("sha256", secret).update(body).digest("hex");
        const a = Buffer.from(expected, "utf8");
        const b = Buffer.from(signature, "utf8");
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          console.warn("[razorpay-webhook] invalid signature");
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: RzpPayload;
        try {
          payload = JSON.parse(body) as RzpPayload;
        } catch (e) {
          console.error("[razorpay-webhook] invalid JSON", e);
          return new Response("ok");
        }

        const sub = payload?.payload?.subscription?.entity;
        const pay = payload?.payload?.payment?.entity;
        const userId = sub?.notes?.user_id ?? pay?.notes?.user_id ?? null;
        const email = sub?.notes?.email ?? pay?.email ?? pay?.notes?.email ?? null;
        const subscriptionId = sub?.id ?? pay?.subscription_id ?? null;

        console.log(
          `[razorpay-webhook] event=${payload.event} userId=${userId ?? "-"} email=${email ?? "-"} sub=${subscriptionId ?? "-"}`,
        );

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          switch (payload.event) {
            case "subscription.activated":
            case "subscription.charged":
            case "subscription.resumed": {
              if (!sub) break;
              const next = sub.current_end ?? sub.charge_at;
              await updateProfile(
                supabaseAdmin,
                { userId, email, subscriptionId: sub.id },
                {
                  plan: "paid",
                  plan_status: "active",
                  subscription_id: sub.id,
                  billing_cycle_end: next ? new Date(next * 1000).toISOString() : null,
                },
                payload.event,
              );
              break;
            }
            case "subscription.cancelled":
            case "subscription.halted": {
              if (!sub) break;
              await updateProfile(
                supabaseAdmin,
                { userId, email, subscriptionId: sub.id },
                { plan_status: "lapsing" },
                payload.event,
              );
              break;
            }
            case "subscription.completed": {
              if (!sub) break;
              await updateProfile(
                supabaseAdmin,
                { userId, email, subscriptionId: sub.id },
                {
                  plan: "free",
                  plan_status: "active",
                  subscription_id: null,
                  billing_cycle_end: null,
                },
                payload.event,
              );
              break;
            }
            case "payment.captured": {
              // Fallback path — only set plan; don't overwrite subscription_id/cycle.
              if (!pay) break;
              await updateProfile(
                supabaseAdmin,
                { userId, email, subscriptionId: pay.subscription_id ?? null },
                { plan: "paid", plan_status: "active" },
                payload.event,
              );
              break;
            }
            default:
              // ignore other events
              break;
          }
        } catch (e) {
          console.error("[razorpay-webhook] handler error", e);
        }

        // Always 200 so Razorpay doesn't retry on transient issues.
        return new Response("ok", { status: 200 });
      },
    },
  },
});
