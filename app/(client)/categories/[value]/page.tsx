import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import ProductContents from "@/features/product/components/product-contents";
import ProductSidebar from "@/features/product/components/products-sidebar";
import { getCategoryByValue, getCategoryProductsPreview } from "@/features/categories/server/get-category";
import {
  seoConfig,
  generateCategoryMetadata,
  collectionPageSchema,
  breadcrumbSchema,
  structuredDataScript,
} from "@/lib/seo";

type Props = { params: Promise<{ value: string }> };

function categoryDescription(label: string): string {
  return `Shop ${label} online in Bangladesh at ${seoConfig.siteName}. 100% twill cotton fabric, cash on delivery, home delivery all over Bangladesh.`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { value } = await params;
  const category = await getCategoryByValue(value);
  if (!category) return { title: "Category not found" };

  return generateCategoryMetadata({
    // Custom copy (written per-category in the dashboard) wins over the
    // generic auto-generated sentence, same idea as competitor category
    // pages that hand-write unique title/description instead of templating.
    name: category.seoTitle || category.label,
    description: category.seoDescription || categoryDescription(category.label),
    slug: category.value,
  });
}

export default async function CategoryPage({ params }: Props) {
  const { value } = await params;
  const category = await getCategoryByValue(value);
  if (!category) notFound();

  const categoryIds = [category.id, ...category.children.map((c) => c.id)];
  const previewProducts = await getCategoryProductsPreview(categoryIds);

  const categoryUrl = `${seoConfig.siteUrl}/categories/${category.value}`;
  const description = category.seoDescription || categoryDescription(category.label);

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: category.label, url: `/categories/${category.value}` },
  ];

  return (
    <div className="w-full bg-primary/5 dark:bg-primary/10 min-h-screen">
      <div className="container mx-auto py-4 px-4 min-h-[80vh]">
        {structuredDataScript(
          "collection-page",
          collectionPageSchema(
            category.label,
            description,
            categoryUrl,
            previewProducts.map((p) => ({
              name: p.name,
              url: `${seoConfig.siteUrl}/shop/${p.id}`,
              image: p.images?.[0],
            })),
          ),
        )}
        {structuredDataScript("breadcrumbs", breadcrumbSchema(breadcrumbs))}

        <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-4 text-xs text-muted-foreground font-medium">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <span className="text-border">•</span>
          <span className="text-foreground" aria-current="page">{category.label}</span>
        </nav>

        <h1 className="font-heading text-2xl lg:text-3xl font-semibold tracking-tight text-foreground mb-6">
          {category.label}{" "}
          <span className="text-muted-foreground text-base font-normal">({category.productCount})</span>
        </h1>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <Suspense fallback={<div className="w-full lg:w-64 shrink-0 h-96 bg-muted animate-pulse rounded-lg" />}>
            <ProductSidebar initialCategory={category.label} />
          </Suspense>

          <div className="flex-1 w-full">
            <Suspense fallback={<div className="w-full h-96 bg-muted animate-pulse rounded-lg" />}>
              <ProductContents initialCategory={category.label} initialProducts={previewProducts} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
