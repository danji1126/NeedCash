import type { Metadata } from "next";
import { RESUME } from "@/lib/constants";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Timeline } from "@/components/resume/timeline";
import { SkillChart } from "@/components/resume/skill-chart";

export const metadata: Metadata = {
  title: "Resume",
  description: "Interactive curriculum vitae",
};

export default function ResumePage() {
  return (
    <div className="mx-auto max-w-3xl px-8 py-20">
      {/* Header */}
      <ScrollReveal>
        <p className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
          Curriculum Vitae
        </p>
        <h1 className="mt-4 font-heading text-4xl font-bold tracking-[-0.03em]">
          {RESUME.name}
        </h1>
        <p className="mt-3 text-text-secondary leading-relaxed">
          {RESUME.title}
        </p>
        <p className="mt-2 text-sm text-text-muted leading-relaxed">
          {RESUME.bio}
        </p>
        <div className="mt-4 flex gap-6 text-sm text-text-secondary">
          <span>{RESUME.experience.length}개 회사</span>
          <span>{RESUME.experience.reduce((sum, exp) => sum + (exp.projects?.length ?? 0), 0)}개 프로젝트</span>
          <span>{RESUME.skills.length}개 기술</span>
        </div>
        <div className="mt-6 h-px bg-border/60" />
      </ScrollReveal>

      {/* Experience */}
      <ScrollReveal delay={0.1}>
        <section className="mt-16">
          <p className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
            Experience
          </p>
          <Timeline items={RESUME.experience} />
        </section>
      </ScrollReveal>

      {/* Skills */}
      <ScrollReveal delay={0.2}>
        <section className="mt-16">
          <p className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
            Skills
          </p>
          <SkillChart skills={RESUME.skills} />
        </section>
      </ScrollReveal>

      {/* Contact */}
      <ScrollReveal delay={0.4}>
        <section className="mt-16">
          <p className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
            Contact
          </p>
          <div className="mt-4 space-y-2 text-sm text-text-secondary">
            {RESUME.contact.email && <p>Email: {RESUME.contact.email}</p>}
            {RESUME.contact.github && (
              <p>
                GitHub:{" "}
                <a
                  href={RESUME.contact.github}
                  className="text-text underline underline-offset-4 transition-opacity hover:opacity-50"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {RESUME.contact.github}
                </a>
              </p>
            )}
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}
