import * as THREE from 'three';
import EventEmitter from '../gui/event';
import { FixedLengthQueue } from '../utils';

export enum RaycastLayer { Default = 0, NoRaycast = 1 };

const _cacheSize = 256;

type AddParam = {
  category : string,
  searchable : boolean, // get to find function
  raycastable : boolean, // attend raycaster intersection
  browsable? : boolean,
  attach? : boolean,
};

type SearchOption = {

};

const _defaultAddParam = { category : 'sceneGraph', searchable : true, raycastable : true, browsable : true };

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
  const dirLight = new THREE.DirectionalLight( 0xffffff, 5 );
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

      this.addObject( this.basicScene, { category : 'sceneGraph', searchable : false, raycastable : false, browsable : false } );
      this.addObject( this.decorators, { category : 'sceneGraph', searchable : false, raycastable : false, browsable : false } );
      this.addObject( this.users, { category : 'sceneGraph', searchable : true, raycastable : true, browsable : true } );
            
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

  addObject( object, option : AddParam = _defaultAddParam ): THREE.Object3D {
    function copyParams( data, target ) {
      target.browsable = option.browsable === undefined ?  data.browsable : option.browsable;
      target.searchable = option.searchable === undefined ? data.searchable : option.searchable;
      target.raycastable = option.raycastable === undefined ? data.raycastable : option.raycastable;
    };
    function addByOption( group, attach ) {
      if ( attach ) {
        group.attach( object );
      } else {
        group.add( object );
      }
    };
    switch( option.category ) {
      case 'user':
        addByOption( this.users, option.attach );
        //this.users.add( object )
        copyParams( this.users.userData, object.userData );
        break;
      case 'deco':
        //this.decorators.add( object );
        addByOption( this.decorators, option.attach );
        copyParams( this.decorators.userData, object.userData );
        break;
      case 'scenegraph':
      default:
        addByOption( this, option.attach );
        //super.add( object );
        copyParams( option, object.userData );
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