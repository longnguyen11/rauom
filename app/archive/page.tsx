import Image from "next/image";
import Link from "next/link";

import { listArchivedDishes } from "@/lib/dishes";

export default async function ArchivePage() {
  const archived = await listArchivedDishes();

  return (
    <section className="page-prose">
      <h1>Archive</h1>
      <p>
        Archived dishes stay searchable so returning customers can request repeats in
        future rotations.
      </p>

      {archived.length === 0 ? (
        <p>No archived dishes yet.</p>
      ) : (
        <div className="dish-grid">
          {archived.map((dish) => (
            <article key={dish.id} className="dish-card">
              <Image
                src={
                  dish.images[0]?.url ??
                  "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=900&q=80"
                }
                alt={dish.images[0]?.altText ?? dish.name}
                width={640}
                height={800}
                className="dish-card-image"
              />
              <div className="dish-card-body">
                <h2>{dish.name}</h2>
                <p>{dish.shortDescription}</p>
                <Link href={`/dishes/${dish.slug}`} className="btn-secondary">
                  View archived details
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
