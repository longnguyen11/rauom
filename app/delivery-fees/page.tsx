import { getCurrentMessages } from "@/lib/i18n";

export default async function DeliveryFeesPage() {
  const { messages } = await getCurrentMessages();

  return (
    <article className="page-prose">
      <h1>{messages.deliveryFees.title}</h1>
      <p>{messages.deliveryFees.origin}</p>
      <p>{messages.deliveryFees.cutoff}</p>
      <ul>
        <li>{messages.deliveryFees.tier1}</li>
        <li>{messages.deliveryFees.tier2}</li>
        <li>{messages.deliveryFees.rounding}</li>
      </ul>
      <p>{messages.deliveryFees.pickupFallback}</p>
    </article>
  );
}
