export default function DeliveryFeesPage() {
  return (
    <article className="page-prose">
      <h1>Delivery Area and Fees</h1>
      <p>Origin: 720 Orange Ave, Longwood, FL 32750.</p>
      <p>Driving distance cutoff: 30.0 miles (delivery unavailable beyond that).</p>
      <ul>
        <li>0-10 miles: base $4.00 plus $0.90 per mile</li>
        <li>10-30 miles: $13.00 plus $0.65 per mile beyond 10</li>
        <li>Final fee rounds to nearest $0.50</li>
      </ul>
      <p>If delivery is unavailable, pickup remains available at checkout.</p>
    </article>
  );
}
