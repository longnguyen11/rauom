import Image from "next/image";
import Link from "next/link";

import { listArchivedDishes } from "@/lib/dishes";
import { getCurrentMessages } from "@/lib/i18n";

export default async function ArchivePage() {
  const [{ messages }, archived] = await Promise.all([
    getCurrentMessages(),
    listArchivedDishes(),
  ]);

  return (
    <section className="page-prose">
      <h1>{messages.archive.title}</h1>
      <p>{messages.archive.subtitle}</p>

      {archived.length === 0 ? (
        <p>{messages.archive.empty}</p>
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
                  {messages.archive.viewArchivedDetails}
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
