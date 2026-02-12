import { EditorialHero } from "@/components/layout/hero/editorial-hero";
import { EditorialGrid } from "@/components/layout/section-grid/editorial-grid";
import { EditorialPosts } from "@/components/layout/posts-section/editorial-posts";
import type { HomeProps } from "./home-page";

export function EditorialHome({ sections, recentPosts }: HomeProps) {
  return (
    <div className="mx-auto max-w-6xl px-8">
      <EditorialHero />
      <EditorialGrid sections={sections} />
      <EditorialPosts posts={recentPosts} />
    </div>
  );
}
