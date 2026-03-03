import { getCurrentMessages } from "@/lib/i18n";

export default async function HowOrderingWorksPage() {
  const { messages } = await getCurrentMessages();

  return (
    <article className="page-prose">
      <h1>{messages.howOrdering.title}</h1>
      <ol>
        <li>{messages.howOrdering.step1}</li>
        <li>{messages.howOrdering.step2}</li>
        <li>{messages.howOrdering.step3}</li>
        <li>{messages.howOrdering.step4}</li>
        <li>{messages.howOrdering.step5}</li>
      </ol>
      <p>{messages.howOrdering.note}</p>
    </article>
  );
}
