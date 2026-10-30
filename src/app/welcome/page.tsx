import Link from "next/link";

export default function WelcomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 text-center">
      <h1 className="text-5xl font-bold">Farhat&apos;s AI Chat</h1>
      <Link
        href="/"
        className="rounded-full bg-indigo-600 px-8 py-3 text-lg text-white"
      >
        Start chatting
      </Link>
    </main>
  );
}