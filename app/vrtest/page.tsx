'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { VRButton } from 'three/examples/jsm/webxr/VRButton'


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
        scene.add(cube);
        scene.add(light);
        scene.add(ambient);
        
        camera.position.set(0, 0, 5);
        
        function animate() {
            renderer.setAnimationLoop(function () {
                cube.rotation.x += 0.01;
                cube.rotation.y += 0.01;
                renderer.render(scene, camera);
            });
        }
        
        animate();
    } )

    return (<div>
        <canvas className='view' ref={canvasRef}></canvas>
    </div>);
}