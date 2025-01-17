import { NextRequest, NextResponse } from 'next/server';
import pool from '@/app/lib/db';


async function getUserContents( user_id : string ) {
    // request information to db
    // return userId;
    // const res = await pool.query( 'SELECT * FROM CONTENTS WHERE user_id=$1', [ user_id ] );
    const query = `select users.*, contents.* from users inner join contents on users.user_id = contents.user_id where users.user_id=$1`;
    const res = await pool.query( query, [ user_id ] );
    return res.rows;
}

export async function GET( req : NextRequest, { params } ) {
    
    const { userId } = await params;

    const userContents = await getUserContents( userId );
    //console.log( 'GET request res : ', userContents );

    if ( !userContents ) { 
        return NextResponse.json( { success : false, message : 'User not found' }, { status : 404 } );
    }

    return NextResponse.json( { success : true, data : userContents } , { status : 200 } );
}

export async function POST( req : NextRequest, { params } ) {
    const { userId } = params;
    const body = await req.json();

    // insert new contents to db
    const savedContent = undefined;//await saveUserContent( userId, body );

    return NextResponse.json( { success : true, data : savedContent }, { status : 201 } );
}