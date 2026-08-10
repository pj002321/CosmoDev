export default function Loading() {
  return (
    <>
      <div className="loading-bar" aria-hidden="true" />
      <div className="flex items-center justify-center py-32" role="status" aria-label="로딩 중">
        <span className="loading-dot" style={{ "--d": "0s" } as React.CSSProperties} />
        <span className="loading-dot" style={{ "--d": "0.15s" } as React.CSSProperties} />
        <span className="loading-dot" style={{ "--d": "0.3s" } as React.CSSProperties} />
      </div>
    </>
  );
}
