'use client'

import * as THREE from 'three';
import '@/styles/global.css';
import PalletComponent from '@/app/components/engine';
import styles from './styles.module.css';

export default function Page() {

  const assetPath = '/vr_showcase_2017.glb';
  const onload = ( data ) => {
    data.scene.position.set( 0, 0.2, 0 );
  }

  const preload = ( engine ) => {    
    const boxGeometry = new THREE.BoxGeometry(0.1, 2, 5);
    const canvas1 = document.createElement('canvas');
    canvas1.width = 2048;
    canvas1.height = 2048;
    canvas1.getContext('2d').fillStyle = 'white';
    canvas1.getContext('2d').fillRect(0, 0, 2048, 2048);

    const texture1 = new THREE.CanvasTexture( canvas1 );
    const boxMaterial1 = new THREE.MeshStandardMaterial( { color: 0xa1a1a1, map: texture1 } );
    
    const canvas2 = document.createElement('canvas');          
    canvas2.width = 2048;
    canvas2.height = 2048;          
    canvas2.getContext('2d').fillStyle = 'white';
    canvas2.getContext('2d').fillRect(0, 0, 2048, 2048);

    const texture2 = new THREE.CanvasTexture( canvas2 );
    const boxMaterial2 = new THREE.MeshStandardMaterial( { color: 0xa1a1a1, map: texture2 } );

    const canvasMesh1 = new THREE.Mesh( boxGeometry, boxMaterial1 );
    canvasMesh1.position.set( -2, 1.2, -1.2 );

    const canvasMesh2 = new THREE.Mesh( boxGeometry, boxMaterial2 );
    canvasMesh2.position.set( 1.5, 1.2, -1.2 );
    engine.sceneGraph.add( canvasMesh1 );
    engine.sceneGraph.add( canvasMesh2 );

    engine.createVREnvironment( [ canvasMesh1, canvasMesh2 ] );
  }
  
  const styleText = {
    width: "100%",
    height: "100%",
    background: "#3c3c3c"
  };

  return (
    <div style={styleText}>
      <div>
        <PalletComponent url={assetPath} mode={"editor"} size={{ width : "100vw", height: "100vh" }} onload={onload} preload={preload} scroll={false}/>
      </div>    
    </div> );
}