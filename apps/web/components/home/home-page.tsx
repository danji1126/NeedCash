"use client";

import { useDesign } from "@/lib/design/use-design";
import { EditorialHome } from "./editorial-home";
import { BentoHome } from "./bento-home";
import { BrutalistHome } from "./brutalist-home";
import { GlassHome } from "./glass-home";

interface Post {
  slug: string;
  title: string;
  description?: string;
  date: string;
}

interface Section {
  href: string;
  label: string;
  desc: string;
}

export interface HomeProps {
  sections: Section[];
  recentPosts: Post[];
}

export function HomePage({ sections, recentPosts }: HomeProps) {
  const { design } = useDesign();

  switch (design) {
    case "bento":
      return <BentoHome sections={sections} recentPosts={recentPosts} />;
    case "brutalist":
      return <BrutalistHome sections={sections} recentPosts={recentPosts} />;
    case "glass":
      return <GlassHome sections={sections} recentPosts={recentPosts} />;
    default:
      return <EditorialHome sections={sections} recentPosts={recentPosts} />;
  }
}
