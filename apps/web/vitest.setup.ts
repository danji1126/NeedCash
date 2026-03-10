import { vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

// ─── 환경변수 설정 ───
process.env.USE_LOCAL_DB = "true";
process.env.ADMIN_API_KEY = "test-secret-key-for-vitest";

// ─── framer-motion 글로벌 mock ───
vi.mock("framer-motion", () => {
  const motion = new Proxy(
    {},
    {
      get: (_target, prop: string) => {
        return ({
          children,
          ...props
        }: {
          children?: React.ReactNode;
          [key: string]: unknown;
        }) => {
          const {
            initial: _i, animate: _a, exit: _e, transition: _t,
            whileHover: _wh, whileTap: _wt, whileInView: _wiv,
            variants: _v, layout: _l, layoutId: _li,
            ...domProps
          } = props;
          const React = require("react");
          return React.createElement(prop, domProps, children);
        };
      },
    }
  );
  return {
    motion,
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => children,
    useAnimation: () => ({ start: vi.fn(), stop: vi.fn(), set: vi.fn() }),
    useInView: () => true,
    useScroll: () => ({
      scrollY: { get: () => 0, onChange: vi.fn() },
      scrollYProgress: { get: () => 0, onChange: vi.fn() },
    }),
    useTransform: () => 0,
    useMotionValue: (initial: number) => ({
      get: () => initial, set: vi.fn(), onChange: vi.fn(),
    }),
    useReducedMotion: () => false,
  };
});

// ─── next/navigation 글로벌 mock ───
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(), replace: vi.fn(), back: vi.fn(),
    forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// ─── next/link mock ───
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => {
    const React = require("react");
    return React.createElement("a", { href, ...props }, children);
  },
}));

// ─── next/image mock ───
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const React = require("react");
    return React.createElement("img", props);
  },
}));

// ─── 테스트 격리 cleanup ───
afterEach(() => {
  if (typeof localStorage !== "undefined") localStorage.clear();
  if (typeof sessionStorage !== "undefined") sessionStorage.clear();
  vi.useRealTimers();
  vi.clearAllMocks();
});
