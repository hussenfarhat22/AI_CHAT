import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { isValidModelId } from "@/lib/models";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: Request) {
  const { messages, modelId }: { messages: UIMessage[]; modelId: string } =
    await req.json();

  if (!isValidModelId(modelId)) {
    return Response.json(
      { error: "Unknown or unsupported model." },
      { status: 400 }
    );
  }

  const result = streamText({
    model: openrouter.chat(modelId),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}