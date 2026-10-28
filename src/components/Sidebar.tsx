"use client";

import { useState } from "react";
import type { Conversation } from "@/lib/storage";

export default function Sidebar({
  conversations,
  activeId,
  onNew,
  onSelect,
  onRename,
  onDelete,
}: {
  conversations: Conversation[];
  activeId: string;
  onNew: () => void;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  function startRename(c: Conversation) {
    setEditingId(c.id);
    setDraft(c.title);
  }

  function commitRename() {
    if (editingId && draft.trim()) {
      onRename(editingId, draft.trim());
    }
    setEditingId(null);
  }

  function confirmDelete(c: Conversation) {
    if (window.confirm(`Delete "${c.title}"? This cannot be undone.`)) {
      onDelete(c.id);
    }
  }

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
          <li
            key={c.id}
            className={`flex items-center gap-1 rounded ${
              c.id === activeId ? "bg-gray-200 text-black" : "hover:bg-gray-100 hover:text-black"
            }`}
          >
            {editingId === c.id ? (
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                }}
                className="m-1 w-full rounded border px-2 py-1 text-sm text-black"
              />
            ) : (
              <>
                <button
                  onClick={() => onSelect(c.id)}
                  className="min-w-0 flex-1 truncate px-3 py-2 text-left text-sm"
                >
                  {c.title}
                </button>
                <button
                  onClick={() => startRename(c)}
                  aria-label={`Rename ${c.title}`}
                  className="px-1 text-sm"
                >
                  ✎
                </button>
                <button
                  onClick={() => confirmDelete(c)}
                  aria-label={`Delete ${c.title}`}
                  className="px-2 text-sm"
                >
                  ✕
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}