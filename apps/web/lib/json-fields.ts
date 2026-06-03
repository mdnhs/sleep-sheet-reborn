// Helpers for fields that were Postgres String[] / Json but are stored as
// TEXT (JSON-encoded) in Cloudflare D1 (SQLite). Use these at the route
// boundary so the rest of the app keeps working with real arrays.

/** Parse a JSON-encoded string array column into string[]. Safe on null/garbage. */
export function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[];
  if (typeof value !== "string" || value.length === 0) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

/** Encode a string array for storage in a TEXT column. */
export function serializeStringArray(value: string[] | undefined | null): string {
  return JSON.stringify(value ?? []);
}

/** Parse a JSON-encoded object column (was Postgres Json). */
export function parseJson<T = unknown>(value: unknown): T | null {
  if (value == null) return null;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/** The Product columns that are JSON-encoded string arrays in D1. */
const PRODUCT_ARRAY_FIELDS = [
  "variants",
  "tags",
  "images",
  "sizes",
  "features",
] as const;

type RawProductArrays = Record<(typeof PRODUCT_ARRAY_FIELDS)[number], unknown>;

/**
 * Turn a raw Product row (array fields as JSON strings) into one with real
 * arrays. Pass-through for any other fields, including nested relations.
 */
export function deserializeProduct<T extends Partial<RawProductArrays>>(
  product: T
): Omit<T, keyof RawProductArrays> & {
  variants: string[];
  tags: string[];
  images: string[];
  sizes: string[];
  features: string[];
} {
  return {
    ...product,
    variants: parseStringArray(product.variants),
    tags: parseStringArray(product.tags),
    images: parseStringArray(product.images),
    sizes: parseStringArray(product.sizes),
    features: parseStringArray(product.features),
  };
}
