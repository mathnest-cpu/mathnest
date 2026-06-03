import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubscribeButton } from "@/components/SubscribeButton";
import { cancelMySubscription, reconcileMyPlan } from "@/lib/subscription.functions";
import { toast } from "sonner";
import { format } from "date-fns";
import { Sparkles, AlertCircle } from "lucide-react";

export function SubscriptionStatusBar() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const reconcile = useServerFn(reconcileMyPlan);
  const cancel = useServerFn(cancelMySubscription);

  // Auto-downgrade lapsing plans on dashboard load.
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

  const isPaid = profile?.plan === "paid";
  const isLapsing = profile?.plan_status === "lapsing";

  const handleCancel = async () => {
    if (!confirm("Cancel your subscription? You'll keep access until the end of your current billing cycle.")) return;
    try {
      await cancel();
      toast.success("Subscription cancelled — access continues until billing cycle ends.");
      qc.invalidateQueries({ queryKey: ["my-plan"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not cancel.");
    }
  };

  return (
    <div className="space-y-3">
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${isPaid ? "bg-emerald-500" : "bg-muted-foreground/50"}`} />
          <div className="text-sm">
            {isPaid ? (
              <>
                <span className="font-medium">Paid plan</span>
                {profile?.billing_cycle_end && (
                  <span className="text-muted-foreground">
                    {" "}· {isLapsing ? "Access until" : "Renews"} {format(new Date(profile.billing_cycle_end), "MMM d, yyyy")}
                  </span>
                )}
                {isLapsing && (
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">Cancelling</span>
                )}
              </>
            ) : (
              <>
                <span className="font-medium">Free plan</span>
                <span className="text-muted-foreground"> · 1 worksheet available</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isPaid ? (
            !isLapsing && (
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                Cancel subscription
              </Button>
            )
          ) : (
            <SubscribeButton email={profile?.email ?? undefined} name={profile?.full_name ?? undefined} size="sm" />
          )}
        </div>
      </Card>

      {!isPaid && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-amber-300 bg-amber-50 p-4 dark:border-amber-700/40 dark:bg-amber-950/30">
          <div className="flex items-start gap-2 text-sm">
            <Sparkles className="mt-0.5 h-4 w-4 text-amber-600" />
            <span>Upgrade to access all 10 worksheets this month and unlock progress-based learning.</span>
          </div>
          <SubscribeButton email={profile?.email ?? undefined} name={profile?.full_name ?? undefined} label="Upgrade now" size="sm" />
        </Card>
      )}

      {isPaid && isLapsing && profile?.billing_cycle_end && (
        <Card className="flex items-start gap-2 border-muted-foreground/30 bg-muted/30 p-3 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <span>
            Your subscription is cancelled. You'll keep full access until {format(new Date(profile.billing_cycle_end), "MMM d, yyyy")}.
          </span>
        </Card>
      )}
    </div>
  );
}
