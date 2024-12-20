'use client'

import LoadingComponent from '../loading/loadingComponent';
import { CSSProperties, useEffect, forwardRef, useRef, useImperativeHandle } from 'react';

export interface PalletComponentRef {
    /** */
}

interface Props {
    mode? : string;
    url? : string;
    onload? : (() => void) | [() => void];
}

const PalletComponent = forwardRef<PalletComponentRef, Props>( ( { url, mode, onload } : Props, ref ) => {
    let PalletPromise = null;
    let engineInstance = useRef( null );
    useImperativeHandle( ref, () => ({
    }));
    const canvasRef = useRef(null);
    const loadingRef = useRef(null);

    const style : CSSProperties = { display: 'inline-block', position: 'relative', width: 'inherit', height: 'inherit' };

    useEffect( () => {
        if ( PalletPromise === null ) {
            console.log( canvasRef.current.clientWidth, canvasRef.current.clientHeight );
            PalletPromise = import ( '@/PalletEngine/module' );
            PalletPromise.then( pallet => {
                pallet._engineFactory( { mode : mode }, ( engine ) => {
                    engineInstance.current = engine;
                    if ( url ) {
                        engine.loadGLTF( url, gltf => {
                            engine.sceneGraph.add( gltf.scene );
                        } );
                    }
                    if ( loadingRef.current ) {
                        loadingRef.current.hide();
                    }
                    //engine.resizeRenderer( { canvas : canvasRef.current } );
                } );
            } );
        }
    } );

    return (
        <div id='canvas-container' style={style}>            
            <LoadingComponent ref={loadingRef} style={{zIndex: 2}}/>
            <canvas className="view" ref={canvasRef} style={style}></canvas>
        </div>
    )
});

PalletComponent.displayName = 'PalletComponent';
export default PalletComponent;