"use client";

import { useRef, useMemo, useCallback } from "react";
import { marked } from "marked";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  showPreview: boolean;
}

type ToolbarAction = {
  label: string;
  title: string;
  prefix: string;
  suffix: string;
  placeholder: string;
  block?: boolean;
};

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  { label: "B", title: "Bold", prefix: "**", suffix: "**", placeholder: "bold text" },
  { label: "I", title: "Italic", prefix: "_", suffix: "_", placeholder: "italic text" },
  { label: "H", title: "Heading", prefix: "## ", suffix: "", placeholder: "Heading", block: true },
  { label: "</>", title: "Code", prefix: "`", suffix: "`", placeholder: "code" },
  { label: "Link", title: "Link", prefix: "[", suffix: "](url)", placeholder: "link text" },
];

export function MarkdownEditor({ value, onChange, showPreview }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const preview = useMemo(() => {
    if (!showPreview || !value) return "";
    return marked.parse(value) as string;
  }, [value, showPreview]);

  const insertMarkdown = useCallback(
    (action: ToolbarAction) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = value.slice(start, end);
      const text = selected || action.placeholder;

      let insertion: string;
      if (action.block && start > 0 && value[start - 1] !== "\n") {
        insertion = `\n${action.prefix}${text}${action.suffix}`;
      } else {
        insertion = `${action.prefix}${text}${action.suffix}`;
      }

      const newValue = value.slice(0, start) + insertion + value.slice(end);
      onChange(newValue);

      requestAnimationFrame(() => {
        const cursorPos = start + action.prefix.length + (action.block && start > 0 && value[start - 1] !== "\n" ? 1 : 0);
        textarea.focus();
        textarea.setSelectionRange(cursorPos, cursorPos + text.length);
      });
    },
    [value, onChange]
  );

  return (
    <div>
      <div className="mb-1 flex gap-1">
        {TOOLBAR_ACTIONS.map((action) => (
          <button
            key={action.title}
            type="button"
            title={action.title}
            onClick={() => insertMarkdown(action)}
            className="rounded border border-border/50 px-2 py-0.5 text-xs text-text-muted transition-colors hover:bg-bg-secondary hover:text-text"
          >
            {action.label}
          </button>
        ))}
      </div>
      <div className={showPreview ? "grid gap-4 lg:grid-cols-2" : ""}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={20}
          className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 font-mono text-sm leading-relaxed focus:border-text-muted focus:outline-none"
          placeholder="Write your post in Markdown..."
        />
        {showPreview && (
          <div
            className="prose-custom overflow-auto rounded-lg border border-border p-4"
            dangerouslySetInnerHTML={{ __html: preview }}
          />
        )}
      </div>
    </div>
  );
}
