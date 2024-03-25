import * as THREE from 'three';
import * as dat from 'dat.gui';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';

let _useWebGPU : Boolean = false;
let _pointer : THREE.Vector2 = new THREE.Vector2();

// replace extension functions
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

enum PowerPreference { HighPerformance = "high-performance", LowPower = "low-power", Default = "default" };

function findParentByType( object , type ) {
    if (object.parent instanceof type ) {
        return object.parent; // 부모 요소가 해당 타입인 경우 반환
    } else if (object.parent !== null) {
        return findParentByType(object.parent, type ); // 타입이 아닌 경우 부모 요소로 재귀 호출
    } else {
        return null; // 최상위 부모 요소에 도달할 때까지 타입을 찾지 못한 경우
    }
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

export class Command {
    command : string;
    parameter : string;
    constructor() {

    }
}

class InteractionController {
    raycaster : THREE.Raycaster;
    constructor( option : Object ) {
        this.raycaster = new THREE.Raycaster();
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

class DesktopIRC extends InteractionController {
    controls : TransformControls;

    constructor() {
        super({});
    }

    drawHelper() {

    }

    connectEvent() {
        document.addEventListener( 'mousedown', event => {
            if ( this.controls.axis ) return
            this.raycaster.setFromCamera( this.getViewportPos( event.clientX, event.clientY ), _module.camera );
            const hits = this.raycaster.intersectObject( _module.sceneGraph, true );
            this.onIntersection( hits );
        } );
    }
    
    onIntersection( hits : Array<any> ) {
        const hitMeshes = hits.filter( h => h.object.isMesh && ! ( findParentByType( h.object, TransformControls ) ) );

        if ( hitMeshes.length > 0 ) {
            this.controls.enabled = true;
            const group = findParentByType( hitMeshes[ 0 ].object, THREE.Group );
            if ( group ) {
                this.controls.attach( group );
            } else {
                this.controls.attach( hitMeshes[0].object );
            }
        } else {                
            this.controls.detach();
            this.controls.enabled = false;
        }
    }

    createControls( camera, canvas ) : TransformControls {
        this.controls = new TransformControls( camera, canvas );
        return this.controls;
    }
}

class VirtualRealityIRC extends InteractionController {
    constructor() {
        super( {} );
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

export class PalletEngine extends PalletElement {
    
    sceneGraph : THREE.Scene;
    camera : THREE.PerspectiveCamera;
    directionalLight : THREE.DirectionalLight;
    ambientLight : THREE.AmbientLight;
    gltfLoader : GLTFLoader;
    clock : THREE.Clock;
    controller : OrbitControls;
    updateFunctions : Array<Function>;
    commandQueue : CommandQueue;
    irc : InteractionController;
            
    constructor( canvas : HTMLCanvasElement ) {
        super();
        this.sceneGraph = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        this.directionalLight = new THREE.DirectionalLight( 0xffffff, 10 );
        this.ambientLight = new THREE.AmbientLight( 0xfff8e8 );
        this.gltfLoader = new GLTFLoader();
        this.clock = new THREE.Clock();
        this.controller = new OrbitControls( this.camera, canvas );
        this.controller.enableDamping = true;
        this.controller.dampingFactor = 0.1;
        this.updateFunctions = new Array<Function>();
        this.commandQueue = new CommandQueue();
        this.irc = new DesktopIRC();
        this.irc.connectEvent();
        const transformer = ( this.irc as DesktopIRC ).createControls( this.camera, canvas );
        this.sceneGraph.add( transformer );
        transformer.addEventListener( 'dragging-changed', event => {
            this.controller.enabled = ! event.value;
        } );

        const renderer = Renderer.Create( { antialias: true, canvas: canvas } as RenderOptions );
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.setClearColor( 0x3c3c3c );
        renderer.setAnimationLoop( () => {
            const dt = this.clock.getDelta();
            this.update( dt );
        } );

        window.addEventListener('resize', (event) => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            renderer.setSize( window.innerWidth, window.innerHeight );
        } )

        this.createScene();
    }

    createScene() {
        const gridHelper : THREE.GridHelper = new THREE.GridHelper( 50, 50, 0x7c7c7c, 0x5f5f5f );
        this.camera.position.set( 0, 0, 5 );
        this.sceneGraph.add( gridHelper );
        this.sceneGraph.add( this.directionalLight );
        this.sceneGraph.add( this.ambientLight );

        //create temporal object

        const cube = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, 1 ), new THREE.MeshStandardMaterial( { color: 0xffdfba } ) );
        this.sceneGraph.add( cube );

        this.updateFunctions.push( ( delta ) => { 
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;
        } )
    }

    createEnvironment() {

    }

    loadGLTF( url : string, onload : Function ) {
        this.gltfLoader.load( url , gltf => {
            onload( gltf );
            this.sceneGraph.add( gltf.scene );
        }, /* onProgress, onError */ );
    }

    update( dt : Number ) {
        this.updateFunctions.map( func => func( dt ) );
        this.commandQueue.update();

        this.controller.update();
        Renderer.Get().render( this.sceneGraph, this.camera );
    }

    addUpdator( func : Function ) {
        this.updateFunctions.push( func );
    }

    appendCommand() {

    }
}

customElements.define( 'pallet-element', PalletElement );
customElements.define( 'pallet-engine', PalletEngine );


let canvasElements : HTMLCollectionOf<HTMLCanvasElement> = document.getElementsByTagName('canvas' );
export let _module : PalletEngine;

if ( canvasElements.length > 0 ) {
    const canvas = canvasElements[ 0 ];
    _module = new PalletEngine( canvas );
}
