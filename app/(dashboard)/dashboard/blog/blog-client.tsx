'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetPosts } from '@/features/blog/api/use-get-posts';
import { useDeletePost } from '@/features/blog/api/use-delete-post';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DeleteAlertMessage } from '@/components/DeleteAlertMessage';
import { Plus, Edit, Trash } from 'lucide-react';
import Link from 'next/link';

export default function BlogClientPage() {
  const { data: posts, isLoading } = useGetPosts();
  const { mutate: deletePost, isPending: isDeleting } = useDeletePost();

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center pb-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Blog Posts</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your blog posts</p>
        </div>
        <Link href="/dashboard/blog/create">
          <Button><Plus className="mr-2 h-4 w-4" /> Create Post</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : !posts || posts.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No blog posts found.</p>
          ) : (
            <div className="space-y-2">
              {posts.map((post: any) => (
                <div key={post.id} className="flex items-center justify-between rounded-lg p-4 border transition-all hover:bg-accent bg-card">
                  <div className="flex flex-col gap-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{post.title}</p>
                    <p className="text-xs text-muted-foreground">Status: {post.isPublished ? 'Published' : 'Draft'} | /{post.slug}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/blog/update/${post.id}`}>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <DeleteAlertMessage
                      description="This will permanently delete this blog post."
                      loading={isDeleting}
                      onConfirm={() => deletePost(post.id)}
                    >
                      <Button variant="destructive" size="icon" className="h-8 w-8">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </DeleteAlertMessage>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
