"use client";

import { useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MODELS, DEFAULT_MODEL_ID } from "@/lib/models";
import type { ChatMessage } from "@/lib/types";
import type { Conversation } from "@/lib/storage";
import Markdown from "@/components/Markdown";

function readableError(error: Error): string {
  const text = error.message;
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed.error === "string") return parsed.error;
  } catch {
    // Not JSON: use the text as it is.
  }
  if (/failed to fetch|networkerror|load failed/i.test(text)) {
    return "Network problem: could not reach the server. Check your connection and retry.";
  }
  return text || "Something went wrong. Please try again.";
}

export default function Chat({
  conversation,
  onMessagesChange,
}: {
  conversation: Conversation;
  onMessagesChange: (id: string, messages: ChatMessage[]) => void;
}) {
  const [input, setInput] = useState("");
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);

    const { messages, sendMessage, status, error, regenerate, clearError } =
    useChat<ChatMessage>({
    id: conversation.id,
    messages: conversation.messages,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (isBusy) return;
    onMessagesChange(conversation.id, messages);
  }, [messages, isBusy, conversation.id, onMessagesChange]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isBusy) return;
    sendMessage({ text: input }, { body: { modelId } });
    setInput("");
  }

  return (
    <main className="mx-auto flex h-full w-full max-w-2xl flex-col p-4">
      <div className="mb-4 flex items-center gap-2 pl-12 pr-28 md:pl-0">
        <label htmlFor="model" className="text-sm font-medium">
          Model:
        </label>
        <select
          id="model"
          value={modelId}
          onChange={(e) => setModelId(e.target.value)}
          className="min-w-0 rounded border bg-white px-2 py-1 text-black dark:bg-gray-800 dark:text-white "
        >
          {MODELS.map((model) => (
            <option key={model.id} value={model.id}>
              {model.provider} - {model.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto">
        {messages.map((message) => {
          const modelName = MODELS.find(
            (m) => m.id === message.metadata?.model
          )?.name;
          return (
            <div
              key={message.id}
              className={message.role === "user" ? "text-right" : "text-left"}
            >
              {message.role === "assistant" && modelName && (
                <div className="mb-1 text-xs text-gray-500">{modelName}</div>
              )}
              <div
  className={`inline-block break-words max-w-[85%] rounded-lg dark:bg-gray-700 dark:text-white ${
    message.role === "user" ? "whitespace-pre-wrap" : ""
  }`}
>
  {message.parts.map((part, i) =>
    part.type === "text" ? (
      message.role === "assistant" ? (
        <Markdown key={i} text={part.text} />
      ) : (
        <span key={i}>{part.text}</span>
      )
    ) : null
  )}
</div>
            </div>
          );
        })}
      </div>
      {error && (
        <div
          role="alert"
          className="mt-3 flex items-start justify-between gap-3 rounded border border-red-400 bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200"
        >
          <span>{readableError(error)}</span>
          <span className="flex shrink-0 gap-3">
            <button
              onClick={() => regenerate({ body: { modelId } })}
              className="underline"
            >
              Retry
            </button>
            <button onClick={clearError} className="underline">
              Dismiss
            </button>
          </span>
        </div>
      )}




      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded border bg-white px-3 py-2 text-black dark:bg-gray-800 dark:text-white"
        />
        <button
          type="submit"
          disabled={isBusy}
          className="rounded bg-black px-4 py-2 text-white dark:bg-white dark:text-black disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </main>
  );
}