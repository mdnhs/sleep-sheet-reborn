import { Hono } from 'hono'
import prisma from '@/lib/prisma'

const app = new Hono()

.get('/', async (c) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 3,  
    })

    return c.json({ success: true, testimonials })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ success: false, message: 'Failed to fetch testimonials', error: errorMessage }, 500)
  }
})

export default app
