import { LogOut, ShieldOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/logout";

interface NoAccessProps {
  title?: string;
  message?: string;
}

export function NoAccess({
  title = "No access yet",
  message = "Your account doesn't have any permissions assigned. Please contact your administrator to request access.",
}: NoAccessProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-muted p-4">
          <ShieldOff className="size-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground text-sm">{message}</p>
        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm">
            <LogOut className="me-2 size-4" />
            Logout
          </Button>
        </form>
      </div>
    </div>
  );
}
