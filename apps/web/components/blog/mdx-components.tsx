/* eslint-disable @typescript-eslint/no-explicit-any */

export const mdxComponents: Record<string, React.ComponentType<any>> = {
  h1: (props: any) => (
    <h1
      className="mt-12 mb-4 font-heading text-3xl font-bold tracking-[-0.03em]"
      {...props}
    />
  ),
  h2: (props: any) => (
    <h2
      className="mt-10 mb-3 font-heading text-2xl font-semibold tracking-[-0.02em]"
      id={toId(props.children)}
      {...props}
    />
  ),
  h3: (props: any) => (
    <h3
      className="mt-8 mb-2 font-heading text-xl font-semibold tracking-[-0.01em]"
      id={toId(props.children)}
      {...props}
    />
  ),
  p: (props: any) => (
    <p className="my-4 leading-[1.8] text-text-secondary" {...props} />
  ),
  a: ({ href, children, ...rest }: any) => (
    <a
      href={href}
      className="text-text underline underline-offset-4 transition-opacity hover:opacity-50"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      {...rest}
    >
      {children}
    </a>
  ),
  ul: (props: any) => (
    <ul className="my-4 list-disc pl-6 space-y-1" {...props} />
  ),
  ol: (props: any) => (
    <ol className="my-4 list-decimal pl-6 space-y-1" {...props} />
  ),
  li: (props: any) => (
    <li className="leading-[1.8] text-text-secondary" {...props} />
  ),
  blockquote: (props: any) => (
    <blockquote
      className="my-6 border-l-2 border-border pl-5 italic text-text-muted"
      {...props}
    />
  ),
  code: (props: any) => {
    if (props["data-language"]) {
      return <code {...props} />;
    }
    return (
      <code
        className="rounded bg-code-bg px-1.5 py-0.5 font-mono text-[0.9em]"
        {...props}
      />
    );
  },
  pre: (props: any) => (
    <pre
      className="my-6 overflow-x-auto rounded-lg p-4 font-mono text-sm [&>code]:bg-transparent"
      {...props}
    />
  ),
  hr: () => <hr className="my-10 border-border/40" />,
};

function toId(children: React.ReactNode): string {
  if (typeof children === "string") {
    return children.toLowerCase().replace(/\s+/g, "-");
  }
  return "";
}
