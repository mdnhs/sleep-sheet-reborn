import React from 'react';
import BlogPostClient from './blog-post-client';

export const metadata = {
  title: 'Blog Post',
};

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  return <BlogPostClient slug={params.slug} />;
}
