import { HomePage } from "@/components/home/home-page";
import { getAllPosts } from "@/lib/mdx";

export const dynamic = "force-dynamic";

const SECTIONS = [
  { href: "/blog", label: "Blog", desc: "Stories and thoughts on development" },
  { href: "/game", label: "Game", desc: "A collection of simple web games" },
  { href: "/resume", label: "Resume", desc: "Interactive curriculum vitae" },
];

export default async function Home() {
  const recentPosts = (await getAllPosts()).slice(0, 3);

  return <HomePage sections={SECTIONS} recentPosts={recentPosts} />;
}
