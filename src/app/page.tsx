"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MODELS, DEFAULT_MODEL_ID } from "@/lib/models";

export default function Home() {
  const [input, setInput] = useState("");
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isBusy = status === "submitted" || status === "streaming";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isBusy) return;
    sendMessage({ text: input }, { body: { modelId } });
    setInput("");
  }

  return (
    <main className="mx-auto flex h-screen max-w-2xl flex-col p-4">
      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="model" className="text-sm font-medium">
          Model:
        </label>
        <select
          id="model"
          value={modelId}
          onChange={(e) => setModelId(e.target.value)}
          className="rounded border px-2 py-1"
        >
          {MODELS.map((model) => (
            <option key={model.id} value={model.id}>
              {model.provider} - {model.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={message.role === "user" ? "text-right" : "text-left"}
          >
            <div className="inline-block max-w-[85%] whitespace-pre-wrap rounded-lg bg-gray-200 px-3 py-2 text-black">
              {message.parts.map((part, i) =>
                part.type === "text" ? <span key={i}>{part.text}</span> : null
              )}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded border px-3 py-2"
        />
        <button
          type="submit"
          disabled={isBusy}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </main>
  );
}