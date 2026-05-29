// src/app/domain-not-found/page.tsx
// Displayed when a request arrives from a custom domain that is not configured
// or has not yet been verified in ClientSpace.
// No ClientSpace branding on this page — it may be accessed from a third-party domain.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portal Not Available",
  description: "The domain you are visiting is not configured or has been removed.",
  robots: { index: false, follow: false },
};

export default function DomainNotFoundPage() {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Portal Not Available</title>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: #09090b;
            color: #a1a1aa;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 2rem;
          }
          .container {
            max-width: 480px;
            width: 100%;
            text-align: center;
          }
          .icon {
            width: 56px;
            height: 56px;
            margin: 0 auto 1.5rem;
            background: #18181b;
            border: 1px solid #27272a;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          h1 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #fafafa;
            margin: 0 0 0.75rem;
            letter-spacing: -0.015em;
          }
          p {
            font-size: 0.9rem;
            line-height: 1.6;
            color: #71717a;
            margin: 0 0 2rem;
          }
          a {
            display: inline-flex;
            align-items: center;
            gap: 0.375rem;
            padding: 0.5rem 1.25rem;
            border-radius: 8px;
            background: #18181b;
            border: 1px solid #27272a;
            color: #a1a1aa;
            font-size: 0.875rem;
            font-weight: 500;
            text-decoration: none;
            transition: all 0.15s;
          }
          a:hover {
            background: #27272a;
            color: #fafafa;
          }
          .divider {
            width: 40px;
            height: 1px;
            background: #27272a;
            margin: 2rem auto;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="icon">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#52525b"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <circle cx="12" cy="16" r="0.5" fill="#52525b" />
            </svg>
          </div>

          <h1>This portal is not available</h1>

          <p>
            The domain you&apos;re visiting is not configured or has been
            removed. If you believe this is an error, please contact the agency
            that sent you this link.
          </p>

          <div className="divider" />

          <a href="https://clientspace.app">
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="10,3 5,8 10,13" />
            </svg>
            Return to homepage
          </a>
        </div>
      </body>
    </html>
  );
}
