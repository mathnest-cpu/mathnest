import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createRazorpayOrder, verifyRazorpayPayment } from "@/lib/razorpay.functions";


declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

interface Props {
  /** Amount in paise (e.g. 50000 = ₹500.00). Minimum 100. */
  amount: number;
  currency?: string;
  name?: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  onSuccess?: (payment: { order_id: string; payment_id: string }) => void;
  label?: string;
}

export function RazorpayCheckoutButton({
  amount,
  currency = "INR",
  name = "MathNest",
  description = "Payment",
  prefill,
  onSuccess,
  label = "Pay now",
}: Props) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void loadScript();
  }, []);

  const handleClick = async () => {
    setLoading(true);
    try {
      const ok = await loadScript();
      if (!ok || !window.Razorpay) {
        toast.error("Could not load Razorpay. Please try again.");
        return;
      }

      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, currency }),
      });
      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({}));
        toast.error(err.error ?? "Failed to start payment.");
        return;
      }
      const order = (await orderRes.json()) as {
        order_id: string;
        amount: number;
        currency: string;
        key_id: string;
      };

      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name,
        description,
        order_id: order.order_id,
        prefill,
        modal: {
          ondismiss: () => {
            toast.message("Payment cancelled.");
          },
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const verifyRes = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const verify = (await verifyRes.json().catch(() => ({}))) as {
            success?: boolean;
            error?: string;
          };
          if (verifyRes.ok && verify.success) {
            toast.success("Payment successful!");
            onSuccess?.({
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
            });
          } else {
            toast.error(verify.error ?? "Payment verification failed.");
          }
        },
      });

      // Listen for payment failure events.
      const rzpAny = rzp as unknown as {
        on?: (evt: string, cb: (resp: { error?: { description?: string } }) => void) => void;
      };
      rzpAny.on?.("payment.failed", (resp) => {
        toast.error(resp?.error?.description ?? "Payment failed.");
      });

      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={loading} size="lg">
      {loading ? "Loading…" : label}
    </Button>
  );
}
