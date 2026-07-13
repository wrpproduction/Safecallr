import React from "react";

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  // Split content by lines
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
  let listKey = 0;

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`} className="list-disc pl-6 space-y-2 my-4 text-slate-300 text-base leading-relaxed">
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  const parseInlineStyles = (text: string): React.ReactNode[] => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index} className="font-bold text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={i} className="text-2xl font-bold font-headline text-white mt-8 mb-4 tracking-tight border-b border-white/5 pb-2">
          {parseInlineStyles(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={i} className="text-xl font-bold font-headline text-white mt-6 mb-3 tracking-tight">
          {parseInlineStyles(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      currentList.push(
        <li key={i}>
          {parseInlineStyles(line.slice(2))}
        </li>
      );
    } else if (line === "") {
      flushList();
    } else {
      flushList();
      elements.push(
        <p key={i} className="text-slate-300 text-base leading-relaxed my-4">
          {parseInlineStyles(line)}
        </p>
      );
    }
  }

  flushList();

  return <div className="markdown-content">{elements}</div>;
}
