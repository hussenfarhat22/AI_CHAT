import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { isValidModelId } from "@/lib/models";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const MAX_CHARS = 24000; // roughly 6,000 tokens of history

function messageLength(m: UIMessage): number {
  return m.parts.reduce(
    (sum, p) => sum + (p.type === "text" ? p.text.length : 0),
    0
  );
}

function trimMessages(messages: UIMessage[]): UIMessage[] {
  const kept: UIMessage[] = [];
  let total = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const len = messageLength(messages[i]);
    if (kept.length > 0 && total + len > MAX_CHARS) break;
    kept.unshift(messages[i]);
    total += len;
  }
  while (kept.length > 1 && kept[0].role === "assistant") kept.shift();
  return kept;
}

function getStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const e = error as { statusCode?: unknown; lastError?: unknown };
  if (typeof e.statusCode === "number") return e.statusCode;
  return getStatus(e.lastError);
}
function describe(error: unknown): string {
  if (error instanceof Error) {
    const cause = (error as { cause?: unknown }).cause;
    const extra = cause instanceof Error ? ` | cause: ${cause.message}` : "";
    return `${error.name}: ${error.message}${extra}`.slice(0, 300);
  }
  return String(error).slice(0, 300);
}
function friendlyError(error: unknown): string {
  console.error("[chat] stream error:", error);
  const status = getStatus(error);

  if (status === 429) {
    return "This model is rate limited right now. Wait a moment and retry, or switch to another model.";
  }
  if (status === 402) {
    return "The AI account has run out of credits. Please contact the app owner.";
  }
  if (status === 401 || status === 403) {
    return "The server could not authenticate with the AI provider.";
  }
  if (status === 400 || status === 404) {
    return "This model is unavailable right now. Choose another model and retry.";
  }
  if (status !== undefined && status >= 500) {
    return "The model provider had a problem. Retry, or choose another model.";
  }
    return `Something went wrong while generating the answer. (debug: ${describe(error)})`;
}
function isAllowedImageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.protocol === "https:" &&
      u.hostname.endsWith(".public.blob.vercel-storage.com")
    );
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const { messages, modelId }: { messages: UIMessage[]; modelId: string } =
    await req.json();

  if (!isValidModelId(modelId)) {
    return Response.json(
      { error: "Unknown or unsupported model." },
      { status: 400 }
    );
  }
    const badImage = messages.some((m) =>
    m.parts.some(
      (p) => p.type === "file" && !isAllowedImageUrl(p.url)
    )
  );
  if (badImage) {
    return Response.json(
      { error: "Only images uploaded through this app are allowed." },
      { status: 400 }
    );
  }

  const result = streamText({
    model: openrouter.chat(modelId),
    messages: await convertToModelMessages(trimMessages(messages)),
        experimental_download: async (requested) => requested.map(() => null),
  });

  return result.toUIMessageStreamResponse({
    messageMetadata: ({ part }) => {
      if (part.type === "start") {
        return { model: modelId };
      }
    },
    onError: friendlyError,
  });
}