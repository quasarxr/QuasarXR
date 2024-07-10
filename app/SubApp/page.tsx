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
          pallet._module.loadGLTF( './mario_animacion.glb', gltf => {
            gltf.scene.position.set( 0, -2, -5 );
            const mixer = new THREE.AnimationMixer( gltf.scene );
            // ** findout bounding box at load frame
            const action = mixer.clipAction( gltf.animations[0] );
            action.play();

            gltf.scene.traverse( object => {
              if ( object.isMesh ) {
                object.castShadow = true;
                object.receiveShadow = true;
              }
            } );
  
            //gltf.scene.updateWorldMatrix( true, true );
            //const box3 = new THREE.Box3();
            //box3.setFromObject( gltf.scene, true );
            // gltf.scene.traverse( object => {
            //   if ( object.isMesh ) {
            //     for ( let i = 0; i < object.geometry.getAttribute( 'position' ).count; i++ ) {
            //       const p = new THREE.Vector3();
            //       object.getVertexPosition( i, p );
            //       box3.expandByPoint( p );
            //     }
            //   }
            // } );
            // const box3Helper = new THREE.Box3Helper( box3, 0x00ff00 );
            //pallet._module.sceneGraph.add( box3Helper );
            gltf.scene.userData.mixer = mixer;
            gltf.scene.userData.action = action;
            gltf.scene.userData.updator = pallet._module.addUpdator( dt => {
              //box3Helper.box.makeEmpty();
              //box3Helper.box.setFromObject( gltf.scene, true );
              mixer.update( dt );
            }  );            
          } );
          pallet._module.createVREnvironment();
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