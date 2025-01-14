import { NextResponse } from 'next/server';
import formidable from 'formidable';// form data를 파싱하는 라이브러리
import pool from '../../lib/db';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const config = {
    api: {
        bodyParser: false, // Formidable을 사용하기 때문에 bodyParser를 비활성화
    }
}
export function GET() {
    return NextResponse.json({ message: 'Upload API' });
}

async function requestContent( userId, title, path, type ) {
    return await pool.query( 'INSERT INTO CONTENTS ( user_id, title, path, type ) VALUES ( $1, $2, $3, $4 ) ', [ userId, title, path, type ] );
}

export async function POST( req : Request ) {
    //process.cwd() : 현재 작업 디렉토리를 반환
    try {        
        const { fileName, fileData, userName, userId, } = await req.json();
        const timestamp = Date.now();

        // 사용자 Email 을 해시로 변환
        const userHash = crypto.createHash( 'sha256' ).update( userName ).digest( 'hex' );
        // 계층형 구조로 폴더 경로 생성
        const envPath = process.env.STORAGE_PATH;
        const storagePath = path.join(process.cwd(), envPath, userHash.slice(0, 2), userHash );

        const fileHash = crypto.createHash( 'sha256' ).update( fileName ).digest( 'hex' );
        const filePath = path.join(storagePath, `${timestamp}-${fileHash}` );

        const json = JSON.stringify( fileData );
        const buf = Buffer.from( json, 'utf-8');
        const arr = new Uint8Array( [ ...buf ] );

        // 해당 경로가 없으면 만들어줌.
        if (!fs.existsSync(storagePath)) {
            fs.mkdirSync(storagePath, { recursive: true });
        }
        fs.writeFileSync( filePath, arr, 'base64' );

        fs.access( filePath, fs.constants.F_OK, ( err ) => {
            if ( err ) {
                console.log( 'failed to write file' );
            } else {
                const result = requestContent( userId, 'tempTitle', filePath, 'glb' );
                console.log( result );
            }
        } );
        return NextResponse.json({ message: 'File uploaded successfully', path: storagePath });
    } catch (error) {
        console.error('File upload error:', error);
        return NextResponse.json({ message: 'Upload failed', error }, { status: 500 });
    }
} 