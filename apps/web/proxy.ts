import { NextRequest, NextResponse } from 'next/server'

// Better Auth default session cookie name
const SESSION_COOKIE = 'better-auth.session_token'

const PROTECTED = ['/dashboard', '/admin']
// Paths that skip protection even if they start with a protected prefix
const PROTECTED_EXCLUSIONS = ['/admin/login']
const AUTH_PATHS = ['/login', '/admin/login']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSession = !!request.cookies.get(SESSION_COOKIE)

  // Redirect authenticated users away from login
  if (hasSession && AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Protect dashboard and platform admin routes (excluding login pages)
  const isExcluded = PROTECTED_EXCLUSIONS.some((p) => pathname.startsWith(p))
  if (!isExcluded && PROTECTED.some((p) => pathname.startsWith(p)) && !hasSession) {
    const isAdmin = pathname.startsWith('/admin')
    const loginUrl = new URL(isAdmin ? '/admin/login' : '/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const response = NextResponse.next()

  // Inject tenant slug header for server components / API calls
  const host = (request.headers.get('host') ?? '').split(':')[0]
  const parts = host.split('.')
  if (parts.length >= 3) {
    response.headers.set('X-Organization-Slug', parts[0])
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
