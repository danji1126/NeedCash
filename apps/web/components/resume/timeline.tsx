"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Experience } from "@/lib/constants";

function ProjectList({ projects }: { projects: NonNullable<Experience["projects"]> }) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.215, 0.61, 0.355, 1] }}
      className="overflow-hidden"
    >
      <div className="mt-3 space-y-3 border-l border-border/40 pl-4">
        {projects.map((project, j) => (
          <div key={j} className="text-sm">
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-medium tracking-[-0.01em]">{project.name}</p>
              <p className="shrink-0 text-[12px] text-text-muted">{project.period}</p>
            </div>
            {project.client && (
              <p className="mt-0.5 text-[12px] text-text-muted">
                {project.client}
                {project.teamSize && ` · ${project.teamSize}명`}
              </p>
            )}
            <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">
              {project.description}
            </p>
            {project.techStack.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {project.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="inline-block rounded-sm bg-bg-tertiary px-1.5 py-0.5 text-[11px] text-text-muted"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function Timeline({ items }: { items: Experience[] }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <div className="mt-4 space-y-0">
      {items.map((item, i) => {
        const hasProjects = item.projects && item.projects.length > 0;
        const isExpanded = expandedIndex === i;

        return (
          <div
            key={i}
            className="border-b border-border/60 py-5"
          >
            <div
              className={`flex items-baseline justify-between ${hasProjects ? "cursor-pointer" : ""}`}
              onClick={() => {
                if (hasProjects) {
                  setExpandedIndex(isExpanded ? null : i);
                }
              }}
            >
              <p className="font-medium tracking-[-0.01em]">
                {hasProjects && (
                  <span className="mr-1.5 inline-block text-[12px] text-text-muted transition-transform duration-200"
                    style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
                  >
                    ▶
                  </span>
                )}
                {item.company}{" "}
                <span className="text-sm text-text-secondary">
                  &middot; {item.role}
                </span>
                {hasProjects && (
                  <span className="ml-2 text-[12px] text-text-muted">
                    {item.projects!.length}개 프로젝트
                  </span>
                )}
              </p>
              <p className="text-[13px] text-text-muted">{item.period}</p>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              {item.description}
            </p>
            <AnimatePresence>
              {isExpanded && hasProjects && (
                <ProjectList projects={item.projects!} />
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
