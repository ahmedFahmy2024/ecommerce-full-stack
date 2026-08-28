"use client";

import { logoutAction } from "@/lib/actions/logout";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { LogOut } from "lucide-react";

export function LogoutButton({ displayName }: { displayName: string }) {
  return (
    <form action={logoutAction}>
      <SidebarMenuButton type="submit">
        <LogOut />
        <span>Logout ({displayName})</span>
      </SidebarMenuButton>
    </form>
  );
}
