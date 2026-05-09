import Footer from "@/components/footer";
import Navbar from "@/components/nav-bar";
import { CartProvider } from "@/provider/cart-provider";
import { ReduxProvider } from "@/provider/redux-provider";
import React from "react";
interface ClientLayoutProps {
  children: React.ReactNode;
}

function clientLayout({ children }: ClientLayoutProps) {
  return (
    <ReduxProvider>
      <CartProvider>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </CartProvider>
    </ReduxProvider>
  );
}

export default clientLayout;
