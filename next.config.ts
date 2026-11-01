import type { NextConfig } from "next";

// Estas páginas mostram texto escrito pelo freelancer. Em desenvolvimento, o Next
// precisa também de eval e de ligação por websocket.
const isDev = process.env.NODE_ENV === "development";
const PUBLIC_SITE_HEADERS = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'none'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      `connect-src 'self'${isDev ? " ws:" : ""}`,
      "object-src 'none'",
      "base-uri 'none'",
      "form-action 'none'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Também no cabeçalho, para valer antes de a página acabar de carregar.
  async headers() {
    return [
      {
        source: "/demo/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          ...PUBLIC_SITE_HEADERS,
        ],
      },
      { source: "/s/:path*", headers: PUBLIC_SITE_HEADERS },
    ];
  },
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
