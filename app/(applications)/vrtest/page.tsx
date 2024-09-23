'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { VRButton } from 'three/examples/jsm/webxr/VRButton'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'


export default function page() {
    const canvasRef = useRef(null);

    useEffect( () => {

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        const renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true, preserveDrawingBuffer: true, logarithmicDepthBuffer: true, canvas: canvasRef.current } );
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.xr.enabled = true;
        document.body.appendChild(renderer.domElement);
        document.body.appendChild(VRButton.createButton(renderer));
        
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(geometry, material);
        const light = new THREE.DirectionalLight(0xffffff, 10);
        const ambient = new THREE.AmbientLight(0xffffff);
        const sphereGeometry = new THREE.SphereGeometry();
        const material1 = new THREE.MeshStandardMaterial( { color: 0xff0000 } );
        const sphere = new THREE.Mesh( sphereGeometry, material1 );
        scene.add(cube);
        scene.add(light);
        scene.add(ambient);
        scene.add(sphere);
        scene.background = new THREE.Color( 0x0c0c0c );

        const loader = new GLTFLoader();
        loader.load( './mario_animacion.glb', res => {
            scene.add( res.scene );
        } )
        
        camera.position.set(0, 1, 5);
        
        function animate() {
            console.log( camera );
            renderer.setAnimationLoop(function () {
                cube.rotation.x += 0.01;
                cube.rotation.y += 0.01;
                renderer.render(scene, camera);
                const time = Date.now() / 1000 ;
                sphere.position.set( 4 * Math.cos(time), 0, 4 * Math.sin(time) );
            });
        }
        
        animate();
    } )

    return (<div>
        <canvas className='view' ref={canvasRef}></canvas>
    </div>);
}