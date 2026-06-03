import db from "@/lib/db";
import { Product } from "@/lib/types";
import { parseStringArray } from "@/lib/json-fields";
import { ServiceError } from "@/lib/service-error";

type ProductReviewRelation = {
  id: string;
  rating: number;
  createdAt: Date;
  comment: string;
  user: { id: string; name: string };
};

export type ListProductsQuery = {
  category?: string;
  sort?: string;
  price?: string;
  page?: number;
  search?: string;
  limit?: number;
};

export async function getProductById(id: string): Promise<{ formattedProduct: Product }> {
  const product = await db.product.findUnique({
    where: { id },
    include: {
      category: true,
      reviews: {
        select: {
          id: true,
          rating: true,
          createdAt: true,
          comment: true,
          user: { select: { id: true, name: true } },
        },
      },
      specifications: { select: { key: true, value: true } },
    },
  });

  if (!product) throw new ServiceError("Product Not Found", 404);

  const formattedProduct: Product = {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,
    sku: product.sku,
    tags: parseStringArray(product.tags),
    images: parseStringArray(product.images),
    category: product.category.value,
    categoryLabel: product.category.label,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    specifications: product.specifications,
    care: product.careInstruction || "",
    colors: parseStringArray(product.variants),
    sizes: parseStringArray(product.sizes),
    features: parseStringArray(product.features),
    isFeatured: product.isFeatured,
    reviews: (product.reviews as ProductReviewRelation[]).map((review) => ({
      id: review.id,
      rating: review.rating,
      date: review.createdAt.toISOString(),
      comment: review.comment,
      name: review.user?.name,
      userId: review.user.id,
    })),
    reviewCount: product.reviews.length,
  };

  return { formattedProduct };
}

function buildPriceFilter(priceRange?: string): Record<string, number> | undefined {
  switch (priceRange) {
    case "under-50":
      return { lte: 50 };
    case "50-100":
      return { gte: 50, lte: 100 };
    case "100-200":
      return { gte: 100, lte: 200 };
    case "200+":
      return { gte: 200 };
    default:
      return undefined;
  }
}

function buildOrderBy(sort?: string): Record<string, string>[] {
  switch (sort) {
    case "newest":
      return [{ createdAt: "desc" }];
    case "price-asc":
      return [{ price: "asc" }];
    case "price-desc":
      return [{ price: "desc" }];
    case "featured":
      return [{ isFeatured: "desc" }, { updatedAt: "desc" }];
    default:
      return [];
  }
}

export async function listProducts(query: ListProductsQuery) {
  const page = query.page ?? 1;
  const limit = Math.min(query.limit ?? 8, 100);

  const filterConditions: Record<string, unknown>[] = [];
  if (query.category) filterConditions.push({ category: { label: query.category } });

  const priceFilter = buildPriceFilter(query.price);
  if (priceFilter) filterConditions.push({ price: priceFilter });

  if (query.sort === "featured") filterConditions.push({ isFeatured: true });

  if (query.search) {
    filterConditions.push({
      OR: [
        // SQLite LIKE is case-insensitive for ASCII; `mode` is Postgres-only.
        { name: { contains: query.search } },
        { description: { contains: query.search } },
        { category: { label: { contains: query.search } } },
      ],
    });
  }

  const whereFilter = filterConditions.length > 0 ? { AND: filterConditions } : {};

  const [totalCount, products] = await db.$transaction([
    db.product.count({ where: whereFilter }),
    db.product.findMany({
      where: whereFilter,
      orderBy: buildOrderBy(query.sort),
      take: limit,
      skip: (page - 1) * limit,
      include: { category: true },
    }),
  ]);

  return {
    data: (products as Record<string, any>[]).map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      sku: product.sku,
      tags: parseStringArray(product.tags),
      images: parseStringArray(product.images),
      category: product.category.value,
      categoryLabel: product.category.label,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      isFeatured: product.isFeatured,
    })),
    total: totalCount,
    hasNextPage: page * limit < totalCount,
    totalPages: Math.ceil(totalCount / limit),
  };
}
