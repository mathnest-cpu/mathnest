import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { SubscribeButton } from "@/components/SubscribeButton";
import { reconcileMyPlan } from "@/lib/subscription.functions";
import { format, differenceInCalendarDays } from "date-fns";

export function SubscriptionStatusBar() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const reconcile = useServerFn(reconcileMyPlan);

  useEffect(() => {
    if (!user) return;
    reconcile().then((r) => {
      if (r?.changed) qc.invalidateQueries({ queryKey: ["my-plan"] });
    }).catch(() => {});
  }, [user, reconcile, qc]);

  const { data: profile } = useQuery({
    queryKey: ["my-plan", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("plan, plan_status, billing_cycle_end, full_name, email")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (!profile) return null;

  const isPaid = profile.plan === "paid";
  const isLapsing = profile.plan_status === "lapsing";
  const endDate = profile.billing_cycle_end ? new Date(profile.billing_cycle_end) : null;
  const daysLeft = endDate ? differenceInCalendarDays(endDate, new Date()) : null;

  // Paid, cancelled/lapsing
  if (isPaid && isLapsing && endDate) {
    return (
      <Card
        className="flex flex-wrap items-center justify-between gap-3 p-4"
        style={{ background: "#242938", border: "1px solid #2e3447" }}
      >
        <span style={{ color: "#9FE1CB", fontSize: 13 }}>
          Your access ends on {format(endDate, "MMM d, yyyy")}. Resubscribe to keep full access.
        </span>
        <SubscribeButton
          email={profile.email ?? undefined}
          name={profile.full_name ?? undefined}
          label="Resubscribe"
          size="sm"
        />
      </Card>
    );
  }

  // Paid, active, within 7 days of renewal
  if (isPaid && !isLapsing && endDate && daysLeft !== null && daysLeft <= 7) {
    return (
      <div style={{ color: "#6b7694", fontSize: 12 }}>
        Your plan renews on {format(endDate, "MMM d, yyyy")}
      </div>
    );
  }

  // Paid, active, >7 days: nothing
  if (isPaid) return null;

  // Free tier
  return (
    <Card
      className="flex flex-wrap items-center justify-between gap-3 p-4"
      style={{ background: "#242938", border: "1px solid #2e3447" }}
    >
      <span style={{ color: "#9FE1CB", fontSize: 13 }}>
        Free plan · 1 worksheet available
      </span>
      <Link
        to="/plans"
        className="rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
        style={{ background: "#1D9E75", color: "#ffffff" }}
      >
        Upgrade to ₹299/month
      </Link>
    </Card>
  );
}
