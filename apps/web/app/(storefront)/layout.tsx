import Footer from "@/components/footer";
import Navbar from "@/components/nav-bar";
import { CartProvider } from "@/providers/cart-provider";
import { ReduxProvider } from "@/providers/redux-provider";
import { WishlistProvider } from "@/providers/wishlist-provider";
import React from "react";
interface ClientLayoutProps {
  children: React.ReactNode;
}

function clientLayout({ children }: ClientLayoutProps) {
  return (
    <ReduxProvider>
      <CartProvider>
        <WishlistProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </WishlistProvider>
      </CartProvider>
    </ReduxProvider>
  );
}

export default clientLayout;
