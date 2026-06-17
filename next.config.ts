import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "recharts",
      "@base-ui/react",
    ],
  },
  async headers() {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://*.supabase.co";

    const isDev = process.env.NODE_ENV === "development";

    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
      },
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com",
          isDev
            ? `connect-src 'self' ${supabaseUrl} wss://*.supabase.co https://api.resend.com https://*.s3.amazonaws.com https://*.r2.cloudflarestorage.com ws://localhost:* ws://127.0.0.1:* wss://localhost:* wss://127.0.0.1:* https://cloudflareinsights.com`
            : `connect-src 'self' ${supabaseUrl} wss://*.supabase.co https://api.resend.com https://*.s3.amazonaws.com https://*.r2.cloudflarestorage.com https://cloudflareinsights.com`,
          "style-src 'self' 'unsafe-inline'",
          `img-src 'self' data: blob: ${supabaseUrl} https://*.s3.amazonaws.com https://*.r2.cloudflarestorage.com`,
          "font-src 'self'",
          "frame-ancestors 'none'",
        ].join("; "),
      },
    ];

    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
