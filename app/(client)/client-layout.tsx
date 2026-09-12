"use client";

import Footer from "@/components/footer";
import Navbar from "@/components/nav-bar";
import { TrafficTracker } from "@/components/traffic-tracker";
import { CartProvider } from "@/provider/cart-provider";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import { ChevronUp, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWebsiteSettings } from "@/hooks/use-website-settings";
import Testimonials from "@/components/home/testimonials";
import Newsletter from "@/components/home/newsletter";
import Link from "next/link";

interface ClientLayoutProps {
  children: React.ReactNode;
}

function clientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { footerPhone } = useWebsiteSettings();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <CartProvider>
      <TrafficTracker />
      <div className="flex flex-col min-h-screen">
        <React.Suspense fallback={null}>
          <Navbar />
        </React.Suspense>
        <main className="flex-1">{children}</main>
        {!pathname.includes("/checkout") && !pathname.includes("/account") && !pathname.includes("/signin") && !pathname.includes("/signup") && !pathname.includes("/orders") && (
          <>
            <Testimonials />
            <Newsletter />
          </>
        )}
        <Footer />
      </div>
      <Link
        href={`https://wa.me/${footerPhone.replace(/\D/g, "")}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl shadow-emerald-500/25 transition-all duration-300 hover:scale-110 active:scale-95 hover:bg-[#20bd5a]"
        aria-label="Contact us on WhatsApp"
      >
        <MessageCircle className="h-6 w-6" />
      </Link>
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={cn(
          "fixed bottom-34 sm:bottom-20 right-4 sm:right-6 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-all duration-300 hover:opacity-90",
          showScrollTop ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
        )}
        aria-label="Scroll to top"
      >
        <ChevronUp className="h-5 w-5" />
      </button>
    </CartProvider>
  );
}

export default clientLayout;
