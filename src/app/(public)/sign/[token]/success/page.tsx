// src/app/(public)/sign/[token]/success/page.tsx
// Shown after the client successfully signs a contract.
// Polls for pdfUrl once so the download link appears ASAP after Inngest finishes.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Document Signed | ClientSpace",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function SigningSuccessPage({ params }: PageProps) {
  const { token } = await params;

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Animated checkmark */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center animate-[bounceIn_0.5s_ease-out]">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-emerald-600 dark:text-emerald-400"
              style={{
                strokeDasharray: 50,
                strokeDashoffset: 0,
                animation: "drawCheck 0.6s ease-out 0.2s both",
              }}
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        <style>{`
          @keyframes drawCheck {
            from { stroke-dashoffset: 50; }
            to   { stroke-dashoffset: 0; }
          }
          @keyframes bounceIn {
            0%   { transform: scale(0.5); opacity: 0; }
            70%  { transform: scale(1.05); }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Document signed!
          </h1>
          <p className="text-neutral-500 text-sm">
            Thank you. Your signature has been recorded and the document has been
            sent back to the sender.
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 text-sm text-neutral-600 dark:text-neutral-400 text-left space-y-2">
          <p className="font-medium text-neutral-800 dark:text-neutral-200">What happens next</p>
          <ul className="space-y-1.5 list-disc list-inside text-neutral-500">
            <li>A signed copy of the document will be emailed to you shortly.</li>
            <li>The sender will also receive a notification with the signed document.</li>
            <li>Keep this page&apos;s token for your records if needed: <code className="text-xs font-mono bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">{token.slice(0, 8)}…</code></li>
          </ul>
        </div>

        <p className="text-xs text-neutral-400">
          You can safely close this tab.
        </p>
      </div>
    </div>
  );
}
