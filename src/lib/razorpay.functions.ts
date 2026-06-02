import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHmac, timingSafeEqual } from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ALLOWED_CURRENCIES = ["INR"] as const;

const CreateOrderSchema = z.object({
  amount: z.number().int().min(100).max(10_000_000),
  currency: z.enum(ALLOWED_CURRENCIES).default("INR"),
  receipt: z
    .string()
    .min(1)
    .max(40)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
});

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => CreateOrderSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error("Razorpay credentials not configured.");
    }

    const receipt = data.receipt ?? `rcpt_${Date.now()}`;
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: data.amount,
        currency: data.currency,
        receipt,
        notes: { user_id: userId },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Razorpay create order failed:", res.status, text);
      throw new Error("Failed to create order.");
    }

    const order = (await res.json()) as {
      id: string;
      amount: number;
      currency: string;
    };

    return {
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: keyId,
    };
  });

const VerifySchema = z.object({
  razorpay_order_id: z.string().min(1).max(128),
  razorpay_payment_id: z.string().min(1).max(128),
  razorpay_signature: z.string().min(1).max(256),
});

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => VerifySchema.parse(input))
  .handler(async ({ data }) => {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) throw new Error("Server not configured.");

    const expected = createHmac("sha256", keySecret)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest("hex");

    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(data.razorpay_signature, "utf8");
    const ok = a.length === b.length && timingSafeEqual(a, b);

    if (!ok) throw new Error("Invalid signature.");

    return {
      success: true as const,
      order_id: data.razorpay_order_id,
      payment_id: data.razorpay_payment_id,
    };
  });
