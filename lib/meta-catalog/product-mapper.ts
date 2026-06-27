import type { RawProduct, CatalogProduct, CatalogVariant, ValidationError } from "./types"
import { MetaCatalogConfig } from "./config"
import { formatPrice, buildProductLink, buildImageLink, mapAvailability, truncate, stripHtml } from "./utils"
import { validateAndClean } from "./validators"

function getSpec(specs: { key: string; value: string }[], key: string): string | undefined {
  return specs.find((s) => s.key.toLowerCase() === key.toLowerCase())?.value
}

function getGender(specs: { key: string; value: string }[]): "male" | "female" | "unisex" {
  const gender = getSpec(specs, "gender")?.toLowerCase()
  if (gender === "male" || gender === "female") return gender
  return "unisex"
}

function getAgeGroup(specs: { key: string; value: string }[]): "adult" | "kids" | "toddler" | "infant" | "newborn" {
  const age = getSpec(specs, "age_group")?.toLowerCase()
  if (["kids", "toddler", "infant", "newborn"].includes(age || "")) return age as "kids"
  return "adult"
}

function getMaterial(specs: { key: string; value: string }[]): string {
  return getSpec(specs, "material") || ""
}

function getGtin(specs: { key: string; value: string }[]): string {
  return getSpec(specs, "gtin") || getSpec(specs, "upc") || getSpec(specs, "ean") || ""
}

function getGoogleCategory(specs: { key: string; value: string }[]): string {
  return getSpec(specs, "google_product_category") || ""
}

type MapResult = {
  errors: ValidationError[]
  data: CatalogProduct | null
}

export function mapProduct(product: RawProduct, categoryLabel: string): MapResult {
  const { valid, errors } = validateAndClean(product)

  const description = truncate(
    stripHtml(product.description || ""),
    MetaCatalogConfig.descriptionMaxLength,
  )

  const title = truncate(
    stripHtml(product.name || ""),
    MetaCatalogConfig.titleMaxLength,
  )

  const salePrice = product.discount > 0
    ? product.price * (1 - product.discount / 100)
    : null

  const priceStr = formatPrice(product.price)
  const salePriceStr = salePrice !== null ? formatPrice(salePrice) : null

  const availability = mapAvailability(product.stock)

  const link = buildProductLink(product.id)

  const mainImage = product.images[0] || ""
  const additionalImages = product.images.slice(1)

  const spec = product.specifications || []

  const data: CatalogProduct = {
    id: product.id,
    title,
    description,
    availability,
    condition: "new",
    price: priceStr,
    salePrice: salePriceStr,
    currency: MetaCatalogConfig.currency,
    link,
    imageLink: buildImageLink(mainImage),
    additionalImageLinks: additionalImages.map(buildImageLink),
    brand: getSpec(spec, "brand") || MetaCatalogConfig.brandFallback,
    googleProductCategory: getGoogleCategory(spec),
    productType: categoryLabel || "",
    itemGroupId: product.id,
    mpn: product.sku || product.id,
    gtin: getGtin(spec),
    color: product.variants.map((v) => v.name).join("/") || "",
    size: product.sizes.join("/") || "",
    material: getMaterial(spec),
    gender: getGender(spec),
    ageGroup: getAgeGroup(spec),
    customLabels: [
      product.isFeatured ? "featured" : "",
      product.tags[0] || "",
      product.tags[1] || "",
      product.defaultVariantName || "",
      product.careInstruction || "",
    ],
  }

  return { errors, data }
}

export function mapVariants(product: RawProduct): CatalogVariant[] {
  const variants: CatalogVariant[] = []
  const mainImage = product.images[0] || ""
  const additionalImages = product.images.slice(1)
  const basePrice = product.price
  const baseAvailability = mapAvailability(product.stock)

  const hasOneVariant = product.variants.length <= 1 && product.sizes.length <= 1

  if (hasOneVariant) return variants

  for (const variant of product.variants) {
    for (const size of product.sizes) {
      const variantPrice = variant.price ?? basePrice
      const salePrice = product.discount > 0 ? variantPrice * (1 - product.discount / 100) : null

      variants.push({
        id: `${product.id}-${variant.name}-${size}`,
        itemGroupId: product.id,
        title: `${product.name} - ${variant.name}${size ? ` (${size})` : ""}`,
        price: formatPrice(variantPrice),
        salePrice: salePrice !== null ? formatPrice(salePrice) : null,
        availability: baseAvailability,
        imageLink: buildImageLink(mainImage),
        additionalImageLinks: additionalImages.map(buildImageLink),
        color: variant.name,
        size,
        material: "",
      })
    }
  }

  return variants
}

export function mapToCatalogEntries(product: RawProduct, categoryLabel: string): {
  entries: (CatalogProduct | CatalogVariant)[]
  errors: ValidationError[]
} {
  const { data, errors } = mapProduct(product, categoryLabel)
  const entries: (CatalogProduct | CatalogVariant)[] = []

  if (data) {
    entries.push(data)
  }

  const variantEntries = mapVariants(product)
  entries.push(...variantEntries)

  return { entries, errors }
}
