import { NextRequest, NextResponse } from 'next/server';
import pool from '../../lib/db';
import bcrypt from 'bcrypt';
import { createSession, updateSession, deleteSession } from '@/app/lib/session';
import { redirect } from 'next/navigation';

// GET 요청 처리
export async function GET( req : NextRequest ) {
    try {
        const result = await pool.query( 'SELECT * FROM Users' );
        return NextResponse.json( result.rows, { status: 200 } );
    } catch (error) {
        return NextResponse.json( { error: error }, { status: 500 } );
    }
}

// POST 요청 처리
export async function POST( req: NextRequest ) {
    try {
        const { email, password } = await req.json();
        const result = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
        
        if ( result?.rows?.length === 0 ) {
            return NextResponse.json( { message: 'Invalid email', email : true }, { status: 401 } );
        }

        const userData = result.rows[0];
        const isValidPassword = bcrypt.compareSync( password, userData.password_hash );
        
        if ( !isValidPassword ) {
            return NextResponse.json({ message: 'Invalid password', password : true }, { status : 401 } );
        }

        await createSession( userData );
        //await deleteSession();

        // login success    
        return NextResponse.json( { message : 'Login successful' }, { status : 201 } );
    } catch (error) {
        console.error( error );
        return NextResponse.json({ message: 'Internal server error', error }, { status: 500 });
    }
}