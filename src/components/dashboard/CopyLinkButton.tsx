"use client";

import { useState } from "react";

export function CopyLinkButton({ url, className, style }: { url: string; className?: string; style?: React.CSSProperties }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Zwischenablage-Zugriff verweigert (seltener Browser-Fall) — der
      // Link steht daneben trotzdem als Text, also kein Blocker.
    }
  }

  return (
    <button type="button" onClick={handleCopy} className={className} style={style}>
      {copied ? "Kopiert ✓" : "Link kopieren"}
    </button>
  );
}
