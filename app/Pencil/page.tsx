'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import '@/styles/global.css'
import styles from './styles.module.css';

let PalletPromise = null;

export default function Page() {
  //strict mode
    function forward() {
      window.history.forward();
    }
    function back() {
      window.history.back();
    }

    useEffect( () => {
      if ( PalletPromise === null ) {
        PalletPromise = import( '../../PalletEngine/module' );
        PalletPromise.then( pallet => {
          const engine = pallet._module;
          engine.loadGLTF( './vr_showcase_2017.glb', gltf => {
            gltf.scene.position.set( 0, 0.2, 0 );
          } );

          engine.createVREnvironment();
        } );
      }

    } /*, [] */ );

    const styleText = {
      width: "100%",
      height: "100%",
      background: "#3c3c3c"
    }


    return (
    <div style={styleText}>
      <div>
        <canvas style={styleText} className="view"></canvas>
      </div>
    </div> );
}