'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileUpload } from '@/features/dashboard/components/file-upload';
import { useCreatePost } from '@/features/blog/api/use-create-post';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TiptapEditor } from '@/components/tiptap-editor';
import { toast } from 'sonner';

export default function CreateBlogClient() {
  const router = useRouter();
  const { mutate: createPost, isPending } = useCreatePost();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState<string | undefined>('');
  const [coverImage, setCoverImage] = useState<File | string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalImage = coverImage as string;
    if (coverImage instanceof File) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('image', coverImage);
      const res = await fetch('/api/blog/upload-image', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Failed to upload image');
        setIsUploading(false);
        return;
      }
      const { url } = await res.json();
      finalImage = url;
      setIsUploading(false);
    }

    createPost({
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

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Create Blog Post</h1>
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
              <label className="text-sm font-semibold">Publish immediately</label>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <Button type="button" variant="outline" onClick={() => router.push('/dashboard/blog')}>Cancel</Button>
              <Button type="submit" disabled={isPending || isUploading}>
                {isUploading ? 'Uploading...' : isPending ? 'Saving...' : 'Save Post'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
