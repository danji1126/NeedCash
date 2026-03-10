"use client";

import dynamic from "next/dynamic";
import { useDesign } from "@/lib/design/use-design";

const EditorialFooter = dynamic(() => import("./footer/editorial-footer").then(m => ({ default: m.EditorialFooter })));
const BentoFooter = dynamic(() => import("./footer/bento-footer").then(m => ({ default: m.BentoFooter })));
const BrutalistFooter = dynamic(() => import("./footer/brutalist-footer").then(m => ({ default: m.BrutalistFooter })));
const GlassFooter = dynamic(() => import("./footer/glass-footer").then(m => ({ default: m.GlassFooter })));

export function Footer() {
  const { design } = useDesign();

  switch (design) {
    case "bento":
      return <BentoFooter />;
    case "brutalist":
      return <BrutalistFooter />;
    case "glass":
      return <GlassFooter />;
    default:
      return <EditorialFooter />;
  }
}
