/**
 * MDX → D1 마이그레이션 스크립트
 * 기존 content/blog/*.mdx 파일을 SQL INSERT 문으로 변환
 *
 * 사용법:
 *   node scripts/migrate-blog-to-d1.mjs > migrations/0002_seed_data.sql
 *   npx wrangler d1 migrations apply needcash-blog --local
 *   npx wrangler d1 migrations apply needcash-blog --remote
 */
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeRaw from "rehype-raw";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";

const CONTENT_DIR = path.join(process.cwd(), "content/blog");

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeSlug)
  .use(rehypePrettyCode, { theme: "github-dark", keepBackground: true })
  .use(rehypeStringify);

function escapeSql(str) {
  return str.replace(/'/g, "''");
}

const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx"));
const lines = [];

for (const file of files) {
  const slug = file.replace(/\.mdx$/, "");
  const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf-8");
  const { data, content } = matter(raw);

  if (data.published === false) continue;

  const wordCount = content.trim().split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  const compiled = await processor.process(content);

  const title = data.title ?? slug;
  const description = data.description ?? "";
  const date = data.date ?? "";
  const updatedAt = data.updatedAt ?? null;
  const category = data.category ?? "etc";
  const tags = JSON.stringify(data.tags ?? []);
  const html = String(compiled);

  lines.push(
    `INSERT INTO posts (slug, title, description, date, updated_at, category, tags, published, reading_time, content, html) VALUES (` +
      `'${escapeSql(slug)}', ` +
      `'${escapeSql(title)}', ` +
      `'${escapeSql(description)}', ` +
      `'${escapeSql(date)}', ` +
      `${updatedAt ? `'${escapeSql(updatedAt)}'` : "NULL"}, ` +
      `'${escapeSql(category)}', ` +
      `'${escapeSql(tags)}', ` +
      `1, ` +
      `${readingTime}, ` +
      `'${escapeSql(content)}', ` +
      `'${escapeSql(html)}'` +
      `);`
  );
}

console.log("-- Auto-generated: MDX blog posts seed data");
console.log(`-- Generated at: ${new Date().toISOString()}`);
console.log(`-- Total posts: ${lines.length}`);
console.log("");
for (const line of lines) {
  console.log(line);
  console.log("");
}
