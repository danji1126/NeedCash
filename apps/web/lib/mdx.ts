export type { PostMeta } from "./db";
export { getAllPosts, getPostBySlug } from "./db";

export interface Heading {
  level: number;
  text: string;
  id: string;
}

const HEADING_REGEX = /^(#{2,3})\s+(.+)$/gm;

export function extractHeadings(content: string): Heading[] {
  HEADING_REGEX.lastIndex = 0;
  const headings: Heading[] = [];
  let match;
  while ((match = HEADING_REGEX.exec(content)) !== null) {
    headings.push({
      level: match[1].length,
      text: match[2],
      id: match[2].toLowerCase().replace(/\s+/g, "-"),
    });
  }
  return headings;
}
