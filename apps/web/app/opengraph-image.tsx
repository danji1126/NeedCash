import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "NeedCash - 프로토타입 허브";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#0A0A0A",
          color: "#FFFFFF",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          fontFamily: "sans-serif",
          padding: "80px",
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "#FFFFFF",
            lineHeight: 1,
          }}
        >
          NeedCash
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#8A8A8A",
            marginTop: 24,
            letterSpacing: "0.05em",
          }}
        >
          프로토타입 허브 — 게임, 블로그, 이력서
        </div>
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 48,
          }}
        >
          {["Game", "Blog", "Resume"].map((label) => (
            <div
              key={label}
              style={{
                border: "1px solid #333",
                borderRadius: 6,
                padding: "8px 20px",
                color: "#888",
                fontSize: 16,
              }}
            >
              {label}
            </div>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 48,
            right: 80,
            fontSize: 16,
            color: "#444",
          }}
        >
          needcash-hub.danji1126.workers.dev
        </div>
      </div>
    ),
    { ...size }
  );
}
