"use client";
import { Button } from "@/components/ui/button";
import { useCurrent } from "@/features/auth/api/use-current";
import { UserButton } from "@/features/auth/components/user-button";
import { Moon, PanelLeft, Sun, User } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import DashBoardSideBar from "./dashboard-sidebar";

function DashBoardNavBar() {
  const { data: user } = useCurrent();
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
      <div className="container mx-auto px-4">
        <div className=" py-4 flex flex-row items-center justify-between">
          <div className=" flex flex-row items-center gap-4">
            <button onClick={() => setIsSideBarOpen(!isSideBarOpen)}>
              <PanelLeft size={18} />
            </button>
            <h1 className=" text-lg font-bold  uppercase">Luxestore</h1>
          </div>
          <div className=" flex items-center gap-4 flex-row">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {hasMounted && resolvedTheme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            {!user ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Account"
                nativeButton={false}
                render={<Link href="/signin" />}
              >
                <User className="h-5 w-5" />
              </Button>
            ) : (
              <UserButton />
            )}
          </div>
        </div>
      </div>
      <DashBoardSideBar
        isOpen={isSideBarOpen}
        onClose={() => setIsSideBarOpen(!isSideBarOpen)}
      />
    </nav>
  );
}

export default DashBoardNavBar;
