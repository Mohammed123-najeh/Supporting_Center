// Project config for the public site. The canonical URL drives metadataBase, the
// canonical link, Open Graph URLs and the Organization JSON-LD (the source read it
// from its env as `https://${env.publicSiteHost}`). Set SITE_URL per environment,
// e.g. SITE_URL=https://example.com (no trailing slash needed).
export const SITE_URL = (process.env.SITE_URL || "https://rummanah.dev").replace(/\/+$/, "")
