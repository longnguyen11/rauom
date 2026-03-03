import { z } from "zod";
import { NextResponse } from "next/server";

import { createPendingEmailSubscriber } from "@/lib/subscribers";

const schema = z.object({
  email: z.email(),
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const { token } = await createPendingEmailSubscriber(payload.email);

    return NextResponse.json({
      message: "Check your email to confirm subscription.",
      developmentToken: process.env.NODE_ENV === "development" ? token : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to subscribe.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
