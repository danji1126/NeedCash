import { GlassHero } from "@/components/layout/hero/glass-hero";
import { GlassGrid } from "@/components/layout/section-grid/glass-grid";
import { GlassPosts } from "@/components/layout/posts-section/glass-posts";
import type { HomeProps } from "./home-page";

export function GlassHome({ sections, recentPosts }: HomeProps) {
  return (
    <div className="relative z-[1] mx-auto max-w-5xl px-6">
      <GlassHero />
      <GlassGrid sections={sections} />
      <GlassPosts posts={recentPosts} />
    </div>
  );
}
