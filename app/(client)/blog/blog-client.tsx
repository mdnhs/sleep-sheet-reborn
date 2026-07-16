'use client';
import { useGetPosts } from '@/features/blog/api/use-get-posts';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';

export default function BlogClientPage() {
  const { data: postsData, isLoading } = useGetPosts();

  const publishedPosts = postsData?.data?.filter((p: any) => p.isPublished) || [];

  return (
    <div className="container mx-auto py-12 px-4 min-h-[80vh]">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Our Blog</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Read our latest stories, news, and insights.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton className="aspect-video w-full rounded-2xl" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : publishedPosts.length === 0 ? (
        <div className="text-center py-20">
          <h3 className="text-2xl font-semibold">No posts yet</h3>
          <p className="text-muted-foreground">Check back later for new content!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {publishedPosts.map((post: any) => (
            <Link href={`/blog/${post.slug}`} key={post.id} className="group flex flex-col gap-4">
              <div className="overflow-hidden rounded-2xl aspect-video bg-muted relative">
                {post.coverImage ? (
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  {format(new Date(post.createdAt), 'MMMM d, yyyy')} • {post.author?.name || 'Admin'}
                </p>
                <h3 className="text-xl font-semibold group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h3>
                {post.summary && (
                  <p className="text-muted-foreground mt-2 line-clamp-3">{post.summary}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
