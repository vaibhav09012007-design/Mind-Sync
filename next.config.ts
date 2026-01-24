import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Security Headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Content Security Policy
          // {
          //   key: "Content-Security-Policy",
          //   value: [
          //     "default-src 'self'",
          //     "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.io https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com",
          //     "worker-src 'self' blob:",
          //     "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          //     "font-src 'self' https://fonts.gstatic.com",
          //     "img-src 'self' data: blob: https://*.clerk.com https://*.gravatar.com",
          //     "connect-src 'self' https://*.clerk.accounts.dev https://api.clerk.dev wss://*.clerk.accounts.dev https://*.clerk.com",
          //     "frame-src 'self' https://*.clerk.accounts.dev https://challenges.cloudflare.com",
          //     "frame-ancestors 'none'",
          //     "base-uri 'self'",
          //     "form-action 'self'",
          //   ].join("; "),
          // },
          // Prevent XSS
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Prevent clickjacking
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Prevent MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Referrer Policy
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Permissions Policy
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=(), interest-cohort=()",
          },
          // Strict Transport Security (HTTPS only)
          // {
          //   key: "Strict-Transport-Security",
          //   value: "max-age=31536000; includeSubDomains",
          // },
        ],
      },
    ];
  },
};

export default nextConfig;
