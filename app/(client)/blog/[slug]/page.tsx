import BlogPostClient from './blog-post-client';
import { seoConfig } from "@/lib/seo";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { extractTags } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;

  try {
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.slug, slug))
      .limit(1);

    if (post) {
      const cleanSummary = post.summary || post.content.replace(/<[^>]*>/g, "").slice(0, 160).trim();
      const description = cleanSummary.length > 155 ? `${cleanSummary.slice(0, 155)}...` : cleanSummary;
      const tags = extractTags(post.title, post.content);

      return {
        title: `${post.title} | ${seoConfig.siteName}`,
        description,
        keywords: tags.join(", "),
        openGraph: {
          title: post.title,
          description,
          type: "article",
          url: `${seoConfig.siteUrl}/blog/${slug}`,
          images: post.coverImage ? [{ url: post.coverImage }] : undefined,
        },
        twitter: {
          card: "summary_large_image",
          title: post.title,
          description,
          images: post.coverImage ? [post.coverImage] : undefined,
        },
        alternates: {
          canonical: `${seoConfig.siteUrl}/blog/${slug}`,
        },
      };
    }
  } catch {}

  const fallbackTitle = slug.replace(/-/g, " ");
  return {
    title: `${fallbackTitle} | Blog | ${seoConfig.siteName}`,
    description: `Read ${fallbackTitle} on ${seoConfig.siteName}`,
    alternates: {
      canonical: `${seoConfig.siteUrl}/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  return <BlogPostClient slug={slug} />;
}
