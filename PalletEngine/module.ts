import * as THREE from 'three';
import GUI from 'lil-gui';
import { Controller } from 'lil-gui';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls, TransformControlsGizmo } from 'three/examples/jsm/controls/TransformControls';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import { SelectionBox } from 'three/examples/jsm/interactive/SelectionBox';
import { SelectionHelper } from 'three/examples/jsm/interactive/SelectionHelper';
import { ImageUtils } from 'three/src/extras/ImageUtils';

// effect
//import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
//import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
//import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';

// shadow
import { HorizontalBlurShader } from 'three/examples/jsm/shaders/HorizontalBlurShader';
import { VerticalBlurShader } from 'three/examples/jsm/shaders/VerticalBlurShader';

// vr 
import { VRButton } from 'three/examples/jsm/webxr/VRButton';

// monaco-editor
import * as monaco from 'monaco-editor';
import Editor, { loader } from '@monaco-editor/react';
// import { UUID } from 'crypto';

// audio
//import { PositionalAudioHelper } from 'three/examples/jsm/helpers/PositionalAudioHelper';

// hdr
//import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader';

// vr pointer models
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory';
import { OculusHandModel } from 'three/examples/jsm/webxr/OculusHandModel';
import { OculusHandPointerModel } from 'three/examples/jsm/webxr/OculusHandPointerModel';

// import { World, System, Component, TagComponent, Types } from 'three/examples/jsm/libs/ecsy.module';

let _useWebGPU : Boolean = false;
let _pointer : THREE.Vector2 = new THREE.Vector2();
let _defaultCube : THREE.Mesh;
let _version = { major: 0, minor: 1, patch: 0, get : () => `Pallet v.${_version.major}.${_version.minor}.${_version.patch}` };
let _product = { name : 'Pallet' };
let _xr_initialized = false;

// replace extension functions
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

enum PowerPreference { HighPerformance = "high-performance", LowPower = "low-power", Default = "default" };
enum MouseEvent { Left = 0, Wheel = 1, Right = 2 };
enum RaycastLayer { Default = 0, NoRaycast = 1 };
 
function findParentByType( object , type ) {
    if (object.parent instanceof type ) {
        return object.parent; // 부모 요소가 해당 타입인 경우 반환
    } else if (object.parent !== null) {
        return findParentByType(object.parent, type ); // 타입이 아닌 경우 부모 요소로 재귀 호출
    } else {
        return null; // 최상위 부모 요소에 도달할 때까지 타입을 찾지 못한 경우
    }
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, function(c) {
        const r = Math.random() * 16 | 0,
              v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    } );
}

export type RenderOptions = {
    canvas : HTMLCanvasElement,
    context : RenderingContext,
    alpha : boolean,
    precision : string,
    premultipliedAlpha : boolean,
    antialias : boolean,
    logarithmicDepthBuffer : boolean,
    depth : boolean,
    stencil : boolean,
    preserveDrawingBuffer : boolean,
    powerPreference : PowerPreference
}

export type Updator = {
    //uuid : string,
    func : (dt : number) => void,
    enabled : boolean,
    archetype : string
}

export type RaycastEvent = {
    trigger : string,
    handler : () => void,
    uuid : string,
}

export class Command {
    command : string;
    parameter : string;
    constructor() {

    }
}

class InteractionController {
    parent : PalletElement;
    raycaster : THREE.Raycaster;
    
    constructor( option : Object ) {
        this.raycaster = new THREE.Raycaster();
        this.raycaster.layers.disable( RaycastLayer.NoRaycast );
        this.raycaster.params.Line.threshold = 0;
    }    
    drawHelper() {}
    connectEvent() {}
    getViewportPos( x : number, y : number, target : THREE.Vector2 = undefined ) : THREE.Vector2 {
        _pointer.x = ( x / window.innerWidth ) * 2 - 1;
        _pointer.y = - ( y / window.innerHeight ) * 2 + 1;
        if ( target ) target.copy( _pointer );
        return _pointer;
    }
}

// TODO : THREE.OrbitControls combine in this class or customize it.
// the box selection has bug from key, mouse event when window focus changed
class DesktopIRC extends InteractionController {
    controls : TransformControls;
    context : THREE.Object3D;
    contextGUI : HTMLElement;
    hitPoint : THREE.Vector3;
    selectionBox : SelectionBox;
    selectionHelper : SelectionHelper;
    keyStatus : {};
    shiftPressed : boolean;
    cursorStart : THREE.Vector2;
    cursorEnd : THREE.Vector2;
    materialFolder : GUI;
    textureButton : Controller;
    targetMaterial : THREE.Material;
    isDrawing : boolean;

    constructor() {
        super({});
        this.hitPoint = new THREE.Vector3();
        this.selectionBox = new SelectionBox();
        this.selectionHelper = new SelectionHelper( Renderer.Get(), 'selectBox' );
        this.selectionHelper.element.classList.add('disabled');
        this.shiftPressed = false;
        this.materialFolder = undefined;
        this.textureButton = undefined;
        this.targetMaterial = null;
        
        this.cursorStart = new THREE.Vector2();
        this.cursorEnd = new THREE.Vector2();

        this.isDrawing = false;
    }

    drawGhost() {

    }

    connectEvent() {
        const findCanvasTexture = () => {
            const canvasTexObjs = [];
            _module.sceneGraph.traverse( object => {
                if ( object.isMesh ) {
                    if ( object.material ) {
                        if ( object.material.map ) {
                            if ( object.material.map.isCanvasTexture ) {
                                canvasTexObjs.push( object );
                            }
                        }
                    }
                }
            } );
            return canvasTexObjs;
        }

        const uvPosition = new THREE.Vector2();

        document.addEventListener( 'mousedown', event => {
            this.isDrawing = true;            
            this.cursorStart.set( event.clientX, event.clientY );
            if ( this.shiftPressed ) {
                _module.controller.enabled = false;
                this.selectionHelper.enabled = true;
                this.selectionHelper.element.classList.remove('disabled');

                this.selectionBox.startPoint.set(
                    ( event.clientX / window.innerWidth ) * 2 - 1,
                    - ( event.clientY / window.innerHeight ) * 2 + 1,
                    0.5
                );
            } else {
                this.selectionHelper.enabled = false;
            }
            
            const canvasTextureMeshes = findCanvasTexture();
            if ( canvasTextureMeshes.length > 0 ) {
                this.raycaster.setFromCamera( this.getViewportPos( event.clientX, event.clientY ) , _module.camera );
                const hits = this.raycaster.intersectObjects( [ ...canvasTextureMeshes ] );
                if ( hits.length > 0 ) {                    
                    const uv = hits[0].uv;
                    const x = uv.x * hits[0].object.material.map.image.width;
                    const y = (1 - uv.y) * hits[0].object.material.map.image.height;
                    uvPosition.set( x, y );
                }
            }
        } );

        // dragging handler
        document.addEventListener( 'mousemove', event => {
            if ( this.shiftPressed ) {
                this.selectionBox.endPoint.set(
                    ( event.clientX / window.innerWidth ) * 2 - 1,
                    - ( event.clientY / window.innerHeight ) * 2 + 1,
                    0.5
                );
            }

            const drawOnTexture = ( intersection, texture ) => {
                const uv = intersection.uv;
                const x = uv.x * texture.image.width;
                const y = (1 - uv.y) * texture.image.height;

                const ctx = texture.source.data.getContext('2d');
                ctx.moveTo( uvPosition.x, uvPosition.y );
                ctx.strokeStyle = 'black';
                ctx.lineTo( x, y );
                ctx.stroke();
                uvPosition.set( x, y );
                texture.needsUpdate = true;
            };

            if ( this.isDrawing ) {
                const canvasTextureMeshes = findCanvasTexture();
                this.raycaster.setFromCamera( this.getViewportPos( event.clientX, event.clientY ) , _module.camera );
                if ( canvasTextureMeshes.length > 0 ) {
                    const hits = this.raycaster.intersectObjects( [ ...canvasTextureMeshes ] );
                    if ( hits.length > 0 ) {
                        drawOnTexture( hits[0], hits[0].object.material.map );
                    }
                }
            }
        } );

        // button release handler
        document.addEventListener( 'mouseup', event => {
            this.cursorEnd.set( event.clientX, event.clientY );
            const isCanvasEvent = event.target === Renderer.Canvas();
            const isDragging = this.cursorStart.distanceTo( this.cursorEnd ) > 0.01;
            const eventStates = { drag: isDragging, canvasEvent: isCanvasEvent };
            _module.controller.enabled = true;
            this.selectionHelper.element.classList.add('disabled');
            this.disableContextGUI();

            if ( this.shiftPressed ) {
                this.selectionBox.endPoint.set(
                    ( event.clientX / window.innerWidth ) * 2 - 1,
                    - ( event.clientY / window.innerHeight ) * 2 + 1,
                    0.5
                );
                this.selectionBox.select();
                const filteredSelection = this.selectionBox.collection.filter( object => {
                    const isGizmo = findParentByType( object, TransformControlsGizmo );
                    const isGizmoPlane = object.isTransformControlsPlane;
                    const isGround = object.isGround;
                    const isLine = object.isLine || object.isLineSegment;
                    if ( isGizmo || isGround || isLine || isGizmoPlane ) return false
                    else return true;
                } )
                console.log( filteredSelection );
            } else {
                switch( event.button ) {
                    case MouseEvent.Left:
                        this.onLeftClick( this.cursorEnd, eventStates );
                        break;
                    case MouseEvent.Right:
                        this.onRightClick( this.cursorEnd, eventStates );
                        break;
                    case MouseEvent.Wheel:
                        this.onWheelClick( this.cursorEnd, eventStates );
                        break;
                }
            }

            this.isDrawing = false;
        } );

        document.addEventListener( 'keydown', event => {
            switch( event.code ) {
                case 'ControlLeft':
                    break;
                case 'AltLeft':
                    break;
                case 'Tab':
                    break;
                case 'ShiftLeft':
                    this.shiftPressed = true;
                    break;
                case 'KeyQ':
                    console.log( this.controls.space );
                    this.controls.setSpace( this.controls.space === 'local' ? 'world' : 'local' );
                    break;
                case 'KeyW':
                    this.controls.setMode( 'translate' );
                    break;
                case 'KeyE':
                    this.controls.setMode( 'rotate' );
                    break;
                case 'KeyR':
                    this.controls.setMode( 'scale' );
            }
        } );

        document.addEventListener( 'keyup', event => {
            switch( event.code ) {
                case 'ControlLeft':
                    break;
                case 'AltLeft':
                    break;
                case 'Tab':
                    break;
                case 'ShiftLeft':
                    this.shiftPressed = false;
                    break;
            }
        } );
    }

    disconnectEvent( option : Object ) {

    }

    onLeftClick( pointer : THREE.Vector2, state ) {
        if ( this.controls.axis || state.drag || ! state.canvasEvent ) return
        this.raycaster.setFromCamera( this.getViewportPos( pointer.x, pointer.y ) , _module.camera );
        const hits = this.raycaster.intersectObject( _module.sceneGraph );
        this.onIntersection( hits );
    }

    onRightClick( pointer : THREE.Vector2, state ) {
        this.raycaster.setFromCamera( this.getViewportPos( pointer.x, pointer.y ), _module.camera );
        const hits = this.raycaster.intersectObject( _module.sceneGraph );
        console.log( state );
        if ( state.drag == false )
            this.onContext( hits, pointer );
    }

    onWheelClick( pointer : THREE.Vector2, state ) {

    }

    onDragging( pointer : THREE.Vector2 ) {

    }

    onContext( hits : Array<any>, position : THREE.Vector2 ) {
        const hitMeshes = hits.filter( h => h.object.isMesh && ! findParentByType( h.object, TransformControls ) );
        if ( hitMeshes.length > 0 ) { // Some object3D hangs in ray
            //this.controls.enabled = false;
            const group = findParentByType( hitMeshes[ 0 ].object, THREE.Group );
            if ( hitMeshes[0].object.isGround ) {
                this.enableContextGUI( position, 'add' );
            } else if ( hitMeshes[0].object.isHelper ) {
                this.enableContextGUI( position, 'light' );
            } else {
                this.enableContextGUI( position, 'property' );
            }
            if ( group ) {
                this.context = group;
            } else {
                this.context = hitMeshes[ 0 ].object;
            }
            this.hitPoint.copy( hitMeshes[0].point );
        } else { // hangs nothing
            this.context = null;
            this.enableContextGUI( position, 'add' );
            //this.disableContextGUI();
        }
    }
    
    onIntersection( hits : Array<any> ) {        
        this.replaceButtonImage( undefined );
        let eventObject = null;
        const hitMeshes = hits.filter( h => h.object.isMesh && !findParentByType( h.object, TransformControls ) && !h.object.isGround );
        if ( hitMeshes.length > 0 ) { // prevents any action to ground
            this.controls.enabled = true;
            const group = findParentByType( hitMeshes[ 0 ].object, THREE.Group );
            this.targetMaterial = null;
            if ( group ) {
                this.controls.attach( group );
                this.context = group;
                eventObject = group;
            } else if ( hitMeshes[0].object.isHelper ) {
                this.controls.attach( hitMeshes[0].object.light );
                this.context = hitMeshes[0].object.light;
            } else {
                const pickedObject = hitMeshes[0].object;
                eventObject = pickedObject;
                this.controls.attach( pickedObject );
                this.context = hitMeshes[0].object;                
                this.replaceButtonImage( undefined );

                if ( pickedObject.isMesh && pickedObject.material ) {
                    if ( pickedObject.material.map ) {
                        const imageToDataURL = (function(img) {
                            const  imgData = ImageUtils.getDataURL(img);
                            console.log( this );
                            this.replaceButtonImage(imgData);
                          }.bind(this))(pickedObject.material.map.image);
                    }
                }
            }
        } else {                
            this.controls.detach();
            this.controls.enabled = false;
            this.controls.setMode( 'translate' );
            this.context = null;
        }
        
        if ( eventObject ) {
            if ( eventObject.userData.events ) {
                eventObject.userData.events.forEach( event => {
                    if ( event.trigger == 'click' ) {
                       event.handler();
                    }   
                   } );
            }
        }
    }

    createControls( camera, canvas ) : TransformControls {
        this.controls = new TransformControls( camera, canvas );
        return this.controls;
    }

    enableContextGUI( position : THREE.Vector2, mode : string ) {
        this.contextGUI.style.visibility = 'visible';
        if ( position ) {
            this.contextGUI.style.left = `${position.x}px`;
            this.contextGUI.style.top = `${position.y}px`;
        }

        _module.contextGUI.children.forEach( c => {
            if ( c['_title'].toLowerCase() == mode ) {
                c.show();
            } else {
                c.hide();
            }
        } )
    }

    disableContextGUI() {
        this.contextGUI.style.visibility = 'hidden';
    }

    replaceButtonImage( source ) {
        //const buttonOrigin = imageButton.domElement.children[0].children[0];
        //button.style.backgroundColor = '#ff0000';
        //button.style.backgroundImage = `url(/images/temp/apple.jpeg)`;
        if ( this.textureButton && this.textureButton.domElement ) {
            // TODO : GUI 참조 얻어오는 방식을 하드코딩 하지 않게 바꾸기
            const target = 
                this.textureButton.domElement.children[0].children.length > 1 ? this.textureButton.domElement.children[0].children[1] as HTMLElement :
                this.textureButton.domElement.children[0].children[0] as HTMLElement;
            if ( target ) {
                target.style.backgroundImage = `url("${source}")`;
                target.style.backgroundSize = 'cover'; // 'cover','contain','initial','inherit'
                target.style.backgroundRepeat = 'no-repeat';
                target.style.backgroundPosition = 'center';
                target.style.width = '100px';
                target.style.height = '100px';
                target.style.marginLeft = 'auto';
                target.textContent = '';
            }
        }
    }

    replaceTexture( texture ) {
        if ( this.targetMaterial ) {
            this.targetMaterial.map = texture;
            this.targetMaterial.needsUpdate = true;
        } else if ( this.context ) {
            this.context.material.map = texture;
            this.context.material.needsUpdate = true;
        }
    }

    dispose() {

    }

    select( object : THREE.Object3D ) {
        
    }
}

class VirtualRealityIRC extends InteractionController {
    isDrawing : boolean;
    uvPosition : THREE.Vector2;

    constructor() {
        super({});

        this.uvPosition = new THREE.Vector2();
        this.isDrawing = false;
    }
    
    createControls() {        
        const engine = this.parent as PalletEngine;
        const factory = new XRControllerModelFactory();
        const xrManager = Renderer.Get().xr;

        
        const findCanvasTexture = () => {
            const canvasTexObjs = [];
            _module.sceneGraph.traverse( object => {
                if ( object.isMesh ) {
                    if ( object.material ) {
                        if ( object.material.map ) {
                            if ( object.material.map.isCanvasTexture ) {
                                canvasTexObjs.push( object );
                            }
                        }
                    }
                }
            } );
            return canvasTexObjs;
        }

        const xrControls = [ xrManager.getController(0), xrManager.getController(1) ];
        xrControls.forEach( control => {
            engine.camera.add( control );
            const geometry = new THREE.BufferGeometry();
            geometry.setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 5 ) ] );
            control.add( new THREE.Line( geometry ) );
        } );

        const xrGrips = [ xrManager.getControllerGrip(0), xrManager.getControllerGrip(1) ];
        xrGrips.forEach( grip => {
            grip.add( factory.createControllerModel( grip ) );
            engine.camera.add( grip );
        } );

        const xrHands = [ xrManager.getHand(0), xrManager.getHand(1) ];
        xrHands.forEach( (hand, index) => {
            hand.add( new OculusHandModel( hand ) );
            const pointer = new OculusHandPointerModel( hand, xrControls[index] );
            hand.add( pointer );
            engine.camera.add( hand );
        } );

        xrControls[1].addEventListener('selectstart', event => {
            this.isDrawing = true;
            const canvasTextureObjs = findCanvasTexture();
            const intersections = this.getIntersections( xrControls[1], canvasTextureObjs );
            if ( intersections.length > 0 ) {
                const uv = intersections[0].uv;
                const texture = intersections[0].object.material.map;
                const x = uv.x * texture.image.width;
                const y = (1 - uv.y) * texture.image.height;
                this.uvPosition.set( x, y );
            }
        } );
        xrControls[1].addEventListener('selectend', event => { this.isDrawing = false } );
    }

    drawOnTexture( intersection, texture ) {
        const uv = intersection.uv;
        const x = uv.x * texture.image.width;
        const y = (1 - uv.y) * texture.image.height;

        const ctx = texture.source.data.getContext('2d');
        ctx.moveTo( this.uvPosition.x, this.uvPosition.y );
        ctx.strokeStyle = 'black';
        ctx.lineTo( x, y );
        ctx.stroke();
        this.uvPosition.set( x, y );
        texture.needsUpdate = true;
    }

    getIntersections( controller, targets ) {
        const tempMatrix = new THREE.Matrix4();
        tempMatrix.identity().extractRotation(controller.matrixWorld);

        const raycaster = new THREE.Raycaster();
        raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
        raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

        return raycaster.intersectObjects(targets);
    }
}

class CommandQueue { 
    array : Array<Command>;
    
    constructor() {
        this.array = new Array<Command>();
    }

    isEmpty() : Boolean {
        return this.array.length > 0;
    }
    update() {
        if ( this.isEmpty() ) {

        }
    }
}

export class Scene {

    root : THREE.Scene;
    animationObjects : THREE.Group;

    constructor() {
        this.root = new THREE.Scene();
        this.animationObjects = new THREE.Group();
    }

    defaultScene() {

    }
}

export class Renderer {
    static renderer : THREE.WebGLRenderer = null;
    static canvas : HTMLCanvasElement = null;
    static option : RenderOptions = { alpha: true } as RenderOptions;
    static Get() {
        if ( ! Renderer.renderer ) {
            Renderer.Create( {} as RenderOptions );
        }
        return Renderer.renderer;
    }
    
    static Canvas() {
        if ( Renderer.renderer ) { 
            return Renderer.renderer.domElement;
        }
        return null;
    }

    static Create( opt : RenderOptions ) : THREE.WebGLRenderer {
        Renderer.renderer = new THREE.WebGLRenderer( opt );
        return Renderer.renderer;
    }

    static AnimationLoop( func : Function ) {
        
    }
}

class PalletElement extends HTMLElement {    
    constructor() {
        super();
        
    }
}

class Utility {
    constructor() {

    }

    static FileSelector( multiple : boolean = false ) {
        const f = document.createElement( 'input' );
        f.setAttribute( 'type', 'file' );
        f.setAttribute( 'multiple', `${multiple}` );
        //f.setAttribute( 'accept', accept );
        //f.addEventListener('change', ( event ) => callback( f ) );
        f.click();
        return f;
    }
    
    static FileExtension( path ) {

    }
}

export class PalletEngine extends PalletElement {
    
    sceneGraph : THREE.Scene;
    camera : THREE.PerspectiveCamera;
    cameraPivot : THREE.Object3D;
    directionalLight : THREE.DirectionalLight;
    ambientLight : THREE.AmbientLight;
    gltfLoader : GLTFLoader;
    fbxLoader : FBXLoader;
    clock : THREE.Clock;
    controller : OrbitControls;
    updateFunctions : Array<Updator>;
    commandQueue : CommandQueue;
    irc : InteractionController;
    vrc : VirtualRealityIRC;
    screenGUI : GUI;
    contextGUI : GUI;
    contextGUIOuter : HTMLElement;

    // shader
    shadowGroup : THREE.Group;
    shaderState : any;
    renderTarget : THREE.WebGLRenderTarget;
    renderTargetBlur : THREE.WebGLRenderTarget;
    shadowCamera : THREE.OrthographicCamera;
    shadowCameraHelper : THREE.CameraHelper;
    shadowPlane : THREE.Mesh;
    shadowBlurPlane : THREE.Mesh;
    depthMaterial : THREE.MeshDepthMaterial;
    horizontalBlurMaterial : THREE.ShaderMaterial;
    verticalBlurMaterial = THREE.ShaderMaterial;

    // helper
    helperGroup : THREE.Group;

    // monaco-editor
    monacoInstance : monaco.editor.IStandaloneCodeEditor;
    editorElement : HTMLElement;    
    editScriptIndex : number;
    

    // hdr
    hdrUrl : string;
            
    constructor( canvas : HTMLCanvasElement ) {
        super();
        this.sceneGraph = new THREE.Scene();
        this.cameraPivot = new THREE.Object3D();
        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        this.sceneGraph.add( this.camera );
        this.sceneGraph.add( this.cameraPivot );
        this.gltfLoader = new GLTFLoader();
        this.fbxLoader = new FBXLoader();
        this.clock = new THREE.Clock(); // for debugging, optimization
        this.controller = new OrbitControls( this.camera, canvas ); // now use default camera controller
        this.controller.enableDamping = true; // smooth move to camera
        this.controller.dampingFactor = 0.1;
        this.controller.minDistance = 1;
        this.controller.maxDistance = 100;
        this.camera.position.set( -3, 1.6, -2 );
        this.controller.target.set( 0, 1.6, -1 );
        this.controller.update();
        this.updateFunctions = new Array<Updator>(); // 
        this.commandQueue = new CommandQueue(); // for customize events
        
        // create renderer, IRC selectionHelper initialize Issue
        const renderer = Renderer.Create( { antialias: true, canvas: canvas, alpha: true, preserveDrawingBuffer: true, logarithmicDepthBuffer: true } as RenderOptions );
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.setClearColor( 0x3c3c3c );
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.xr.enabled = true;
        renderer.setAnimationLoop( () => {
            const dt = this.clock.getDelta();
            this.update( dt );
        } );

        window.addEventListener('resize', (event) => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            renderer.setSize( window.innerWidth, window.innerHeight );
        } );


        // interaction setting
        this.irc = new DesktopIRC();
        this.irc.parent = this;
        this.irc.connectEvent();

        // user interface
        this.screenGUI = new GUI( { title : 'Properties' } );
        this.screenGUI.close();
        this.contextGUIOuter = document.createElement( 'div' );
        this.contextGUIOuter.addEventListener( 'mouseup', event => event.stopPropagation() ); // prevent pass event to document

        // below interface refactoring to generic
        // cast desktop interaction interface
        const desktopIRC = this.irc as DesktopIRC;

        // link user interface to interaction
        desktopIRC.contextGUI = this.contextGUIOuter;
        document.body.appendChild( this.contextGUIOuter );

        // context menu setting
        this.contextGUI = new GUI( { container : this.contextGUIOuter, title : 'Context' } );

        // create gizmo instance
        const transformer = desktopIRC.createControls( this.camera, canvas );
        this.sceneGraph.add( transformer );
        
        // prevent viewport dragging during gizmo interaction
        transformer.addEventListener( 'dragging-changed', event => {
            this.controller.enabled = ! event.value;
        } );

        // selection box setting
        desktopIRC.selectionBox.camera = this.camera;
        desktopIRC.selectionBox.scene = this.sceneGraph;

        window.addEventListener( 'contextmenu', event => event.preventDefault() );

        // shadow 
        this.shaderState = {
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

        this.shadowGroup = new THREE.Group();
        this.sceneGraph.add( this.shadowGroup );

        this.renderTarget = new THREE.WebGLRenderTarget( 1024, 1024 );
        this.renderTarget.generateMipmaps = false;

        this.renderTargetBlur = new THREE.WebGLRenderTarget( 1024, 1024 );
        this.renderTargetBlur.generateMipmaps = false;

        const planeGeometry = new THREE.PlaneGeometry( 50, 50 ).rotateX( Math.PI / 2 );
        const planeMaterial = new THREE.MeshBasicMaterial( { map : this.renderTarget.texture , opacity: 1, transparent: true, depthWrite: false } );
        this.shadowPlane = new THREE.Mesh( planeGeometry, planeMaterial );
        this.shadowPlane.scale.y = -1; // reverse y axis
        this.shadowPlane.renderOrder = -1;
        this.shadowPlane.layers.set( RaycastLayer.NoRaycast );
        this.shadowGroup.add( this.shadowPlane );
        
        this.shadowBlurPlane = new THREE.Mesh( planeGeometry );
        this.shadowBlurPlane.visible = false;
        this.shadowGroup.add( this.shadowBlurPlane );

        this.shadowCamera = new THREE.OrthographicCamera( -50 / 2, 50 / 2, 50 / 2, - 50 / 2, 0, 10 );
        this.shadowCamera.rotation.x = Math.PI / 2;
        this.shadowGroup.add( this.shadowCamera );

        this.shadowCameraHelper = new THREE.CameraHelper( this.shadowCamera );
        this.shadowCameraHelper.visible = false;
        this.shadowGroup.add( this.shadowCameraHelper );

        this.depthMaterial = new THREE.MeshDepthMaterial();
        this.depthMaterial.userData.darkness = { value: this.shaderState.shadow.darkness };
        this.depthMaterial.onBeforeCompile = function( shader ) {
            shader.uniforms.darkness = this.depthMaterial.userData.darkness;
            shader.fragmentShader = /*glsl*/`
                uniform float darkness;
                ${shader.fragmentShader.replace('gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );',
					'gl_FragColor = vec4( vec3( 0.0 ), ( 1.0 - fragCoordZ ) * darkness );')}
            `;
        }.bind(this);
        this.depthMaterial.depthTest = false;
        this.depthMaterial.depthWrite = false;

        this.horizontalBlurMaterial = new THREE.ShaderMaterial( HorizontalBlurShader );
        this.horizontalBlurMaterial.depthTest = false;

        this.verticalBlurMaterial = new THREE.ShaderMaterial( VerticalBlurShader );
        this.verticalBlurMaterial.depthTest = false;

        this.helperGroup = new THREE.Group();

        this.hdrUrl = 'studio_small_08_4k.exr';

        this.createScene();
        this.createGUI();
    }

    createMonacoEditor() {
        // monaco-editor load
        loader.init().then( ( monaco ) => {
            this.editorElement = document.createElement( 'div' );            
            this.editorElement.style.position = 'absolute';
            this.editorElement.style.left = '50%';
            this.editorElement.style.top = '50%';
            this.editorElement.style.width = '60%';
            this.editorElement.style.height = '350px';
            this.editorElement.style.transform = 'translate(-50%, -50%)';
            this.editorElement.style.border = '1px solid black';
            this.editorElement.style.borderRadius = '10px';
            this.editorElement.style.display = 'flex';
            this.editorElement.style.flexDirection = 'column';
            this.editorElement.style.overflow = 'hidden';

            const handleBar = document.createElement( 'div' );
            handleBar.style.display = 'flex';
            handleBar.style.width = '100%';
            handleBar.style.height = '15px';
            handleBar.style.backgroundColor = 'lightgrey';
            handleBar.style.paddingBottom = '5px';
            handleBar.style.justifyContent = 'end';

            const applyButton = document.createElement( 'div' );
            applyButton.textContent = 'apply';
            applyButton.style.margin = '0px 15px 0px 5px';
            applyButton.style.userSelect = 'none';
            applyButton.addEventListener( 'click', event => {
                this.applyEditorCode();
            } );

            const closeButton = document.createElement( 'div' );
            closeButton.textContent = 'close';
            closeButton.style.margin = '0px 15px 0px 5px';
            closeButton.style.userSelect = 'none';
            closeButton.addEventListener( 'click', event => {
                this.editorElement.style.display = 'none';
            } );

            handleBar.appendChild( applyButton );
            handleBar.appendChild( closeButton );

            const monacoWrapper = document.createElement( 'div' );            
            monacoWrapper.style.flex = '1';

            this.editorElement.appendChild( handleBar );
            this.editorElement.appendChild( monacoWrapper );
            document.body.appendChild( this.editorElement );

            const properties = {
                value: 'function hello() {\n\talert("Hello world!");\n}',
                language: 'javascript',
                theme: 'vs-dark'
            };
            this.monacoInstance = monaco.editor.create( monacoWrapper, properties );
            this.monacoInstance.setValue( "// Hello monaco editor ! " );

            this.hideEditor();
        } );
    }

    createGUI() {
        // main menu
        const system = this.screenGUI.addFolder( "System" );
        const systemProp = { 
            Add: function() {

            },
            Import: function() {
                const f = Utility.FileSelector();
                f.addEventListener( "change", () => {
                    // now only use glb loader
                    const url = URL.createObjectURL( f.files[0] );
                    _module.gltfLoader.load( url, gltf => {
                        _module.sceneGraph.add( gltf.scene );
                    } );
                } );
            }
        };
        system.add( systemProp, "Import" );

        //transform
        const transformFolder = this.screenGUI.addFolder( 'Transform' );
        transformFolder.close();
    
        const positionFolder = transformFolder.addFolder( 'Position' );
        positionFolder.close();
        const posProp = { X: 0, Y: 0, Z: 0, };
        const updatePosition = value => {
            if ( localIRC.context ) {
                localIRC.context.position.set( posProp.X, posProp.Y, posProp.Z );
            }
        }
        positionFolder.add( posProp, 'X' ).listen().onChange( updatePosition );
        positionFolder.add( posProp, 'Y' ).listen().onChange( updatePosition );
        positionFolder.add( posProp, 'Z' ).listen().onChange( updatePosition );

        const eulerFolder = transformFolder.addFolder( 'Rotation' );
        eulerFolder.close();
        const eulerProp = { X: 0, Y: 0, Z: 0, };
        const updateEuler = value => {
            if ( localIRC.context ) {
                localIRC.context.rotation.set( eulerProp.X, eulerProp.Y, eulerProp.Z );
            }
        }
        eulerFolder.add( eulerProp, 'X' ).listen().onChange( updateEuler );
        eulerFolder.add( eulerProp, 'Y' ).listen().onChange( updateEuler );
        eulerFolder.add( eulerProp, 'Z' ).listen().onChange( updateEuler );

        const scaleFolder = transformFolder.addFolder( 'Scale' );
        scaleFolder.close();
        const scaleProp = { X: 1, Y: 1, Z: 1, };
        const updateScale = value => {
            if ( localIRC.context ) {
                localIRC.context.scale.set( scaleProp.X, scaleProp.Y, scaleProp.Z );
            }
        }
        scaleFolder.add( scaleProp, 'X' ).listen().onChange( updateScale );
        scaleFolder.add( scaleProp, 'Y' ).listen().onChange( updateScale );
        scaleFolder.add( scaleProp, 'Z' ).listen().onChange( updateScale );

        // material
        const materialFolder = this.screenGUI.addFolder( "Material" );
        const materialProp = {
            Color: 0xffffff,
            Map: () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.style.display = 'none';
                input.onchange = (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    
                    const reader = new FileReader();
                    reader.onload = event => {
                    const loader = new THREE.TextureLoader();
                    loader.load(event.target.result, texture => {
                        localIRC.replaceTexture( texture );
                        //target.material.map = texture;
                    });
                    localIRC.replaceButtonImage( event.target.result );
                    };
                    reader.readAsDataURL(input.files[0]);
                };
                input.click();

            },
            NormalMap: () => {},
            SpecularMap: () => {},

        };

        const updateColor = value => {
            if ( localIRC.targetMaterial ) {
                localIRC.targetMaterial.color.setHex( value );
            } else if ( localIRC.context && localIRC.context.isMesh && localIRC.context.material.color ) {
                localIRC.context.material.color.setHex( value );
            }
        };

        materialFolder.addColor( materialProp, 'Color' ).listen().onChange( updateColor );
        const textureButton = materialFolder.add( materialProp, 'Map' );
        const localIRC = this.irc as DesktopIRC;
        localIRC.textureButton = textureButton;
        localIRC.replaceButtonImage(undefined);

        const target = localIRC.textureButton.domElement.children[0].children[0] as HTMLElement;
        const div = document.createElement('div');
        div.textContent = 'Map';
        target.parentElement.insertBefore( div, target );

        // mesh information
        const meshFolder = this.screenGUI.addFolder( "Meshes" );

        // etc properties
        const etcFolder = this.screenGUI.addFolder( "Etc" );
        const etcProp = {
            Animation: true,
            Loop: true,
            Reset: () => { localIRC.context.userData.action.time = 0 },
            Updator: true
        };

        const animPause = etcFolder.add( etcProp, "Animation" ).listen().onChange( value => { 
            if ( value ) localIRC.context.userData.action.paused = false;
            else localIRC.context.userData.action.paused = true;
        } );

        const animLoop = etcFolder.add( etcProp, "Loop" ).listen().onChange( value => {
            if ( value ) {
                localIRC.context.userData.action.setLoop( THREE.LoopRepeat, Infinity );
                localIRC.context.userData.action.reset();
            } else
                localIRC.context.userData.action.setLoop( THREE.LoopOnce );
        } );

        const resetButton = etcFolder.add( etcProp, "Reset" );
        const updateController = etcFolder.add( etcProp, "Updator" )
        .listen()
        .onChange( value => { 
            localIRC.context.userData.updators.forEach( updator => updator.enabled = value ); 
        } );

        // Settings

        const settingsProps = {
            dirLight_color : 0xffffff,
            dirLight_intensity : 1,
            target : () => {
                
            },
            dirLight_select : () => {

            },
            ambient_color : 0xffffff,
            ambient_intensity : 1,
            ambient_select : () => {

            }
        };
        const settingsFolder = this.screenGUI.addFolder( 'Settings' );
        const g_dir_light = settingsFolder.addFolder( 'Directional Light' );
        g_dir_light.addColor( settingsProps, 'dirLight_color' ).name('Color').onChange( value => { this.directionalLight.color.set( value ) } ).listen();
        g_dir_light.add( settingsProps, 'dirLight_intensity', 0, 100, 1 ).name('Intensity').onChange( value => this.directionalLight.intensity = value ).listen();
        g_dir_light.add( settingsProps, 'target' );
        g_dir_light.add( settingsProps, 'dirLight_select' );

        const g_ambient_light = settingsFolder.addFolder( "Ambient Light" );
        g_ambient_light.addColor( settingsProps, 'ambient_color' ).name('Color').onChange( value => { this.ambientLight.color.set( value ) } ).listen();
        g_ambient_light.add( settingsProps, 'ambient_intensity', 0, 100, 1 ).name('Intensity').onChange( value => this.ambientLight.intensity = value ).listen();
        g_ambient_light.add( settingsProps, 'ambient_select' );

        const environmentProps = {
            Background: () => {

            },
            SkyBox : () => {
                
            }

        }
        const g_environment = this.screenGUI.addFolder( 'Environment' );

        let prevUUID = "";

        const clearFolder = ( folder ) => {            
            const length = folder.controllers.length;
            const temp = folder.controllers;
            
            folder.children = [];
            folder.controllers = [];

            for( let i = 0; i < length ; ++i ) {
                temp[i].hide();
                temp[i].destroy();
            }
        };



        // ui update function
        this.addUpdator( ( delta ) => {

            //global
            settingsProps.dirLight_color = this.directionalLight.color.getHex();
            settingsProps.dirLight_intensity = this.directionalLight.intensity;
            settingsProps.ambient_color = this.ambientLight.color.getHex();
            settingsProps.ambient_intensity = this.ambientLight.intensity;

            const obj = localIRC.context;

            if ( obj ) {
                posProp.X = obj.position.x;
                posProp.Y = obj.position.y;
                posProp.Z = obj.position.z;

                eulerProp.X = obj.rotation.x;
                eulerProp.Y = obj.rotation.y;
                eulerProp.Z = obj.rotation.z;

                scaleProp.X = obj.scale.x;
                scaleProp.Y = obj.scale.y;
                scaleProp.Z = obj.scale.z;
                
                if ( obj.userData.mixer ) {
                    animPause.enable();
                    animLoop.enable();
                    resetButton.enable();

                    if ( obj.userData.action.paused ) {
                        animLoop.setValue( obj.userData.action.paused === THREE.LoopRepeat );
                    }

                    if ( obj.userData.action.loop === THREE.LoopRepeat )
                        animLoop.setValue( true );
                    else
                        animLoop.setValue( false );
                }
                else{
                    animPause.disable();
                    animLoop.disable();
                    resetButton.disable();
                }

                if ( obj.userData.updators ) {
                    updateController.enable();

                    let flag = false;
                    obj.userData.updators.forEach( updator => { flag = flag || updator.enabled } );

                    updateController.setValue( flag );
                } else {
                    updateController.disable();
                }

                if ( obj.isMesh && obj.material ) {
                    if ( obj.material.color )
                        materialProp.Color = obj.material.color.getHex();
                    else
                        materialProp.Color = 0xffffff;
                }

                // update mesh folder
                if ( obj.uuid === prevUUID ) {
                    // do not update 
                } else {        
                    // update local uuid
                    prevUUID = obj.uuid;
                    const meshProps = {};

                    clearFolder( meshFolder );

                    if ( obj.isGroup ) {
                        obj.traverse( child => {
                            if ( child.isMesh ) {
                                meshProps[child.name] = () => {
                                    if ( child.material.map ) {
                                        const imageToDataURL = (function(img) {
                                            const  imgData = ImageUtils.getDataURL(img);
                                            localIRC.targetMaterial = child.material;
                                            materialProp.Color = child.material.color.getHexString();
                                            localIRC.replaceButtonImage(imgData);
                                          }.bind(this))(child.material.map.image);
                                    }
                                };
                                meshFolder.add( meshProps, `${child.name}`);
                            }
                        } )
                    }

                    clearFolder( editScriptFolder );
                    editScriptFolder.add( propertyParam, "AddScript" ).name( "Add Script" );
                    if ( obj.userData.updators ) {
                        obj.userData.updators.forEach( (updator, index) => {
                            console.log( updator );
                            const scriptParam = { function: () => {
                                console.log( updator.func.archetype );
                                this.showEditor( updator.archetype, index );
                            } };
                            const control = editScriptFolder.add( scriptParam, 'function' ).name(`Script - ${index}`);
                            console.log( control );
                        } );
                    }
                    
                    clearFolder( eventFolder );
                    eventFolder.add( propertyParam, "AddEvent" ).name( "Add Event" );
                    if ( obj.userData.events ) {
                        obj.userData.events.forEach( (event, index) => {} );
                    }
                }
            } else {
                // set default
                posProp.X = 0;
                posProp.Y = 0;
                posProp.Z = 0;

                eulerProp.X = 0;
                eulerProp.Y = 0;
                eulerProp.Z = 0;

                scaleProp.X = 1;
                scaleProp.Y = 1;
                scaleProp.Z = 1;

                materialProp.Color = 0xffffff;
                
                clearFolder( meshFolder );

                animPause.disable();
                animLoop.disable();
                resetButton.disable();
                updateController.disable();

                prevUUID = "";

                clearFolder( editScriptFolder );
            }
        } );

        // context menu
        // assign custom style
        this.contextGUIOuter.style.cssText = 'position: absolute; left: 0px; top: 0px; visibility: hidden;';

        const propertyParam = {
            AddScript: () => {

            },
            AddEvent: () => {

            }
        }
 

        const propertyFolder = this.contextGUI.addFolder( 'Property' );
        const editScriptFolder = propertyFolder.addFolder( 'Scripts' );
        const eventFolder = propertyFolder.addFolder( 'Events' );
        propertyFolder.hide();

        const lightFolder = this.contextGUI.addFolder('Light');
        const lightParam = {
            Color: '#ffffff',
            Intensity: 1,
        };

        lightFolder.addColor( lightParam, 'Color' ).onChange( color => {
            localIRC.context.light.color = new THREE.Color( color );
        } );

        lightFolder.add( lightParam, 'Intensity', 0, 1000, 1 ).onChange( intensity => {
            localIRC.context.light.intensity = intensity;
        } );
        
        const creationParam = {
            Box: () => {
                localIRC.disableContextGUI(); // refactoring
                const geometry = new THREE.BoxGeometry( 1, 1, 1 );
                const material = new THREE.MeshStandardMaterial();
                const box = new THREE.Mesh( geometry, material );
                box.position.copy( localIRC.hitPoint );
                box.castShadow = true;
                box.receiveShadow = true;
                this.sceneGraph.add( box );
            },
            Sphere: () => {
                localIRC.disableContextGUI(); // refactoring
                const geometry = new THREE.SphereGeometry( 0.8, 30, 15 );
                const material = new THREE.MeshStandardMaterial();
                const sphere = new THREE.Mesh( geometry, material );
                sphere.position.copy( localIRC.hitPoint );
                sphere.castShadow = true;
                sphere.receiveShadow = true;
                this.sceneGraph.add( sphere );
            },
            Plane: () => {
                localIRC.disableContextGUI(); // refactoring
                const geometry = new THREE.PlaneGeometry( 1, 1, 1 );
                const material = new THREE.MeshStandardMaterial();
                const plane = new THREE.Mesh( geometry, material );
                plane.position.copy( localIRC.hitPoint );
                this.sceneGraph.add( plane );
            },
            GLB: () => {
                localIRC.disableContextGUI(); // refactoring
            },
            DirectionalLight: () => {
                localIRC.disableContextGUI();
                const light = new THREE.DirectionalLight();
                light.castShadow = true;
                light.shadow.camera.near = 1;
				light.shadow.camera.far = 100;
				light.shadow.camera.right = 15;
				light.shadow.camera.left = - 15;
				light.shadow.camera.top	= 15;
				light.shadow.camera.bottom = - 15;
				light.shadow.mapSize.width = 512;
				light.shadow.mapSize.height = 512;                
                const helper = new THREE.DirectionalLightHelper( light, 1 );
                helper.isHelper = true;
                this.sceneGraph.add( light );
                this.sceneGraph.add( helper );
            },
            PointLight: () => {
                localIRC.disableContextGUI();
                const light = new THREE.PointLight();
                const helper = new THREE.PointLightHelper( light, 1 );
                helper.isHelper = true;
                this.sceneGraph.add( light );
                this.sceneGraph.add( helper );
            },
            SpotLight: () => {
                localIRC.disableContextGUI();
                const light = new THREE.SpotLight( 0xffffff, 3, 0, 0.3, 1, 0 );
                light.position.set( 0, 3, 0 );
                light.castShadow = true;
                const helperParent = new THREE.Object3D();
                const helper = new THREE.Mesh( new THREE.ConeGeometry( 1, 3, 10 ), new THREE.MeshBasicMaterial( { color: 0xffffff, wireframe: true } ) );
                helper.light = light;
                helper.isHelper = true;
                helper.rotation.set( -1.57, 0, 0 );
                helperParent.add( helper );
                this.sceneGraph.add( light );
                light.add( helperParent );
                let updator : Updator = { func : ( dt ) => {
                    helperParent.lookAt( light.target.position );
                }, enabled : true, archetype: '' };
                this.updateFunctions.push( updator );
                light.userData.scripts = [ updator.func ];
            },
            HemisphereLight: () => {
                localIRC.disableContextGUI();
                const light = new THREE.HemisphereLight( 0xffffff, 0x080820, 1 );
                this.sceneGraph.add( light );
            }
        }

        const create = this.contextGUI.addFolder( 'Add' );
        create.add( creationParam, 'Box' );
        create.add( creationParam, 'Sphere' );
        create.add( creationParam, 'Plane' );
        create.add( creationParam, 'GLB' );
        create.add( creationParam, 'DirectionalLight' );
        create.add( creationParam, 'PointLight' );
        create.add( creationParam, 'SpotLight' );
        create.add( creationParam, 'HemisphereLight' );
        
        this.createMonacoEditor();
    }

    createScene() {
        const gridHelper : THREE.GridHelper = new THREE.GridHelper( 50, 50, 0x7c7c7c, 0x5f5f5f );
        const gridPlane : THREE.Mesh = new THREE.Mesh( new THREE.PlaneGeometry( 50, 50, 10, 10 ), new THREE.MeshStandardMaterial( { transparent : true, opacity: 0.2, color: 0x576076 } ) );
        gridPlane.name = 'GridPlane';
        gridPlane.isGround = true;
        gridPlane.castShadow = false;
        gridPlane.receiveShadow = true;
        gridPlane.rotation.set( -1.57, 0, 0 );
        //gridPlane.layers.set( RaycastLayer.NoRaycast );
        this.sceneGraph.add( gridHelper );
        this.sceneGraph.add( gridPlane );
        this.sceneGraph.userData.gridPlane = gridPlane;
        this.sceneGraph.userData.gridHelper = gridHelper;

        this.directionalLight = new THREE.DirectionalLight( 0x94f8ff, 4 );

        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.camera.right = 25;
        this.directionalLight.shadow.camera.left = - 25;
        this.directionalLight.shadow.camera.top = 25;
        this.directionalLight.shadow.camera.bottom = - 25;
        this.directionalLight.shadow.camera.far = 150;
        this.directionalLight.shadow.camera.near = 1;
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.directionalLight.position.set( 0, 125, 0 );

        this.sceneGraph.add( this.directionalLight );
        this.ambientLight = new THREE.AmbientLight( 0x6ebad4 );
        this.ambientLight.intensity = 15;
        this.sceneGraph.add( this.ambientLight );

        this.sceneGraph.add( this.helperGroup );

        const listener = new THREE.AudioListener();
        this.camera.add( listener );
        this.camera.userData.listener = listener;

        // enable all layer
        for ( let key in RaycastLayer ) {
            this.camera.layers.enable( key );
        }


        //load hdr
        (async () => {
            const exrLoader = new EXRLoader();
            exrLoader.load( this.hdrUrl, ( texture ) => {
                //this.sceneGraph.background = texture;                
                const pmremGenerator = new THREE.PMREMGenerator( Renderer.Get() );
                pmremGenerator.compileEquirectangularShader();
    
                const renderTarget = pmremGenerator.fromEquirectangular( texture );
    
                this.sceneGraph.environment = renderTarget.texture;
                //this.sceneGraph.background = renderTarget.texture;
            } );
        })();
    }

    clearScene() {

    }

    createEnvironment() {

    }

    createVREnvironment( interactions = null ) {
        document.body.appendChild( VRButton.createButton( Renderer.Get(), { requiredFeatures: ['hand-tracking'] } ) );

        const engine = this;        
        const xrManager = Renderer.Get().xr;

        this.vrc = new VirtualRealityIRC();
        this.vrc.parent = this;
        this.vrc.createControls();
        xrManager.addEventListener( 'sessionstart', () => {
            this.camera.position.set( 0, 0, 0 );
            this.cameraPivot.position.set( 2.3, 0, -4 );
            this.cameraPivot.add( this.camera );
        } );

        xrManager.addEventListener( 'sessionend', () => {
            this.camera.position.set( 0, 1.6, 0 );
            this.cameraPivot.position.set( 0, 0, 0 );
            this.sceneGraph.add( this.camera );
        } );
        
        if ( interactions ) {
            engine.addUpdator( delta => {
                if ( this.vrc.isDrawing ) {
                    const intersections1 = engine.vrc.getIntersections( xrManager.getController(1), interactions );
            
                    if ( intersections1.length > 0 ) {
                        engine.vrc.drawOnTexture( intersections1[0], intersections1[0].object.material.map );
                    }
                }
            } );
        }
    }

    loadGLTF( url : string, onload : Function ) {
        this.gltfLoader.load( url , gltf => {
            onload( gltf );
            this.sceneGraph.add( gltf.scene );
        }, /* onProgress, onError */ );
    }

    loadFBX( url : string, onload : Function, option : Object = null ) {
        this.fbxLoader.load( url, model => {
            onload( model );
            this.sceneGraph.add( model );
        } )
    }

    loadAudio( url: string, onload : Function ) {
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load( url, onload );
    }

    update( dt : number ) {
        this.updateFunctions.map( updator => { if ( updator.enabled ) updator.func( dt ) } );
        this.commandQueue.update();

        this.controller.update();

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
        Renderer.Get().render( this.sceneGraph, this.camera );
    }

    addUpdator( func : (dt : number) => void, bind: THREE.Object3D = undefined, enabled : boolean = true ) {
        let updator : Updator = { func : func, enabled : enabled, archetype : func.toString() };
        console.log( bind );
        updator.func = updator.func.bind( bind );
        this.updateFunctions.push( updator );
        return updator;
    }

    // renderTarget --> blurPlane (horizontalBlur) --> renderTargetBlur --> blurPlane (verticalBlur) --> renderTarget
    blurShadow( amount ) {

        this.shadowBlurPlane.visible = true;

        // blur horizontally and draw in the renderTargetBlur
        this.shadowBlurPlane.material = this.horizontalBlurMaterial;
        this.shadowBlurPlane.material.uniforms.tDiffuse.value = this.renderTarget.texture;
        this.horizontalBlurMaterial.uniforms.h.value = amount * 1 / 256;

        Renderer.Get().setRenderTarget( this.renderTargetBlur );
        Renderer.Get().render( this.shadowBlurPlane, this.shadowCamera );

        // blur vertically and draw in the main renderTarget
        this.shadowBlurPlane.material = this.verticalBlurMaterial;
        this.shadowBlurPlane.material.uniforms.tDiffuse.value = this.renderTargetBlur.texture;
        this.verticalBlurMaterial.uniforms.v.value = amount * 1 / 256;

        Renderer.Get().setRenderTarget( this.renderTarget );
        Renderer.Get().render( this.shadowBlurPlane, this.shadowCamera );

        this.shadowBlurPlane.visible = false;

    }

    showEditor( snippet : string = null, index : number = -1 ) {
        if ( snippet ) {
            const content = snippet.substring( snippet.indexOf( '{' ) + 1, snippet.lastIndexOf( '}' ) );
            this.monacoInstance.setValue( content );
        }
        this.editScriptIndex = index;
        this.editorElement.style.display = 'flex';
    }

    hideEditor() {
        this.editScriptIndex = -1;
        this.editorElement.style.display = 'none';
    }

    applyEditorCode() {
        const localIRC = this.irc as DesktopIRC;
        const obj = localIRC.context;
        console.log( obj );
        let code = 0;
        let msg = undefined;
        if ( this.editScriptIndex < 0 ) {
            code = -1;
            msg = '[script edit] invalid script index';
        }
        if ( ! obj || ! obj.userData || ! obj.userData.updators ) {
            code = -2;
            msg = '[script edit] invalid object';
        }

        if ( code < 0 ) {
            console.error( msg );
            return code;
        } else {
            const newFunc = new Function('delta', this.monacoInstance.getValue() );
            obj.userData.updators[ this.editScriptIndex ].archetype = newFunc.toString();
            obj.userData.updators[ this.editScriptIndex ].func = newFunc.bind( obj );
            console.log( newFunc );
        }
    }

    attachRaycastEvent( object : THREE.Object3D, data : RaycastEvent ) {
        let event : RaycastEvent = { trigger : data.trigger , handler : data.handler, uuid : data.uuid ? data.uuid : generateUUID() };
        if ( ! object.userData.events ) object.userData.events = []
        object.userData.events.push( event );
        console.log( object.userData.events );
    }
}

customElements.define( 'pallet-element', PalletElement );
customElements.define( 'pallet-engine', PalletEngine );


let canvasElements : HTMLCollectionOf<HTMLCanvasElement> = document.getElementsByTagName('canvas');
export let _module : PalletEngine;

if ( canvasElements.length > 0 ) {
    _module = new PalletEngine( canvasElements[ 0 ] );
}
