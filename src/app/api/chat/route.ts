import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { getModel, isValidModelId } from "@/lib/models";
import { generateImageToBlob } from "@/lib/generate-image";

export const maxDuration = 60;

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const MAX_CHARS = 24000; // roughly 6,000 tokens of history
const MAX_REFERENCE_IMAGES = 3;

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
  return "Something went wrong while generating the answer. Please try again.";
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

function isImagePart(part: UIMessage["parts"][number]): boolean {
  return part.type === "file" && part.mediaType.startsWith("image/");
}

// Pictures the tool may use as references: uploaded ones and generated ones.
function collectImageUrls(messages: UIMessage[]): string[] {
  const urls: string[] = [];
  for (const m of messages) {
    for (const p of m.parts) {
      if (p.type === "file" && p.mediaType.startsWith("image/")) {
        urls.push(p.url);
      } else if (p.type === "tool-generate_image") {
        const out = (p as unknown as { output?: { url?: unknown } }).output;
        if (out && typeof out.url === "string") urls.push(out.url);
      }
    }
  }
  return urls.filter(isAllowedImageUrl);
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
    m.parts.some((p) => p.type === "file" && !isAllowedImageUrl(p.url))
  );
  if (badImage) {
    return Response.json(
      { error: "Only images uploaded through this app are allowed." },
      { status: 400 }
    );
  }

  const modelInfo = getModel(modelId);
  const canSee = modelInfo?.vision ?? false;
  const canUseTools = modelInfo?.tools ?? false;

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const sendingImages = lastUser?.parts.some(isImagePart) ?? false;
  if (sendingImages && !canSee) {
    return Response.json(
      {
        error:
          "This model can't read images. Choose a model with the Vision badge.",
      },
      { status: 400 }
    );
  }

  // Older pictures and generated images become short text notes
  // for models that cannot use them, so the conversation survives a switch.
  const prepared: UIMessage[] = messages.map((m) => ({
    ...m,
    parts: m.parts.map((p) => {
      if (!canSee && isImagePart(p)) {
        return {
          type: "text" as const,
          text: "[An image was shared here, but this model cannot see images.]",
        };
      }
      if (!canUseTools && p.type === "tool-generate_image") {
        return {
          type: "text" as const,
          text: "[An image was generated here.]",
        };
      }
      return p;
    }),
  }));

  let generated = 0; // at most one image per message
  const tools = {
    generate_image: tool({
      description:
        "Create a new image, or edit or vary an image from this conversation. " +
        "Use it only when the user asks to draw, generate, create, edit or change a picture. " +
        "Write a detailed prompt: subject, style, setting, lighting and colors.",
      inputSchema: z.object({
        prompt: z
          .string()
          .min(3)
          .max(1500)
          .describe("A detailed description of the image to create"),
        useReferenceImages: z
          .boolean()
          .describe(
            "true if the new image should be based on pictures already in the conversation (uploaded or generated), false for a brand new image"
          ),
      }),
      execute: async ({ prompt, useReferenceImages }) => {
        if (generated >= 1) {
          return { error: "Only one image can be created per message." };
        }
        generated += 1;
        try {
          const references = useReferenceImages
            ? collectImageUrls(messages).slice(-MAX_REFERENCE_IMAGES)
            : [];
          const { url } = await generateImageToBlob(prompt, references);
          return { url, prompt };
        } catch (e) {
          console.error("[image] failed:", e);
          return { error: "The image could not be created. Please try again." };
        }
      },
    }),
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  const result = streamText({
    model: openrouter.chat(modelId),
    instructions:
      `You are a helpful assistant. Today's date is ${today} (UTC). ` +
      (canUseTools
        ? "You can create images with the generate_image tool when the user asks for a picture. After the tool returns, reply with one short sentence and do not repeat the image link."
        : ""),
    messages: await convertToModelMessages(trimMessages(prepared), {
      ignoreIncompleteToolCalls: true,
    }),
    tools: canUseTools ? tools : undefined,
    stopWhen: stepCountIs(3),
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