'use client'

import * as THREE from 'three';
import PalletComponent from '@/app/components/engine';

export default function page() {

    const preload = ( engine ) => {

        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(geometry, material);
        const sphereGeometry = new THREE.SphereGeometry();
        const material1 = new THREE.MeshStandardMaterial( { color: 0xff0000 } );
        const sphere = new THREE.Mesh( sphereGeometry, material1 );
        engine.sceneGraph.add(cube);
        engine.sceneGraph.add(sphere);
        engine.sceneGraph.background = new THREE.Color( 0x0c0c0c );

        engine.gltfLoader.load( './mario_animacion.glb', res => {
            engine.sceneGraph.add( res.scene );
        } )
        
        engine.camera.position.set(0, 1, 5);

        let time = 0;

        engine.addUpdator( (delta) => {
            time += delta;
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;
            sphere.position.set( 4 * Math.cos(time), 0, 4 * Math.sin(time) );
        } );

        engine.createVREnvironment();
    };

    const styleText = {
        width: "100%",
        height: "100%",
        background: "#3c3c3c"
    };

    return (
    <div style={styleText}>
        <div>
            <PalletComponent preload={preload} size={{ width : "100vw", height : "100vh"}} scroll={false}/>
        </div>        
    </div>);
}