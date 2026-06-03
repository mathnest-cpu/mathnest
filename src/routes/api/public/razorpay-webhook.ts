import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

export const Route = createFileRoute("/api/public/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) {
          console.error("RAZORPAY_WEBHOOK_SECRET not configured");
          return new Response("Server misconfigured", { status: 500 });
        }

        const signature = request.headers.get("x-razorpay-signature");
        const body = await request.text();
        if (!signature) return new Response("Missing signature", { status: 401 });

        const expected = createHmac("sha256", secret).update(body).digest("hex");
        const a = Buffer.from(expected, "utf8");
        const b = Buffer.from(signature, "utf8");
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          return new Response("Invalid signature", { status: 401 });
        }

        type RzpSub = {
          id: string;
          status: string;
          current_end?: number;
          charge_at?: number;
          notes?: { user_id?: string };
        };
        type RzpPayload = {
          event: string;
          payload?: { subscription?: { entity?: RzpSub } };
        };
        const payload = JSON.parse(body) as RzpPayload;
        const sub = payload?.payload?.subscription?.entity;
        if (!sub) return new Response("ok");

        const userId = sub.notes?.user_id;
        if (!userId) return new Response("ok");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        switch (payload.event) {
          case "subscription.charged":
          case "subscription.activated":
          case "subscription.resumed": {
            const next = sub.current_end ?? sub.charge_at;
            await supabaseAdmin
              .from("profiles")
              .update({
                plan: "paid",
                plan_status: "active",
                subscription_id: sub.id,
                billing_cycle_end: next ? new Date(next * 1000).toISOString() : null,
              })
              .eq("id", userId);
            break;
          }
          case "subscription.cancelled":
          case "subscription.halted": {
            await supabaseAdmin
              .from("profiles")
              .update({ plan_status: "lapsing" })
              .eq("id", userId);
            break;
          }
          case "subscription.completed": {
            await supabaseAdmin
              .from("profiles")
              .update({
                plan: "free",
                plan_status: "active",
                subscription_id: null,
                billing_cycle_end: null,
              })
              .eq("id", userId);
            break;
          }
        }

        return new Response("ok");
      },
    },
  },
});
