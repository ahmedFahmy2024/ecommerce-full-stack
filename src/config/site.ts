/**
 * Global site configuration (remediation T16).
 *
 * The previous file re-exported the old education-domain menu registry, which
 * was deleted in the T16 remediation — those labels, routes, and permission
 * strings are not valid for the Nest e-commerce backend. The e-commerce
 * navigation (Overview / Catalog / Sales / Customers / Marketing / Account)
 * lives in `src/config/navigation.ts` (T22).
 */
export const siteConfig = {
  name: "Enterprise Dashboard",
  description:
    "A professional, multi-layered dashboard template built with Next.js and Tailwind CSS.",
  url: "https://dashboard.example.com",
  ogImage: "https://dashboard.example.com/og.jpg",
  links: {
    github: "https://github.com/example/dashboard",
  },

  layout: {
    type: "vertical" as const,
    sidebarType: "classic" as const,
    defaultTheme: "system" as const,
  },
} as const;

export type SiteConfig = typeof siteConfig;
