import * as THREE from 'three';
import EventEmitter from '../gui/event';
import { FixedLengthQueue } from '../utils';

// shadow
import { HorizontalBlurShader } from 'three/examples/jsm/shaders/HorizontalBlurShader';
import { VerticalBlurShader } from 'three/examples/jsm/shaders/VerticalBlurShader';


export enum RaycastLayer { Default = 0, NoRaycast = 1 };

const _cacheSize = 256;

type AddParam = {
  target : string,
  searchable : boolean,
  raycastable : boolean,
};

type SearchOption = {

};

const _defaultAddParam = { target : 'sceneGraph', searchable : true, raycastable : true };

function _createGround( size = 50, segment = 10, division = 50 ) : THREE.Group {
  const groundGroup = new THREE.Group();
  groundGroup.name = 'default ground';
  const gridGeom = new THREE.PlaneGeometry( size, size, segment, segment ).rotateX( Math.PI / 2 );
  const gridMat = new THREE.MeshStandardMaterial( { transparent: true, opacity: 0.2, color: 0x576076, side: THREE.DoubleSide } );
  const gridPlane = new THREE.Mesh( gridGeom, gridMat );
  gridPlane.isGround = true;
  gridPlane.castShadow = false;
  gridPlane.receiveShadow = true;
  groundGroup.add( gridPlane );
  
  const gridHelper = new THREE.GridHelper( size, division, 0x7c7c7c /** center color */, 0x5f5f5f /** grid color */);
  groundGroup.add( gridHelper );

  groundGroup.userData.shortcut = { 'plane' : gridPlane, 'helper' : gridHelper };
  return groundGroup;
}

function _createLight( useShadow : boolean = true ) : THREE.Group {
  const lightGroup = new THREE.Group();
  lightGroup.name = 'default lights';
  const dirLight = new THREE.DirectionalLight( 0xffffff, 5);
  lightGroup.add( dirLight );
  dirLight.position.set( 0, 5, 0 );

  if ( useShadow ) {
    dirLight.castShadow = true;
    dirLight.shadow.camera.right = 25;
    dirLight.shadow.camera.left = - 25;
    dirLight.shadow.camera.top = 25;
    dirLight.shadow.camera.bottom = - 25;
    dirLight.shadow.camera.far = 150;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
  }
  const ambientLight = new THREE.AmbientLight( 0xffffff );
  ambientLight.intensity = 1;
  lightGroup.add( ambientLight );

  lightGroup.userData.shortcut = { 'directionalLight' : dirLight , 'ambientLight' : ambientLight };
  
  return lightGroup;
}

/*
function _createShadowEffect( size = 50 ) : THREE.Group {
  const shadowGroup = new THREE.Group();
  shadowGroup.name = 'ShadowGroup';

  shadowGroup.userData.searchable = false;

  const renderTarget = new THREE.WebGLRenderTarget( 1024, 1024 );
  renderTarget.generateMipmaps = false;
  shadowGroup.userData.renderTarget = renderTarget;

  const renderTargetBlur = new THREE.WebGLRenderTarget( 1024, 1024 );
  renderTargetBlur.generateMipmaps = false;
  shadowGroup.userData.renderTargetBlur = renderTargetBlur;

  const shadowCamera = new THREE.OrthographicCamera( -50 / 2, 50 / 2, 50 / 2, - 50 / 2, 0, 10 );
  shadowCamera.rotation.x = Math.PI / 2;
  shadowGroup.add( this.shadowCamera );
  shadowGroup.userData.shadowCamera = shadowCamera;
  
  const shadowCameraHelper = new THREE.CameraHelper( shadowCamera );
  shadowCameraHelper.visible = false;
  shadowGroup.add( this.shadowCameraHelper );
  shadowGroup.userData.shdaowCameraHelper = shadowCameraHelper;

  const planeGeometry = new THREE.PlaneGeometry( size, size ).rotateX( Math.PI / 2 );
  const planeMaterial = new THREE.MeshBasicMaterial( { map : this.renderTarget.texture , opacity: 1, transparent: true, depthWrite: false } );
  const shadowPlane = new THREE.Mesh( planeGeometry, planeMaterial );
  shadowPlane.scale.y = -1; // reverse y axis
  shadowPlane.renderOrder = -1;
  shadowPlane.layers.set( RaycastLayer.NoRaycast );
  shadowGroup.add( this.shadowPlane );

  return shadowGroup;
}
*/

function _createBasicScene() : THREE.Group {
  const group = new THREE.Group();
  const groundGroup = _createGround();
  group.add( groundGroup );
  const lightGroup = _createLight();
  group.add( lightGroup );
  group.userData.shortcut = {
    'groundPlane' : groundGroup.userData.shortcut.plane,
    'groundHelper' : groundGroup.userData.shortcut.helper,
    'directionalLight' : lightGroup.userData.shortcut.directionalLight,
    'ambientLight' : lightGroup.userData.shortcut.ambientLight,
  }
  return group;
}


function createXRScene() : THREE.Group {

}

export class PalletScene extends THREE.Scene {
  basicScene : THREE.Group; // define basic scene objects
  decorators : THREE.Group; // decorate scene, environment related objects, lights, ground, gizmo, helpers, etc... 
  users : THREE.Group; // user created objects
  deleteQueue : FixedLengthQueue<THREE.Object3D>;
  uuidToObject : Map<string, THREE.Object3D>;
  typeToObject : Map<string, [ THREE.Object3D ]>;
    
  constructor() {
      super();
      this.basicScene = _createBasicScene();

      this.basicScene.name = 'BasicScene';
      this.decorators = new THREE.Group();
      this.decorators.name = 'Decorators';
      this.users = new THREE.Group();
      this.users.name = 'UserGroup';

      this.uuidToObject = new Map();
      this.typeToObject = new Map();
      this.deleteQueue = new FixedLengthQueue<THREE.Object3D>( _cacheSize );

      super.add( this.basicScene );
      super.add( this.decorators );
      super.add( this.users );
            
      //load hdr
      //const hdrUrl = 'studio_small_08_4k.exr';
      //(async () => {
          //const exrLoader = new EXRLoader();
          //exrLoader.load( hdrUrl, ( texture ) => {
              //this.sceneGraph.background = texture;                
              //const pmremGenerator = new THREE.PMREMGenerator( Renderer.Get() );
              //pmremGenerator.compileEquirectangularShader();

              //const renderTarget = pmremGenerator.fromEquirectangular( texture );
    
              //this.sceneGraph.environment = renderTarget.texture;
              //this.sceneGraph.background = renderTarget.texture;
          //} );
      //})();
  }

  addObject( object, opt : AddParam = _defaultAddParam ): THREE.Object3D {
    switch( opt.target ) {
      case 'user':
        this.users.add( object );
        break;
      case 'deco':
        this.decorators.add( object );
        break;
      case 'scenegraph':
      default:
        super.add( object );
        break;
    };
      this.updateMaps( object );
      EventEmitter.emit( 'modified-scenegraph', this );        
      return object;
  }

  addObjects( objects : [ THREE.Object3D ], opt : AddParam = _defaultAddParam ) : [ THREE.Object3D ] {
    objects.forEach( o => this.addObject( o , opt ) );
    return objects;
  }
    
  removeObject( object ): boolean {
    let success = false;
    const sceneObject = this.uuidToObject.get( object.uuid );
    if ( sceneObject ) { // exist in scene
        success = true;
        this.deleteQueue.push( sceneObject );
        sceneObject.removeFromParent();
    }        
    EventEmitter.emit( 'modified-scenegraph', this );
    return success;
  }

  updateMaps( input = undefined ) {
    const allocate = ( o ) => {
      this.uuidToObject.set( o.uuid, o );
        const typeArr = this.typeToObject.get( o.type );
        if ( typeArr ) {
          if ( ! typeArr.includes( o ) ) { // not exist element
            typeArr.push( o );
          }          
        } else {
          this.typeToObject.set( o.type, [ o ] );
        }            
    }
    const target = input || this;
    target.traverse( object => {
      allocate( object );
    } );
  }

  exist( object ): boolean {
      const obj = this.uuidToObject.get( object.uuid );
      return obj !== null && obj !== undefined;
  }

  searchObjects( options : SearchOption ) {

  }

  findObjects( predict : ( object : THREE.Object3D ) => boolean ) :  THREE.Object3D[] {
    const res = [];
    this.traverse( object => {
      if ( predict( object ) ) res.push( object );
    } );
    return res;
  }

  traverse( callback : ( object : THREE.Object3D ) => void ) {
    super.traverse( callback );
  }
  
  dispose() {

  }

  set visibleGround( value ) {
    this.defaultGround.plane.visible = value;
    this.defaultGround.helper.visible = value;
    //this.shadowGroup.visible = value;
  }

  set background( value ) {
    super.background = value;
  }

  set environment( value ) {
    super.environment = value;
  }

  get defaultLights() {
    return { directional : this.basicScene.userData.shortcut.directionalLight, ambient : this.basicScene.userData.shortcut.ambientLight };
  }

  get defaultGround() {
    return { plane: this.basicScene.userData.shortcut.groundPlane, helper: this.basicScene.userData.shortcut.groundHelper };
  }
}



/// backup code

function shaderVariables() {
  // shader
  // shadowGroup : THREE.Group;
  // shaderState : any;
  // renderTarget : THREE.WebGLRenderTarget;
  // renderTargetBlur : THREE.WebGLRenderTarget;
  // shadowCamera : THREE.OrthographicCamera;
  // shadowCameraHelper : THREE.CameraHelper;
  // shadowPlane : THREE.Mesh;
  // shadowBlurPlane : THREE.Mesh;
  // depthMaterial : THREE.MeshDepthMaterial;
  // horizontalBlurMaterial : THREE.ShaderMaterial;
  // verticalBlurMaterial = THREE.ShaderMaterial;
  
  // shadow 
  const shaderState = {
    shadow : {
        blur: 0.2,
        darkness: 5,
        opacity: 1,
    },
    plane: {
        color: '#ffffff',
        opacity: 1,
    },
    showWireframe: false,
  };
}

function createShadow() {
  // this.shadowGroup = new THREE.Group();
  // this.shadowGroup.name = 'ShadowGroup';
  // this.sceneGraph.add( this.shadowGroup );

  // this.renderTarget = new THREE.WebGLRenderTarget( 1024, 1024 );
  // this.renderTarget.generateMipmaps = false;

  // this.renderTargetBlur = new THREE.WebGLRenderTarget( 1024, 1024 );
  // this.renderTargetBlur.generateMipmaps = false;

  // const planeGeometry = new THREE.PlaneGeometry( 50, 50 ).rotateX( Math.PI / 2 );
  // const planeMaterial = new THREE.MeshBasicMaterial( { map : this.renderTarget.texture , opacity: 1, transparent: true, depthWrite: false } );
  // this.shadowPlane = new THREE.Mesh( planeGeometry, planeMaterial );
  // this.shadowPlane.scale.y = -1; // reverse y axis
  // this.shadowPlane.renderOrder = -1;
  // this.shadowPlane.layers.set( RaycastLayer.NoRaycast );
  // this.shadowGroup.add( this.shadowPlane );
  
  // this.shadowBlurPlane = new THREE.Mesh( planeGeometry );
  // this.shadowBlurPlane.visible = false;
  // this.shadowGroup.add( this.shadowBlurPlane );

  // this.shadowCamera = new THREE.OrthographicCamera( -50 / 2, 50 / 2, 50 / 2, - 50 / 2, 0, 10 );
  // this.shadowCamera.rotation.x = Math.PI / 2;
  // this.shadowGroup.add( this.shadowCamera );

  // this.shadowCameraHelper = new THREE.CameraHelper( this.shadowCamera );
  // this.shadowCameraHelper.visible = false;
  // this.shadowGroup.add( this.shadowCameraHelper );

  // this.depthMaterial = new THREE.MeshDepthMaterial();
  // this.depthMaterial.userData.darkness = { value: this.shaderState.shadow.darkness };
  // this.depthMaterial.onBeforeCompile = function( shader ) {
  //     shader.uniforms.darkness = this.depthMaterial.userData.darkness;
  //     shader.fragmentShader = /*glsl*/`
  //         uniform float darkness;
  //         ${shader.fragmentShader.replace('gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );',
  //             'gl_FragColor = vec4( vec3( 0.0 ), ( 1.0 - fragCoordZ ) * darkness );')}
  //     `;
  // }.bind(this);
  // this.depthMaterial.depthTest = false;
  // this.depthMaterial.depthWrite = false;

  // this.horizontalBlurMaterial = new THREE.ShaderMaterial( HorizontalBlurShader );
  // this.horizontalBlurMaterial.depthTest = false;

  // this.verticalBlurMaterial = new THREE.ShaderMaterial( VerticalBlurShader );
  // this.verticalBlurMaterial.depthTest = false;
}

function updateShadow() {
  
      // shadow routine begin

      /** 
      // remove the background
      const initialBackground = this.sceneGraph.background;
      this.sceneGraph.background = null;

      // force the depthMaterial to everything
      this.sceneGraph.userData.gridPlane.visible = false;
      this.sceneGraph.userData.gridHelper.visible = false;
      this.sceneGraph.overrideMaterial = this.depthMaterial;
      let gizmoVisible = false;
      const transformControls = ( this.irc as DesktopIRC ).controls;
      if ( this.irc ) {
          gizmoVisible = transformControls.visible;
          transformControls.visible = false;
      }

      // set renderer clear alpha
      const initialClearAlpha = Renderer.Get().getClearAlpha();
      Renderer.Get().setClearAlpha( 0 );

      // render to the render target to get the depths
      Renderer.Get().setRenderTarget( this.renderTarget );
      Renderer.Get().render( this.sceneGraph, this.shadowCamera );

      // and reset the override material
      this.sceneGraph.overrideMaterial = null;
      this.sceneGraph.userData.gridPlane.visible = true;
      this.sceneGraph.userData.gridHelper.visible = true;
      transformControls.visible = gizmoVisible;

      const blur = 0.2;
      this.blurShadow( this.shaderState.shadow.blur );

      // a second pass to reduce the artifacts
      // (0.4 is the minimum blur amout so that the artifacts are gone)
      this.blurShadow( this.shaderState.shadow.blur * 0.4 );

      // reset and render the normal scene
      Renderer.Get().setRenderTarget( null );
      Renderer.Get().setClearAlpha( initialClearAlpha );
      this.sceneGraph.background = initialBackground;
      */
      // shadow routine end
}


// renderTarget --> blurPlane (horizontalBlur) --> renderTargetBlur --> blurPlane (verticalBlur) --> renderTarget
function blurShadow( amount ) {

  // this.shadowBlurPlane.visible = true;

  // // blur horizontally and draw in the renderTargetBlur
  // this.shadowBlurPlane.material = this.horizontalBlurMaterial;
  // this.shadowBlurPlane.material.uniforms.tDiffuse.value = this.renderTarget.texture;
  // this.horizontalBlurMaterial.uniforms.h.value = amount * 1 / 256;

  // PalletRenderer.Get().setRenderTarget( this.renderTargetBlur );
  // PalletRenderer.Get().render( this.shadowBlurPlane, this.shadowCamera );

  // // blur vertically and draw in the main renderTarget
  // this.shadowBlurPlane.material = this.verticalBlurMaterial;
  // this.shadowBlurPlane.material.uniforms.tDiffuse.value = this.renderTargetBlur.texture;
  // this.verticalBlurMaterial.uniforms.v.value = amount * 1 / 256;

  // PalletRenderer.Get().setRenderTarget( this.renderTarget );
  // PalletRenderer.Get().render( this.shadowBlurPlane, this.shadowCamera );

  // this.shadowBlurPlane.visible = false;

}