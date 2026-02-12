import { BentoHero } from "@/components/layout/hero/bento-hero";
import { BentoGrid } from "@/components/layout/section-grid/bento-grid";
import { BentoPosts } from "@/components/layout/posts-section/bento-posts";
import type { HomeProps } from "./home-page";

export function BentoHome({ sections, recentPosts }: HomeProps) {
  return (
    <div className="mx-auto max-w-[80rem] px-4 py-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <BentoHero />
        <BentoGrid sections={sections} />
        <BentoPosts posts={recentPosts} />
      </div>
    </div>
  );
}
