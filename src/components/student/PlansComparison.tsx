import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubscribeButton } from "@/components/SubscribeButton";
import { Check, X, Info } from "lucide-react";

export function PlansComparison() {
  const { user } = useAuth();
  const { data: profile } = useQuery({
    queryKey: ["my-plan", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("plan, email, full_name")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const isPaid = profile?.plan === "paid";

  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold">Subscription plans</h2>
      <p className="text-sm text-muted-foreground">How free and paid tiers compare</p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {/* Free */}
        <div className="rounded-xl border p-5">
          <div className="text-sm font-medium">Free</div>
          <div className="mt-1 text-3xl font-semibold">
            ₹0 <span className="text-sm font-normal text-muted-foreground">/ month</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Auto-assigned on signup via invite</p>
          <ul className="mt-4 space-y-2 text-sm">
            <Feature ok>1 worksheet per month</Feature>
            <Feature ok>Always the latest worksheet</Feature>
            <Feature ok>Score sync to dashboard</Feature>
            <Feature>9 worksheets locked</Feature>
            <Feature>Progress unlocking</Feature>
          </ul>
          <Button className="mt-5 w-full" variant="outline" disabled={!isPaid}>
            {isPaid ? "Free tier" : "Current plan"}
          </Button>
        </div>

        {/* Paid */}
        <div className="rounded-xl border-2 border-primary p-5">
          <span className="inline-block rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
            Recommended
          </span>
          <div className="mt-2 text-sm font-medium">Monthly</div>
          <div className="mt-1 text-3xl font-semibold">
            ₹299 <span className="text-sm font-normal text-muted-foreground">/ month</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Full access, cancel anytime, no refunds</p>
          <ul className="mt-4 space-y-2 text-sm">
            <Feature ok>10 worksheets per month</Feature>
            <Feature ok>Latest worksheet always free</Feature>
            <Feature ok>Progress-based unlocking</Feature>
            <Feature ok>Score sync to dashboard</Feature>
            <Feature ok>Access until billing cycle ends</Feature>
          </ul>
          <div className="mt-5">
            {isPaid ? (
              <Button className="w-full" disabled>Current plan</Button>
            ) : (
              <SubscribeButton
                email={profile?.email ?? undefined}
                name={profile?.full_name ?? undefined}
                label="Upgrade — ₹299/month"
              />
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-start gap-2 border-t pt-4 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>All payments via Razorpay. Cancel anytime from your dashboard. No refunds on unused periods.</span>
      </div>
    </Card>
  );
}

function Feature({ children, ok }: { children: React.ReactNode; ok?: boolean }) {
  return (
    <li className="flex items-start gap-2">
      {ok ? (
        <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
      ) : (
        <X className="mt-0.5 h-4 w-4 text-muted-foreground" />
      )}
      <span className={ok ? "" : "text-muted-foreground"}>{children}</span>
    </li>
  );
}
