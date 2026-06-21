import 'dotenv/config';
import { db } from '../db';
import { testimonials } from '../db/schema';

async function main() {
  console.log("🌱 Seeding testimonials...");
  // Create testimonials with optional images
  const testimonialsData = [
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
      image: null,
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
      image: null,
    },
  ];

  for (const item of testimonialsData) {
    await db.insert(testimonials).values({
      name: item.name,
      message: item.message,
      rating: item.rating,
      image: item.image,
    });
  }

  console.log('✅ Testimonial data created successfully.')
}

main()
  .catch((e) => {
    console.error("❌ Error seeding testimonials:", e);
    process.exit(1);
  });
