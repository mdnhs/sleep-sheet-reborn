"use client";

import Footer from "@/components/footer";
import Navbar from "@/components/nav-bar";
import { CartProvider } from "@/provider/cart-provider";
import { ReduxProvider } from "@/provider/redux-provider";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import { ChevronUp, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { seoConfig } from "@/lib/seo/config";

interface ClientLayoutProps {
  children: React.ReactNode;
}

function clientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <ReduxProvider>
      <CartProvider>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <a
          href={`https://wa.me/${seoConfig.contact.telephone.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-all duration-300 hover:bg-green-600"
          aria-label="Contact us on WhatsApp"
        >
          <MessageCircle className="h-5 w-5" />
        </a>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className={cn(
            "fixed bottom-20 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-all duration-300 hover:opacity-90",
            showScrollTop ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
          )}
          aria-label="Scroll to top"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      </CartProvider>
    </ReduxProvider>
  );
}

export default clientLayout;
