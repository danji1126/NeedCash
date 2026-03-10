"use client";

import dynamic from "next/dynamic";
import { useDesign } from "@/lib/design/use-design";

const EditorialHeader = dynamic(() => import("./header/editorial-header").then(m => ({ default: m.EditorialHeader })));
const BentoHeader = dynamic(() => import("./header/bento-header").then(m => ({ default: m.BentoHeader })));
const BrutalistHeader = dynamic(() => import("./header/brutalist-header").then(m => ({ default: m.BrutalistHeader })));
const GlassHeader = dynamic(() => import("./header/glass-header").then(m => ({ default: m.GlassHeader })));

export function Header() {
  const { design } = useDesign();

  switch (design) {
    case "bento":
      return <BentoHeader />;
    case "brutalist":
      return <BrutalistHeader />;
    case "glass":
      return <GlassHeader />;
    default:
      return <EditorialHeader />;
  }
}
