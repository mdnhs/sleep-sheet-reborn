import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // TODO: resolve tenant from subdomain/custom domain
  // Extract org slug from hostname, set X-Organization-Id header for downstream use
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
