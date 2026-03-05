import { SITE } from "./constants";

interface ShareOptions {
  game: string;
  title: string;
  lines: string[];
}

export function buildShareText({ game, title, lines }: ShareOptions): string {
  const header = `[${SITE.name}] ${title}`;
  const body = lines.join("\n");
  const url = `${SITE.url}/game/${game}`;
  return `${header}\n${body}\n${url}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback for older browsers
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}
