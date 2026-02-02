"use client";

import { motion } from "framer-motion";
import type { Skill } from "@/lib/constants";

export function SkillChart({ skills }: { skills: Skill[] }) {
  const categories = [...new Set(skills.map((s) => s.category))];

  return (
    <div className="mt-4 space-y-8">
      {categories.map((category) => (
        <div key={category}>
          <h3 className="text-sm font-medium text-text-secondary">
            {category}
          </h3>
          <div className="mt-3 space-y-3">
            {skills
              .filter((s) => s.category === category)
              .map((skill) => (
                <div key={skill.name} className="flex items-center gap-4">
                  <span className="w-24 text-sm tracking-[-0.01em]">
                    {skill.name}
                  </span>
                  <div className="flex-1">
                    <div className="h-[3px] overflow-hidden bg-bg-tertiary">
                      <motion.div
                        className="h-full bg-text"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${(skill.level / 5) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 1,
                          ease: [0.215, 0.61, 0.355, 1],
                        }}
                      />
                    </div>
                  </div>
                  <span className="w-8 text-right text-[13px] text-text-muted">
                    {skill.level}/5
                  </span>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
