import { generateImagesSitemap } from "@/lib/seo"

export const dynamic = "force-dynamic"

export async function GET() {
  const xml = await generateImagesSitemap()
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
