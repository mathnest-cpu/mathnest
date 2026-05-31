import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { RazorpayCheckoutButton } from "@/components/RazorpayCheckoutButton";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
  head: () => ({
    meta: [
      { title: "Checkout — MathNest" },
      { name: "description", content: "Securely pay for your MathNest sessions." },
    ],
  }),
});

function CheckoutPage() {
  const [rupees, setRupees] = useState(500);
  const [lastPayment, setLastPayment] = useState<{ order_id: string; payment_id: string } | null>(
    null,
  );
  const amountPaise = Math.max(100, Math.round(rupees * 100));

  return (
    <div className="mx-auto max-w-md p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Checkout</h1>
        <p className="text-sm text-muted-foreground">Pay securely with Razorpay.</p>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Amount (INR)</span>
        <input
          type="number"
          min={1}
          value={rupees}
          onChange={(e) => setRupees(Number(e.target.value) || 0)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </label>

      <RazorpayCheckoutButton
        amount={amountPaise}
        description={`MathNest payment of ₹${rupees}`}
        onSuccess={setLastPayment}
      />

      {lastPayment && (
        <div className="rounded-md border border-border p-4 text-sm">
          <div className="font-medium text-green-700">Payment successful ✓</div>
          <div className="mt-2 text-muted-foreground break-all">
            Order: {lastPayment.order_id}
            <br />
            Payment: {lastPayment.payment_id}
          </div>
        </div>
      )}
    </div>
  );
}
