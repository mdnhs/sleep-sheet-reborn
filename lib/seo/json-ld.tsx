import Script from "next/script"
import { seoConfig } from "./config"
import type { BreadcrumbItem, ProductSeoData, CategorySeoData, BlogSeoData } from "./types"

export function jsonLd<T>(schema: T): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    ...schema,
  })
}

export function organizationSchema() {
  return jsonLd({
    "@type": "Organization",
    name: seoConfig.organization.name,
    url: seoConfig.organization.url,
    logo: seoConfig.organization.logo,
    description: seoConfig.organization.description,
    foundingDate: seoConfig.organization.foundingDate,
    sameAs: seoConfig.organization.sameAs,
    address: {
      "@type": "PostalAddress",
      streetAddress: seoConfig.address.streetAddress,
      addressLocality: seoConfig.address.addressLocality,
      addressRegion: seoConfig.address.addressRegion,
      postalCode: seoConfig.address.postalCode,
      addressCountry: seoConfig.address.addressCountry,
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: seoConfig.contact.telephone,
      email: seoConfig.contact.email,
      contactType: seoConfig.contact.contactType,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${seoConfig.siteUrl}/shop?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  })
}

export function websiteSchema() {
  return jsonLd({
    "@type": "WebSite",
    name: seoConfig.siteName,
    url: seoConfig.siteUrl,
    description: seoConfig.defaultDescription,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${seoConfig.siteUrl}/shop?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  })
}

export function webpageSchema(title: string, description: string, url: string) {
  return jsonLd({
    "@type": "WebPage",
    name: title,
    description,
    url,
    publisher: {
      "@type": "Organization",
      name: seoConfig.organization.name,
      logo: seoConfig.organization.logo,
    },
    inLanguage: "en",
    dateModified: new Date().toISOString(),
  })
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return jsonLd({
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${seoConfig.siteUrl}${item.url}`,
    })),
  })
}

export function productSchema(product: ProductSeoData) {
  const offers = {
    "@type": "Offer",
    price: product.price,
    priceCurrency: product.currency || "BDT",
    availability: `https://schema.org/${product.availability || "InStock"}`,
    url: product.url,
    ...(product.compareAtPrice && product.compareAtPrice > product.price
      ? { priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] }
      : {}),
  }

  const schema: Record<string, unknown> = {
    "@type": "Product",
    "@id": `${product.url}#product`,
    name: product.name,
    description: product.description,
    url: product.url,
    image: product.images || [seoConfig.defaultImage],
    sku: product.sku || product.id,
    offers,
  }

  if (product.gtin) schema.gtin = product.gtin
  if (product.brand) {
    schema.brand = { "@type": "Brand", name: product.brand }
  }
  if (product.category) {
    schema.category = product.category
  }
  if (product.rating && product.reviewCount) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    }
  }

  return jsonLd(schema)
}

export function collectionPageSchema(
  name: string,
  description: string,
  url: string,
  products: Array<{ name: string; url: string; image?: string }>,
) {
  return jsonLd({
    "@type": "CollectionPage",
    name,
    description,
    url,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: products.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Product",
          name: p.name,
          url: p.url,
          ...(p.image ? { image: p.image } : {}),
        },
      })),
    },
  })
}

export function articleSchema(post: BlogSeoData) {
  const schema: Record<string, unknown> = {
    "@type": "Article",
    "@id": `${post.url}#article`,
    headline: post.title,
    description: post.excerpt,
    url: post.url,
    image: post.coverImage || seoConfig.defaultImage,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: {
      "@type": "Person",
      name: post.author?.name || seoConfig.organization.name,
      ...(post.author?.url ? { url: post.author.url } : {}),
    },
    publisher: {
      "@type": "Organization",
      name: seoConfig.organization.name,
      logo: {
        "@type": "ImageObject",
        url: seoConfig.organization.logo || `${seoConfig.siteUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": post.url,
    },
  }

  if (post.readingTime) {
    schema.timeRequired = `PT${post.readingTime}M`
  }

  if (post.category) {
    schema.articleSection = post.category
  }

  return jsonLd(schema)
}

export function faqSchema(questions: Array<{ question: string; answer: string }>) {
  return jsonLd({
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  })
}

export function localBusinessSchema() {
  return jsonLd({
    "@type": "Store",
    name: seoConfig.organization.name,
    url: seoConfig.organization.url,
    logo: seoConfig.organization.logo,
    image: seoConfig.defaultImage,
    description: seoConfig.organization.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: seoConfig.address.streetAddress,
      addressLocality: seoConfig.address.addressLocality,
      addressRegion: seoConfig.address.addressRegion,
      postalCode: seoConfig.address.postalCode,
      addressCountry: seoConfig.address.addressCountry,
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: seoConfig.contact.telephone,
      email: seoConfig.contact.email,
      contactType: seoConfig.contact.contactType,
    },
    sameAs: seoConfig.organization.sameAs,
    openingHoursSpecification: [
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Monday", opens: "09:00", closes: "18:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Tuesday", opens: "09:00", closes: "18:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Wednesday", opens: "09:00", closes: "18:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Thursday", opens: "09:00", closes: "18:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Friday", opens: "09:00", closes: "18:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "10:00", closes: "16:00" },
    ],
    priceRange: "$$",
  })
}

export function imageObjectSchema(url: string, caption: string, width?: number, height?: number) {
  return jsonLd({
    "@type": "ImageObject",
    url,
    caption,
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  })
}

export function personSchema(name: string, url?: string, image?: string, jobTitle?: string) {
  return jsonLd({
    "@type": "Person",
    name,
    ...(url ? { url } : {}),
    ...(image ? { image } : {}),
    ...(jobTitle ? { jobTitle } : {}),
  })
}

export function aggregateOfferSchema(
  offers: Array<{ price: number; priceCurrency: string; availability: string }>,
) {
  const lowPrice = Math.min(...offers.map((o) => o.price))
  const highPrice = Math.max(...offers.map((o) => o.price))

  return jsonLd({
    "@type": "AggregateOffer",
    lowPrice,
    highPrice,
    priceCurrency: offers[0]?.priceCurrency || "BDT",
    availability: `https://schema.org/${offers[0]?.availability || "InStock"}`,
    offerCount: offers.length,
    offers: offers.map((o) => ({
      "@type": "Offer",
      price: o.price,
      priceCurrency: o.priceCurrency,
      availability: `https://schema.org/${o.availability}`,
    })),
  })
}

export function videoObjectSchema(
  name: string,
  description: string,
  thumbnailUrl: string,
  contentUrl: string,
  uploadDate: string,
  duration?: string,
) {
  return jsonLd({
    "@type": "VideoObject",
    name,
    description,
    thumbnailUrl,
    contentUrl,
    uploadDate,
    ...(duration ? { duration } : {}),
  })
}

export function productGroupSchema(
  groupName: string,
  groupUrl: string,
  groupDescription: string,
  variants: ProductSeoData[],
) {
  return jsonLd({
    "@type": "ProductGroup",
    name: groupName,
    url: groupUrl,
    description: groupDescription,
    variesBy: ["color", "size"],
    hasVariant: variants.map((v) => ({
      "@type": "Product",
      name: v.name,
      url: v.url,
      image: v.images?.[0] || seoConfig.defaultImage,
      sku: v.sku || v.id,
      offers: {
        "@type": "Offer",
        price: v.price,
        priceCurrency: v.currency || "BDT",
        availability: `https://schema.org/${v.availability || "InStock"}`,
      },
    })),
  })
}

export function structuredDataScript(id: string, schema: string) {
  return (
    <script
      key={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: schema }}
    />
  )
}
