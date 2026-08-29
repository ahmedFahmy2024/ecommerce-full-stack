import type { formats } from "./i18n/request";
import type { routing } from "./i18n/routing";

import type Common from "../messages/en/Common.json";
import type IndexPage from "../messages/en/IndexPage.json";
import type Auth from "../messages/en/Auth.json";
import type Users from "../messages/en/Users.json";
import type Categories from "../messages/en/Categories.json";
import type Roles from "../messages/en/Roles.json";

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: {
      Common: typeof Common;
      IndexPage: typeof IndexPage;
      Auth: typeof Auth;
      Users: typeof Users;
      Categories: typeof Categories;
      Roles: typeof Roles;
    };
    Formats: typeof formats;
  }
}
