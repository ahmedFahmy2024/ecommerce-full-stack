/**
 * Global site configuration (remediation T16).
 *
 * Previous file re-exported `menusConfig` (education-domain navigation).
 * That registry was deleted in T16 remediation — old menu labels, cloned
 * routes, and permission strings are not valid for Nest e-commerce.
 * Navigation T22 will reintroduce Overview/Catalog/Sales/Customers/Marketing/Account.
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

  // Navigation placeholder — T22 will populate with real e-commerce menus
  nav: {
    main: [] as const,
    sidebar: [] as const,
  },
} as const;

export type SiteConfig = typeof siteConfig;
