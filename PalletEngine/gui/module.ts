import { Pane, FolderApi, ButtonApi, InputBindingApi, TabPageApi, TabApi, BindingParams, BladeApi, ListBladeApi, TextBladeApi } from 'tweakpane';
import { BindingApi } from '@tweakpane/core';
import FileUtil from '../utils/file';
import EventEmitter from '../gui/event';
import MathUtil from '../utils/math';

// plugin
import { PathPickerBundle, PathPickerApi } from './plugins/pathpicker';
import { RenderViewBundle, RenderViewApi } from './plugins/renderview';
import { TweenGraphBundle, TweenGraphApi } from './plugins/graph/tweenGraph';
import { SceneGraphBundle, SceneGraphApi } from './plugins/graph/sceneGraph';
import { AuthenticatorBundle ,AuthenticatorApi } from './plugins/auth';

const isDev = process.env.NODE_ENV === 'development';

type GuiComponent = FolderApi | ButtonApi | InputBindingApi<any> | TabPageApi | TabApi | BladeApi ;
const _GUI_IDs = [ 'property-panel', 'oncanvas-menu', 'top-menu', 'footer-menu', 'scene-graph', 'sub-view' ];

interface PanePrimitive { value : number | boolean | string };
interface PaneVector2 { x : number, y : number };
interface PaneVector3 { x : number, y : number, z : number };
interface PaneVector4 { x : number, y : number, z : number, w : number };
interface PaneColor { r: 255, g: 255, b: 255, a: 255 };

type PaneParamType = PanePrimitive | PaneVector2 | PaneVector3 | PaneVector4 | PaneColor;

enum TAB_PAGE_ID { SYSTEM, CREATION, PROPERTY, TWEEN, EVENT };
enum GUI_DATA_ID { SYSTEM, CREATION, TRANSFORM, MATERIAL, ANIMATION, ENVIRONMENT, DIRLIGHT, AMBIENTLIGHT, FLOOR, TWEEN };
enum TRANSFORM_ID { POSITION, ROTATION, SCALE }; // NOTE : TRANSFORM_ID[0] == 'POSITION'

interface GUIData { title : string, emit : string, cat : string, binding : PaneParamType, option : BindingParams };

const bakeGUIData = ( t : string , e : string , c : string , b = null, opt = null ) => {
    let data : GUIData = { title: t, emit: e, cat: c, binding: b, option: opt };
    return data;
}

const fileSelector2 = ( callback, accept = "" ) => {
    const fs = FileUtil.FileSelector( false , accept );
    fs.addEventListener( 'change', () => {
        if ( callback ) callback( fs.files[0] );
    } );
}

const fileSelector = ( callback, accept = "" ) => {
    fileSelector2( ( file ) => {
        const url = URL.createObjectURL( file );
        if ( callback ) callback( url );
    }, accept );
}

const _GuiContexts : GUIData[] = [
    bakeGUIData( 'Toggle Property', 'context-property', 'button' ),
    bakeGUIData( 'Reset Camera', 'context-camera', 'button' ),
];

const _GuiDatas : GUIData[][]= [
    [ // system
        bakeGUIData( 'Import', 'file-import', 'button' ),
        bakeGUIData( 'Export', 'file-export', 'button' ),
        bakeGUIData( 'Storage', 'system-storage', 'button', null, { disabled: !isDev } ), // only development test
    ],[ // creation
        bakeGUIData( 'Box', 'create-box', 'button' ),
        bakeGUIData( 'Sphere', 'create-sphere', 'button' ),
        bakeGUIData( 'Plane', 'create-plane', 'button' ),
        bakeGUIData( 'Cone', 'create-cone', 'button' ),
        bakeGUIData( 'Cylinder', 'create-cylinder', 'button' ),
        bakeGUIData( 'DirectionalLight', 'create-dirlight', 'button' ),
        bakeGUIData( 'PointLight', 'create-pointlight', 'button' ),
        bakeGUIData( 'SpotLight', 'create-spotlight', 'button' ),
        bakeGUIData( 'HemisphereLight', 'create-hemispherelight', 'button' ),
        bakeGUIData( 'Camera', 'create-camera', 'button' ),
    ], [ // transform
        bakeGUIData( 'Position', 'modify-position', 'p3d', { x: 0, y: 0, z: 0 } ),
        bakeGUIData( 'Rotation', 'modify-rotation', 'p3d', { x: 0, y: 0, z: 0 } ),
        bakeGUIData( 'Scale', 'modify-scale', 'p3d', { x: 0, y: 0, z: 0 } )
    ], [ // material
        bakeGUIData( 'Color', 'mat-color', 'color', { value: 0xffffff }, { view: 'color' } ),
        bakeGUIData( 'Diffuse', 'mat-diffuse', 'image' ),
        bakeGUIData( 'Normal', 'mat-normal', 'image' ),
        bakeGUIData( 'Metalic', 'mat-metalic', 'image' ),
        bakeGUIData( 'Roughness', 'mat-roughness', 'image' ),
        bakeGUIData( 'Specular', 'mat-specular', 'image' ),
    ], [ // animation
        bakeGUIData( 'Enable', 'anim-enable', 'checkbox', { value : true } ),
        bakeGUIData( 'Loop', 'anim-loop', 'checkbox', { value: true } ),
        bakeGUIData( 'Reset', 'anim-reset', 'button' ),
    ], [ // environment
        bakeGUIData( 'Background', 'env-bg', 'file' ),
        bakeGUIData( 'Background\nColor', 'env-bg-color', 'color', { value: 0x3c3c3c }, { view: 'color' } ),
        bakeGUIData( 'HDR', 'env-hdr', 'file' ),
        bakeGUIData( 'EXR', 'env-exr', 'file' ),
        bakeGUIData( 'Exposure', 'env-exposure', 'slider', { value : 1 }, { min: 0, max: 2 } ),
        bakeGUIData( 'Ground', 'env-ground', 'checkbox', { value : true } ),
    ], [ // dir light
        bakeGUIData( 'Intensity', 'env-dirlight-intensity', 'slider', { value : 5 }, { min : 0, max : 20 } ),
        bakeGUIData( 'Color', 'env-dirlight-color', 'color', { value : 0xffffff }, { view: 'color' } ),
        bakeGUIData( 'Direction', 'env-dirlight-edit', 'button' ),
    ], [ // ambient light
        bakeGUIData( 'Intensity', 'env-ambient-intensity', 'slider', { value : 1 }, { min : 0, max : 10 } ),
        bakeGUIData( 'Color', 'env-ambient-color', 'color', { value : 0xffffff }, { view: 'color' } ),
    ], [ // floor
    ], [ // tween
        bakeGUIData( 'Name', 'tween-add-name', 'text', { value: '' } ),
        bakeGUIData( 'Type', 'tween-add-type', 'list', { value : 'position' }, [ 
            { text: 'Position', value: 'position' },
            { text: 'Rotation', value: 'rotation' }, 
            { text: 'Scale', value: 'scale' } ] ),
        bakeGUIData( 'Duration', 'tween-add-duration', 'number', { value: 1 } ),
        bakeGUIData( 'To', 'tween-add-to', 'p3d', { x: 0, y: 0, z: 0} ),
    ]
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
        this.registerPluings();
    }

    registerPluings() {
        this.registerPlugin( PathPickerBundle );
        this.registerPlugin( RenderViewBundle );
        this.registerPlugin( TweenGraphBundle );
        this.registerPlugin( AuthenticatorBundle );
        this.registerPlugin( SceneGraphBundle );
    }

    reposition( left : number, top : number ) {
        this.rootElement.style.left = `${left}px`;
        this.rootElement.style.top = `${top}px`;
    }

    resize( width: number, height : number ) {
        this.rootElement.style.width = `${width}px`;
        this.rootElement.style.height = `${height}px`;
    }

    get rootElement() {
        return this.element.parentElement;
    }

    get position() {
        return this.rootElement.getBoundingClientRect();
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
        _GUI_IDs.forEach( name => {
            this.createPane( name ).hidden = true;
        } );

        this.configData();
        this.configContext();
        this.configSubView();
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

        this.paneMap = null;
    }

    getPane( id : string ) {
        return this.paneMap.get( id );
    }

    getGUI( uid : string ) {
        return this.guiMap.get( uid );
    }

    configContext() {
        const inst = this.paneMap.get('oncanvas-menu');

        _GuiContexts.forEach( el => {
            if ( el.cat === 'button' ) {
                const btn = inst.addButton( { title: el.title } );
                this.connectAction( btn, el.emit, false );
            }
        } )

        this.guiMap.set( 'context', { uid: 'context', pi : inst, events: [] } );

        EventEmitter.on( 'context-property', () => {
            this.toggleProperty();
            this.showContext( false, 0, 0 );
        } );
    }

    configData() {        
        const inst = this.paneMap.get('property-panel');
        inst.hidden = false;
        inst.rootElement.style.width = '300px';
        //inst.rootElement.style.height = '99vh';
        inst.rootElement.style.scrollbarWidth = 'thin';
        inst.rootElement.style.scrollbarColor = '#ccc rgba(95, 95, 95, 0.4)';
        const tab = inst.addTab( {
            pages: [
                { title: 'System' },
                { title: 'Object' },
                { title: 'Property' },
                { title: 'Tween'},
                { title: 'Event'},
            ]
        } );

        // tab.on( 'select', (event) => {
        //     const selectIndex = event.index;
        //     if ( selectIndex === TAB_PAGE_ID.TWEEN ) {
        //         playBtn.hidden = true;
        //     } else {
        //         playBtn.hidden = false;
        //     }
        // } );

        this.guiMap.set( 'property-tab', { uid : 'property-tab', pi : tab, events: [] } );

        
        this.deploySystem( tab.pages[ TAB_PAGE_ID.SYSTEM ] );
        this.deployCreation( tab.pages[ TAB_PAGE_ID.CREATION ] );
        //this.deploySelection( tab.pages[ TAB_PAGE_ID.PROPERTY ] );
        this.deployTransform( tab.pages[ TAB_PAGE_ID.PROPERTY ] );
        this.deployMaterial( tab.pages[ TAB_PAGE_ID.PROPERTY ] );
        this.deplayAnimation( tab.pages[ TAB_PAGE_ID.PROPERTY ] );
        this.deployTween( tab.pages[ TAB_PAGE_ID.TWEEN ] );

    }

    configSubView() {
        const size = { x : 250, y : 150 };
        const inst = this.paneMap.get('sub-view');
        const rect = this.paneMap.get('property-panel').position;
        inst.hidden = false;
        const api = inst.addBlade( {
            view: 'renderview'
        } ) as RenderViewApi;
        api.enabled( false );
        inst.resize( size.x, size.y );
        inst.reposition( rect.x - size.x, rect.y );

        this.guiMap.set('subview', { uid: 'subview', pi: api, events: [] });
    }

    connectAction( btn : ButtonApi, emitName : string, useCallback = true ) {
        const actionName = emitName.replace('-', '' );
        if ( useCallback ) {
            const func = this.searchMethod( actionName );
            if ( func ) func.bind( this );
            btn.on( 'click', () => { 
                if ( func ) func( ( data ) => EventEmitter.emit( emitName, data ) )
            } );
        } else {            
            btn.on( 'click', () => { 
                EventEmitter.emit( emitName, undefined );
            } );
        }
    }
    
    connectImageAction( btn : ButtonApi, emitName : string ) {
        EventEmitter.on( emitName + '-listen', data => {
            const div = btn.element.children[1].children[0].children[0] as HTMLElement;
            if ( data ) div.style.backgroundImage = `url(${data})`;
            div.style.backgroundSize = 'cover'; // 'cover','contain','initial','inherit'
            div.style.backgroundRepeat = 'no-repeat';
            div.style.backgroundPosition = 'center';
            div.style.width = '40px';
            div.style.height = '40px';
            //div.style.marginLeft = 'auto';
            div.textContent = '';
        } );
    }

    connectBinding( binding : BindingApi, param : PaneParamType, emitName : string, listenName : string ) {
        let enableChange = true;
        binding.on( 'change', (event) => {
            if ( enableChange ) {
                EventEmitter.emit( emitName, event.value );
            }            
        } );

        EventEmitter.on( listenName, ( value ) => {
            enableChange = false;
            for( let key in param ) {
                param[key] = value[key];
            }
            binding.refresh();
            enableChange = true;
        } );
    }

    connectBlade( blade : BladeApi, param : PaneParamType, emitName : string, listenName : string ) {
        // type guard
        if ( typeof( blade as any ).on === 'function' ) {
            (blade as any).on( 'change', ( event ) => {
                EventEmitter.emit( emitName, event.value );
            } );

            EventEmitter.on( listenName, ( value ) => {
                if ( 'value' in blade ) {
                    ( blade as any )['value'] = value;
                } else {

                }
            } );
        } else {

        }
    }

    deploySystem( page : TabPageApi ) {

        const authApi = page.addBlade( { view: 'authenticator' } ) as AuthenticatorApi;
        this.guiMap.set( 'authenticator', { uid: 'authenticator', pi: authApi, events: [] } );
        
        const playBtn = page.addButton( { title: 'Play' } );
        this.connectAction( playBtn, 'editor-play', false );

        const pubBtn = page.addButton( { title: 'Publish' } );
        this.connectAction( pubBtn, 'editor-pub', false );

        const vrBtn = page.addButton( { title: 'Enter VR' } );
        this.connectAction( vrBtn, 'editor-vr', false );

        const fileFolder = page.addFolder( { title : 'File' } );
        _GuiDatas[ GUI_DATA_ID.SYSTEM ].forEach( el => {
            if ( el.cat === 'file' ) {
                const picker = fileFolder.addBlade( {
                    label: el.title,
                    view: 'pathpicker'
                } ) as PathPickerApi;

                const actionName = el.emit.replace('-', '' );
                const func = this.searchMethod( actionName );

                const emitFunction = () => {
                    if ( func ) func( ( file ) => {
                        console.log( file );
                        const url = URL.createObjectURL( file );
                        EventEmitter.emit( el.emit, url );
                        picker.setName( file.name );
                    } );
                };

                picker.on( emitFunction );
            } else if ( el.cat === 'button' ) {
                const btn = fileFolder.addButton( { title: el.title } );                
                btn.disabled = el.option?.disabled;
                this.connectAction( btn, el.emit );
            }
        } );

        const envFolder = page.addFolder( { title : 'Environment' } );
        _GuiDatas[ GUI_DATA_ID.ENVIRONMENT ].forEach( el => {
            if ( el.cat === 'button' ) {
                const btn = envFolder.addButton( { title: '', label : el.title } );
                this.connectAction( btn, el.emit );
                this.connectImageAction( btn, el.emit );
                EventEmitter.emit( el.emit + '-listen', undefined );
            } else if ( el.cat === 'file' ) {
                //envFolder.addExplorer();
                const picker = envFolder.addBlade( {
                    label: el.title,
                    view: 'pathpicker'
                } ) as PathPickerApi;

                const actionName = el.emit.replace('-', '' );
                const func = this.searchMethod( actionName );

                const emitFunction = () => {
                    if ( func ) func( ( file ) => {
                        console.log ( file );
                        const url = URL.createObjectURL( file );
                        EventEmitter.emit( el.emit, url );
                        picker.setName( file.name );
                    } );
                };

                picker.on( emitFunction );
            } else if ( el.cat === 'slider' ) {
                const target = el.binding as PanePrimitive;
                const bind = envFolder.addBinding( target, 'value', el.option );
                bind.label = el.title;
                this.connectBinding( bind, target, el.emit, el.emit + '-listen' );
            } else if ( el.cat === 'color' ) {
                const bind = envFolder.addBinding( el.binding as PanePrimitive, 'value', el.option );
                bind.label = el.title;
                this.connectBinding( bind, el.binding, el.emit, el.emit + '-listen' );
            } else if ( el.cat === 'checkbox' ) {
                const bind = envFolder.addBinding( el.binding as PanePrimitive, 'value', el.option );
                bind.label = el.title;
                this.connectBinding( bind, el.binding, el.emit, el.emit + '-listen' );
            }
        } );

        const dirLightFolder = page.addFolder( { title : 'Light' } );
        _GuiDatas[ GUI_DATA_ID.DIRLIGHT ].forEach( el => {
            if ( el.cat === 'slider' ) {
                const target = el.binding as PanePrimitive;
                const bind = dirLightFolder.addBinding( target, 'value', el.option );
                bind.label = el.title;
                this.connectBinding( bind, target, el.emit, el.emit + '-listen' );
            } else if ( el.cat === 'color' ) {
                const bind = dirLightFolder.addBinding( el.binding as PanePrimitive, 'value', el.option );
                bind.label = el.title;
                this.connectBinding( bind, el.binding, el.emit, el.emit + '-listen' );
            } else if ( el.cat === 'button' ) {
                const btn = dirLightFolder.addButton( { title: el.title } );
                this.connectAction( btn, el.emit );
            }
        } );

        const ambientFolder = page.addFolder( { title : 'Ambient' } );
        _GuiDatas[ GUI_DATA_ID.AMBIENTLIGHT ].forEach( el => {
            if ( el.cat === 'slider' ) {
                const target = el.binding as PanePrimitive;
                const bind = ambientFolder.addBinding( target, 'value', el.option );
                bind.label = el.title;
                this.connectBinding( bind, target, el.emit, el.emit + '-listen' );
            } else if ( el.cat === 'color' ) {
                const bind = ambientFolder.addBinding( el.binding as PanePrimitive, 'value', el.option );
                bind.label = el.title;
                this.connectBinding( bind, el.binding, el.emit, el.emit + '-listen' );
            }
        } );
    }

    deployTransform( page : TabPageApi ) {
        const f = page.addFolder( { title: 'Transform' } );
        _GuiDatas[ GUI_DATA_ID.TRANSFORM ].forEach( ( el, index, arr ) => {
            const bind = f.addBinding( el, 'binding' );
            bind.label = el.title;
            const target = _GuiDatas[ GUI_DATA_ID.TRANSFORM ][ index ].binding;
            this.connectBinding( bind, target, el.emit, el.emit+'-listen' );
        } );
        this.guiMap.set( 'transform-folder', { uid : 'transform-folder', pi : f, events: [] } );
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
        this.guiMap.set( 'animation-folder', { uid : 'animation-folder', pi : f, events: [] } );
    }

    deployMaterial( page : TabPageApi ) {
        const f = page.addFolder( { title: 'Material' } );
        _GuiDatas[ GUI_DATA_ID.MATERIAL ].forEach( ( el, index, arr ) => {
            if ( el.cat === 'image' ) {
                const btn = f.addButton( { title: '', label : el.title } );
                this.connectAction( btn, el.emit );
                this.connectImageAction( btn, el.emit );
                EventEmitter.emit( el.emit + '-listen', undefined );
            } else if ( el.cat === 'color' ) {
                const bind = f.addBinding( el.binding as PanePrimitive, 'value', el.option );
                bind.label = el.title;
                this.connectBinding( bind, el.binding, el.emit, el.emit + '-listen' );
            } else {
                const bind = f.addBinding( el.binding as PanePrimitive, 'value' );
                bind.label = el.title;
                this.connectBinding( bind, el.binding, el.emit, el.emit + '-listen' );
            }
        } );
        this.guiMap.set( 'material-folder', { uid : 'material-folder', pi : f, events: [] } );
    }

    deploySelection( page : TabPageApi ) {
        const f = page.addFolder( { title : 'Selection' } );
        this.guiMap.set( 'select-folder', { uid : 'select-folder', pi : f , events: [] } );
        EventEmitter.on( 'display-objects', data => {
            console.log( data );
        } );
    }
    
    deployCreation( page : TabPageApi ) {
        const blade = page.addBlade( { view : 'scenegraph' } ); // scene graph view
        this.guiMap.set( 'scene-graph', {uid: 'scene-graph', pi: blade, events: [] } );

        _GuiDatas[ GUI_DATA_ID.CREATION ].forEach( el => {
            const btn = page.addButton( { title: el.title } );
            btn.on( 'click', ev => EventEmitter.emit( el.emit, null ) );
        } );
        
    }

    deployTween( page : TabPageApi ) {
        const blade = page.addBlade( { view: 'tweengraph' } );
        _GuiDatas[ GUI_DATA_ID.TWEEN ].forEach( ( el, index, arr ) => {
            if ( el.cat === 'list' ) {
                const b = page.addBlade( { view: el.cat, label: el.title, options: el.option, value: (el.binding as PanePrimitive).value } ) as ListBladeApi<string>;
                let enableChange = true;
                b.on( 'change', ev => {
                    if ( enableChange ) {
                        EventEmitter.emit( el.emit, ev.value );
                    }                    
                } );
                EventEmitter.on( el.emit + '-listen', data => {
                    enableChange = false;
                    b.value = data;
                    enableChange = true;
                } );
                this.guiMap.set( el.emit, { uid: el.emit, pi: b, events: [] } );
            } else if ( el.cat === 'button' ) {
                const btn = page.addButton( { title: el.title } );
                this.connectAction( btn, el.emit, false );
            } else if ( el.cat === 'p3d' ) {
                const b = page.addBinding( el, 'binding', el.option );                
                b.label = el.title;
                const target = _GuiDatas[ GUI_DATA_ID.TWEEN ][ index ].binding;
                this.connectBinding( b, target, el.emit, el.emit + '-listen' );
                this.guiMap.set( el.emit, { uid: el.emit, pi: b, events: [] } );
            } else if ( el.cat === 'separator' ) {
                page.addBlade( { view:'separator' } );
            } else if  (el.cat === 'text' ) {
                const b = page.addBlade( { view : 'text', label: el.title, parse: (v) => String(v), value: (el.binding as PanePrimitive).value } ) as TextBladeApi<string>;
                let enableChange = true;
                b.controller.view.valueElement.addEventListener( 'input', (ev : InputEvent) => {
                    if ( enableChange ) {
                        const newName = ( ev.target as HTMLInputElement ).value;
                        this.tweenGraph.updateName( newName );
                        EventEmitter.emit( el.emit, newName );
                    }                    
                } );
                b.on( 'change', event => {
                    if ( enableChange ) {
                        EventEmitter.emit( el.emit, event.value );
                    }                    
                } );
                this.guiMap.set( el.emit, {uid: el.emit, pi: b, events: [] } );
                EventEmitter.on( el.emit + '-listen', data => {
                    enableChange = false;
                    b.value = data;
                    enableChange = true;
                } );
            } else if ( el.cat === 'number' ) {
                const b = page.addBinding( el.binding as PanePrimitive, 'value' );
                b.label = el.title;                
                const target = _GuiDatas[ GUI_DATA_ID.TWEEN ][ index ].binding;
                this.guiMap.set( el.emit, { uid: el.emit, pi: b, events: [] } );
                this.connectBinding( b, target, el.emit, el.emit + '-listen' );
            }
        } );
        this.guiMap.set( 'tween-graph', {uid: 'tween-graph', pi: blade, events: [] } );

        const names = [ 'tween-add-name', 'tween-add-duration', 'tween-add-type', 'tween-add-to' ];

        const _self = this.tweenGraph;
        names.map( name => EventEmitter.on( name, data => {
            if ( _self.cursorIndex !== undefined ) {
                EventEmitter.emit( 'tweenModel-update-signal', undefined );
            }
        } ) );

        EventEmitter.on( 'tweenGraph-item-update', data => {
            EventEmitter.emit( 'tween-add-type-listen', data.type );
            EventEmitter.emit( 'tween-add-name-listen', data.name );
            EventEmitter.emit( 'tween-add-duration-listen', { value : data.duration / 1000 } );
            EventEmitter.emit( 'tween-add-to-listen', { x : data.valuesEnd.x, y : data.valuesEnd.y, z : data.valuesEnd.z } );
        } );

    }

    actionFileImport( cb : Function ) {
        fileSelector( cb );
    }

    actionMatDiffuse( cb : Function ) {
        fileSelector( cb );
    }

    actionMatNormal( cb : Function ) {
        fileSelector( cb );
    }

    actionMatMetalic( cb : Function ) {
        fileSelector( cb );
    }

    actionMatSpecular( cb : Function ) {
        fileSelector( cb );
    }

    actionMatRoughness( cb : Function ) {
        fileSelector( cb );
    }

    actionExport( cb : Function ) {
        if ( cb ) cb();
    }

    actionSystemStorage( cb : Function ) {
        if ( cb ) cb();
    }

    actionEnvBG( cb: Function ) {
        fileSelector2( cb, "image/*" );
    }

    actionEnvHDR( cb: Function ) {
        fileSelector2( cb, ".hdr, .hdri" );
    }

    actionEnvEXR( cb: Function ) {
        fileSelector2( cb, ".exr" );
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

    showContext( display : boolean, left : number, top : number ) {
        const context = this.paneMap?.get('oncanvas-menu');
        if ( context ) {
            context.hidden = !display;
            context.rootElement.style.position = 'absolute';
            context.rootElement.style.left = `${left}px`;
            context.rootElement.style.top = `${top}px`;
        }        
    }

    toggleProperty() {
        const property = this.paneMap?.get('property-panel');
        if ( property ) {
            property.hidden = !property.hidden;
        }
    }

    getSession() {
        return this.authenticator.getSession();
    }

    updateSession( session ) {
        this.authenticator.updateSession( session );
    }

    get cameraView() : RenderViewApi {
        return this.guiMap?.get('subview').pi as RenderViewApi;
    }

    get tweenGraph() : TweenGraphApi {
        return this.guiMap?.get('tween-graph')?.pi as TweenGraphApi;
    }

    get sceneGraph() : SceneGraphApi {
        return this.guiMap?.get('scene-graph')?.pi as SceneGraphApi;
    }

    get tweenBindings() {
        const duration = this.guiMap?.get('tween-add-duration').pi.exportState().binding['value'];
        const to = this.guiMap?.get('tween-add-to').pi.exportState().binding['value'];
        const type = this.guiMap?.get('tween-add-type').pi.exportState()['value'] as string;
        const name = this.guiMap?.get('tween-add-name').pi.exportState()['value'] as string;
        return { duration, to, type, name };
    }

    get authenticator() : AuthenticatorApi {
        return this.guiMap?.get('authenticator').pi as AuthenticatorApi;
    }
}