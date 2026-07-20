import React, { Suspense } from 'react';
import BlogClientPage from './blog-client';
import BlogListFallback from './blog-list-fallback';
import { seoConfig, generateMetadata, webpageSchema, structuredDataScript } from "@/lib/seo";

export const metadata = generateMetadata({
  title: "Blog",
  description: `Read our latest stories, sleep tips, product guides, and news from ${seoConfig.siteName}.`,
  canonical: `${seoConfig.siteUrl}/blog`,
})

export default function BlogPage() {
  return (
    <>
      {structuredDataScript("blog-listing", webpageSchema(
        "Blog | " + seoConfig.siteName,
        "Read our latest stories, sleep tips, product guides, and news.",
        `${seoConfig.siteUrl}/blog`,
      ))}
      {/* BlogClientPage reads the ?tag= param via nuqs (useSearchParams under the
          hood), which opts its subtree out of prerendering. The boundary keeps the
          rest of the route static and serves the skeleton in the initial HTML. */}
      <Suspense fallback={<BlogListFallback />}>
        <BlogClientPage />
      </Suspense>
    </>
  );
}
