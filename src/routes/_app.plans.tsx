import { createFileRoute } from "@tanstack/react-router";
import { PlansComparison } from "@/components/student/PlansComparison";

export const Route = createFileRoute("/_app/plans")({
  component: PlansPage,
  head: () => ({ meta: [{ title: "Plans · MathNest" }] }),
});

function PlansPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Subscription plans</h1>
        <p className="text-sm text-muted-foreground">Choose the plan that fits you</p>
      </div>
      <PlansComparison />
    </div>
  );
}
