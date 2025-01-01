import axios from 'axios'; // HTTP 요청을 보내는 라이브러리

export default class FileUtil {
    static FileSelector( multiple : boolean = false, accept : string = "" ) {
        const f = document.createElement( 'input' );
        f.setAttribute( 'type', 'file' );
        f.setAttribute( 'multiple', `${multiple}` );
        f.setAttribute( 'accept', accept );
        //f.addEventListener('change', ( event ) => callback( f ) );
        f.click();
        return f;
    }

    static DownloadFile( fileName : string, data : any ) {
        try {
            const json = JSON.stringify( data );
            const blob = new Blob( [ json ], { type: 'application/json' } );
            const url = URL.createObjectURL( blob );
            const a = document.createElement( 'a' );
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL( url );
        } catch( error ) {
            console.error( error );
        }
    }

    static UploadFile( url : string, file : any, callback : ( response : any ) => void ) {
        fetch( url, {
            method: 'POST',
            body: JSON.stringify( { fileName : 'scene.glb', fileData: file } ),
        } ).then( response => {
            return response.json();
        } ).then( data => {
            callback( data );
        } ).catch( error => {
            console.error( error );
        } );
    }
    
    static FileExtension( path ) {

    }
}
