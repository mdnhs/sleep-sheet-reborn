"use client";

import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandTwitter,
  IconBrandYoutube,
} from "@tabler/icons-react";
import { Mail, Phone, ShieldCheck, Truck, ArrowRight, Globe } from "lucide-react";
import Link from "next/link";
import { useWebsiteSettings } from "@/hooks/use-website-settings";
import { useLanguage } from "@/hooks/use-language";

const Footer = () => {
  const {
    footerBrandDesc,
    footerEmail,
    footerPhone,
    socialFacebook,
    socialInstagram,
    socialTwitter,
    socialYoutube,
    footerCopyright,
  } = useWebsiteSettings();
  const { language, setLanguage, t } = useLanguage();

  return (
    <footer className="bg-foreground dark:bg-slate-950 text-background dark:text-slate-100 pt-10 md:pt-16 pb-24 md:pb-8 border-t border-white/5 dark:border-white/5 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-y-10 gap-x-8 md:gap-12 lg:gap-8">

          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-4 space-y-5 md:space-y-6 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-2 mb-1 md:mb-2">
              <img src="/dark-logo.png" alt="SleepSheet Logo" className="h-9 md:h-10 w-auto object-contain" />
            </div>
            <p className="text-sm text-white/60 leading-relaxed max-w-xs mx-auto md:mx-0">
              {footerBrandDesc}
            </p>
            <div className="flex space-x-3 pt-2">
              {(socialInstagram || true) && (
                <a
                  href={socialInstagram || "#"}
                  aria-label="Instagram"
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-white/5 text-white/70 hover:bg-white hover:text-foreground transition-all duration-300"
                >
                  <IconBrandInstagram className="h-5 w-5" />
                </a>
              )}
              {(socialFacebook || true) && (
                <a
                  href={socialFacebook || "#"}
                  aria-label="Facebook"
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-white/5 text-white/70 hover:bg-white hover:text-foreground transition-all duration-300"
                >
                  <IconBrandFacebook className="h-5 w-5" />
                </a>
              )}
              {(socialTwitter || true) && (
                <a
                  href={socialTwitter || "#"}
                  aria-label="Twitter"
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-white/5 text-white/70 hover:bg-white hover:text-foreground transition-all duration-300"
                >
                  <IconBrandTwitter className="h-5 w-5" />
                </a>
              )}
              {(socialYoutube || true) && (
                <a
                  href={socialYoutube || "#"}
                  aria-label="YouTube"
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-white/5 text-white/70 hover:bg-white hover:text-foreground transition-all duration-300"
                >
                  <IconBrandYoutube className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          {/* Shop Column */}
          <div className="col-span-1 lg:col-span-2 space-y-4 md:space-y-5">
            <h4 className="font-semibold tracking-widest uppercase text-xs text-white/40">Shop</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/collections/new-arrivals"
                  className="group flex items-center text-sm text-white/70 hover:text-white transition-colors"
                >
                  <span className="relative overflow-hidden">
                    <span className="block transition-transform duration-300 group-hover:-translate-y-full">New Arrivals</span>
                    <span className="absolute inset-0 block transition-transform duration-300 translate-y-full group-hover:translate-y-0">New Arrivals</span>
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/collections/bestsellers"
                  className="group flex items-center text-sm text-white/70 hover:text-white transition-colors"
                >
                  <span className="relative overflow-hidden">
                    <span className="block transition-transform duration-300 group-hover:-translate-y-full">Bestsellers</span>
                    <span className="absolute inset-0 block transition-transform duration-300 translate-y-full group-hover:translate-y-0">Bestsellers</span>
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/shop"
                  className="group flex items-center text-sm text-white/70 hover:text-white transition-colors"
                >
                  <span className="relative overflow-hidden">
                    <span className="block transition-transform duration-300 group-hover:-translate-y-full">All Products</span>
                    <span className="absolute inset-0 block transition-transform duration-300 translate-y-full group-hover:translate-y-0">All Products</span>
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/sale"
                  className="group flex items-center text-sm text-white/70 hover:text-white transition-colors"
                >
                  <span className="relative overflow-hidden">
                    <span className="block transition-transform duration-300 group-hover:-translate-y-full">Sale</span>
                    <span className="absolute inset-0 block transition-transform duration-300 translate-y-full group-hover:translate-y-0">Sale</span>
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="col-span-1 lg:col-span-2 space-y-4 md:space-y-5">
            <h4 className="font-semibold tracking-widest uppercase text-xs text-white/40">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  prefetch={false}
                  className="text-sm text-white/70 hover:text-white transition-colors flex items-center gap-2 group"
                >
                  Our Story
                  <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 hidden md:inline-block" />
                </Link>
              </li>
              <li>
                <Link
                  href="/sustainability"
                  prefetch={false}
                  className="text-sm text-white/70 hover:text-white transition-colors flex items-center gap-2 group"
                >
                  Sustainability
                  <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 hidden md:inline-block" />
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  prefetch={false}
                  className="text-sm text-white/70 hover:text-white transition-colors flex items-center gap-2 group"
                >
                  Careers
                  <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 hidden md:inline-block" />
                </Link>
              </li>
              <li>
                <Link
                  href="/press"
                  prefetch={false}
                  className="text-sm text-white/70 hover:text-white transition-colors flex items-center gap-2 group"
                >
                  Press
                  <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 hidden md:inline-block" />
                </Link>
              </li>
              <li>
                <Link
                  href="/sitemap.xml"
                  prefetch={false}
                  className="text-sm text-white/70 hover:text-white transition-colors flex items-center gap-2 group"
                >
                  Web Sitemap
                  <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 hidden md:inline-block" />
                </Link>
              </li>
              <li>
                <Link
                  href="/sitemap"
                  prefetch={false}
                  className="text-sm text-white/70 hover:text-white transition-colors flex items-center gap-2 group"
                >
                  User Sitemap
                  <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 hidden md:inline-block" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="col-span-2 lg:col-span-4 space-y-4 md:space-y-5">
            <h4 className="font-semibold tracking-widest uppercase text-xs text-white/40">Here to Help</h4>
            <div className="space-y-4 flex flex-col md:block">
              <a href={`mailto:${footerEmail}`} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group cursor-pointer w-full md:w-fit md:pr-6">
                <div className="flex shrink-0 items-center justify-center h-8 w-8 rounded-full bg-white/10 text-white group-hover:bg-white group-hover:text-foreground transition-colors">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/50 mb-0.5">Email Us</p>
                  <p className="text-sm text-white font-medium">{footerEmail}</p>
                </div>
              </a>

              <a href={`tel:${footerPhone.replace(/[^0-9+]/g, "")}`} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group cursor-pointer w-full md:w-fit md:pr-6">
                <div className="flex shrink-0 items-center justify-center h-8 w-8 rounded-full bg-white/10 text-white group-hover:bg-white group-hover:text-foreground transition-colors">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/50 mb-0.5">Call Us</p>
                  <p className="text-sm text-white font-medium">{footerPhone}</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 md:mt-16 flex flex-col gap-6 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
          <p className="text-center text-xs text-white/40 md:text-left">
            {footerCopyright}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 md:justify-end">
            <Link
              href="/privacy-policy"
              prefetch={false}
              className="text-xs text-white/40 hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-white hover:after:w-full after:transition-all after:duration-300"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-service"
              prefetch={false}
              className="text-xs text-white/40 hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-white hover:after:w-full after:transition-all after:duration-300"
            >
              Terms of Service
            </Link>
            <Link
              href="/shipping-returns"
              prefetch={false}
              className="text-xs text-white/40 hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-white hover:after:w-full after:transition-all after:duration-300"
            >
              Shipping & Returns
            </Link>
            <div className="flex items-center gap-2 ml-4">
              <span className="text-xs font-semibold text-white/40 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" /> {t("language")}
              </span>
              <div className="flex gap-0.5 bg-white/5 p-0.5 rounded-lg border border-white/10">
                <button
                  onClick={() => setLanguage("bn")}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-md cursor-pointer transition-all ${
                    language === "bn"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  BN
                </button>
                <button
                  onClick={() => setLanguage("en")}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-md cursor-pointer transition-all ${
                    language === "en"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  EN
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
