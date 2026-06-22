import { Hono } from 'hono';
import { db } from '@/db';
import { posts, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { sessionMiddleware } from '@/lib/session-middleware';

const app = new Hono()

// Get all posts (Client & Admin)
.get('/', async (c) => {
  try {
    const list = await db.select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      summary: posts.summary,
      content: posts.content,
      coverImage: posts.coverImage,
      isPublished: posts.isPublished,
      createdAt: posts.createdAt,
      author: {
        id: users.id,
        name: users.name,
      }
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .orderBy(desc(posts.createdAt));

    return c.json({ success: true, posts: list });
  } catch (error) {
    console.error("Fetch posts error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ success: false, message: 'Failed to fetch posts', error: errorMessage }, 500);
  }
})

// Get single post by slug
.get('/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const postData = await db.select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      summary: posts.summary,
      content: posts.content,
      coverImage: posts.coverImage,
      isPublished: posts.isPublished,
      createdAt: posts.createdAt,
      author: {
        id: users.id,
        name: users.name,
      }
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.slug, slug))
    .limit(1);

    if (!postData.length) {
      return c.json({ success: false, message: 'Post not found' }, 404);
    }

    return c.json({ success: true, post: postData[0] });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ success: false, message: 'Failed to fetch post', error: errorMessage }, 500);
  }
})

// Create post
.post(
  '/',
  sessionMiddleware,
  zValidator(
    'json',
    z.object({
      title: z.string().min(1, 'Title is required'),
      slug: z.string().min(1, 'Slug is required'),
      summary: z.string().optional(),
      content: z.string().min(1, 'Content is required'),
      coverImage: z.string().optional(),
      isPublished: z.boolean().default(false),
    })
  ),
  async (c) => {
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ success: false, error: 'Unauthorized' }, 403);
      }

      const data = c.req.valid('json');
      
      const newPost = await db.insert(posts).values({
        ...data,
        authorId: user.id,
      }).returning();

      return c.json({ success: true, post: newPost[0] }, 201);
    } catch (error) {
      console.error("Create post error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, message: 'Failed to create post', error: errorMessage }, 500);
    }
  }
)

// Update post
.put(
  '/:id',
  sessionMiddleware,
  zValidator(
    'json',
    z.object({
      title: z.string().min(1, 'Title is required'),
      slug: z.string().min(1, 'Slug is required'),
      summary: z.string().optional(),
      content: z.string().min(1, 'Content is required'),
      coverImage: z.string().optional(),
      isPublished: z.boolean().default(false),
    })
  ),
  async (c) => {
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ success: false, error: 'Unauthorized' }, 403);
      }

      const id = c.req.param('id');
      const data = c.req.valid('json');
      
      const updatedPost = await db.update(posts)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(posts.id, id))
        .returning();

      if (!updatedPost.length) {
        return c.json({ success: false, message: 'Post not found' }, 404);
      }

      return c.json({ success: true, post: updatedPost[0] });
    } catch (error) {
      console.error("Update post error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, message: 'Failed to update post', error: errorMessage }, 500);
    }
  }
)

// Delete post
.delete(
  '/:id',
  sessionMiddleware,
  async (c) => {
    try {
      const user = c.get("user");
      if (!user || user.role !== "ADMIN") {
        return c.json({ success: false, error: 'Unauthorized' }, 403);
      }

      const id = c.req.param('id');
      
      const deletedPost = await db.delete(posts)
        .where(eq(posts.id, id))
        .returning();

      if (!deletedPost.length) {
        return c.json({ success: false, message: 'Post not found' }, 404);
      }

      return c.json({ success: true, post: deletedPost[0] });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, message: 'Failed to delete post', error: errorMessage }, 500);
    }
  }
);

export default app;
