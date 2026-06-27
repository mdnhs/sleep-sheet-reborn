import React from 'react';
import BlogPostClient from './blog-post-client';
import { seoConfig } from "@/lib/seo";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  return {
    title: `${params.slug.replace(/-/g, " ")} | Blog | ${seoConfig.siteName}`,
    description: `Read ${params.slug.replace(/-/g, " ")} on ${seoConfig.siteName}`,
    openGraph: {
      title: `${params.slug.replace(/-/g, " ")} | ${seoConfig.siteName}`,
      description: `Read ${params.slug.replace(/-/g, " ")} on ${seoConfig.siteName}`,
      type: "article",
    },
    alternates: {
      canonical: `${seoConfig.siteUrl}/blog/${params.slug}`,
    },
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  return <BlogPostClient slug={params.slug} />;
}
