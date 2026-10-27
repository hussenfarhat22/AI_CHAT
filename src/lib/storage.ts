import type { ChatMessage } from "./types";

export type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
};

const KEY = "ai-chat:conversations";

export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Conversation[]) : [];
  } catch {
    return [];
  }
}

export function saveConversations(list: Conversation[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Storage is full or blocked. 
  }
}

export function saveMessages(id: string, messages: ChatMessage[]): void {
  const updated = loadConversations().map((c) =>
    c.id === id ? { ...c, messages, updatedAt: Date.now() } : c
  );
  saveConversations(updated);
}
export function createConversation(): Conversation {
  return {
    id: crypto.randomUUID(),
    title: "New chat",
    messages: [],
    updatedAt: Date.now(),
  };
}

export function makeTitle(messages: ChatMessage[]): string {
  const first = messages.find((m) => m.role === "user");
  const text = first?.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("")
    .trim();
  return text ? text.slice(0, 40) : "New chat";
}