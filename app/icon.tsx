import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 7,
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "#628a20",
            position: "relative",
            display: "flex",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 6,
              left: -5,
              width: 26,
              height: 5,
              borderRadius: "50%",
              border: "2px solid #645396",
              transform: "rotate(-20deg)",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
