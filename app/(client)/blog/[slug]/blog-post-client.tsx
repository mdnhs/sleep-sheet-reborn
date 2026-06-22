'use client';
import { useGetPost } from '@/features/blog/api/use-get-post';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function BlogPostClient({ slug }: { slug: string }) {
  const { data: post, isLoading } = useGetPost(slug);

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-3xl min-h-[80vh]">
        <Skeleton className="h-8 w-32 mb-8" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-6 w-1/3 mb-8" />
        <Skeleton className="aspect-video w-full rounded-2xl mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  if (!post || !post.isPublished) {
    return (
      <div className="container mx-auto py-20 px-4 text-center min-h-[80vh]">
        <h1 className="text-3xl font-bold mb-4">Post not found</h1>
        <Link href="/blog" className="text-primary hover:underline">Return to blog</Link>
      </div>
    );
  }

  return (
    <article className="container mx-auto py-12 px-4 max-w-4xl min-h-[80vh]">
      <Link href="/blog" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to blog
      </Link>
      
      <div className="mb-10 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 leading-tight">
          {post.title}
        </h1>
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <span>{format(new Date(post.createdAt), 'MMMM d, yyyy')}</span>
          <span>•</span>
          <span>{post.author?.name || 'Admin'}</span>
        </div>
      </div>

      {post.coverImage && (
        <div className="aspect-video w-full rounded-3xl overflow-hidden mb-12 shadow-lg">
          <img src={post.coverImage} alt={post.title} className="object-cover w-full h-full" />
        </div>
      )}

      <div 
        className="prose prose-lg dark:prose-invert max-w-3xl mx-auto" 
        dangerouslySetInnerHTML={{ __html: post.content }} 
      />
    </article>
  );
}
