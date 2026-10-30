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
      

      <div className="flex-1 space-y-4 overflow-y-auto">
                {messages.map((message) => {
          const modelName = MODELS.find(
            (m) => m.id === message.metadata?.model
          )?.name;
          const isUser = message.role === "user";

          return (
            <div
              key={message.id}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              {isUser ? (
                <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-indigo-600 px-4 py-2.5 text-white shadow-sm">
                  {message.parts.map((part, i) =>
                    part.type === "text" ? (
                      <span key={i}>{part.text}</span>
                    ) : null
                  )}
                </div>
              ) : (
                <div className="flex max-w-full gap-3">
                  <div
                    aria-hidden="true"
                    className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm dark:bg-indigo-950"
                  >
                    ✨
                  </div>
                  <div className="min-w-0 flex-1">
                    {modelName && (
                      <span className="mb-1 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">
                        {modelName}
                      </span>
                    )}
                    <div className="break-words leading-relaxed text-gray-900 dark:text-gray-100">
                      {message.parts.map((part, i) =>
                        part.type === "text" ? (
                          <Markdown key={i} text={part.text} />
                        ) : null
                      )}
                    </div>
                  </div>
                </div>
              )}
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




            <form
        onSubmit={handleSubmit}
        className="mt-3 rounded-2xl border border-gray-300 bg-white p-2 shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 dark:border-gray-600 dark:bg-gray-800 dark:focus-within:ring-indigo-900"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="w-full bg-transparent px-2 py-2 text-black outline-none placeholder:text-gray-400 dark:text-white"
        />
        <div className="mt-1 flex items-center justify-between gap-2">
          <div className="relative min-w-0">
            <label htmlFor="model" className="sr-only">
              Model
            </label>
            <select
              id="model"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className="max-w-[12rem] cursor-pointer appearance-none truncate rounded-full bg-indigo-50 py-1.5 pl-3 pr-8 text-sm font-medium text-indigo-700 outline-none transition hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-200 dark:hover:bg-indigo-900 [&>option]:bg-white [&>option]:text-black"
            >
              {MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.provider} - {model.name}
                </option>
              ))}
            </select>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-indigo-700 dark:text-indigo-200"
            >
              ▾
            </span>
          </div>
          <button
            type="submit"
            disabled={isBusy}
            className="rounded-full bg-indigo-600 px-5 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </main>
  );
}