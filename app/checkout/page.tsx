import { CheckoutForm } from "@/components/checkout-form";
import { getCurrentMessages } from "@/lib/i18n";

export default async function CheckoutPage() {
  const { locale, messages } = await getCurrentMessages();

  return (
    <section className="checkout-shell">
      <div className="page-prose">
        <h1>{messages.checkoutPage.title}</h1>
        <p>{messages.checkoutPage.intro}</p>
      </div>

      <CheckoutForm locale={locale} />
    </section>
  );
}
