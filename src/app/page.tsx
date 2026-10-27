"use client";

import { useEffect, useState } from "react";
import Chat from "@/components/Chat";
import {
  loadConversations,
  saveConversations,
  type Conversation,
} from "@/lib/storage";

export default function Home() {
  const [conversation, setConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    const list = loadConversations();
    if (list.length > 0) {
      setConversation(list[0]);
    } else {
      const fresh: Conversation = {
        id: crypto.randomUUID(),
        title: "New chat",
        messages: [],
        updatedAt: Date.now(),
      };
      saveConversations([fresh]);
      setConversation(fresh);
    }
  }, []);

  if (!conversation) return null;

  return <Chat key={conversation.id} conversation={conversation} />;
}