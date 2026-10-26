"use client"; //tells Next.js that this is a client component

import {useState} from "react"; //is a react hook that lets you remember value and update it - we use it to remember what the user is typing.
import {useChat} from "@ai-sdk/react";//a hook by vercel ai sdk , manage chat messages , send messages to backend , and track the status of conversations.
import {DefaultChatTransport} from "ai"; // used to configure how chat messages are sent to backend API .

export default function Home(){ //react uses this function to create the page - "export default" makes it thge main thing this file exports.
const[input,setInput] = useState("");//input is the current value . set input we use it rather than changing input normally so that react knows it should update the interface .

const { messages,sendMessage, status} = useChat({ 
  transport: new DefaultChatTransport({
    api: "/api/chat",
    body: {modelId: "openai/gpt-4o-mini"},
  }),
});

const isBusy = status === "submitted" || status === "streaming";// we use this to prevent sending messages when current message request is in progress.

function handleSubmit(e: React.FormEvent){
  e.preventDefault();
  if(!input.trim() || isBusy) return;
  sendMessage({text: input});
  setInput("");
}

  return (
    <main className="mx-auto flex h-screen max-w-2xl flex-col p-4">
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



