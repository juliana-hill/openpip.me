"use client";

import { ExternalLink, Search } from "lucide-react";
import styles from "./WebSearchCard.module.css";

type SearchResult = {
  title: string;
  url: string;
  snippet: string;
};

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function truncateSnippet(text: string, maxLen = 200): string {
  const cleaned = text
    .replace(/Skip to content\n?/gi, "")
    .replace(/Accessibility Feedback\n?/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (cleaned.length <= maxLen) return cleaned;
  const cut = cleaned.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > maxLen * 0.6 ? cut.slice(0, lastSpace) : cut) + "…";
}

type Props = { result: string; query: string; toolName: string };

export function WebSearchCard({ result, query, toolName }: Props) {
  let results: SearchResult[] = [];

  if (toolName === "WebSearch") {
    // SDK returns text like: "...\nLinks: [{title, url},...]\n..."
    if (typeof result === "string") {
      const match = result.match(/Links:\s*(\[[\s\S]*?\])/);
      if (match) {
        try {
          const parsed = JSON.parse(match[1]) as Array<{ title?: string; url?: string }>;
          results = parsed.filter((r) => r.url).map((r) => ({ title: r.title ?? r.url!, url: r.url!, snippet: "" }));
        } catch { /* parse failed */ }
      }
    }
  } else {
    try {
      if (typeof result === "string") results = JSON.parse(result);
      else if (Array.isArray(result)) results = result;
    } catch { /* parse failed */ }
  }

  if (!Array.isArray(results) || results.length === 0) {
    return <p className={styles.empty}>No results found for &ldquo;{query}&rdquo;</p>;
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <Search size={14} className={styles.searchIcon} />
        <p className={styles.title}>Web Search</p>
        <span className={styles.count}>{results.length} result{results.length !== 1 ? "s" : ""}</span>
      </div>
      <div className={styles.queryRow}>
        <p className={styles.query}>{query}</p>
      </div>
      <div className={styles.results}>
        {results.map((r, i) => (
          <a
            key={i}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.result}
          >
            <ExternalLink size={14} className={styles.externalIcon} />
            <div className={styles.resultBody}>
              <p className={styles.resultTitle}>{r.title}</p>
              <p className={styles.resultDomain}>{extractDomain(r.url)}</p>
              {r.snippet && (
                <p className={styles.resultSnippet}>{truncateSnippet(r.snippet)}</p>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
