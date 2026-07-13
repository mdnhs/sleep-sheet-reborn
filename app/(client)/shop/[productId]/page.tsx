import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import FeaturedProduct from "@/components/home/featured-product";
import ProductPicker from "@/features/product/components/product-picker";
import { ProductAccordion } from "@/features/product/components/product-accordion";
import { ProductReviews } from "@/features/product/components/product-reviews";
import ProductTag from "@/features/product/components/product-tags";
import { OrderCountdown } from "@/features/product/components/order-countdown";
import SwitchImage from "@/features/product/components/switch-image";
import { ProductViewTracker } from "@/features/product/components/product-view-tracker";
import { getProductById } from "@/features/product/server/get-product";
import {
  seoConfig,
  generateProductMetadata,
  productSchema,
  breadcrumbSchema,
  structuredDataScript,
} from "@/lib/seo";

type Props = { params: Promise<{ productId: string }> };

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { productId } = await params;
  const product = await getProductById(productId);
  if (!product) return { title: "Product not found" };

  return generateProductMetadata({
    name: product.name,
    description: stripHtml(product.description || ""),
    slug: product.id,
    images: product.images,
    price: product.price,
    rating: product.rating,
    reviewCount: product.reviewCount,
  });
}

export default async function ProductDetailPage({ params }: Props) {
  const { productId: id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const categoryLabel = product.categoryLabel || product.category || "Products";
  const productBreadcrumbs = [
    { name: "Home", url: "/" },
    { name: categoryLabel, url: `/shop?category=${encodeURIComponent(categoryLabel)}` },
    { name: product.name, url: `/shop/${id}` },
  ];

  return (
    <div className="bg-primary/5 dark:bg-primary/10 min-h-screen">
      <ProductViewTracker product={product} />
      {structuredDataScript("product", productSchema({
        id,
        name: product.name,
        description: product.description,
        slug: id,
        price: product.price,
        currency: "BDT",
        sku: product.sku,
        category: product.category,
        images: product.images,
        rating: product.rating,
        reviewCount: product.reviewCount,
        availability: product.stock > 0 ? "InStock" : "OutOfStock",
        url: `${seoConfig.siteUrl}/shop/${id}`,
      }))}
      {structuredDataScript("breadcrumbs", breadcrumbSchema(productBreadcrumbs))}
      <div className="container mx-auto px-4 py-2 lg:py-8">
        <nav aria-label="Breadcrumb" className="hidden lg:flex items-center gap-0 mb-8 text-xs text-muted-foreground font-medium">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="m15 18-6-6 6-6" /></svg>
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <span className="mx-2 text-border">•</span>
          <Link href={`/shop?category=${encodeURIComponent(categoryLabel)}`} className="hover:text-foreground transition-colors">{categoryLabel}</Link>
          <span className="mx-2 text-border">•</span>
          <span className="text-foreground" aria-current="page">{product.name}</span>
        </nav>

        <article className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-16">
          {/* Left Column: Image Gallery */}
          <div>
            <SwitchImage product={product} />
          </div>

          {/* Right Column: Product Info */}
          <div className="flex flex-col pt-0 lg:pt-2">

            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2 lg:mb-3">
              <h1 className="font-heading text-xl lg:text-4xl font-semibold tracking-tight text-foreground">
                {product.name}
              </h1>
            </div>

            <OrderCountdown />

            <ProductPicker product={product} />

            <div className="mt-4">
              <ProductAccordion product={product} />
            </div>
          </div>
        </article>

        {/* Full-width Details Section */}
        <div className="mt-16 border-t border-border/60 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <section className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-border/50 shadow-sm">
              <h2 className="text-xl font-bold text-foreground mb-4">Description & Fit</h2>
              <div
                className="prose prose-sm md:prose-base dark:prose-invert text-muted-foreground leading-relaxed max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description || "" }}
              />
            </section>

            {/* Product Features */}
            {product.features && product.features.length > 0 && (
              <div className="pt-6 border-t border-border/40">
                <h2 className="text-xl font-bold text-foreground mb-4">Product Features</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 list-disc pl-5 text-muted-foreground text-sm">
                  {product.features.map((feature, i) => (
                    <li key={i} className="leading-relaxed">{feature}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="pt-6 border-t border-border/40">
                <h2 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">Product Tags</h2>
                <ProductTag tags={product.tags} />
              </div>
            )}
          </div>

          {/* Specifications */}
          {product.specifications && product.specifications.length > 0 && (
            <div className="bg-secondary/10 border border-border/50 rounded-3xl p-6 md:p-8 h-fit">
              <h2 className="text-xl font-bold text-foreground mb-4">Specifications</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border/50">
                  <tbody className="divide-y divide-border/40">
                    {product.specifications.map((spec, i) => (
                      <tr key={i} className="hover:bg-secondary/10 transition-colors">
                        <td className="py-3 pr-4 font-semibold text-sm text-foreground w-1/3 leading-normal">
                          {spec.key}
                        </td>
                        <td className="py-3 text-sm text-muted-foreground leading-normal">
                          {spec.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <ProductReviews product={product} />
      </div>

      <section aria-label="Related products" className="mt-20 pt-16 bg-white dark:bg-slate-900 border-t border-border/50">
        <div className="container mx-auto px-4 mb-8">
          <h2 className="text-3xl md:text-4xl font-semibold text-center text-foreground tracking-tight">You might also like</h2>
        </div>
        <FeaturedProduct />
      </section>
    </div>
  );
}
