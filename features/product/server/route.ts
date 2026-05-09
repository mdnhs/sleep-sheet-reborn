import { Hono } from 'hono';
import prisma from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';
import { Product } from '@/lib/types';
import { Prisma } from '@/generated/prisma';
const IMAGE_DIR = path.join(process.cwd(), 'images');
const app = new Hono()


. get('/images/:filename', async (c) => {
  const { filename } = c.req.param();
  const filePath = path.join(IMAGE_DIR, filename);

  try {
    const file = await fs.readFile(filePath);
    const extension = path.extname(filename).substring(1);

    return new Response(file, {
      headers: {
        'Content-Type': `image/${extension}`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return c.text('Image not found', 404);
  }
})
.get("/:id",async(c)=>{

  const id = c.req.param("id");

  try{
    const product = await prisma.product.findUnique({
      where:{id},
      include:{
        category:true,
        reviews:{
          select:{
            id:true,
            rating:true,
            createdAt:true,
            comment:true,
            user:{
              select:{
                id:true,
                name:true
              }
            }

          }
        },
        specifications:{
          select:{
            key:true,
            value:true,
          }
        },
      }
    });
    if(!product){
      return c.json({error:"Product Not Found"},404);
    }
    const formattedProduct:Product={
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      sku: product.sku,
      tags: product.tags,
      images: product.images,
      category: product.category.value,
      categoryLabel: product.category.label,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      specifications:product.specifications,
      care:product.careInstruction||"",
      colors:product.variants,
      sizes:product.sizes,
      features:product.features,
      isFeatured:product.isFeatured,
      reviews: product.reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        date: review.createdAt.toISOString(),
        comment: review.comment ,
        name: review.user?.name,
        userId:review.user.id,
      })),
      reviewCount: product.reviews.length,

    }

    return c.json({formattedProduct},200)
  }catch(error){
    console.error(error);
    return c.json({ error: 'Failed to fetch product' }, 500);
  }
})

.get("/", async (c) => {
  // Extract query parameters
  const category = c.req.query("category");
  const sort = c.req.query("sort");
  const priceRange = c.req.query("price");
  const page = parseInt(c.req.query("page") || "1");
  const search = c.req.query("search");
  const limit = 8;

  // 1. Build price filter
  let priceFilter: Prisma.FloatFilter | undefined;
  switch (priceRange) {
    case "under-50": priceFilter = { lte: 50 }; break;
    case "50-100": priceFilter = { gte: 50, lte: 100 }; break;
    case "100-200": priceFilter = { gte: 100, lte: 200 }; break;
    case "200+": priceFilter = { gte: 200 }; break;
  }

  // 2. Build featured filter
  const isFeatured = sort === "featured" ? true : undefined;

  // 3. Build filter conditions
  const filterConditions: Prisma.ProductWhereInput[] = [];

  if (category) {
    filterConditions.push({ category: { label: category } });
  }

  if (priceFilter) {
    filterConditions.push({ price: priceFilter });
  }

  if (isFeatured !== undefined) {
    filterConditions.push({ isFeatured });
  }

  if (search) {
    filterConditions.push({
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { label: { contains: search, mode: 'insensitive' } } }
      ]
    });
  }

  // 4. Build final where clause
  const whereFilter: Prisma.ProductWhereInput = filterConditions.length > 0 
    ? { AND: filterConditions }
    : {};

  // 5. Build orderBy clause
  const orderBy: Prisma.ProductOrderByWithRelationInput[] = [];
  switch (sort) {
    case "newest":
      orderBy.push({ createdAt: "desc" });
      break;
    case "price-asc":
      orderBy.push({ price: "asc" });
      break;
    case "price-desc":
      orderBy.push({ price: "desc" });
      break;
    case "featured":
      orderBy.push(
        { isFeatured: "desc" },
        { updatedAt: "desc" }
      );
      break;
  }

  try {
    // 6. Execute queries
    const [totalCount, products] = await prisma.$transaction([
      prisma.product.count({ where: whereFilter }),
      prisma.product.findMany({
        where: whereFilter,
        orderBy,
        take: limit,
        skip: (page - 1) * limit,
        include: { category: true },
      }),
    ]);

    // 7. Format response
    return c.json({
      data: products.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        sku: product.sku,
        tags: product.tags,
        images: product.images,
        category: product.category.value,
        categoryLabel: product.category.label,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        isFeatured: product.isFeatured,
      })),
      total: totalCount,
      hasNextPage: page * limit < totalCount,
      totalPages: Math.ceil(totalCount / limit),
    });
    
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to fetch products" }, 500);
  }
});



export default app;
