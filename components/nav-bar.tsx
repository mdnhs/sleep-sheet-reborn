"use client";
import { useIsMobile } from "@/hooks/use-mobile";
import Link from "next/link";
import React, { useState, useSyncExternalStore } from "react";

const subscribe = () => () => {};
const useHasMounted = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
import { ShoppingBag, User, Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import CartDrawer from "./cart/cart-drawer";
import { useCurrent } from "@/features/auth/api/use-current";
import { UserButton } from "@/features/auth/components/user-button";
import { useSelector } from "react-redux";
import { selectTotalItems } from "@/features/cart/state/cart-slice";

const NAV_LINKS = [
  { id: 1, name: "Home", path: "/" },
  { id: 2, name: "Shop", path: "/products?sort=newest" },
  // { id: 3, name: "Collection", path: "/collection" },
  { id: 4, name: "About", path: "/about" },
  { id: 6, name: "Contact", path: "/contact" },
];

function Navbar() {
  const isMobile = useIsMobile();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const totalItems = useSelector(selectTotalItems);
  const { resolvedTheme, setTheme } = useTheme();

  const hasMounted = useHasMounted();

  const { data: user } = useCurrent();

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold">
            LUXESTORE
          </Link>
          {!isMobile && (
            <div className="hidden md:flex space-x-8">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.name}
                  href={link.path}
                  className="text-sm font-medium hover:text-primary/80 transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          )}

          <div className="flex items-center space-x-4">
            {/* <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Button> */}

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

            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
              aria-label="Toggle theme"
            >
              {hasMounted && resolvedTheme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCartOpen(true)}
              aria-label="Cart"
              className="relative"
            >
              <ShoppingBag className="h-5 w-5" />
              {hasMounted && totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs">
                  {totalItems}
                </span>
              )}
            </Button>
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            )}
          </div>
        </div>
        {isMobile && isMenuOpen && (
          <div className="md:hidden py-4 animate-fade-in">
            <div className="flex flex-col space-y-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.name}
                  href={link.path}
                  className="text-sm font-medium py-2 hover:text-primary/80 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} /> */}
    </nav>
  );
}

export default Navbar;
