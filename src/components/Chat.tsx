"use client";

import { useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MODELS, DEFAULT_MODEL_ID } from "@/lib/models";
import type { ChatMessage } from "@/lib/types";
import type { Conversation } from "@/lib/storage";
import Markdown from "@/components/Markdown";
export default function Chat({
  conversation,
  onMessagesChange,
}: {
  conversation: Conversation;
  onMessagesChange: (id: string, messages: ChatMessage[]) => void;
}) {
  const [input, setInput] = useState("");
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);

  const { messages, sendMessage, status } = useChat<ChatMessage>({
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