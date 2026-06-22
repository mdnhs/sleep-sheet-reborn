import { Hono } from 'hono'
import { db } from '@/db'
import { testimonials } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

const app = new Hono()

.get('/', async (c) => {
  try {
    const list = await db.select()
      .from(testimonials)
      .orderBy(desc(testimonials.createdAt))
      .limit(3);

    return c.json({ success: true, testimonials: list })
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
      name: z.string().min(1, 'Name is required'),
      message: z.string(),
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

export default app
