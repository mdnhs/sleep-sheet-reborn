'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileUpload } from '@/features/dashboard/components/file-upload';
import { useGetPosts } from '@/features/blog/api/use-get-posts';
import { useUpdatePost } from '@/features/blog/api/use-update-post';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TiptapEditor } from '@/components/tiptap-editor';

export default function UpdateBlogClient({ id }: { id: string }) {
  const router = useRouter();
  const { data: posts, isLoading } = useGetPosts();
  const { mutate: updatePost, isPending } = useUpdatePost(id);
  
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState<string | undefined>('');
  const [coverImage, setCoverImage] = useState<File | string>('');
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    if (posts) {
      const post = posts.find((p: any) => p.id === id);
      if (post) {
        setTitle(post.title || '');
        setSlug(post.slug || '');
        setSummary(post.summary || '');
        setContent(post.content || '');
        setCoverImage(post.coverImage || '');
        setIsPublished(post.isPublished || false);
      }
    }
  }, [posts, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalImage = coverImage as string;
    if (coverImage instanceof File) {
      const reader = new FileReader();
      reader.readAsDataURL(coverImage);
      await new Promise((resolve) => (reader.onload = resolve));
      finalImage = reader.result as string;
    }

    updatePost({
      title,
      slug,
      summary,
      content: content || '',
      coverImage: finalImage,
      isPublished
    }, {
      onSuccess: () => {
        router.push('/dashboard/blog');
      }
    });
  };

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Update Blog Post</h1>
      <Card>
        <CardHeader>
          <CardTitle>Post Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Title</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Slug</label>
              <Input value={slug} onChange={e => setSlug(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Summary</label>
              <Input value={summary} onChange={e => setSummary(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Cover Image</label>
              <FileUpload 
                value={coverImage ? [coverImage] : []}
                onChange={(urls) => setCoverImage(urls[0] || '')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Content</label>
              <TiptapEditor value={content || ''} onChange={setContent} />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} />
              <label className="text-sm font-semibold">Publish</label>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <Button type="button" variant="outline" onClick={() => router.push('/dashboard/blog')}>Cancel</Button>
              <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Update Post'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
