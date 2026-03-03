import { getCurrentMessages } from "@/lib/i18n";

export default async function FreshCookPolicyPage() {
  const { messages } = await getCurrentMessages();

  return (
    <article className="page-prose">
      <h1>{messages.freshCook.title}</h1>
      <p>{messages.freshCook.paragraph}</p>
      <ul>
        <li>{messages.freshCook.bullet1}</li>
        <li>{messages.freshCook.bullet2}</li>
        <li>{messages.freshCook.bullet3}</li>
      </ul>
      <p>{messages.freshCook.closing}</p>
    </article>
  );
}
