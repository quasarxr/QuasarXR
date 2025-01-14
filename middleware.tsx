
import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware( req : NextRequest ) {
    const token = await getToken( { req, secret: process.env.NEXTAUTH_SECRET } );

    const validCheck = () => {
        return ( Number( token?.exp ) < Date.now() ) && ( token?.user_id );
    }

    const { pathname } = req.nextUrl;

    if ( pathname.startsWith("/_next" ) || // Next.js 내부 정적 파일
        pathname.startsWith("/static/" ) || // 사용자 정의 정적 파일        
        pathname.startsWith("/api") ||
        pathname.endsWith(".ico") || // 파비콘
        pathname.endsWith(".png") || // 이미지 파일
        pathname.endsWith(".css") || // 스타일시트
        pathname.endsWith(".js") // JavaScript 파일
    ) {
        return NextResponse.next();
    }

    const validAuth = validCheck();

    if ( validAuth && req.nextUrl.pathname === '/' ) {
        return NextResponse.redirect( new URL( '/dashboard', req.url ) );
    } else if ( ! validAuth && req.nextUrl.pathname !== '/') {
        return NextResponse.redirect( new URL( '/', req.url ) );
    }

    return NextResponse.next();
}