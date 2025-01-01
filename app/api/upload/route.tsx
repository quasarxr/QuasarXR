import { NextResponse } from 'next/server';
import formidable from 'formidable';// form data를 파싱하는 라이브러리
import fs from 'fs';
import path from 'path';

export const config = {
    api: {
        bodyParser: false, // Formidable을 사용하기 때문에 bodyParser를 비활성화
    }
}
export function GET() {
    return NextResponse.json({ message: 'Upload API' });
}

export async function POST( req ) {
    //process.cwd() : 현재 작업 디렉토리를 반환
    try {        
        const { fileName, fileData } = await req.json();
        const storagePath = path.join(process.cwd(), 'storage', 'uploads');
        const filePath = path.join(storagePath, fileName );

        const json = JSON.stringify( fileData );
        const buf = Buffer.from( json, 'utf-8');
        const arr = new Uint8Array( [ ...buf ] );

        if (!fs.existsSync(storagePath)) {
            fs.mkdirSync(storagePath, { recursive: true });
        }
        fs.writeFileSync(filePath, arr, 'base64');
        return NextResponse.json({ message: 'File uploaded successfully', path: storagePath });
    } catch (error) {
        console.error('File upload error:', error);
        return NextResponse.json({ message: 'Upload failed', error }, { status: 500 });
    }
} 