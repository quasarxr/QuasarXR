'use client'
import * as THREE from 'three';
import '@/styles/global.css'
import PalletComponent from '@/app/components/engine';

export default function Page() {

  const preload = ( engine ) => {
    engine.loadGLTF( '/daft_punk_in_end_of_line_club.glb', gltf => {
      gltf.scene.position.set( 0, 0.15, 0);
      gltf.scene.scale.set( 0.05, 0.05, 0.05 );
      const mixer = new THREE.AnimationMixer( gltf.scene );
      // ** findout bounding box at load frame
      const action = mixer.clipAction( gltf.animations[0] );
      action.play();

      const bounding = new THREE.Box3();
      gltf.scene.traverse( object => {
        if ( object.isMesh ) {
          object.castShadow = true;
          object.receiveShadow = true;

          console.log( object.geometry.boundingBox );
          if ( bounding.isEmpty ) bounding.copy( object.geometry.boundingBox );
          bounding.containsBox( object.geometry.boundingBox );
        }
      } );

      const boxSize = new THREE.Vector3();
      bounding.getSize( boxSize );

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
      //engine.sceneGraph.add( box3Helper );
      gltf.scene.userData.mixer = mixer;
      gltf.scene.userData.action = action;
      gltf.scene.userData.updator = engine.addUpdator( dt => {
        //box3Helper.box.makeEmpty();
        //box3Helper.box.setFromObject( gltf.scene, true );
        mixer.update( dt );
      }, gltf.scene );
    } );

    engine.loadGLTF( '/speaker.glb', gltf => {
      gltf.scene.position.set( 3, 1, 0 );
      gltf.scene.scale.set( 0.5, 0.5, 0.5 );
      gltf.scene.rotation.set( 1.57, 0, 0 );

      const speaker = gltf.scene.clone();
      speaker.position.set( -3, 1, 0 );

      engine.sceneGraph.add( speaker );

      if ( true ) {
        const audio = new THREE.PositionalAudio( engine.camera.userData.listener );
        const audio1 = new THREE.PositionalAudio( engine.camera.userData.listener );
        gltf.scene.add( audio );
        speaker.add( audio1 );
        engine.loadAudio( '/Around_the_World.mp3', buffer => {
            audio.setBuffer( buffer );
            audio.autoplay = true;
            audio.loop = true;

            audio1.setBuffer( buffer );
            audio1.autoplay = true;
            audio1.loop = true;
            //const helper = new PositionalAudioHelper( audio, 10 );
            //this.sceneGraph.add( helper );    
        } );

        engine.attachRaycastEvent( gltf.scene, { trigger: 'click', handler: () => { 
          if ( ! audio.isPlaying ) {
            audio.play();
            audio1.play();
          }
          else {
            audio.stop();
            audio1.stop();
          }
        }, undefined } );

        engine.attachRaycastEvent( speaker, { trigger: 'click', handler: () => { 
          if ( ! audio.isPlaying ) {
            audio.play();
            audio1.play();
          }
          else {
            audio.stop();
            audio1.stop();
          }
        }, undefined } );
      }
    } );

    // engine.loadFBX( './Rig_Dance05.fbx', fbx => {
    //   console.log( fbx );
    //   if ( fbx.animations && fbx.animations.length ) {
    //     const mixer = new THREE.AnimationMixer( fbx );
    //     const action = mixer.clipAction( fbx.animations[0] );
    //     action.play();

    //     fbx.userData.mixer = mixer;
    //     fbx.userData.action = action;
    //     fbx.userData.updator = engine.addUpdator( dt => {
    //       mixer.update( dt );
    //     }, fbx );
    //   }
    // } );
    engine.createVREnvironment();
  }
  
  const styleText = {
    width: "100%",
    height: "100%",
    background: "#3c3c3c"
  };

  return (
    <div style={styleText}>
      <div>
        <PalletComponent mode={"editor"} preload={preload} size={{ width : "100vw", height: "100vh" }} scroll={false}/>
      </div>
    </div>
    
  );
}