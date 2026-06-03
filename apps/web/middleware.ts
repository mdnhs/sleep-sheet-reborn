import { NextRequest, NextResponse } from 'next/server'

// Better Auth default session cookie name
const SESSION_COOKIE = 'better-auth.session_token'

const PROTECTED = ['/dashboard', '/admin']
const AUTH_PATHS = ['/login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSession = !!request.cookies.get(SESSION_COOKIE)

  // Redirect authenticated users away from login
  if (hasSession && AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Protect dashboard and platform admin routes
  if (PROTECTED.some((p) => pathname.startsWith(p)) && !hasSession) {
    const loginUrl = new URL('/login', request.url)
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
