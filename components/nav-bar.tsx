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
import { selectTotalItems } from "@/features/cart/state/cart-slice";
import Link from "next/link";
import React, { useState, useSyncExternalStore } from "react";
import { Menu, ShoppingBag, User } from "lucide-react";
import { useSelector } from "react-redux";

const subscribe = () => () => {};
const useHasMounted = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

import CartDrawer from "./cart/cart-drawer";
import { Button } from "./ui/button";

const NAV_LINKS = [
  { id: 1, name: "Home", path: "/" },
  { id: 2, name: "Shop", path: "/products?sort=newest" },
  // { id: 3, name: "Collection", path: "/collection" },
  { id: 4, name: "About", path: "/about" },
  { id: 6, name: "Contact", path: "/contact" },
];

function NavbarLinks({ onNavigate }: { onNavigate?: () => void }) {
  return NAV_LINKS.map((link) => (
    <Link
      key={link.name}
      href={link.path}
      className="text-sm font-medium transition-colors hover:text-primary/80"
      onClick={onNavigate}
    >
      {link.name}
    </Link>
  ));
}

function NavbarActions({
  hasMounted,
  onCartOpen,
}: {
  hasMounted: boolean;
  onCartOpen: () => void;
}) {
  const { data: user } = useCurrent();
  const totalItems = useSelector(selectTotalItems);

  return (
    <div className="flex items-center space-x-4">
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
        onClick={onCartOpen}
        aria-label="Cart"
        className="relative"
      >
        <ShoppingBag className="h-5 w-5" />
        {hasMounted && totalItems > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
            {totalItems}
          </span>
        )}
      </Button>
    </div>
  );
}

function MobileNavbarMenu({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex w-full max-w-xs flex-col">
        <SheetHeader className="border-b pb-4">
          <SheetTitle>LUXESTORE</SheetTitle>
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

function MobileNavbarAccount({
  hasMounted,
  onCartOpen,
}: {
  hasMounted: boolean;
  onCartOpen: () => void;
}) {
  const { data: user } = useCurrent();
  const totalItems = useSelector(selectTotalItems);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={onCartOpen}
        aria-label="Cart"
        className="relative"
      >
        <ShoppingBag className="h-5 w-5" />
        {hasMounted && totalItems > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
            {totalItems}
          </span>
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
  );
}

function Navbar() {
  const isMobile = useIsMobile();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const hasMounted = useHasMounted();

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        {isMobile ? (
          <div className="relative flex h-16 items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link
              href="/"
              className="absolute left-1/2 -translate-x-1/2 text-xl font-bold"
            >
              LUXESTORE
            </Link>
            <MobileNavbarAccount
              hasMounted={hasMounted}
              onCartOpen={() => setIsCartOpen(true)}
            />
          </div>
        ) : (
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="text-xl font-bold">
              LUXESTORE
            </Link>
            <div className="hidden md:flex space-x-8">
              <NavbarLinks />
            </div>
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
        />
      )}

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} /> */}
    </nav>
  );
}

export default Navbar;
