import { getCurrentMessages } from "@/lib/i18n";

export default async function AllergensPage() {
  const { messages } = await getCurrentMessages();

  return (
    <article className="page-prose">
      <h1>{messages.allergens.title}</h1>
      <p>{messages.allergens.paragraph1}</p>
      <p>{messages.allergens.paragraph2}</p>
    </article>
  );
}
