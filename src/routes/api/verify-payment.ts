import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

export const Route = createFileRoute("/api/verify-payment")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => ({}));
          const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body ?? {};

          if (
            typeof razorpay_order_id !== "string" ||
            typeof razorpay_payment_id !== "string" ||
            typeof razorpay_signature !== "string"
          ) {
            return Response.json({ error: "Missing fields." }, { status: 400 });
          }

          const keySecret = process.env.RAZORPAY_KEY_SECRET;
          if (!keySecret) {
            return Response.json({ error: "Server not configured." }, { status: 500 });
          }

          const expected = createHmac("sha256", keySecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

          const a = Buffer.from(expected, "utf8");
          const b = Buffer.from(razorpay_signature, "utf8");
          const ok = a.length === b.length && timingSafeEqual(a, b);

          if (!ok) {
            return Response.json({ success: false, error: "Invalid signature." }, { status: 400 });
          }

          return Response.json({
            success: true,
            order_id: razorpay_order_id,
            payment_id: razorpay_payment_id,
          });
        } catch (err) {
          console.error("verify-payment error:", err);
          return Response.json({ error: "Internal error." }, { status: 500 });
        }
      },
    },
  },
});
