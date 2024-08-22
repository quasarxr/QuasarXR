import { Pane, FolderApi, ButtonApi, InputBindingApi, TabPageApi, TabApi } from 'tweakpane';
import { BindingApi } from '@tweakpane/core';
import FileUtil from '../utils/file';
import EventEmitter from '../gui/event';
import fs from 'fs';
import MathUtil from '../utils/math';

type GuiComponent = FolderApi | ButtonApi | InputBindingApi<any> | TabPageApi | TabApi ;
const _GuiIDs = [ 'property-panel', 'oncanvas-menu', 'top-menu', 'footer-menu', 'scene-graph' ];

interface PanePrimitive { value : number | boolean | string };
interface PaneVector2 { x : number, y : number };
interface PaneVector3 { x : number, y : number, z : number };
interface PaneVector4 { x : number, y : number, z : number, w : number };
interface PaneColor { r: 255, g: 255, b: 255, a: 255 };

type PaneParamType = PanePrimitive | PaneVector2 | PaneVector3 | PaneVector4 | PaneColor;

enum TAB_PAGE_ID { SYSTEM, CREATION, PROPERTY };
enum GUI_DATA_ID { SYSTEM, CREATION, TRANSFORM, MATERIAL, ANIMATION };
enum TRANSFORM_ID { POSITION, ROTATION, SCALE }; // NOTE : TRANSFORM_ID[0] = 'POSITION'

interface GUIData { title : string, emit : string, cat : string, binding : PaneParamType };

const bakeGUIData = ( t : string , e : string , c : string , b = null ) => {
    let data : GUIData = { title: t, emit: e, cat: c, binding: b };
    return data;
}

const _GuiDatas : GUIData[][]= [
    [ // system
        bakeGUIData( 'Import', 'file-import', 'button' ) ,
        bakeGUIData( 'Export', 'file-export', 'button' ) ,
    ],[ // creation
        bakeGUIData( 'Box', 'create-box', 'button' ),
        bakeGUIData( 'Sphere', 'create-sphere', 'button' ),
        bakeGUIData( 'Plane', 'create-plane', 'button' ),
        bakeGUIData( 'Corn', 'create-corn', 'button' ),
        bakeGUIData( 'Cylinder', 'create-cylinder', 'button' ),
        bakeGUIData( 'DirLight', 'create-dirlight', 'button' ),
        bakeGUIData( 'PointLight', 'create-pointlight', 'button' ),
        bakeGUIData( 'SpotLight', 'create-spotlight', 'button' ),
        bakeGUIData( 'HemisphereLight', 'create-hemispherelight', 'button' ),
    ], [ // transform
        bakeGUIData( 'Position', 'modify-position', 'p3d', { x: 0, y: 0, z: 0 } ),
        bakeGUIData( 'Rotation', 'modify-rotation', 'p3d', { x: 0, y: 0, z: 0 } ),
        bakeGUIData( 'Scale', 'modify-scale', 'p3d', { x: 0, y: 0, z: 0 } )
    ], [ // material
        bakeGUIData( 'Color', 'mat-color', 'color', { value: '0xffffff' } ),
        bakeGUIData( 'Diffuse', 'mat-diffuse', 'image' ),
        bakeGUIData( 'Normal', 'mat-normal', 'image' ),
        bakeGUIData( 'Metalic', 'mat-metalic', 'image' ),
        bakeGUIData( 'Roughness', 'mat-roughness', 'image' ),
        bakeGUIData( 'Specular', 'mat-specular', 'image' ),
    ], [ // animation
        bakeGUIData( 'Enable', 'anim-enable', 'checkbox', { value : true } ),
        bakeGUIData( 'Loop', 'anim-loop', 'checkbox', { value: true } ),
        bakeGUIData( 'Reset', 'anim-reset', 'button' ),
    ],
];

interface GuiInterface {
    uid : string;
    pi : GuiComponent; // tweak pane instace
    events : [];
};

interface PaneConfig {
    container : HTMLElement;
    title : string;
    expanded : boolean;
}

//@expanded version of Pane
// offer utilized methods to use engine gui
class PalletPane extends Pane {
    constructor( option : PaneConfig ) {
        super( option );
    }

    reposition( left : number, top : number ) {
        this.rootElement.style.left = `${left}px`;
        this.rootElement.style.top = `${top}px`;
    }

    get rootElement() {
        return this.element.parentElement;
    }
}

export default class PalletGUI {
    paneMap : Map<string, PalletPane>;// [name : string, gui : Pane][];
    guiMap : Map<string, GuiInterface>;
    propUpdator : Function;

    constructor( mode : string ) {
        this.initialize( mode );
    }

    initialize( mode : string ) {
        this.paneMap = new Map<string, PalletPane> ();
        this.guiMap = new Map<string, GuiInterface> ();
        _GuiIDs.forEach( name => {
            this.createPane( name ).hidden = true;
        } );

        this.configData();
    }

    createPane( id : string, container : HTMLElement = null ) : PalletPane {
        this.paneMap.set( id, new PalletPane( { container: container } as PaneConfig ) );
        return this.paneMap.get( id );
    }

    createCustomElement() {
        return document.createElement('div');
    }

    update( delta ) {
        if( this.propUpdator ) {
            this.propUpdator( delta );
        }
    }

    dispose() {
        this.paneMap.forEach( ( value : Pane, key : string ) => {
            value.dispose();
        } );
    }

    getPane( id : string ) {
        return this.paneMap.get( id );
    }

    getGUI( uid : string ) {
        return this.guiMap.get( uid );
    }

    configData() {        
        const inst = this.paneMap.get('property-panel');
        inst.hidden = false;
        const tab = inst.addTab( {
            pages: [
                { title: 'System' },
                { title: 'Object' },
                { title: 'Property' },
            ]
        } );

        this.guiMap.set( 'property-tab', { uid : 'property-tab', pi : tab, events: [] } );
        
        this.deploySystem( tab.pages[ TAB_PAGE_ID.SYSTEM ] );
        this.deployCreation( tab.pages[ TAB_PAGE_ID.CREATION ] );
        this.deployTransform( tab.pages[ TAB_PAGE_ID.PROPERTY ] );
        this.deployMaterial( tab.pages[ TAB_PAGE_ID.PROPERTY ] );
        this.deplayAnimation( tab.pages[ TAB_PAGE_ID.PROPERTY ] );

    }

    connectAction( btn : ButtonApi, emitName : string ) {
        const actionName = emitName.replace('-', '' );
        const func = this.searchMethod( actionName );
        btn.on( 'click', () => { 
            if ( func ) func( ( data ) => EventEmitter.emit( emitName, data ) )
        } );
    }

    connectBinding( binding : BindingApi, param : PaneParamType, emitName : string, listenName : string ) {
        binding.on( 'change', (event) => {
            EventEmitter.emit( emitName, event.value );
        } );

        EventEmitter.on( listenName, ( value ) => {
            for( let key in param ) {
                param[key] = value[key];
            }
            binding.refresh();
        } );
    }

    deploySystem( page : TabPageApi ) {
        _GuiDatas[ GUI_DATA_ID.SYSTEM ].forEach( el => {
            const btn = page.addButton( { title: el.title } );
            this.connectAction( btn, el.emit );
        } );
    }

    deployTransform( page : TabPageApi ) {
        const f = page.addFolder( { title: 'Transform' } );
        _GuiDatas[ GUI_DATA_ID.TRANSFORM ].forEach( ( el, index, arr ) => {
            const bind = f.addBinding( el, 'binding' );
            bind.label = el.title;
            const target = _GuiDatas[ GUI_DATA_ID.TRANSFORM ][ index ].binding;
            console.log( el.emit );
            this.connectBinding( bind, target, el.emit, el.emit+'-listen' );
        } );

    }

    deplayAnimation( page : TabPageApi ) {
        const f = page.addFolder( { title: 'Animation Control' } );
        _GuiDatas[ GUI_DATA_ID.ANIMATION ].forEach( ( el, index, arr ) => {
            if ( el.cat === 'button' ) {
                const btn = f.addButton( { title: el.title } );
                this.connectAction( btn, el.emit );
            } else {
                const bind = f.addBinding( el.binding as PanePrimitive, 'value' );
                bind.label = el.title;
                this.connectBinding( bind, el.binding, el.emit, el.emit+'-listen' );
            }
        } );
    }

    deployMaterial( page : TabPageApi ) {

    }
    
    deployCreation( page : TabPageApi ) {        
        _GuiDatas[ GUI_DATA_ID.CREATION ].forEach( el => {
            const btn = page.addButton( { title: el.title } );
        } );
    }

    actionFileImport( cb : Function ) {
        const fs = FileUtil.FileSelector();
        fs.addEventListener( 'change', () => {
            const url = URL.createObjectURL( fs.files[0] );
            if ( cb ) cb( url );
        } )
    }

    actionFileExport( cb : Function ) {
        // something ...
        if ( cb ) cb();
    }

    searchMethod( methodName ) {
        let propNames : string[] = Object.getOwnPropertyNames( PalletGUI.prototype );
        const findName : string = propNames.find( name => name.toLowerCase().includes( methodName ) );
        //let func = undefined;
        // for( const propName of  Object.getOwnPropertyNames(PalletGUI.prototype) ) {
        //     if ( typeof this[propName] === 'function' && propName.toLowerCase().includes( methodName ) ) {
        //         func = this[propName];
        //         break;
        //     }
        // }
        return this[ findName ];
    }

}