"use client";

export default function GlobalError({
  error,
  reset,
  retry,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
  retry?: () => void;
}) {
  const retryFn = retry ?? reset;
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#F7F5F0",
          color: "#1A1A17",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "64px 24px" }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
            The ledger could not be opened
          </h1>
          <p style={{ fontSize: 13, color: "#6B675E", marginTop: 8 }}>
            {error.message || "Try again in a moment."}
          </p>
          {retryFn ? (
            <button
              type="button"
              onClick={() => retryFn()}
              style={{
                marginTop: 16,
                height: 32,
                padding: "0 12px",
                borderRadius: 6,
                border: "none",
                background: "#0E3A5B",
                color: "#fff",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          ) : null}
        </div>
      </body>
    </html>
  );
}
