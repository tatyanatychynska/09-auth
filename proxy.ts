import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { checkSession, setServerCookies } from './lib/api/serverApi'


const privateRoutes = ['/profile','/notes']
const publicRoutes = ['/sign-in', '/sign-up']

export async function proxy(req: NextRequest) {
  const { pathname, origin } = req.nextUrl
  const isPrivate = privateRoutes.some((route) => pathname.startsWith(route))
  const isPublic = publicRoutes.some((route) => pathname.startsWith(route))

  const cookiesStore = await cookies()
  const accessToken = cookiesStore.get('accessToken')?.value
  const refreshToken = cookiesStore.get('refreshToken')?.value

  if (isPrivate) {
    if (!accessToken) {
      if (refreshToken) {
        // check session
        try {
          const authRes = await checkSession()
          const isAuth = await setServerCookies(authRes)
          if (isAuth) {
            return NextResponse.next({ headers: { Cookie: cookiesStore.toString() } })
          } else {
            // redirect to login>>>
            return NextResponse.redirect(new URL('/sign-in', origin))
          }
        } catch {
          // redirect to login>>>
          return NextResponse.redirect(new URL('/sign-in', origin))
        }
      }

      // redirect to login>>>
      return NextResponse.redirect(new URL('/sign-in', origin))
    }
    // 
  }
  if (isPublic) {
    if (accessToken) {
      return NextResponse.redirect(new URL('/profile', origin))
    }
    if (refreshToken) {
      // check session
      try {
        const authRes = await checkSession()
        const isAuth = await setServerCookies(authRes)
        if (isAuth) {
          return NextResponse.redirect(new URL('/profile', origin), {
            headers: { Cookie: cookiesStore.toString() },
          })
        } else {
          return NextResponse.next()
        }
      } catch {
        return NextResponse.next()
      }
    }
  }
  return NextResponse.next()
  //   return NextResponse.redirect()
}

export const config = { matcher: ['/profile/:path*', '/notes/:path*', '/sign-in', '/sign-up'] }