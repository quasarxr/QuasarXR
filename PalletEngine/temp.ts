function SaveCustomGLB( engine ) : Promise<any> {
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

function LoadCustomGLB( url ) : Promise<any> {
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


function exportGLTF( object : THREE.Object3D = this.sceneGraph.users ) {
    const tempObject3D = new THREE.Object3D();
    tempObject3D.name = 'exportRoot';
    tempObject3D.add( object );
    const tweenObject = new THREE.Object3D();
    tweenObject.name = 'tweenData';
    tweenObject.userData.tweens = this.tweenMgr.export();
    tempObject3D.add( tweenObject );
    
    const promise = new Promise( ( resolve, reject ) => {                
        const exporter = new GLTFExporter();
        exporter.parse( tempObject3D,  gltf => {
            resolve( gltf );
            //recovery to the scene
            this.sceneGraph.addObject( object,  { category : 'scenegraph', searchable : true, raycastable : true, browsable : true } );
        }, { binary : true, includeCustomExtensions : true } );
    } );

    return promise;
}


function loadGLTF( url : string, onload : Function, isAppData = false ) {
    const extractTweenNodes = ( node : THREE.Group | THREE.Object3D | THREE.Scene ) => {
        let tweenNodes = { 'Root' : null, 'Object3D' : {} };
        node.traverse( ( object ) => {
            if ( object.name === 'tweenData' ) {
                tweenNodes.Root = object;
            }
            if ( object.userData?.tweenUID ) {
                tweenNodes.Object3D[ object.userData.tweenUID ] = object;
            }
        } );

        return tweenNodes;
    };

    this.gltfLoader.load( url , gltf => {
        onload( gltf );

        if ( isAppData ) {
            const root = gltf.scene.children[0]; // exportRoot
            this.tweenMgr.import( extractTweenNodes( gltf.scene ) );

            root.children.forEach( object => {
                if ( object.name.includes( 'system' ) ) {
                    this.sceneGraph.addObjects( object.children, _userAddParam ); // attach object group
                }
            } );
        }
    }, /* onProgress, onError */ );
}
