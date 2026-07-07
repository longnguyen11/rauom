import { CheckoutForm } from "@/components/checkout-form";
import { getCurrentMessages } from "@/lib/i18n";
import { listBlackoutDates } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const { locale, messages } = await getCurrentMessages();
  const blackoutDates = await listBlackoutDates();

  return (
    <section className="checkout-shell">
      <div className="page-prose">
        <h1>{messages.checkoutPage.title}</h1>
        <p>{messages.checkoutPage.intro}</p>
      </div>

      <CheckoutForm
        locale={locale}
        blackoutDates={blackoutDates.map((date) => date.dateLocal)}
      />
    </section>
  );
}
