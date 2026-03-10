"use client";

import dynamic from "next/dynamic";
import { useDesign } from "@/lib/design/use-design";
import { DailyChallenge } from "./daily-challenge";

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

const EditorialHome = dynamic(() => import("./editorial-home").then(m => ({ default: m.EditorialHome })));
const BentoHome = dynamic(() => import("./bento-home").then(m => ({ default: m.BentoHome })));
const BrutalistHome = dynamic(() => import("./brutalist-home").then(m => ({ default: m.BrutalistHome })));
const GlassHome = dynamic(() => import("./glass-home").then(m => ({ default: m.GlassHome })));

export function HomePage({ sections, recentPosts }: HomeProps) {
  const { design } = useDesign();

  let content: React.ReactNode;
  switch (design) {
    case "bento":
      content = <BentoHome sections={sections} recentPosts={recentPosts} />;
      break;
    case "brutalist":
      content = <BrutalistHome sections={sections} recentPosts={recentPosts} />;
      break;
    case "glass":
      content = <GlassHome sections={sections} recentPosts={recentPosts} />;
      break;
    default:
      content = <EditorialHome sections={sections} recentPosts={recentPosts} />;
  }

  return (
    <>
      {content}
      <div className="mx-auto max-w-3xl px-8 pb-20">
        <DailyChallenge />
      </div>
    </>
  );
}
