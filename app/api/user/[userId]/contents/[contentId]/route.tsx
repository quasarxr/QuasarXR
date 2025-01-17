import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

import pool from '@/app/lib/db';

async function getContentInformation( user_id, content_id ) {
    const query = 'SELECT * FROM CONTENTS WHERE id=$1';
    const data = await pool.query( query, [ content_id ] );
    return data.rows;
}

async function getBuffer( path ) {
    const buffer = fs.createReadStream( path );
    return buffer;
}

export async function GET( req : NextRequest, { params } ) {
    try {
        const { userId, contentId } = await params;

        const contentInform = await getContentInformation( userId, contentId );
        const filePath = contentInform[0].path;
        if ( !fs.existsSync( filePath) ) {
            return NextResponse.json( { message: 'File not found' }, { status: 404 } );
        }
        const buffer = fs.readFileSync( filePath );
        return new Response( buffer, { 
            headers: {
                'Content-Type': 'model/gltf-binary',
                'Access-Control-Allow-Origin': '*',
                'Content-Disposition': `inline; filename="${path.basename(filePath)}"`
            }
        } );
    
    } catch( err ) {
        console.error('Error fetching file:', err);
        return NextResponse.json({ message: 'Error fetching file', err }, { status: 500 });
    }

}
