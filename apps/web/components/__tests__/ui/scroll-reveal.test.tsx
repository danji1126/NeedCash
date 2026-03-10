// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";

// Track MockIntersectionObserver instances
let mockObserverInstances: MockIntersectionObserver[] = [];

class MockIntersectionObserver {
  callback: IntersectionObserverCallback;
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    mockObserverInstances.push(this);
  }

  triggerIntersect(isIntersecting: boolean) {
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

// Control useReducedMotion per test via hoisted ref
const mockReducedMotion = vi.hoisted(() => ({ value: false }));

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
    },
  );
  return {
    motion,
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => children,
    useReducedMotion: () => mockReducedMotion.value,
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
  };
});

import { ScrollReveal } from "@/components/ui/scroll-reveal";

describe("ScrollReveal", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockObserverInstances = [];
    mockReducedMotion.value = false;
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("renders children", () => {
    render(<ScrollReveal><p>Hello</p></ScrollReveal>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("renders immediately without animation when reduced motion is preferred", () => {
    mockReducedMotion.value = true;

    render(<ScrollReveal><p>No animation</p></ScrollReveal>);
    expect(screen.getByText("No animation")).toBeInTheDocument();
    // No IntersectionObserver should be created (returns plain div)
    expect(mockObserverInstances).toHaveLength(0);
  });

  it("observes element after timeout", () => {
    render(<ScrollReveal><p>Observed</p></ScrollReveal>);

    expect(mockObserverInstances).toHaveLength(1);
    expect(mockObserverInstances[0].observe).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(mockObserverInstances[0].observe).toHaveBeenCalledOnce();
  });

  it("disconnects observer on intersect (once behavior)", () => {
    render(<ScrollReveal><p>Once</p></ScrollReveal>);

    act(() => {
      vi.advanceTimersByTime(50);
    });

    const observer = mockObserverInstances[0];

    act(() => {
      observer.triggerIntersect(true);
    });

    expect(observer.disconnect).toHaveBeenCalled();
  });

  it("does not disconnect when not intersecting", () => {
    render(<ScrollReveal><p>Hidden</p></ScrollReveal>);

    act(() => {
      vi.advanceTimersByTime(50);
    });

    const observer = mockObserverInstances[0];

    act(() => {
      observer.triggerIntersect(false);
    });

    expect(observer.disconnect).not.toHaveBeenCalled();
  });

  it("cleans up observer on unmount", () => {
    const { unmount } = render(<ScrollReveal><p>Cleanup</p></ScrollReveal>);

    const observer = mockObserverInstances[0];
    unmount();

    expect(observer.disconnect).toHaveBeenCalled();
  });

  it("accepts className prop", () => {
    const { container } = render(
      <ScrollReveal className="custom-class"><p>Styled</p></ScrollReveal>,
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("custom-class");
  });
});
