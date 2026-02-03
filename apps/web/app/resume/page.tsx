import type { Metadata } from "next";
import { RESUME } from "@/lib/constants";
import { RESUME_LABELS } from "@/lib/i18n/resume-labels";
import { SUPPORTED_LANGUAGES, DEFAULT_LANG } from "@/lib/i18n/languages";
import { ResumeContent } from "@/components/resume/resume-content";

export const metadata: Metadata = {
  title: "Resume",
  description: "Interactive curriculum vitae",
  alternates: {
    languages: Object.fromEntries(
      SUPPORTED_LANGUAGES.map((l) => [
        l,
        l === DEFAULT_LANG ? "/resume" : `/resume/${l}`,
      ]),
    ),
  },
};

export default function ResumePage() {
  return (
    <ResumeContent
      resume={RESUME}
      labels={RESUME_LABELS.ko}
      lang="ko"
    />
  );
}
