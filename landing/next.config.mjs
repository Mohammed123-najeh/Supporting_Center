// Security headers (from the source app's next.config.mjs). The source also set a
// per-request nonce CSP in its middleware, which this landing does not port; add
// one here (or in a middleware) when the site goes live.
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
]

// The public URLs. The pages keep the source's file layout under
// src/app/(site)/landing/, and the source's middleware rewrote the public paths
// onto that internal route; these rewrites do the same job without a middleware.
// The components link to the public paths ("/contact", "/offers/<slug>", ...).
const SITE_INTERNAL = "/landing"
const SITE_REWRITES = [
  { source: "/", destination: SITE_INTERNAL },
  { source: "/contact", destination: `${SITE_INTERNAL}/contact` },
  { source: "/ai-solutions", destination: `${SITE_INTERNAL}/ai-solutions` },
  { source: "/electronic-payment", destination: `${SITE_INTERNAL}/electronic-payment` },
  { source: "/offers/:slug", destination: `${SITE_INTERNAL}/offers/:slug` },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output → small runtime image (server.js + minimal node_modules).
  output: "standalone",
  // A separate build folder for local measurements while `next dev` owns .next
  // (NEXT_DIST_DIR=.next-check npx next build). Unset everywhere else.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: true,
  poweredByHeader: false,
  // No source maps in prod.
  productionBrowserSourceMaps: false,
  async rewrites() {
    return { beforeFiles: SITE_REWRITES }
  },
  async headers() {
    return [{ source: "/(.*)", headers: SECURITY_HEADERS }]
  },
}

export default nextConfig
