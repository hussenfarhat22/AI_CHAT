import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { MODELS } from "@/lib/models";

const FEATURES = [
  {
    icon: "⚡",
    title: "Live streaming",
    text: "Answers appear word by word as the model writes them.",
  },
  {
    icon: "🔀",
    title: "Switch models anytime",
    text: "Change model mid-chat. The whole conversation comes with you.",
  },
  {
    icon: "💾",
    title: "Chats saved for you",
    text: "Your conversations stay in your browser, ready to reopen.",
  },
];

export default function WelcomePage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center bg-linear-to-br from-indigo-50 via-white to-purple-50 px-6 py-16 text-center text-gray-900 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 dark:text-white">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-600 text-4xl shadow-lg">
        <span aria-hidden="true">🧑</span>
      </div>

      <h1 className="text-4xl font-bold sm:text-6xl">Farhat&apos;s AI Chat</h1>

      <p className="mt-4 max-w-xl text-lg text-gray-600 dark:text-gray-300">
        Talk to the best AI models in one place, and switch between them in
        the middle of a conversation without losing context.
      </p>

      <Link
        href="/chat"
        className="mt-8 rounded-full bg-indigo-600 px-8 py-3 text-lg font-semibold text-white shadow-lg transition hover:scale-105 hover:bg-indigo-500"
      >
        Start chatting
      </Link>

      <ul className="mt-8 flex flex-wrap justify-center gap-2">
        {MODELS.map((model) => (
          <li
            key={model.id}
            className="rounded-full border border-gray-300 bg-white/70 px-3 py-1 text-sm text-gray-700 dark:border-gray-600 dark:bg-white/10 dark:text-gray-200"
          >
            {model.provider}
          </li>
        ))}
      </ul>

      <div className="mt-14 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-gray-200 bg-white/70 p-5 text-left shadow-sm dark:border-gray-700 dark:bg-white/5"
          >
            <div className="text-2xl" aria-hidden="true">
              {feature.icon}
            </div>
            <h2 className="mt-2 font-semibold">{feature.title}</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {feature.text}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}