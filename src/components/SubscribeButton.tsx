import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createMonthlySubscription } from "@/lib/subscription.functions";

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
  email?: string;
  name?: string;
  label?: string;
  variant?: "default" | "outline" | "secondary";
  size?: "sm" | "default" | "lg";
}

export function SubscribeButton({ email, name, label = "Upgrade to ₹299/month", variant = "default", size = "default" }: Props) {
  const [loading, setLoading] = useState(false);
  const createSub = useServerFn(createMonthlySubscription);
  const qc = useQueryClient();

  useEffect(() => { void loadScript(); }, []);

  const onClick = async () => {
    setLoading(true);
    try {
      const ok = await loadScript();
      if (!ok || !window.Razorpay) {
        toast.error("Could not load Razorpay.");
        return;
      }
      const { subscription_id, key_id } = await createSub();
      const rzp = new window.Razorpay({
        key: key_id,
        subscription_id,
        name: "MathNest",
        description: "Monthly subscription · ₹299",
        prefill: { email, name },
        handler: () => {
          toast.success("Subscription started! Activation will reflect shortly.");
          // Refresh dashboard data — webhook updates plan async.
          setTimeout(() => qc.invalidateQueries(), 1500);
        },
        modal: { ondismiss: () => toast.message("Checkout closed.") },
      });
      rzp.open();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start checkout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={onClick} disabled={loading} variant={variant} size={size}>
      {loading ? "Loading…" : label}
    </Button>
  );
}
