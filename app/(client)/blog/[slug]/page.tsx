import BlogPostClient from './blog-post-client';
import { seoConfig } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const title = slug.replace(/-/g, " ");
  return {
    title: `${title} | Blog | ${seoConfig.siteName}`,
    description: `Read ${title} on ${seoConfig.siteName}`,
    openGraph: {
      title: `${title} | ${seoConfig.siteName}`,
      description: `Read ${title} on ${seoConfig.siteName}`,
      type: "article",
    },
    alternates: {
      canonical: `${seoConfig.siteUrl}/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  return <BlogPostClient slug={slug} />;
}
