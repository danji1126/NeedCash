import type { ResumeData } from "@/lib/constants";
import type { ResumeLabels } from "@/lib/i18n/resume-labels";
import type { Lang } from "@/lib/i18n/languages";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Timeline } from "@/components/resume/timeline";
import { SkillChart } from "@/components/resume/skill-chart";
import { LanguageSwitcher } from "@/components/resume/language-switcher";

interface ResumeContentProps {
  resume: ResumeData;
  labels: ResumeLabels;
  lang: Lang;
}

export function ResumeContent({ resume, labels, lang }: ResumeContentProps) {
  const totalProjects = resume.experience.reduce(
    (sum, exp) => sum + (exp.projects?.length ?? 0),
    0,
  );

  return (
    <div className="mx-auto max-w-3xl px-8 py-20" lang={lang}>
      <LanguageSwitcher currentLang={lang} />

      {/* Header */}
      <ScrollReveal>
        <p className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
          {labels.curriculumVitae}
        </p>
        <h1 className="mt-4 font-heading text-4xl font-bold tracking-[-0.03em]">
          {resume.name}
        </h1>
        <p className="mt-3 text-text-secondary leading-relaxed">
          {resume.title}
        </p>
        <p className="mt-2 text-sm text-text-muted leading-relaxed">
          {resume.bio}
        </p>
        <div className="mt-4 flex gap-6 text-sm text-text-secondary">
          <span>
            {resume.experience.length}
            {labels.companySuffix}
          </span>
          <span>
            {totalProjects}
            {labels.projectSuffix}
          </span>
          <span>
            {resume.skills.length}
            {labels.skillSuffix}
          </span>
        </div>
        <div className="mt-6 h-px bg-border/60" />
      </ScrollReveal>

      {/* Experience */}
      <ScrollReveal delay={0.1}>
        <section className="mt-16">
          <p className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
            {labels.experience}
          </p>
          <Timeline
            items={resume.experience}
            labels={{
              projectCount: labels.projectCount,
              teamMemberSuffix: labels.teamMemberSuffix,
            }}
          />
        </section>
      </ScrollReveal>

      {/* Skills */}
      <ScrollReveal delay={0.2}>
        <section className="mt-16">
          <p className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
            {labels.skills}
          </p>
          <SkillChart skills={resume.skills} />
        </section>
      </ScrollReveal>

      {/* Contact */}
      <ScrollReveal delay={0.4}>
        <section className="mt-16">
          <p className="text-[13px] uppercase tracking-[0.2em] text-text-muted">
            {labels.contact}
          </p>
          <div className="mt-4 space-y-2 text-sm text-text-secondary">
            {resume.contact.email && (
              <p>
                {labels.email}: {resume.contact.email}
              </p>
            )}
            {resume.contact.github && (
              <p>
                {labels.github}:{" "}
                <a
                  href={resume.contact.github}
                  className="text-text underline underline-offset-4 transition-opacity hover:opacity-50"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {resume.contact.github}
                </a>
              </p>
            )}
            {resume.contact.blog && (
              <p>
                {labels.blog}:{" "}
                <a
                  href={resume.contact.blog}
                  className="text-text underline underline-offset-4 transition-opacity hover:opacity-50"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {resume.contact.blog}
                </a>
              </p>
            )}
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}
