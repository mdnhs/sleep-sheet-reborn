import React, { Suspense } from 'react';
import BlogClientPage from './blog-client';
import BlogListFallback from './blog-list-fallback';
import { seoConfig, generateMetadata, webpageSchema, structuredDataScript } from "@/lib/seo";

export const metadata = generateMetadata({
  title: "Blog",
  description: `Read our latest stories, sleep tips, product guides, and news from ${seoConfig.siteName}.`,
  canonical: `${seoConfig.siteUrl}/blog`,
})

import { getPublicBlogPosts } from "@/lib/prefetch-home";

export default async function BlogPage() {
  const postsRes = await getPublicBlogPosts().catch(() => null);
  const posts = postsRes?.data || [];

  return (
    <>
      {structuredDataScript("blog-listing", webpageSchema(
        "Blog | " + seoConfig.siteName,
        "Read our latest stories, sleep tips, product guides, and news.",
        `${seoConfig.siteUrl}/blog`,
      ))}
      <Suspense fallback={<BlogListFallback />}>
        <BlogClientPage initialPosts={posts} />
      </Suspense>
    </>
  );
}
