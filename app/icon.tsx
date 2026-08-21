import { ImageResponse } from "next/og";

export const size = { width: 48, height: 48 };
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
          borderRadius: 10,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "#628a20",
            position: "relative",
            display: "flex",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 9,
              left: -8,
              width: 39,
              height: 8,
              borderRadius: "50%",
              border: "3px solid #645396",
              transform: "rotate(-20deg)",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
