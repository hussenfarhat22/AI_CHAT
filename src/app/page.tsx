"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
 const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { modelId: "openai/gpt-4o-mini" },
    }),
  });

  const isBusy = status === "submitted" || status === "streaming";