import { NextRequest, NextResponse } from "next/server"
import { FeedBuilder } from "@/lib/meta-catalog/feed-builder"
import { fetchAllProducts } from "@/lib/meta-catalog/db"
import { getCachedFeed } from "@/lib/meta-catalog/cache"

export const dynamic = "force-dynamic"
export const revalidate = 300

const builder = new FeedBuilder(fetchAllProducts)

export async function GET(request: NextRequest) {
  const cached = getCachedFeed("xml")
  if (cached) {
    return new NextResponse(cached.data, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "ETag": cached.etag,
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
        "Last-Modified": new Date(cached.generatedAt).toUTCString(),
      },
    })
  }

  try {
    const result = await builder.build("xml")

    return new NextResponse(result.content, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "ETag": result.etag,
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    })
  } catch (error) {
    console.error("Google Merchant feed generation error:", error)
    return new NextResponse("Google Merchant feed generation failed", { status: 500 })
  }
}
