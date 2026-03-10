import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/mdx";

export const runtime = "edge";
export const alt = "NeedCash Blog";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  const title = post?.title ?? "NeedCash Blog";
  const description = post?.description ?? "";
  const category = post?.category ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#0A0A0A",
          color: "#FFFFFF",
          flexDirection: "column",
          justifyContent: "flex-end",
          fontFamily: "sans-serif",
          padding: "64px 80px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {category && (
            <div
              style={{
                fontSize: 14,
                color: "#888",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
              }}
            >
              {category}
            </div>
          )}
          <div
            style={{
              fontSize: title.length > 40 ? 44 : 56,
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              color: "#FFFFFF",
              maxWidth: 900,
            }}
          >
            {title}
          </div>
          {description && (
            <div
              style={{
                fontSize: 20,
                color: "#8A8A8A",
                maxWidth: 800,
                lineHeight: 1.5,
              }}
            >
              {description.length > 120
                ? description.slice(0, 120) + "..."
                : description}
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 48,
            paddingTop: 24,
            borderTop: "1px solid #222",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, color: "#FFFFFF" }}>
            NeedCash
          </div>
          <div style={{ fontSize: 14, color: "#444" }}>needcash.dev/blog</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
