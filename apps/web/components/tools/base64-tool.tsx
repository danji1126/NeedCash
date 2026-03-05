"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

function looksLikeBase64(str: string): boolean {
  if (str.length < 4) return false;
  return /^[A-Za-z0-9+/]+=*$/.test(str.trim().replace(/\s/g, ""));
}

export function Base64Tool() {
  const [plainText, setPlainText] = useState("");
  const [base64Text, setBase64Text] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copiedPlain, setCopiedPlain] = useState(false);
  const [copiedBase64, setCopiedBase64] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  useEffect(() => {
    if (base64Text && looksLikeBase64(base64Text)) {
      setSuggestion("Input looks like Base64. Click Decode to convert.");
    } else {
      setSuggestion(null);
    }
  }, [base64Text]);

  function handleEncode() {
    setError(null);
    try {
      const encoded = btoa(unescape(encodeURIComponent(plainText)));
      setBase64Text(encoded);
    } catch {
      setError("Failed to encode text");
    }
  }

  function handleDecode() {
    setError(null);
    try {
      const decoded = decodeURIComponent(escape(atob(base64Text.trim())));
      setPlainText(decoded);
    } catch {
      setError("Invalid Base64 input. Check for incorrect characters.");
    }
  }

  async function copyPlain() {
    await navigator.clipboard.writeText(plainText);
    setCopiedPlain(true);
    setTimeout(() => setCopiedPlain(false), 1500);
  }

  async function copyBase64() {
    await navigator.clipboard.writeText(base64Text);
    setCopiedBase64(true);
    setTimeout(() => setCopiedBase64(false), 1500);
  }

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-bold text-text-primary">
        Base64 Encoder / Decoder
      </h2>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={handleEncode}>
          Encode ↓
        </Button>
        <Button size="sm" variant="outline" onClick={handleDecode}>
          Decode ↑
        </Button>
      </div>
      {error && (
        <div className="rounded border border-red-400/60 bg-red-400/10 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}
      {suggestion && (
        <div className="rounded border border-yellow-400/60 bg-yellow-400/10 px-3 py-2 text-sm text-yellow-400">
          {suggestion}
        </div>
      )}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-text-secondary">Plain Text</label>
            <Button size="sm" variant="ghost" onClick={copyPlain}>
              {copiedPlain ? "Copied!" : "Copy"}
            </Button>
          </div>
          <textarea
            value={plainText}
            onChange={(e) => setPlainText(e.target.value)}
            placeholder="Enter text to encode..."
            className="h-40 w-full resize-none rounded border border-border/60 bg-bg-secondary p-3 font-mono text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            spellCheck={false}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-text-secondary">Base64</label>
            <Button size="sm" variant="ghost" onClick={copyBase64}>
              {copiedBase64 ? "Copied!" : "Copy"}
            </Button>
          </div>
          <textarea
            value={base64Text}
            onChange={(e) => setBase64Text(e.target.value)}
            placeholder="Enter Base64 to decode..."
            className="h-40 w-full resize-none rounded border border-border/60 bg-bg-secondary p-3 font-mono text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
