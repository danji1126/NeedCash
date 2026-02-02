export const SITE = {
  name: "NeedCash",
  description: "프로토타입 허브 - 게임, 블로그, 광고, 이력서를 하나의 공간에서.",
  url: "https://needcash.dev",
} as const;

export const NAV_LINKS = [
  { href: "/blog", label: "Blog" },
  { href: "/game", label: "Game" },
  { href: "/ads", label: "Ads" },
  { href: "/resume", label: "Resume" },
] as const;

// ── 게임 데이터 ──

export interface Game {
  slug: string;
  title: string;
  description: string;
  emoji: string;
}

export const GAMES: Game[] = [
  {
    slug: "dice",
    title: "Dice Roller",
    description: "주사위 2개를 굴려 운을 시험하세요",
    emoji: "🎲",
  },
  {
    slug: "lotto",
    title: "Lotto Pick",
    description: "행운의 로또번호를 뽑아보세요",
    emoji: "🍀",
  },
];

// ── 이력서 데이터 ──

import resumeData from "@/content/resume/resume.json";

export interface Project {
  name: string;
  client: string;
  period: string;
  description: string;
  role: string;
  teamSize: number | null;
  techStack: string[];
}

export interface Experience {
  company: string;
  role: string;
  period: string;
  description: string;
  projects?: Project[];
}

export interface Skill {
  name: string;
  level: number; // 1-5
  category: "Frontend" | "Backend" | "Database" | "Mobile" | "Tool";
}

export interface Education {
  school: string;
  degree: string;
  period: string;
}

export interface ResumeData {
  name: string;
  title: string;
  bio: string;
  experience: Experience[];
  skills: Skill[];
  education: Education[];
  contact: {
    email?: string;
    github?: string;
    linkedin?: string;
  };
}

export const RESUME: ResumeData = resumeData as ResumeData;
