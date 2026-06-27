import { generateCategoriesSitemap } from "@/lib/seo"

export const dynamic = "force-dynamic"

export async function GET() {
  const xml = await generateCategoriesSitemap()
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
