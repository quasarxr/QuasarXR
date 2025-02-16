import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { PalletScene } from '../wrapper';

interface UploadParam {
    url? : string,
    session : any,
    file : any,
}

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

    static DownloadFile( fileName : string, data : any, type : string = 'application/json' ) {
        try {
            const json = JSON.stringify( data );
            const blob = new Blob( [ data ], { type: type } );
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

    static UploadFile( data : UploadParam, callback : ( response : any ) => void ) {
        fetch( 'api/upload', {
            method: 'POST',
            body: JSON.stringify( { fileName : 'scene.glb', fileData: data.file, userName : data.session.user.email, userId : data.session.user.user_id } ),
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

    static SaveCustomGLB( engine ) : Promise<any> {
        const addCustomData = ( gltf, customData ) => {
            const glbView = new DataView( gltf );

            // glb header (12 Bytes)
            const magic = glbView.getUint32( 0, true );
            const version = glbView.getUint32(4, true);
            const length = glbView.getUint32(8, true);

            if (magic !== 0x46546C67) {
                throw new Error("Invalid GLB file");
            }

            // insert custom header
            const customText = new TextEncoder().encode( customData );
            const customChunkSize = customText.byteLength;
            const newChunkType = 0x43555354; // "CUST" in ASCII

            const newGLB = new Uint8Array( length + 8 + customChunkSize );
            newGLB.set( new Uint8Array( gltf ), 0 );

            const newView = new DataView( newGLB.buffer );
            newView.setUint32( length, customChunkSize, true );
            newView.setUint32( length + 4, newChunkType, true );
            newGLB.set( customText, length + 8 );

            // 새 크기 할당
            newView.setUint32( 8, newGLB.byteLength, true );
            return newGLB;
        };

        return new Promise( (resolve, reject ) => {
            const exporter = new GLTFExporter();
            const options = { binary : true };
            exporter.parse( engine.sceneGraph, gltf => {
                const newGLB = addCustomData( gltf, "QuasarXR-Custom-File-Data" );
                console.log( gltf, typeof gltf );
                FileUtil.DownloadFile( 'exported.glb', newGLB, "model/gltf-binary" );
                resolve( true );
            }, error => {

            }, options );
        } );
    }

    static LoadCustomGLB( url ) : Promise<any> {
        const readCustomHeader = async ( url ) => {            
            const res = await fetch( url );
            const glbBuffer = await res.arrayBuffer();
            const glbView = new DataView( glbBuffer );

            const token = glbView.getUint32( 0, true );
            const version = glbView.getUint32( 4, true );
            const length = glbView.getUint32( 8, true ); // glb 전체 크기

            console.log( token, version, length );

            let offset = 12; // glb 헤더 이후 데이터 시작
            while (offset < length) {
                const chunkSize = glbView.getUint32(offset, true);
                offset += 4;
                const chunkType = glbView.getUint32(offset, true);
                offset += 4;
        
                if (chunkType === 0x43555354) { // "CUST" Chunk 찾기
                    const customData = new TextDecoder().decode( new Uint8Array( glbBuffer, offset, chunkSize ) );
                    console.log("✅ 커스텀 헤더 데이터:", customData);
                    return customData;
                }
        
                offset += chunkSize; // 다음 Chunk 위치로 이동
            }
            console.log("❌ 커스텀 Chunk를 찾을 수 없습니다.");
            return null;
        }
        const loadChunk = async ( url ) => {
            const header = await readCustomHeader( url );
            return header;
        }

        return new Promise( ( resolve, reject ) => {
            const h = loadChunk( url ).then( header => {
                console.log( header );
            } );

            const loader = new GLTFLoader();
            loader.load( url, gltf => {
                resolve( gltf );
            } );
        } );
    }
}
