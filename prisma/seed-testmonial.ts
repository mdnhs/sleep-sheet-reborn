import 'dotenv/config';
import { PrismaClient } from '../generated/prisma';
import { PrismaNeon } from '@prisma/adapter-neon';

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create testimonials with optional images
  const testimonials = [
    {
      name: 'John Doe',
      message: 'I love the products from LUXSTORE! The quality is amazing, and customer service is top-notch.',
      rating: 5,
      image: null,
    },
    {
      name: 'Jane Smith',
      message: 'Fast delivery and great products. I will definitely shop again!',
      rating: 4,
      image: null,
    },
    {
      name: 'Mike Johnson',
      message: 'The shopping experience was easy and smooth. I found exactly what I was looking for!',
      rating: 5,
      image: null, // No image
    },
    {
      name: 'Emily Davis',
      message: 'Great value for the price. I am very happy with my purchase!',
      rating: 4,
      image: null,
    },
    {
      name: 'Chris Lee',
      message: 'Excellent quality and customer support. Highly recommend!',
      rating: 5,
      image: null, // No image
    },
  ]

  // Insert testimonials into the database
  for (const testimonial of testimonials) {
    await prisma.testimonial.create({
      data: testimonial,
    })
  }

  console.log('Testimonial data created successfully.')
}

main()
  .catch((e) => {
    throw e
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
