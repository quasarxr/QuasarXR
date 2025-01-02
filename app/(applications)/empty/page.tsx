'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import '@/styles/global.css'
import { useSession } from 'next-auth/react';
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
    
    const { data : session } = useSession();

    useEffect( () => {
      if ( PalletPromise === null ) {
        PalletPromise = import( '../../../PalletEngine/module' );
        PalletPromise.then( pallet => {
          pallet._engineFactory( { mode : 'editor' }, ( engine ) => {
            console.log( engine );
          } );
        } );
      }
     
      console.log( session );
    } , [ session ] );

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