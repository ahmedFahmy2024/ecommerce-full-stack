import type { LucideIcon } from "lucide-react";

import { routes } from "@/constants/routes";
import { PERMISSION, type Permission } from "@/lib/authz/permissions";
import {
  Activity,
  Bell,
  Building2,
  FileJson,
  FileQuestion,
  FileText,
  Globe,
  GraduationCap,
  History,
  Image,
  Layers,
  LayoutDashboard,
  Library,
  Lock,
  MapPin,
  Palette,
  School,
  Settings,
  Shapes,
  ShieldCheck,
  UserCheck,
  UserCircle,
  UserRoundCheck,
  Users,
  UsersRound,
  Zap,
} from "lucide-react";

export interface MenuItemProps {
  title: string;
  icon?: LucideIcon;
  href?: string;
  items?: MenuItemProps[];
  megaMenu?: boolean;
  /** Permission(s) required to see this item. Array = ANY-OF semantics. */
  permission?: Permission | Permission[];
}

export const menusConfig = {
  mainNav: [
    {
      title: "dashboard",
      icon: LayoutDashboard,
      href: routes.dashboard.index,
    },
    {
      title: "users",
      icon: Users,
      href: routes.userManagement.index,
    },
    {
      title: "education",
      icon: School,
      href: routes.education.classes,
    },
    {
      title: "settings",
      icon: Settings,
      href: routes.settings.index,
      megaMenu: true,
      items: [
        {
          title: "profile",
          icon: UserCircle,
          href: routes.settings.profile,
        },
        {
          title: "security",
          icon: ShieldCheck,
          href: routes.settings.security,
        },
        {
          title: "appearance",
          icon: Palette,
          href: routes.settings.appearance,
        },
      ],
    },
  ],
  sidebarNav: [
    {
      title: "general",
      items: [
        {
          title: "overview",
          icon: LayoutDashboard,
          href: routes.dashboard.index,
        },
        {
          title: "analytics",
          icon: Activity,
          href: routes.dashboard.analytics,
        },
        {
          title: "reports",
          icon: FileText,
          href: routes.dashboard.reports,
        },
      ],
    },
    {
      title: "userManagement",
      items: [
        {
          title: "users",
          icon: Users,
          href: routes.userManagement.index,
          permission: PERMISSION.USER.LIST,
          items: [
            {
              title: "list",
              href: routes.userManagement.index,
              permission: PERMISSION.USER.LIST,
            },
            {
              title: "create",
              href: routes.userManagement.create,
              permission: PERMISSION.USER.CREATE,
            },
          ],
        },
        {
          title: "students",
          icon: GraduationCap,
          href: routes.students.index,
          permission: PERMISSION.USER.LIST,
          items: [
            {
              title: "list",
              href: routes.students.index,
              permission: PERMISSION.USER.LIST,
            },
            {
              title: "create",
              href: routes.students.create,
              permission: PERMISSION.USER.CREATE,
            },
          ],
        },
        {
          title: "instructors",
          icon: UserCheck,
          href: routes.instructors.index,
          permission: PERMISSION.USER.LIST,
          items: [
            {
              title: "list",
              href: routes.instructors.index,
              permission: PERMISSION.USER.LIST,
            },
            {
              title: "create",
              href: routes.instructors.create,
              permission: PERMISSION.USER.CREATE,
            },
          ],
        },
        {
          title: "supervisors",
          icon: UserRoundCheck,
          href: routes.supervisors.index,
          permission: PERMISSION.USER.LIST,
          items: [
            {
              title: "list",
              href: routes.supervisors.index,
              permission: PERMISSION.USER.LIST,
            },
            {
              title: "create",
              href: routes.supervisors.create,
              permission: PERMISSION.USER.CREATE,
            },
          ],
        },
        {
          title: "roles",
          icon: ShieldCheck,
          href: routes.userManagement.roles.index,
          permission: PERMISSION.ROLE.LIST,
          items: [
            {
              title: "list",
              href: routes.userManagement.roles.index,
              permission: PERMISSION.ROLE.LIST,
            },
            {
              title: "create",
              href: routes.userManagement.roles.create,
              permission: PERMISSION.ROLE.CREATE,
            },
          ],
        },
      ],
    },
    {
      title: "education",
      items: [
        {
          title: "categories",
          icon: Shapes,
          href: routes.categories.index,
          permission: PERMISSION.CATEGORY.LIST,
          items: [
            {
              title: "list",
              href: routes.categories.index,
              permission: PERMISSION.CATEGORY.LIST,
            },
            {
              title: "create",
              href: routes.categories.create,
              permission: PERMISSION.CATEGORY.CREATE,
            },
          ],
        },
        {
          title: "stages",
          icon: Layers,
          href: routes.stages.index,
          permission: PERMISSION.STAGE.LIST,
          items: [
            {
              title: "list",
              href: routes.stages.index,
              permission: PERMISSION.STAGE.LIST,
            },
            {
              title: "create",
              href: routes.stages.create,
              permission: PERMISSION.STAGE.CREATE,
            },
          ],
        },
        {
          title: "batches",
          icon: UsersRound,
          href: routes.batches.index,
          permission: PERMISSION.BATCH.LIST,
          items: [
            {
              title: "list",
              href: routes.batches.index,
              permission: PERMISSION.BATCH.LIST,
            },
            {
              title: "create",
              href: routes.batches.create,
              permission: PERMISSION.BATCH.CREATE,
            },
          ],
        },
        {
          title: "classes",
          icon: School,
          href: routes.classes.index,
          permission: PERMISSION.CLASS.LIST,
          items: [
            {
              title: "list",
              href: routes.classes.index,
              permission: PERMISSION.CLASS.LIST,
            },
            {
              title: "create",
              href: routes.classes.create,
              permission: PERMISSION.CLASS.CREATE,
            },
          ],
        },
        {
          title: "materials",
          icon: Library,
          href: routes.materials.index,
          permission: PERMISSION.MATERIAL.LIST,
          items: [
            {
              title: "list",
              href: routes.materials.index,
              permission: PERMISSION.MATERIAL.LIST,
            },
            {
              title: "create",
              href: routes.materials.create,
              permission: PERMISSION.MATERIAL.CREATE,
            },
          ],
        },
      ],
    },
    {
      title: "learningResources",
      items: [
        {
          title: "quizzes",
          icon: FileQuestion,
          href: routes.quizzes.index,
          permission: PERMISSION.QUIZ.LIST,
          items: [
            {
              title: "list",
              href: routes.quizzes.index,
              permission: PERMISSION.QUIZ.LIST,
            },
            {
              title: "create",
              href: routes.quizzes.create,
              permission: PERMISSION.QUIZ.CREATE,
            },
          ],
        },
        {
          title: "forms",
          icon: FileJson,
          href: routes.forms.index,
          permission: PERMISSION.FORM.LIST,
          items: [
            {
              title: "list",
              href: routes.forms.index,
              permission: PERMISSION.FORM.LIST,
            },
            {
              title: "create",
              href: routes.forms.create,
              permission: PERMISSION.FORM.CREATE,
            },
          ],
        },
        {
          title: "banners",
          icon: Image,
          href: routes.banners.index,
          permission: PERMISSION.BANNER.LIST,
          items: [
            {
              title: "list",
              href: routes.banners.index,
              permission: PERMISSION.BANNER.LIST,
            },
            {
              title: "create",
              href: routes.banners.create,
              permission: PERMISSION.BANNER.CREATE,
            },
          ],
        },
      ],
    },
    {
      title: "geography",
      items: [
        {
          title: "countries",
          icon: Globe,
          href: routes.countries.index,
          permission: PERMISSION.COUNTRY.LIST,
          items: [
            {
              title: "list",
              href: routes.countries.index,
              permission: PERMISSION.COUNTRY.LIST,
            },
            {
              title: "create",
              href: routes.countries.create,
              permission: PERMISSION.COUNTRY.CREATE,
            },
          ],
        },
        {
          title: "cities",
          icon: Building2,
          href: routes.cities.index,
          permission: PERMISSION.CITY.LIST,
          items: [
            {
              title: "list",
              href: routes.cities.index,
              permission: PERMISSION.CITY.LIST,
            },
            {
              title: "create",
              href: routes.cities.create,
              permission: PERMISSION.CITY.CREATE,
            },
          ],
        },
        {
          title: "districts",
          icon: MapPin,
          href: routes.districts.index,
          permission: PERMISSION.DISTRICT.LIST,
          items: [
            {
              title: "list",
              href: routes.districts.index,
              permission: PERMISSION.DISTRICT.LIST,
            },
            {
              title: "create",
              href: routes.districts.create,
              permission: PERMISSION.DISTRICT.CREATE,
            },
          ],
        },
      ],
    },
    {
      title: "securitySystem",
      items: [
        {
          title: "permissions",
          icon: Zap,
          href: routes.permissions.index,
          permission: PERMISSION.PERMISSION_ENTITY.LIST,
          items: [
            {
              title: "list",
              href: routes.permissions.index,
              permission: PERMISSION.PERMISSION_ENTITY.LIST,
            },
            {
              title: "create",
              href: routes.permissions.create,
              permission: PERMISSION.PERMISSION_ENTITY.CREATE,
            },
          ],
        },
        {
          title: "auditLogs",
          icon: History,
          href: routes.auditLogs.index,
        },
        {
          title: "notifications",
          icon: Bell,
          href: routes.notifications.index,
        },
      ],
    },
    {
      title: "userSettings",
      items: [
        {
          title: "profile",
          icon: UserCircle,
          href: routes.settings.profile,
        },
        {
          title: "settings",
          icon: Settings,
          href: routes.settings.index,
        },
        {
          title: "security",
          icon: Lock,
          href: routes.settings.security,
        },
      ],
    },
  ],
} as const;

export type MenusConfig = typeof menusConfig;
