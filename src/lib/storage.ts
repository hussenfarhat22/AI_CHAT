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
    // Storage is full or blocked. We ignore it for now.
  }
}

export function saveMessages(id: string, messages: ChatMessage[]): void {
  const updated = loadConversations().map((c) =>
    c.id === id ? { ...c, messages, updatedAt: Date.now() } : c
  );
  saveConversations(updated);
}