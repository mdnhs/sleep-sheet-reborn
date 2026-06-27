import { defaultRobotsTxt } from "@/lib/seo"

export const dynamic = "force-dynamic"

export async function GET() {
  const txt = defaultRobotsTxt()
  return new Response(txt, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
