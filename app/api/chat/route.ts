import { NextRequest, NextResponse } from "next/server";
import { sanitizeChatMessages } from "@/lib/chat-request";
import { createMiaCompletion, MiaConfigError, MiaUpstreamError } from "@/lib/mia";
import { isRateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";

function clientKey(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anonymous"
  );
}

export async function POST(request: NextRequest) {
  if (isRateLimited(clientKey(request))) {
    return NextResponse.json(
      { error: "Preveč zahtev. Počakajte trenutek in poskusite znova." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Neveljavno telo zahteve." }, { status: 400 });
  }

  const messages = sanitizeChatMessages(
    body && typeof body === "object" && "messages" in body ? body.messages : null,
  );

  if (!messages) {
    return NextResponse.json({ error: "Pošljite vsaj eno sporočilo." }, { status: 400 });
  }

  try {
    const content = await createMiaCompletion(messages);
    return NextResponse.json({
      message: { role: "assistant", content },
    });
  } catch (error) {
    if (error instanceof MiaConfigError || error instanceof MiaUpstreamError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: "Prišlo je do napake. Poskusite znova ali posredujte operaterju." },
      { status: 500 },
    );
  }
}
