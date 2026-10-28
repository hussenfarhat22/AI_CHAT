"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Storage blocked: the choice just won't be remembered.
    }
  }

  return (
    <button
      onClick={toggle}
      className="rounded border bg-white px-3 py-1 text-sm text-black dark:bg-gray-800 dark:text-white"
    >
      {dark ? "Light mode" : "Dark mode"}
    </button>
  );
}