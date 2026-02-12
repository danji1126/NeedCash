import { BrutalistHero } from "@/components/layout/hero/brutalist-hero";
import { BrutalistGrid } from "@/components/layout/section-grid/brutalist-grid";
import { BrutalistPosts } from "@/components/layout/posts-section/brutalist-posts";
import type { HomeProps } from "./home-page";

export function BrutalistHome({ sections, recentPosts }: HomeProps) {
  return (
    <div>
      <BrutalistHero />
      <BrutalistGrid sections={sections} />
      <BrutalistPosts posts={recentPosts} />
    </div>
  );
}
