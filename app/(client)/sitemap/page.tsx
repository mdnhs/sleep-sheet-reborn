import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { seoConfig, generateMetadata as buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "User Sitemap",
  description: `Browse every page and product category at ${seoConfig.siteName}.`,
  canonical: "/sitemap",
});

const mainPages = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/new-arrivals", label: "New Arrivals" },
  { href: "/bestsellers", label: "Bestsellers" },
  { href: "/sale", label: "Sale" },
  { href: "/blog", label: "Blog" },
  { href: "/testimonials", label: "Customer Reviews" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact Us" },
  { href: "/track-order", label: "Track Your Order" },
  { href: "/signin", label: "Sign In" },
  { href: "/signup", label: "Create Account" },
];

const legalPages = [
  { href: "/terms-of-service", label: "Terms of Service" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/shipping-returns", label: "Shipping & Returns" },
];

function LinkCard({ href, label }: { href: string; label: string }) {
  return (
    <div className="break-inside-avoid mb-3">
      <Link
        href={href}
        className="block rounded-xl border border-border/60 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-foreground/80 hover:text-foreground hover:border-primary/40 hover:shadow-sm transition-all"
      >
        {label}
      </Link>
    </div>
  );
}

export default async function SitemapPage() {
  const allCategories = await db.query.categories.findMany({
    orderBy: (fields, { asc }) => [asc(fields.label)],
  });

  const parentCategories = allCategories.filter((c) => !c.parentId);
  const childrenByParent = new Map<string, typeof allCategories>();
  for (const c of allCategories) {
    if (c.parentId) {
      childrenByParent.set(c.parentId, [...(childrenByParent.get(c.parentId) || []), c]);
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">User Sitemap</h1>
        <p className="text-muted-foreground mb-10">
          Every page and product category at {seoConfig.siteName}, in one place.
        </p>

        <h2 className="text-xl font-semibold mb-4">Main Pages</h2>
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-3 mb-10">
          {mainPages.map((p) => (
            <LinkCard key={p.href} {...p} />
          ))}
        </div>

        <h2 className="text-xl font-semibold mb-4">Legal</h2>
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-3 mb-10">
          {legalPages.map((p) => (
            <LinkCard key={p.href} {...p} />
          ))}
        </div>

        <h2 className="text-xl font-semibold mb-4">Categories</h2>
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-3">
          <LinkCard href="/shop" label="All Products" />
          {parentCategories.map((parent) => (
            <LinkCard key={parent.id} href={`/categories/${parent.value}`} label={parent.label} />
          ))}
          {parentCategories.flatMap((parent) =>
            (childrenByParent.get(parent.id) || []).map((child) => (
              <LinkCard
                key={child.id}
                href={`/categories/${child.value}`}
                label={`${parent.label} — ${child.label}`}
              />
            )),
          )}
        </div>
      </div>
    </div>
  );
}
