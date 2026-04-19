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

    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
          `connect-src 'self' ${supabaseUrl} wss://*.supabase.co https://api.resend.com https://*.s3.amazonaws.com https://*.r2.cloudflarestorage.com`,
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
