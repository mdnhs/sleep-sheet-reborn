"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { UserButton } from "@/features/auth/components/user-button";
import { useCurrent } from "@/features/auth/api/use-current";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCartStore, selectTotalItems } from "@/features/cart/state/use-cart-store";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useSyncExternalStore } from "react";
import { Menu, ShoppingCart, User, Bed, BadgePercent, Search, Sun, Moon, Heart, Home, ShoppingBag } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryState } from "nuqs";
import { useTheme } from "next-themes";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const subscribe = () => () => {};
const useHasMounted = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

import { useLanguage } from "@/hooks/use-language";
import CartDrawer from "./cart/cart-drawer";
import { Button } from "./ui/button";

const NAV_LINKS = [
  { id: 1, name: "home" as const, path: "/" },
  { id: 2, name: "blog" as const, path: "/blog" },
  { id: 3, name: "trackMyOrder" as const, path: "/track-order" },
  { id: 4, name: "shop" as const, path: "/shop", hasBadge: false, icon: ShoppingBag },
];

function NavbarLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sortParam = searchParams.get("sort");
  const { t } = useLanguage();

  return NAV_LINKS.map((link) => {
    // Determine active state based on path and query parameters
    let isActive = false;
    if (link.path === "/") {
      isActive = pathname === "/";
    } else if (link.path.includes("sort=discount")) {
      isActive = pathname === "/shop" && sortParam === "discount";
    } else {
      isActive = pathname === link.path;
    }

    const Icon = link.icon;
    return (
      <Link
        key={link.name}
        href={link.path}
        className={`flex items-center gap-1.5 text-[15px] font-medium transition-colors hover:text-primary ${
          isActive ? "text-primary font-semibold" : "text-slate-600 dark:text-slate-400"
        }`}
        onClick={onNavigate}
      >
        {Icon && <Icon className="h-4.5 w-4.5" />}
        <span>{t(link.name)}</span>
        {link.hasBadge && (
            <span className="ml-1 rounded-[4px] bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
            NEW
          </span>
        )}
      </Link>
    );
  });
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const hasMounted = useHasMounted();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            onClick={toggleTheme}
            className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-transparent transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-105 text-foreground focus:outline-none"
            aria-label="Toggle theme"
          />
        }
      >
        {hasMounted && theme === "dark" ? (
          <Sun className="h-5 w-5 transition-transform duration-500 group-hover:rotate-45" />
        ) : (
          <Moon className="h-5 w-5 transition-transform duration-500 group-hover:-rotate-12" />
        )}
      </TooltipTrigger>
      <TooltipContent side="bottom">Toggle theme</TooltipContent>
    </Tooltip>
  );
}

function MobileThemeToggle({ hasMounted }: { hasMounted: boolean }) {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="flex h-9 w-9 items-center justify-center rounded-full text-foreground bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      aria-label="Toggle theme"
    >
      {hasMounted && theme === "dark" ? (
        <Sun className="h-4.5 w-4.5" />
      ) : (
        <Moon className="h-4.5 w-4.5" />
      )}
    </button>
  );
}

import { useWishlist } from "@/features/wishlist/api/use-wishlist";
import { useWebsiteSettings } from "@/hooks/use-website-settings";

function NavbarActions({
  hasMounted,
  onCartOpen,
}: {
  hasMounted: boolean;
  onCartOpen: () => void;
}) {
  const { data: user } = useCurrent();
  const totalItems = useCartStore(selectTotalItems);
  const { data: wishlist } = useWishlist();
  const wishlistItemsCount = wishlist?.items?.length || 0;
  const { t } = useLanguage();

  return (
    <div className="flex items-center gap-4">
      {/* Theme Toggle */}
      <ThemeToggle />

      {/* Wishlist Button */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              href="/account"
              className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-transparent transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-105 text-foreground focus:outline-none"
              aria-label="View Wishlist"
            />
          }
        >
          <Heart className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
          {hasMounted && wishlistItemsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-sm">
              {wishlistItemsCount}
            </span>
          )}
        </TooltipTrigger>
        <TooltipContent side="bottom">{t("wishlist")}</TooltipContent>
      </Tooltip>

      {/* Cart Button */}
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              onClick={onCartOpen}
              className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-transparent transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-105 text-foreground focus:outline-none"
              aria-label="View Cart"
            />
          }
        >
          <ShoppingCart className="h-5 w-5 transition-transform duration-300 group-hover:rotate-3" />
          {hasMounted && totalItems > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-sm">
              {totalItems}
            </span>
          )}
        </TooltipTrigger>
        <TooltipContent side="bottom">{t("cart")}</TooltipContent>
      </Tooltip>

      {/* Profile/Sign In Button */}
      {!user ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <Link
                href="/signin"
                className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-transparent transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-105 text-foreground focus:outline-none"
                aria-label="Sign In"
              />
            }
          >
            <User className="h-5 w-5" />
          </TooltipTrigger>
          <TooltipContent side="bottom">{t("signIn")}</TooltipContent>
        </Tooltip>
      ) : (
        <Tooltip>
          <TooltipTrigger render={<UserButton />} />
          <TooltipContent side="bottom">{t("account")}</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

function MobileNavbarMenu({
  isOpen,
  onOpenChange,
  logoUrl,
  siteName,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  logoUrl: string;
  siteName: string;
}) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex w-full max-w-xs flex-col">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Image src={logoUrl} alt={siteName || "SleepSheet Logo"} width={160} height={40} className="h-10 w-auto object-contain" />
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-6 p-6">
          <div className="flex flex-col gap-4">
            <NavbarLinks onNavigate={() => onOpenChange(false)} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MobileBottomNav({
  hasMounted,
  onCartOpen,
}: {
  hasMounted: boolean;
  onCartOpen: () => void;
}) {
  const pathname = usePathname();
  const { data: user } = useCurrent();
  const totalItems = useCartStore(selectTotalItems);
  const { data: wishlist } = useWishlist();
  const wishlistItemsCount = wishlist?.items?.length || 0;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-background border-t shadow-[0_-4px_20px_rgba(0,0,0,0.05)] flex items-center justify-between px-6 h-16 pb-safe">
      {/* Home */}
      <Link href="/" aria-label="Home" className={`flex flex-col items-center justify-center w-12 h-12 rounded-full ${pathname === '/' ? 'text-primary' : 'text-muted-foreground'}`}>
        <Home className="h-5 w-5" />
      </Link>

      {/* Wishlist */}
      <Link href="/account" aria-label="Wishlist" className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-full ${pathname === '/account' ? 'text-primary' : 'text-muted-foreground'}`}>
        <Heart className="h-5 w-5" />
        {hasMounted && wishlistItemsCount > 0 && (
          <span className="absolute top-2 right-2 flex h-[14px] w-[14px] items-center justify-center rounded-full bg-primary text-[8px] font-bold text-white">
            {wishlistItemsCount}
          </span>
        )}
      </Link>

      {/* Center Shop Icon */}
      <div className="relative -top-5 flex items-center justify-center">
        <div className="absolute inset-0 bg-background rounded-full scale-110 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]"></div>
        <Link href="/shop" aria-label="Shop" className="relative flex items-center justify-center h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:scale-105 transition-transform z-10">
          <ShoppingBag className="h-6 w-6" />
        </Link>
      </div>

      {/* Cart */}
      <button onClick={onCartOpen} aria-label="View cart" className="relative flex flex-col items-center justify-center w-12 h-12 rounded-full text-muted-foreground hover:text-primary">
        <ShoppingCart className="h-5 w-5" />
        {hasMounted && totalItems > 0 && (
          <span className="absolute top-2 right-2 flex h-[14px] w-[14px] items-center justify-center rounded-full bg-primary text-[8px] font-bold text-white">
            {totalItems}
          </span>
        )}
      </button>

      {/* Profile */}
      {!user ? (
        <Link href="/signin" aria-label="Sign in" className={`flex flex-col items-center justify-center w-12 h-12 rounded-full ${pathname === '/signin' ? 'text-primary' : 'text-muted-foreground'}`}>
          <User className="h-5 w-5" />
        </Link>
      ) : (
        <Link href="/account" aria-label="My account" className={`flex flex-col items-center justify-center w-12 h-12 rounded-full ${pathname === '/account' ? 'text-primary' : 'text-muted-foreground'}`}>
          <User className="h-5 w-5" />
        </Link>
      )}
    </div>
  );
}

function Navbar() {
  const { siteName, logoUrl } = useWebsiteSettings();
  const isMobile = useIsMobile();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const hasMounted = useHasMounted();
  const { t } = useLanguage();
  const { theme } = useTheme();
  // The dark logo is designed for dark backgrounds, so swap to it once
  // mounted and dark mode is active (avoids an SSR/client theme mismatch).
  const displayLogo = hasMounted && theme === "dark" ? "/dark-logo.png" : logoUrl;

  const router = useRouter();
  const [searchQuery, setSearchQuery] = useQueryState("search", {
    defaultValue: "",
    shallow: false,
  });
  const [inputVal, setInputVal] = useState(searchQuery);

  // Sync local input value if url changes (e.g. from page transition or clear)
  React.useEffect(() => {
    setInputVal(searchQuery);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const isProductsPage = window.location.pathname === "/shop";
    if (isProductsPage) {
      setSearchQuery(inputVal.trim() || null);
    } else {
      if (inputVal.trim()) {
        router.push(`/shop?search=${encodeURIComponent(inputVal.trim())}`);
      } else {
        router.push(`/shop`);
      }
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-md">
        <div className="container mx-auto px-4">
          {isMobile ? (
            <div className="flex flex-col py-2 gap-2">
              <div className="flex h-14 items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMenuOpen(true)}
                  aria-label="Open menu"
                  className="hover:bg-transparent"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <Link href="/" aria-label={siteName || "SleepSheet Home"} className="flex items-center gap-2 select-none">
                  <Image src={displayLogo} alt={siteName || "SleepSheet Logo"} width={144} height={36} className="h-9 w-auto object-contain" />
                </Link>
                <div className="flex items-center gap-2">
                  <MobileThemeToggle hasMounted={hasMounted} />
                </div>
              </div>
              {/* Search Input for Mobile Viewports */}
              <form onSubmit={handleSearch} className="relative w-full pb-2">
                <input
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  aria-label={t("searchPlaceholder")}
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  className="w-full rounded-full border-none bg-slate-100 dark:bg-slate-800/50 py-2.5 pl-5 pr-12 text-sm text-foreground placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-slate-800"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="absolute right-4 top-[40%] -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-primary transition-colors"
                >
                  <Search className="h-4 w-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex h-16 items-center justify-between gap-4">
              {/* Logo */}
              <Link href="/" aria-label={siteName || "SleepSheet Home"} className="flex items-center gap-2 select-none shrink-0">
                <Image src={displayLogo} alt={siteName || "SleepSheet Logo"} width={192} height={48} className="h-12 w-auto object-contain" />
              </Link>

              {/* Links */}
              <div className="hidden md:flex items-center gap-8">
                <NavbarLinks />
              </div>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="relative flex-1 max-w-md mx-6">
                <input
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  aria-label={t("searchPlaceholder")}
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  className="w-full rounded-full border-none bg-slate-100 dark:bg-slate-800/50 py-2.5 pl-5 pr-12 text-sm text-foreground placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-slate-800"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-primary transition-colors"
                >
                  <Search className="h-[18px] w-[18px]" />
                </button>
              </form>

              {/* Actions */}
              <NavbarActions
                hasMounted={hasMounted}
                onCartOpen={() => setIsCartOpen(true)}
              />
            </div>
          )}
        </div>

        {isMobile && (
          <MobileNavbarMenu
            isOpen={isMenuOpen}
            onOpenChange={setIsMenuOpen}
            logoUrl={displayLogo}
            siteName={siteName}
          />
        )}

        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      </nav>

      {isMobile && (
        <MobileBottomNav hasMounted={hasMounted} onCartOpen={() => setIsCartOpen(true)} />
      )}
    </>
  );
}

export default Navbar;

