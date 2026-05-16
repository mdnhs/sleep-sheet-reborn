import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandTwitter,
} from "@tabler/icons-react";
import { Mail, Phone } from "lucide-react";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-secondary mt-20 py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-x-12 md:gap-y-12 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="space-y-4 md:max-w-md lg:max-w-none">
            <h3 className="font-bold text-xl">LUXESTORE</h3>
            <p className="text-sm text-muted-foreground">
              Premium quality, ethically made products for the modern lifestyle.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                aria-label="Instagram"
                className="hover:text-primary/80 transition-colors"
              >
                <IconBrandInstagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                aria-label="Facebook"
                className="hover:text-primary/80 transition-colors"
              >
                <IconBrandFacebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="hover:text-primary/80 transition-colors"
              >
                <IconBrandTwitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Shop Column */}
          <div className="space-y-4">
            <h4 className="font-semibold">Shop</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/collections/new-arrivals"
                  className="text-sm text-muted-foreground hover:text-primary/80 transition-colors"
                >
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link
                  href="/collections/bestsellers"
                  className="text-sm text-muted-foreground hover:text-primary/80 transition-colors"
                >
                  Bestsellers
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="text-sm text-muted-foreground hover:text-primary/80 transition-colors"
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href="/sale"
                  className="text-sm text-muted-foreground hover:text-primary/80 transition-colors"
                >
                  Sale
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="space-y-4">
            <h4 className="font-semibold">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-muted-foreground hover:text-primary/80 transition-colors"
                >
                  Our Story
                </Link>
              </li>
              <li>
                <Link
                  href="/sustainability"
                  className="text-sm text-muted-foreground hover:text-primary/80 transition-colors"
                >
                  Sustainability
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="text-sm text-muted-foreground hover:text-primary/80 transition-colors"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="/press"
                  className="text-sm text-muted-foreground hover:text-primary/80 transition-colors"
                >
                  Press
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="space-y-4 md:col-span-2 lg:col-span-1">
            <h4 className="font-semibold">Contact</h4>
            <ul className="space-y-2">
              <li className="flex items-center text-sm text-muted-foreground">
                <Mail className="h-4 w-4 mr-2" />
                support@luxestore.com
              </li>
              <li className="flex items-center text-sm text-muted-foreground">
                <Phone className="h-4 w-4 mr-2" />
                +1 (555) 123-4567
              </li>
            </ul>
            <div className="pt-4 md:max-w-xl lg:max-w-none">
              <h4 className="font-semibold">Subscribe to our newsletter</h4>
              <form className="mt-2 flex flex-col sm:flex-row">
                <input
                  type="email"
                  placeholder="Your email"
                  className="min-w-0 flex-1 rounded-t-md border border-border px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary sm:rounded-l-md sm:rounded-r-none sm:rounded-tr-none"
                />
                <button
                  type="submit"
                  className="rounded-b-md rounded-bl-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90 sm:rounded-b-none sm:rounded-r-md sm:rounded-l-none"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 flex flex-col gap-4 border-t border-border pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-center text-xs text-muted-foreground md:text-left">
            © {new Date().getFullYear()} LUXESTORE. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 md:justify-end">
            <Link
              href="/privacy-policy"
              className="text-xs text-muted-foreground hover:text-primary/80 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-service"
              className="text-xs text-muted-foreground hover:text-primary/80 transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/shipping-returns"
              className="text-xs text-muted-foreground hover:text-primary/80 transition-colors"
            >
              Shipping & Returns
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
