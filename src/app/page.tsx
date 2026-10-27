"use client";

import { useCallback, useEffect, useState } from "react";
import Chat from "@/components/Chat";
import Sidebar from "@/components/Sidebar";
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
    <div className="flex h-screen">
      <Sidebar
        conversations={conversations}
        activeId={active.id}
        onNew={handleNew}
        onSelect={setActiveId}
      />
      <div className="min-w-0 flex-1">
        <Chat
          key={active.id}
          conversation={active}
          onMessagesChange={handleMessagesChange}
        />
      </div>
    </div>
  );
}