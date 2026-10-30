"use client";

import { useCallback, useEffect, useState } from "react";
import Chat from "@/components/Chat";
import Sidebar from "@/components/Sidebar";
import ThemeToggle from "@/components/ThemeToggle";
import type { ChatMessage } from "@/lib/types";
import {
  createConversation,
  loadConversations,
  makeTitle,
  saveConversations,
  type Conversation,
} from "@/lib/storage";

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Load the saved chats once, after the page opens.
  useEffect(() => {
    const list = loadConversations();
    if (list.length === 0) {
      const fresh = createConversation();
      setConversations([fresh]);
      setActiveId(fresh.id);
    } else {
      setConversations(list);
      setActiveId(list[0].id);
    }
    setLoaded(true);
  }, []);

  // Save the list every time it changes.
  useEffect(() => {
    if (loaded) saveConversations(conversations);
  }, [conversations, loaded]);

  function handleNew() {
    const empty = conversations.find((c) => c.messages.length === 0);
    if (empty) {
      setActiveId(empty.id);
      return;
    }
    const fresh = createConversation();
    setConversations((prev) => [fresh, ...prev]);
    setActiveId(fresh.id);
  }

  function handleRename(id: string, title: string) {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c))
    );
  }

  function handleDelete(id: string) {
    const remaining = conversations.filter((c) => c.id !== id);
    if (remaining.length === 0) {
      const fresh = createConversation();
      setConversations([fresh]);
      setActiveId(fresh.id);
      return;
    }
    setConversations(remaining);
    if (id === activeId) setActiveId(remaining[0].id);
  }

  const handleMessagesChange = useCallback(
    (id: string, messages: ChatMessage[]) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== id || c.messages.length === messages.length) return c;
          return {
            ...c,
            messages,
            title: c.title === "New chat" ? makeTitle(messages) : c.title,
            updatedAt: Date.now(),
          };
        })
      );
    },
    []
  );

  const active = conversations.find((c) => c.id === activeId);
  if (!loaded || !active) return null;

  return (
    <div className="flex h-dvh flex-col">
      {/* Header: full width, at the very top */}
      <header className="flex shrink-0 items-center justify-between gap-3 bg-black px-4 py-3 text-white dark:bg-white dark:text-black">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open chat list"
            className="rounded border border-gray-500 px-3 py-1 text-sm md:hidden"
          >
            ☰
          </button>
          <h1 className="text-lg font-semibold">
            <span aria-hidden="true">🧑</span> Farhat&apos;s AI Chat
          </h1>
        </div>
        <ThemeToggle />
      </header>

      {/* Below the header: sidebar on the left, chat on the right */}
      <div className="flex min-h-0 flex-1">
        <div
          className={`fixed bottom-0 left-0 top-14 z-30 bg-background transition-transform md:static md:translate-x-0 ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar
            conversations={conversations}
            activeId={active.id}
            onNew={() => {
              handleNew();
              setMenuOpen(false);
            }}
            onSelect={(id) => {
              setActiveId(id);
              setMenuOpen(false);
            }}
            onRename={handleRename}
            onDelete={handleDelete}
          />
        </div>

        {menuOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/40 md:hidden"
            onClick={() => setMenuOpen(false)}
          />
        )}

        <div className="min-w-0 flex-1">
          <Chat
            key={active.id}
            conversation={active}
            onMessagesChange={handleMessagesChange}
          />
        </div>
      </div>
    </div>
  );
}