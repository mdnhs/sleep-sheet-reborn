"use client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

import { useLogout } from "../api/use-logout";
import { useCurrent } from "../api/use-current";
import { ChevronRight, Loader, LogOut, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const useHasMounted = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

export const UserButton = () => {
  const { data: user, isLoading } = useCurrent();
  const { mutate: logout } = useLogout();
  const { resolvedTheme, setTheme } = useTheme();
  const hasMounted = useHasMounted();
  if (isLoading) {
    return (
      <div className=" size-10 rounded-full flex items-center justify-center border">
        <Loader className=" size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const { name, email } = user;
  const displayName = name || "User";

  const avatarFallBack = name
    ? name.charAt(0).toUpperCase()
    : email.charAt(0).toUpperCase() ?? "U";

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="group size-10 rounded-full border-none bg-background/80 p-0 shadow-sm backdrop-blur-sm transition-all hover:bg-background hover:shadow-md data-[popup-open]:shadow-md"
          />
        }
        aria-label="Open user menu"
      >
        <span className="relative block">
          <Avatar className="size-9">
            <AvatarFallback className="bg-gradient-to-br from-foreground to-foreground/70 font-semibold text-sm text-background">
              {avatarFallBack}
            </AvatarFallback>
          </Avatar>
          <span className="absolute right-0.5 bottom-0.5 size-2.5 rounded-full border-2 border-background bg-emerald-500" />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="bottom"
        className="w-72 rounded-3xl p-1.5"
        sideOffset={12}
      >
        <div className="rounded-[20px] border border-border/60 bg-muted/30 p-3">
          <div className="flex items-center gap-3">
            <Avatar className="size-14 shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-foreground to-foreground/70 font-semibold text-lg text-background">
                {avatarFallBack}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
          </div>
          <Link
            href="/account"
            className="mt-3 flex items-center justify-between rounded-2xl border border-border/60 bg-background px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Manage account
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        </div>

        <DropdownMenuSeparator className="my-1.5" />
        <DropdownMenuItem
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="font-medium"
        >
          {hasMounted && resolvedTheme === "dark" ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
          {hasMounted && resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => logout()}
          variant="destructive"
          className="font-medium"
        >
          <LogOut className="size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
