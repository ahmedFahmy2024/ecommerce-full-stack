"use client";

import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/services/api/auth";
import { useRouter } from "@/i18n/navigation";

interface NoAccessProps {
  title?: string;
  message?: string;
}

export function NoAccess({
  title = "No access yet",
  message = "Your account doesn't have any permissions assigned. Please contact your administrator to request access.",
}: NoAccessProps) {
  const router = useRouter();
  async function handleLogout() {
    try {
      await logout();
    } finally {
      router.push("/login");
    }
  }
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-muted p-4">
          <ShieldOff className="size-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground text-sm">{message}</p>
        <Button onClick={handleLogout} variant="outline" size="sm">
          Logout
        </Button>
      </div>
    </div>
  );
}
