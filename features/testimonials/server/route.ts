import { Hono } from 'hono'
import { db } from '@/db'
import { testimonials } from '@/db/schema'
import { desc } from 'drizzle-orm'

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

export default app
