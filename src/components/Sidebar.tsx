"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
  const [pendingDelete, setPendingDelete] = useState<Conversation | null>(null);

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
    setPendingDelete(c);
  }

  // Close the dialog with the Escape key.
  useEffect(() => {
    if (!pendingDelete) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPendingDelete(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingDelete]);

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-gray-200 p-3 dark:border-gray-700">
      <button
        onClick={onNew}
        className="mb-3 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
      >
        + New chat
      </button>

      <ul className="flex-1 space-y-1 overflow-y-auto">
        {conversations.map((c) => (
          <li
            key={c.id}
            className={`flex items-center gap-1 rounded ${
              c.id === activeId
                ? "bg-gray-200 text-black dark:bg-gray-700 dark:text-white"
                : "hover:bg-gray-100 hover:text-black dark:hover:bg-gray-800 dark:hover:text-white"
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
                className="m-1 w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm text-black dark:border-gray-600 dark:bg-gray-800 dark:text-white"
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

      {pendingDelete &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setPendingDelete(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-title"
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                id="delete-title"
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                Delete this chat?
              </h2>
              <p className="mt-2 break-words text-sm text-gray-600 dark:text-gray-300">
                &ldquo;{pendingDelete.title}&rdquo; and all its messages will be
                permanently deleted. This cannot be undone.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  autoFocus
                  onClick={() => setPendingDelete(null)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDelete(pendingDelete.id);
                    setPendingDelete(null);
                  }}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </aside>
  );
}