"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function JsonFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleFormat() {
    setError(null);
    setSuccess(null);
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      setSuccess("Formatted successfully");
    } catch (e) {
      handleParseError(e);
    }
  }

  function handleMinify() {
    setError(null);
    setSuccess(null);
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setSuccess("Minified successfully");
    } catch (e) {
      handleParseError(e);
    }
  }

  function handleValidate() {
    setError(null);
    setSuccess(null);
    try {
      JSON.parse(input);
      setSuccess("Valid JSON");
    } catch (e) {
      handleParseError(e);
    }
  }

  function handleParseError(e: unknown) {
    if (e instanceof SyntaxError) {
      const match = e.message.match(/position (\d+)/i);
      if (match) {
        const position = parseInt(match[1], 10);
        const lines = input.substring(0, position).split("\n");
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;
        setError(`${e.message} (line ${line}, column ${column})`);
      } else {
        setError(e.message);
      }
    } else {
      setError("Invalid JSON");
    }
  }

  async function handleCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-bold text-text-primary">
        JSON Formatter
      </h2>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={handleFormat}>
          Format
        </Button>
        <Button size="sm" variant="outline" onClick={handleMinify}>
          Minify
        </Button>
        <Button size="sm" variant="outline" onClick={handleValidate}>
          Validate
        </Button>
      </div>
      {error && (
        <div className="rounded border border-red-400/60 bg-red-400/10 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded border border-emerald-400/60 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-400">
          {success}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm text-text-secondary">Input</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"key": "value"}'
            className="h-80 w-full resize-none rounded border border-border/60 bg-bg-secondary p-3 font-mono text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            spellCheck={false}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-text-secondary">Output</label>
            <Button size="sm" variant="ghost" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
          <pre className="h-80 overflow-auto rounded border border-border/60 bg-bg-secondary p-3 font-mono text-sm text-text-primary">
            {output || (
              <span className="text-text-muted">Formatted output...</span>
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
