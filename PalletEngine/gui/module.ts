import { Pane, FolderApi, ButtonApi, InputBindingApi, TabPageApi, TabApi } from 'tweakpane';
import FileUtil from '../utils/file';
import EventEmitter from '../gui/event';
import fs from 'fs';
import MathUtil from '../utils/math';

type GuiComponent = FolderApi | ButtonApi | InputBindingApi<any> | TabPageApi | TabApi ;
const _GuiIDs = [ 'property-panel', 'oncanvas-menu', 'top-menu', 'footer-menu', 'scene-graph' ];

enum TAB_PAGE_ID { SYSTEM, CREATION, PROPERTY };
enum GUI_DATA_ID { SYSTEM, CREATION, TRANSFORM, MATERIAL, ANIMATION };

interface GUIData { title : string, emit : string, cat : string, binding : object };

const bakeGUIData = ( t, e, c, b = null ) => {
    let data : GUIData = { title: t, emit: e, cat: c, binding: b };
    return data;
}

const _GuiDatas : [ GUIData[] ]= [
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
        { title: 'Position', emit: 'modify-position', cat: 'p3d', binding: { x: 0, y: 0, z: 0 } },
        { title: 'Rotation', emit: 'modify-rotation', cat: 'p3d', binding: { x: 0, y: 0, z: 0 } },
        { title: 'Scale', emit: 'modify-scale', cat: 'p3d', binding: { x: 0, y: 0, z: 0 } }
    ], [ // material
        { title: 'Color', emit: 'mat-color', cat: 'color' },
        { title: 'Diffuse', emit: 'mat-diffuse', cat: 'image' },
        { title: 'Normal', emit: 'mat-normal', cat: 'image' },
        { title: 'Metalic', emit: 'mat-metalic', cat: 'image' },
        { title: 'Roughness', emit: 'mat-roughness', cat: 'image' },
        { title: 'Specular', emit: 'mat-specular', cat: 'image' },
    ], [ // animation
        { title: 'Enable', emit: 'anim-enable', cat: 'checkbox' },
        { title: 'Loop', emit: 'anim-loop', cat: 'checkbox' },
        { title: 'Reset', emit: 'anim-reset', cat: 'checkbox' },
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

    deploySystem( page : TabPageApi ) {
        _GuiDatas[ GUI_DATA_ID.SYSTEM ].forEach( el => {
            const btn = page.addButton( { title: el.title } );
            this.connectAction( btn, el.emit );
        } );
    }

    deployTransform( page : TabPageApi ) {
        const f = page.addFolder( { title: 'Transform' } );
        _GuiDatas[ GUI_DATA_ID.TRANSFORM ].forEach( el => {
            const b = f.addBinding( el, 'binding' );
            b.label = el.title;
        } );
    }

    deplayAnimation( page : TabPageApi ) {

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
        console.log( propNames );
        const findName : string = propNames.find( name => name.toLowerCase().includes( methodName ) );

        console.log( findName );
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