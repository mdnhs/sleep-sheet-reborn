"use client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useLogout } from "../api/use-logout";
import { useCurrent } from "../api/use-current";
import { Loader, LogOut } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export const UserButton = () => {
  const { data: user, isLoading } = useCurrent();
  const { mutate: logout } = useLogout();
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

  const avatarFallBack = name
    ? name.charAt(0).toUpperCase()
    : email.charAt(0).toUpperCase() ?? "U";

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className=" outline-none relative">
        <Avatar className=" size-9 hover:opacity-75 transition border">
          <AvatarFallback className=" font-medium text-sm flex items-center justify-center">
            {avatarFallBack}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="bottom"
        className="w-60"
        sideOffset={10}
      >
        <div className=" flex flex-col items-center justify-center gap-2 px-2.5 py-4">
          <Link href="/account">
            <Avatar className=" size-[52px] border">
              <AvatarFallback className=" font-medium text-xl  flex items-center justify-center">
                {avatarFallBack}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className=" flex flex-col items-center justify-center">
            <p className=" text-sm font-medium">{name || "user"}</p>
            <p className=" text-xs ">{email}</p>
          </div>
        </div>

        <Separator className=" mb-1" />
        <DropdownMenuItem
          onClick={() => logout()}
          className=" h-10 flex items-center justify-center font-medium cursor-pointer"
        >
          <LogOut className=" size-4 mr-2" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
