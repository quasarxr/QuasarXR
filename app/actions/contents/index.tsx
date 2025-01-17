import fs from 'fs';

export async function contentList( user_id ) {
    try {
        const response = await fetch(`/api/user/${user_id}/contents`);
        const data = await response.json();
        console.log( 'func contentList : ', data);
        return data;
    } catch( err ) {
        console.error( 'Failed request contents ',  err );
    }
}

export async function fileBuffer( user_id, content_id ) {
    try {
        const response = await fetch(`/api/user/${user_id}/contents/${content_id}`);
        if ( !response.ok ) throw new Error( 'Failed to fetch the GLB file.' );
        const arrayBuffer = await response.arrayBuffer();
        const blob = new Blob( [arrayBuffer] , {type: 'model/gltf-binary'} );
        console.log( blob );
        return blob;
    } catch ( err ) {
        console.error( 'Failed request file url ', err );
    }
}