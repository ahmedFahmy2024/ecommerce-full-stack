import { menusConfig } from "./menus";

/**
 * Global site configuration.
 * Dictates site branding, metadata, and default layout behavior.
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

  /**
   * Layout configuration determines the overall structure of the application.
   */
  layout: {
    type: "vertical", // "vertical" | "horizontal"
    sidebarType: "classic", // "classic" | "module"
    defaultTheme: "system", // "light" | "dark" | "system"
  },

  /**
   * Navigation configuration picks which menu set from menusConfig to use.
   */
  nav: {
    main: menusConfig.mainNav,
    sidebar: menusConfig.sidebarNav,
  },
} as const;

export type SiteConfig = typeof siteConfig;
