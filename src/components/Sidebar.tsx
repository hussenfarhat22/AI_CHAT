"use client";

import type { Conversation } from "@/lib/storage";

export default function Sidebar({
  conversations,
  activeId,
  onNew,
  onSelect,
}: {
  conversations: Conversation[];
  activeId: string;
  onNew: () => void;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r p-3">
      <button
        onClick={onNew}
        className="mb-3 rounded bg-black px-3 py-2 text-sm text-white"
      >
        + New chat
      </button>
      <ul className="flex-1 space-y-1 overflow-y-auto">
        {conversations.map((c) => (
          <li key={c.id}>
            <button
              onClick={() => onSelect(c.id)}
              className={`w-full truncate rounded px-3 py-2 text-left text-sm ${
                c.id === activeId
                  ? "bg-gray-200 text-black"
                  : "hover:bg-gray-100 hover:text-black"
              }`}
            >
              {c.title}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}