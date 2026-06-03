import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/policy")({
  component: PolicyPage,
  head: () => ({
    meta: [
      { title: "Cancellation & Refund Policy · MathNest" },
      { name: "description", content: "MathNest cancellation and refund policy for subscriptions." },
    ],
  }),
});

function PolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-2xl px-6 py-12">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back to home</Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Cancellation & Refund Policy</h1>
        <div className="prose prose-neutral mt-6 max-w-none space-y-4 text-sm leading-relaxed text-foreground">
          <p>You may cancel your MathNest subscription at any time from your student dashboard. Cancellations take effect at the end of your current billing cycle. You will keep full access until the end of the period you have paid for.</p>
          <p>All payments made to MathNest are non-refundable. We do not offer full or partial refunds for any unused portion of a subscription period, including in cases of early cancellation, inactivity, or dissatisfaction. By subscribing, you acknowledge and agree to this no-refund policy.</p>
          <p>Students on the free tier may access one worksheet per month at no charge.</p>
          <p>If a subscription lapses, worksheet access is restricted to the free tier at the end of the current billing cycle. No data is deleted — progress and history remain intact.</p>
          <p>For billing queries contact: <a className="text-primary underline" href="mailto:Nisha.ssc.salhotra@gmail.com">Nisha.ssc.salhotra@gmail.com</a></p>
        </div>
      </main>
    </div>
  );
}
