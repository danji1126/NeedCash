import { HomePage } from "@/components/home/home-page";
import { getAllPosts } from "@/lib/mdx";

const SECTIONS = [
  { href: "/blog", label: "Blog", desc: "Stories and thoughts on development" },
  { href: "/game", label: "Game", desc: "A collection of simple web games" },
  { href: "/ads", label: "Ads", desc: "Landing page experiments" },
  { href: "/resume", label: "Resume", desc: "Interactive curriculum vitae" },
];

export default function Home() {
  const recentPosts = getAllPosts().slice(0, 3);

  return <HomePage sections={SECTIONS} recentPosts={recentPosts} />;
}
