'use client'

import { useEffect } from 'react';

interface ComponentAttribute {
    mode? : string;
    url? : string;
}

export default function PalletComponent( { url, mode } : ComponentAttribute ) {
    let PalletPromise = null;
    useEffect( () => {
        if ( PalletPromise === null ) {
            PalletPromise = import ( '@/PalletEngine/module' );
            PalletPromise.then( pallet => {
                pallet._engineFactory( { mode : mode }, ( engine ) => {
                    if ( url ) {
                        console.log( url );
                        engine.loadGLTF( url, gltf => {
                            engine.sceneGraph.add( gltf.scene );
                        } );
                    }
                } );
            } );
        }
    } );
    return ( <div id='canvas-container'>
        <canvas className="view"></canvas>
    </div> );
}