import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/create-order")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => ({}));
          const amount = Number(body?.amount);
          const currency = typeof body?.currency === "string" ? body.currency : "INR";
          const receipt =
            typeof body?.receipt === "string" ? body.receipt : `rcpt_${Date.now()}`;

          if (!Number.isFinite(amount) || amount < 100) {
            return Response.json(
              { error: "Amount must be an integer >= 100 (in paise)." },
              { status: 400 },
            );
          }

          const keyId = process.env.RAZORPAY_KEY_ID;
          const keySecret = process.env.RAZORPAY_KEY_SECRET;
          if (!keyId || !keySecret) {
            return Response.json(
              { error: "Razorpay credentials not configured." },
              { status: 500 },
            );
          }

          const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
          const res = await fetch("https://api.razorpay.com/v1/orders", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${auth}`,
            },
            body: JSON.stringify({ amount: Math.round(amount), currency, receipt }),
          });

          if (res.status === 401) {
            return Response.json({ error: "Razorpay auth failed." }, { status: 401 });
          }
          if (!res.ok) {
            const text = await res.text();
            console.error("Razorpay create order failed:", res.status, text);
            return Response.json({ error: "Failed to create order." }, { status: 500 });
          }

          const order = (await res.json()) as {
            id: string;
            amount: number;
            currency: string;
          };

          return Response.json({
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: keyId,
          });
        } catch (err) {
          console.error("create-order error:", err);
          return Response.json({ error: "Internal error." }, { status: 500 });
        }
      },
    },
  },
});
