import { CheckoutForm } from "@/components/checkout-form";

export default function CheckoutPage() {
  return (
    <section className="checkout-shell">
      <div className="page-prose">
        <h1>Checkout</h1>
        <p>
          Fresh-cook policy applies: all orders are prepared after confirmation. Slot
          eligibility enforces dish lead-time and payment confirmation buffer.
        </p>
      </div>

      <CheckoutForm />
    </section>
  );
}
