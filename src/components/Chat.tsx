"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { upload } from "@vercel/blob/client";
import Markdown from "@/components/Markdown";
import { MODELS, DEFAULT_MODEL_ID, getModel } from "@/lib/models";
import type { ChatMessage } from "@/lib/types";
import type { Conversation } from "@/lib/storage";

const MAX_IMAGES = 4;
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

type Attachment = { id: string; file: File; url: string };

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
  const selected = getModel(modelId);

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachError, setAttachError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);
  const [uploading, setUploading] = useState(false);

  function addFiles(list: FileList | File[]) {
    const incoming = Array.from(list);
    const accepted: Attachment[] = [];
    let message: string | null = null;

    for (const file of incoming) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        message = `"${file.name}" is not a supported image (use PNG, JPEG, WebP or GIF).`;
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        message = `"${file.name}" is larger than 5 MB.`;
        continue;
      }
      if (attachments.length + accepted.length >= MAX_IMAGES) {
        message = `You can attach up to ${MAX_IMAGES} images.`;
        break;
      }
      accepted.push({
        id: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
      });
    }

    setAttachError(message);
    if (accepted.length > 0) {
      setAttachments((prev) => [...prev, ...accepted]);
    }
  }

  function removeAttachment(id: string) {
    const target = attachments.find((a) => a.id === id);
    if (target) URL.revokeObjectURL(target.url);
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  function hasFiles(e: React.DragEvent) {
    return Array.from(e.dataTransfer.types).includes("Files");
  }

  function handleDragEnter(e: React.DragEvent) {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth.current += 1;
    setDragging(true);
  }

  function handleDragOver(e: React.DragEvent) {
    if (!hasFiles(e)) return;
    e.preventDefault(); // without this, the browser refuses the drop
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!hasFiles(e)) return;
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setDragging(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }

  function handlePaste(e: React.ClipboardEvent) {
    if (e.clipboardData.files.length === 0) return; // plain text: let it paste
    e.preventDefault();
    addFiles(e.clipboardData.files);
  }

  useEffect(() => {
    if (isBusy) return;
    onMessagesChange(conversation.id, messages);
  }, [messages, isBusy, conversation.id, onMessagesChange]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if ((!text && attachments.length === 0) || isBusy || uploading) return;

    let fileParts;
    setUploading(true);
    try {
      fileParts = await Promise.all(
        attachments.map(async (a) => {
          const blob = await upload(a.file.name, a.file, {
            access: "public",
            handleUploadUrl: "/api/upload",
          });
          return {
            type: "file" as const,
            mediaType: a.file.type,
            filename: a.file.name,
            url: blob.url,
          };
        })
      );
    } catch (err) {
      console.error("[upload] failed:", err);
      setAttachError("Upload failed. Please try again.");
      setUploading(false);
      return;
    }
    setUploading(false);

    sendMessage(
      {
        role: "user",
        parts: [
          ...(text ? [{ type: "text" as const, text }] : []),
          ...fileParts,
        ],
      },
      { body: { modelId } }
    );

    attachments.forEach((a) => URL.revokeObjectURL(a.url));
    setAttachments([]);
    setAttachError(null);
    setInput("");
  }

  return (
    <main
      className="relative mx-auto flex h-full w-full max-w-2xl flex-col p-4"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      <div className="flex-1 space-y-6 overflow-y-auto">
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
                  <div className="flex flex-wrap gap-2">
                    {message.parts.map((part, i) =>
                      part.type === "file" &&
                      part.mediaType.startsWith("image/") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={i}
                          src={part.url}
                          alt={part.filename ?? "Attached image"}
                          className="mb-2 max-h-48 rounded-lg"
                        />
                      ) : null
                    )}
                  </div>
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
                                            {message.parts.map((part, i) => {
                        if (part.type === "text") {
                          return <Markdown key={i} text={part.text} />;
                        }
                        if (part.type === "tool-generate_image") {
                          const tool = part as unknown as {
                            state: string;
                            input?: { prompt?: string };
                            output?: { url?: string; error?: string };
                          };
                          if (tool.state === "output-available") {
                            if (tool.output?.url) {
                              return (
                                <div key={i} className="my-2 max-w-sm">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={tool.output.url}
                                    alt={tool.input?.prompt ?? "Generated image"}
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700"
                                  />
                                  <a
                                    href={`${tool.output.url}?download=1`}
                                    download="generated-image"
                                    className="mt-2 inline-block rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-500"
                                  >
                                    Download
                                  </a>
                                </div>
                              );
                            }
                            return (
                              <p
                                key={i}
                                className="my-2 text-sm text-red-600 dark:text-red-400"
                              >
                                {tool.output?.error ??
                                  "The image could not be created."}
                              </p>
                            );
                          }
                          if (tool.state === "output-error") {
                            return (
                              <p
                                key={i}
                                className="my-2 text-sm text-red-600 dark:text-red-400"
                              >
                                The image could not be created.
                              </p>
                            );
                          }
                          return (
                            <div
                              key={i}
                              className="my-2 flex h-48 w-full max-w-sm animate-pulse items-center justify-center rounded-xl bg-gray-200 text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                            >
                              Creating your image...
                            </div>
                          );
                        }
                        return null;
                      })}
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
        {selected && (
          <div className="flex flex-wrap gap-1 px-2 pt-1">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                selected.vision
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                  : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              {selected.vision ? "Vision" : "Text only"}
            </span>
            {selected.tools && (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800 dark:bg-sky-950 dark:text-sky-200">
                Tools
              </span>
            )}
          </div>
        )}

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-2 pt-2">
            {attachments.map((a) => (
              <div key={a.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.url}
                  alt={a.file.name}
                  className="h-16 w-16 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeAttachment(a.id)}
                  aria-label={`Remove ${a.file.name}`}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-xs text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {attachError && (
          <p
            role="alert"
            className="px-2 pt-1 text-xs text-red-600 dark:text-red-400"
          >
            {attachError}
          </p>
        )}

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="w-full bg-transparent px-2 py-2 text-black outline-none placeholder:text-gray-400 dark:text-white"
        />

        <div className="mt-1 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach images"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              📎
            </button>

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
                    {model.vision ? "  👁" : ""}
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
          </div>

          <button
            type="submit"
            disabled={isBusy || uploading}
            className="rounded-full bg-indigo-600 px-5 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Send"}
          </button>
        </div>
      </form>

      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed border-indigo-500 bg-indigo-50/80 text-lg font-medium text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-200">
          Drop images to attach
        </div>
      )}
    </main>
  );
}