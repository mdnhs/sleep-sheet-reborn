import { Hono } from 'hono'
import { db } from '@/db'
import { testimonials } from '@/db/schema'
import { desc, eq, ilike, inArray, or, sql, and } from 'drizzle-orm'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { uploadImage } from '@/lib/cloudinary'

const app = new Hono()

.get('/', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1', 10)
    const limit = Math.min(parseInt(c.req.query('limit') || '10', 10), 100)
    const search = c.req.query('search')

    const filterConditions: any[] = []

    if (search) {
      filterConditions.push(
        or(
          ilike(testimonials.name, `%${search}%`),
          ilike(testimonials.message, `%${search}%`),
        )
      )
    }

    const [countResult] = await db.select({
      count: sql<number>`count(*)`,
    }).from(testimonials)
      .where(filterConditions.length > 0 ? and(...filterConditions) : undefined)

    const totalCount = Number(countResult?.count || 0)

    const list = await db.select()
      .from(testimonials)
      .where(filterConditions.length > 0 ? and(...filterConditions) : undefined)
      .orderBy(desc(testimonials.createdAt))
      .limit(limit)
      .offset((page - 1) * limit)

    const mappedList = list.map(t => ({
      ...t,
      screenshot: t.screenshot || t.image
    }))

    return c.json({
      data: mappedList,
      total: totalCount,
      hasNextPage: page * limit < totalCount,
      totalPages: Math.ceil(totalCount / limit),
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ success: false, message: 'Failed to fetch testimonials', error: errorMessage }, 500)
  }
})

.post(
  '/',
  zValidator(
    'json',
    z.object({
      name: z.string().optional().default(""),
      message: z.string().optional().default(""),
      rating: z.number().min(1).max(5),
      image: z.string().optional(),
      screenshot: z.string().optional(),
      role: z.enum(['FASHION_ENTHUSIAST', 'CUSTOMER', 'INFLUENCER', 'OTHER']).default('CUSTOMER'),
    })
  ),
  async (c) => {
    try {
      const data = c.req.valid('json')

      const newTestimonial = await db.insert(testimonials).values(data).returning()

      return c.json({ success: true, testimonial: newTestimonial[0] }, 201)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return c.json({ success: false, message: 'Failed to create testimonial', error: errorMessage }, 500)
    }
  }
)

.post('/upload-image', async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get("image")
    if (!file || !(file instanceof File)) {
      return c.json({ error: "No image file provided" }, 400)
    }

    const url = await uploadImage(file, "testimonials")
    return c.json({ url })
  } catch (error) {
    console.error("Failed to upload image", error)
    return c.json({ error: "Failed to upload image" }, 500)
  }
})

.post('/bulk-delete', zValidator('json', z.object({ ids: z.array(z.string()) })), async (c) => {
  try {
    const { ids } = c.req.valid('json')

    if (ids.length === 0) {
      return c.json({ error: 'No IDs provided' }, 400)
    }

    const result = await db.delete(testimonials)
      .where(inArray(testimonials.id, ids))
      .returning({ id: testimonials.id })

    return c.json({ deleted: result.length })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: errorMessage }, 500)
  }
})

.delete(
  '/:id',
  async (c) => {
    try {
      const id = c.req.param('id')

      const deletedTestimonial = await db.delete(testimonials).where(eq(testimonials.id, id)).returning()

      if (!deletedTestimonial.length) {
        return c.json({ success: false, message: 'Testimonial not found' }, 404)
      }

      return c.json({ success: true, testimonial: deletedTestimonial[0] })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return c.json({ success: false, message: 'Failed to delete testimonial', error: errorMessage }, 500)
    }
  }
)

.patch(
  '/:id',
  zValidator(
    'json',
    z.object({
      name: z.string().optional().default(""),
      message: z.string().optional().default(""),
      rating: z.number().min(1).max(5).optional(),
      image: z.string().optional(),
      screenshot: z.string().optional(),
      role: z.enum(['FASHION_ENTHUSIAST', 'CUSTOMER', 'INFLUENCER', 'OTHER']).optional(),
    })
  ),
  async (c) => {
    try {
      const id = c.req.param('id')
      const data = c.req.valid('json')

      const updatedTestimonial = await db
        .update(testimonials)
        .set(data)
        .where(eq(testimonials.id, id))
        .returning()

      if (!updatedTestimonial.length) {
        return c.json({ success: false, message: 'Testimonial not found' }, 404)
      }

      return c.json({ success: true, testimonial: updatedTestimonial[0] }, 200)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return c.json({ success: false, message: 'Failed to update testimonial', error: errorMessage }, 500)
    }
  }
)

export default app
