import React from 'react';
import BlogClientPage from './blog-client';
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
      <BlogClientPage />
    </>
  );
}
