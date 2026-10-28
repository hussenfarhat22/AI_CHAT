"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Markdown({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => (
          <ul className="mb-2 list-disc pl-5 last:mb-0">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-2 list-decimal pl-5 last:mb-0">{children}</ol>
        ),
        h1: ({ children }) => (
          <h1 className="mb-2 text-xl font-bold">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-2 text-lg font-bold">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-2 font-bold">{children}</h3>
        ),
        blockquote: ({ children }) => (
          <blockquote className="mb-2 border-l-4 border-gray-400 pl-3 italic">
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline dark:text-blue-400"
          >
            {children}
          </a>
        ),
        pre: ({ children }) => (
          <pre className="mb-2 overflow-x-auto rounded bg-gray-900 p-3 text-sm text-gray-100 last:mb-0 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-gray-100">
            {children}
          </pre>
        ),
        code: ({ children, className }) => (
          <code
            className={`rounded bg-gray-300 px-1 py-0.5 dark:bg-gray-600 font-mono text-sm ${className ?? ""}`}
          >
            {children}
          </code>
        ),
        table: ({ children }) => (
          <div className="mb-2 overflow-x-auto">
            <table className="border-collapse text-sm">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-gray-400 px-2 py-1 text-left font-bold">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-gray-400 px-2 py-1">{children}</td>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
