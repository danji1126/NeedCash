import type { Lang } from "./languages";

export interface ResumeLabels {
  curriculumVitae: string;
  experience: string;
  skills: string;
  contact: string;
  email: string;
  github: string;
  blog: string;
  companySuffix: string;
  projectSuffix: string;
  skillSuffix: string;
  projectCount: string;
  teamMemberSuffix: string;
}

export const RESUME_LABELS: Record<Lang, ResumeLabels> = {
  ko: {
    curriculumVitae: "Curriculum Vitae",
    experience: "Experience",
    skills: "Skills",
    contact: "Contact",
    email: "Email",
    github: "GitHub",
    blog: "Blog",
    companySuffix: "개 회사",
    projectSuffix: "개 프로젝트",
    skillSuffix: "개 기술",
    projectCount: "개 프로젝트",
    teamMemberSuffix: "명",
  },
  en: {
    curriculumVitae: "Curriculum Vitae",
    experience: "Experience",
    skills: "Skills",
    contact: "Contact",
    email: "Email",
    github: "GitHub",
    blog: "Blog",
    companySuffix: " companies",
    projectSuffix: " projects",
    skillSuffix: " skills",
    projectCount: " projects",
    teamMemberSuffix: " members",
  },
  th: {
    curriculumVitae: "ประวัติย่อ",
    experience: "ประสบการณ์",
    skills: "ทักษะ",
    contact: "ติดต่อ",
    email: "อีเมล",
    github: "GitHub",
    blog: "บล็อก",
    companySuffix: " บริษัท",
    projectSuffix: " โปรเจกต์",
    skillSuffix: " ทักษะ",
    projectCount: " โปรเจกต์",
    teamMemberSuffix: " คน",
  },
  vi: {
    curriculumVitae: "Sơ yếu lý lịch",
    experience: "Kinh nghiệm",
    skills: "Kỹ năng",
    contact: "Liên hệ",
    email: "Email",
    github: "GitHub",
    blog: "Blog",
    companySuffix: " công ty",
    projectSuffix: " dự án",
    skillSuffix: " kỹ năng",
    projectCount: " dự án",
    teamMemberSuffix: " thành viên",
  },
  ja: {
    curriculumVitae: "履歴書",
    experience: "職歴",
    skills: "スキル",
    contact: "連絡先",
    email: "メール",
    github: "GitHub",
    blog: "ブログ",
    companySuffix: "社",
    projectSuffix: "件のプロジェクト",
    skillSuffix: "件のスキル",
    projectCount: "件のプロジェクト",
    teamMemberSuffix: "名",
  },
};
