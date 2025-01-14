import { NextRequest, NextResponse } from 'next/server';


function getUserContents( id : string ) {
    // request information to db
    // return userId;
    return undefined;
}

export async function GET( req : NextRequest, { params } ) {
    const { userId } = params;

    const userContents = await getUserContents( userId );

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