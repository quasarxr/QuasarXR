import { NextRequest, NextResponse } from 'next/server';
import pool from '../../lib/db';
import bcrypt from 'bcrypt';
import { createSession, updateSession, deleteSession } from '@/app/lib/session';
import { redirect } from 'next/navigation';

const saltRounds = 10;

// GET 요청 처리
export async function GET() {

}
  
// POST 요청 처리
export async function POST( req: NextRequest ) {
    const { username, email, password } = await req.json();
    return NextResponse.json( { message: 'Signup success', result : ( bcrypt.hash( password, saltRounds ).then( async function( hash ) {
        try {
            const result = await pool.query('INSERT INTO USERS ( username, email, password_hash ) VALUES ( $1, $2, $3 )', [username, email, hash] );

            await createSession( username );

            return NextResponse.json( {messasge: 'Signup success', result }, { status: 201 } );
        } catch( error ) {
            return NextResponse.json( { message: 'Database query failed' }, { status: 401 } );
        }
        
    } ).catch( error => {
        return NextResponse.json( { message: 'Error during password hashing' }, { status: 500 } );
    } ) ) }, { status : 201 } );
}