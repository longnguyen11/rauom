export default function HowOrderingWorksPage() {
  return (
    <article className="page-prose">
      <h1>How Ordering Works</h1>
      <ol>
        <li>Browse dishes and add items to cart.</li>
        <li>Select delivery or pickup and choose an eligible timeslot.</li>
        <li>Checkout validates lead-time, capacity, distance, and tax estimate.</li>
        <li>Submit with manual payment method (cash, Zelle, Venmo).</li>
        <li>Order enters pending confirmation, then kitchen begins after confirmation.</li>
      </ol>
      <p>
        Lead-time defaults to at least 1 day, and some dishes require 2-3 days.
      </p>
    </article>
  );
}
