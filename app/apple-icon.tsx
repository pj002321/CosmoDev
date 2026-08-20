import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0b",
        }}
      >
        <div
          style={{
            width: 90,
            height: 90,
            borderRadius: "50%",
            background: "#628a20",
            position: "relative",
            display: "flex",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 34,
              left: -28,
              width: 146,
              height: 26,
              borderRadius: "50%",
              border: "10px solid #645396",
              transform: "rotate(-20deg)",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
