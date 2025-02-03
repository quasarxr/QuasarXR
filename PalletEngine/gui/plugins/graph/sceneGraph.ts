import {
    Blade,
    BaseBladeParams,
    ViewProps,
    View,
    BladePlugin,
    BladeController,
    parseRecord,
    createPlugin,
    BladeApi,
    ClassName,
    TpPluginBundle
} from '@tweakpane/core';

import EventEmitter from '../../event';

enum CB_KEY { ADD = "add", REMOVE = "remove", PREVIEW = "preview", MODELUPDATE = 'modelUpdate' };

const SVG_DOWN = '<svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
  '<path transform="translate( -2, 0 ) rotate( 0, 12, 12 )" d="M8 10L11.8665 14L16 10" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>\n' +
  '</svg>\n';
const SVG_RIGHT = '<svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
  '<path transform="translate( -2, 0 ) rotate( -90, 12, 12 ) " d="M8 10L11.8665 14L16 10" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>\n' +
  '</svg>\n';

let _updateRequested = false;
let _pendingData = null;

export class SceneGraphApi extends BladeApi<SceneGraphBladeController> {

    public clear() {
        this.controller.viewClear();
    }

    public setElement( element : {} ) {
        // define element structure
    }
     
    public update( data : any ) {
        this.controller.viewUpdate( data );
    }

    private setCallback( key, callback ) {
        return this.controller.callbackMap.get( key ).func = callback;
    }

    public onUpdateModel( callback ) {
        this.setCallback( CB_KEY.MODELUPDATE, callback );
    }

    public onSceneAdd( callback ) {
        this.setCallback( CB_KEY.ADD, callback );
    }

    public onSceneRemove( callback ) {
        this.setCallback( CB_KEY.REMOVE, callback );
    }

    public updateName( name : string ) {
        this.controller.updateName( name );
    }

    public get cursorIndex() {
        return this.controller.cursorIndex;
    }
}

interface ControllerConfig {
    document : Document;
    blade: Blade;
    viewProps: ViewProps;
}

type SceneCallback = { func : ( ...args : any [] ) => void }

export class SceneGraphBladeController extends BladeController<SceneGraphView> {

    callbackMap : Map<string, SceneCallback>;
    modelAddCallback : SceneCallback;
    modelUpdateCallback : SceneCallback;

    constructor( config : ControllerConfig ) {
        const param = {
            blade : config.blade,
            view : new SceneGraphView( config.document, {
                viewProps : config.viewProps,
            } ),
            viewProps : config.viewProps,
        }
        super( param );

        this.callbackMap = new Map<string, SceneCallback>();
        Object.values( CB_KEY ).forEach( cbName => {
            this.callbackMap.set( cbName, { func: undefined } );
        } )
        this.assignViewEvents();
    }

    public viewUpdate( data : any ) {
        this.view.updateGraph( data );
    }

    public viewClear() {
        this.view.clearGraph();
    }

    public updateName( name : string ) {
        this.view.changeElementName( name );
    }

    public get cursorIndex() {
        return this.view.cursorIndex;
    }

    private assignViewEvents() {
        this.view.assignEvents( this.callbackMap );
    }
}

interface ViewConfig {
    viewProps : ViewProps;
}

const _className = ClassName('scene-graph');

export class SceneGraphView implements View {
    private readonly document : Document;

    private draggingElement : HTMLElement;
    private nextSibiling : HTMLElement;

    private dragStartIndex : Number;
    private dropInsertIndex : Number;

    private selectedElement : HTMLElement;
    private itemToChild : WeakMap< HTMLElement, HTMLElement>; // item to under sub division
    private modelToItem : WeakMap<object, HTMLElement>; // uuid to created item
    private itemToModel : WeakMap< HTMLElement, object>;

    public readonly element : HTMLElement;
    public readonly graph : HTMLElement;

    public readonly controlArea : HTMLElement;
    public readonly controlAdd : HTMLElement;
    public readonly controlRemove : HTMLElement;
    public readonly controlPreview : HTMLElement;

    constructor( doc : Document, config : ViewConfig ) {
        this.document = doc;
        this.element = doc.createElement( 'div' );
        this.element.classList.add( _className() );
        config.viewProps.bindClassModifiers( this.element );
        this.graph = doc.createElement( 'div' );
        this.graph.setAttribute( 'tabindex', '-1' );
        this.graph.classList.add(_className('g'));
        
        this.element.appendChild( this.graph );

        this.controlArea = doc.createElement( 'div' );
        this.controlArea.classList.add( _className('control') );
        this.element.appendChild( this.controlArea );

        this.controlAdd = doc.createElement( 'div' );
        this.controlAdd.classList.add( _className( 'btn' ) );
        this.controlAdd.textContent = 'Add';
        this.controlAdd.addEventListener( 'click', event => {
        } );
        this.controlArea.appendChild( this.controlAdd );
        
        this.controlRemove = doc.createElement( 'btn' );
        this.controlRemove.classList.add( _className( 'btn' ) );
        this.controlRemove.textContent = 'Remove';
        this.controlRemove.addEventListener( 'click', event => {
        } );
        this.controlArea.appendChild( this.controlRemove );

        this.controlPreview = doc.createElement( 'btn' );
        this.controlPreview.classList.add( _className( 'btn' ) );
        this.controlPreview.textContent = 'Preview';
        this.controlPreview.addEventListener( 'click', event => {
        } );
        this.controlArea.appendChild( this.controlPreview );

        

        this.draggingElement = null;
        this.nextSibiling = null;
        
        this.dragStartIndex = -1;
        this.dropInsertIndex = -1;

        this.itemToChild = new WeakMap();
        this.modelToItem = new WeakMap();
        this.itemToModel = new WeakMap();
    }

    async updateGraph( data : any ) {
        // https://chatgpt.com/share/679c9e56-de00-8001-b1d6-8d9d75fa4fa1
        _pendingData = data;
        if ( _updateRequested ) return;

        _updateRequested = true;
        await Promise.resolve(); // 다음 microtask에서 실행

        while( _pendingData !== null ) {
            const currentData = _pendingData;
            _pendingData = null; // 현재 데이터를 반영하면 pendingData를 초기화

            this.clearGraph();

            (async function() {
                const rootArea = this.document.createElement('div');
                this.graph.appendChild( rootArea );
                this.modelToItem.set( currentData, rootArea );

                currentData.traverse( object => {
                    const visible = object.userData.browsable || object === currentData;
                    
                    if ( visible ) {
                        const i = this.createItem( object, object.children.length > 0 && object.children.every( value => value.userData.browsable ) );
                        this.itemToModel.set( i, object );
                        this.modelToItem.set( object, i );
                        if ( object.parent ) {
                            const parentItem = this.modelToItem.get( object.parent );
                            if ( ! this.itemToChild.get( parentItem ) ) {
                                const className = object.parent === currentData ? 'root-area' : 'child-area';
                                this.itemToChild.set( parentItem, this.createArea( className ) );
                                parentItem.parentElement.appendChild( this.itemToChild.get( parentItem ) );
                            }
                            this.itemToChild.get( parentItem ).appendChild( i );
                        } else {
                            rootArea.appendChild( i );
                            this.itemToChild.set( i, this.createArea( 'child-area' ) );
                            rootArea.appendChild( this.itemToChild.get( i ) );
                            this.itemToChild.get( i ).classList.toggle( 'expanded' );
                        }
                    }
                } );
            }.bind( this ))().then( res => {
                console.log( 'scene update done' );
            } );
        }

        _updateRequested = false;        
    }

    changeElementName( name : string ) {
        if ( this.selectedElement ) this.selectedElement.textContent = name;
    }

    createArea( className : string = 'child-area' ) : HTMLElement {
        const element = this.document.createElement('div');
        element.classList.add( _className( className ) );
        //element.classList.add( 'expanded' );
        return element;
    }

    createItem( data, useExpand = false ) : HTMLElement {
        const wrapper = this.document.createElement( 'div' );
        wrapper.style.display = 'flex';
        wrapper.draggable = true;
        wrapper.classList.add( _className( 'item' ) );

        const expandButton = this.document.createElement( 'div' );
        expandButton.innerHTML = SVG_RIGHT;
        expandButton.classList.add( _className( 'item-expand' ) );
        //expandButton.classList.add( 'expanded' );

        expandButton.addEventListener( 'mousedown', e => {
            e.stopPropagation();
            expandButton.classList.add( 'click' );
        } );

        expandButton.addEventListener( 'mouseover', e => {
            e.stopPropagation();
            expandButton.classList.add( 'hover' );
        } );

        expandButton.addEventListener( 'mouseleave', e => {
            e.stopPropagation();
            expandButton.classList.remove( 'hover' );
        } );

        expandButton.addEventListener( 'mouseup', e => {
            e.stopPropagation();            
            expandButton.classList.remove( 'click' );
            const container = this.itemToChild.get( wrapper );

            expandButton.classList.toggle( 'expanded' );
            container?.classList.toggle( 'expanded' );
            if ( expandButton.classList.contains( 'expanded' ) ) {
                console.log( container );
                // expandButton.classList.remove( 'expanded' );
                // container?.classList.remove( 'expanded' );
                expandButton.innerHTML = SVG_DOWN;
            } else {
                console.log( container );
                // expandButton.classList.add( 'expanded' );
                // container?.classList.add( 'expanded' );
                expandButton.innerHTML = SVG_RIGHT;
            }
        } );
        wrapper.appendChild( expandButton );
            
        if ( useExpand ) {
        } else {
            // const dummyButton = this.document.createElement( 'div' );
            // dummyButton.classList.add( _className( 'dummy-button' ) );
            // wrapper.appendChild( dummyButton );
            expandButton.style.visibility = 'hidden';
        }


        const text = this.document.createElement( 'div' );
        text.textContent = data['name'] || data['type'];
        text.classList.add( _className( 'item-text' ) );
        wrapper.appendChild( text );

        wrapper.addEventListener( 'mousedown', e => {
            e.stopPropagation();
            if ( this.draggingElement !== null && wrapper !== this.draggingElement ) {
                this.draggingElement.classList.remove( 'dragging' );
            }
            wrapper.classList.add( 'dragging' );
            this.draggingElement = wrapper;
            this.dragStartIndex = Array.from( this.graph.children ).indexOf( wrapper );
        } );

        wrapper.addEventListener( 'mouseup', e => {
            e.stopPropagation();
            this.selectedElement?.classList.remove( 'selected' );
            this.selectedElement = wrapper;
            wrapper.classList.toggle( 'selected' );
            
            EventEmitter.emit( 'sceneGraph-update-signal', this.itemToModel.get( wrapper ) );
        } );

        wrapper.addEventListener( 'dragstart', event => {
            event.dataTransfer.effectAllowed = 'move';
        } );

        wrapper.addEventListener( 'dragend', event => {
            event.dataTransfer.dropEffect = 'move';
        } );

        return wrapper;
    }

    assignEvents( callbacks : Map<string, SceneCallback> ) {
        this.graph.addEventListener( 'click', ev => {
            ev.stopPropagation();
            if ( this.draggingElement ) {
                this.draggingElement.classList.remove( 'dragging' );                
                this.draggingElement = null;
            }

            if ( ev.target === this.graph ) {
                this.deSelectItem();
            }
        } );

        this.graph.addEventListener( 'dragover', e => {
            e.preventDefault();

            let itemSibilings = Array.from( this.document.querySelectorAll('.tp-tween-graphv_item:not(.dragging') );
            let nextItem = itemSibilings.find( sibiling => {
                const sibilingElement = sibiling as HTMLElement;
                const containerLocalTop = this.graph.getBoundingClientRect().top;
                const sibilingClientTop = sibilingElement.getBoundingClientRect().top
                const sibilingHalfHeight = sibilingElement.offsetHeight * 0.5;
                return ( e.clientY - containerLocalTop ) < ( sibilingClientTop - containerLocalTop + sibilingHalfHeight )
            } ) as HTMLElement;

            itemSibilings.forEach( sibiling => {
                (sibiling as HTMLElement).classList.remove('nextItem');
            } );

            if ( nextItem ) {
                nextItem.classList.add('nextItem');
            }
            this.nextSibiling = nextItem;
        } );

        this.graph.addEventListener( 'drop', e => {
            e.preventDefault();
            let itemSibilings = Array.from( this.document.querySelectorAll('.tp-tween-graphv_item:not(.dragging') );
            itemSibilings.forEach( sibiling => {
                (sibiling as HTMLElement).classList.remove('nextItem');
            } );

            if ( this.draggingElement ) {
                if ( this.nextSibiling ) {
                    this.graph.insertBefore( this.draggingElement, this.nextSibiling );
                    this.dropInsertIndex = Array.from( this.graph.children ).indexOf( this.nextSibiling ) - 1;
                } else {                    
                    this.graph.appendChild( this.draggingElement );
                    this.dropInsertIndex = this.graph.children.length - 1;
                }
                this.draggingElement.classList.remove( 'dragging' );
                this.draggingElement = null;
                this.nextSibiling = null;

                callbacks.get(CB_KEY.MODELUPDATE)?.func( this.dragStartIndex, this.dropInsertIndex );

            }

            this.dragStartIndex = -1;
            this.dropInsertIndex = -1;
        } );

        this.graph.addEventListener( 'keydown', event => {
            switch( event.key ) {
                case 'CtrlLeft':
                    console.log( 'ctrl' );
                    break;
                case 'ShiftLeft':
                    console.log( 'shift' );
                    break;
            }
        } );
    }

    clearGraph() {
        this.deSelectItem();
        while( this.graph.firstChild ) {
            this.graph.removeChild( this.graph.firstChild );
        }
    }

    toggleSelect( element : HTMLElement ) {
        element?.classList.toggle( 'selected' );
    }

    selectItem( element : HTMLElement ) {
        if ( element == undefined || element == null ) console.error( 'element has to passed with parameter' );
        if ( this.selectedElement ) {
            this.deSelectItem();
            this.selectedElement = element;
        }
        if ( ! element.classList.contains( 'selected' ) ) {
            element.classList.add( 'selected' );
        }
    }

    deSelectItem( element : HTMLElement = undefined ) {
        if ( element ) {
            element.classList.remove( 'selected' );
        } else {
            this.selectedElement?.classList.remove( 'selected' );
            this.selectedElement = null;
        }
    }

    public get cursorIndex() {
        if ( this.selectedElement ) {
            return Number( this.selectedElement.getAttribute( 'graphIndex' ) );
        } else {
            return undefined;
        }
        
    }
}

interface PluginParams extends BaseBladeParams {
    view : 'scenegraph';
};

export const SceneGraphPlugin : BladePlugin<PluginParams> =
    createPlugin( {
        id : 'scenegraph',
        type : 'blade',
        accept( args ) {
            const result = parseRecord<PluginParams>( args, (p) => ({
                view: p.required.constant('scenegraph'),
            }));
            return result ? { params : result } : null;
        },
        controller( args ) {
            return new SceneGraphBladeController( {
                document : args.document,
                blade : args.blade,
                viewProps : args.viewProps,
            } );
        },
        api( args ) {
            if ( ! ( args.controller instanceof SceneGraphBladeController ) ) {
                return null;
            }
            return new SceneGraphApi( args.controller );
        }

    } );

export const SceneGraphBundle : TpPluginBundle = {
    id: 'scenegraph',
    plugins: [
        SceneGraphPlugin
    ],
    css : `.tp-scene-graphv_g {
        height: 450px;
        border-radius: 5px 5px 0px 0px;
        border: 1px solid black;
        border-width: 1px 1px 0px 1px;
        background-color: rgb( 105, 105, 105 );
        margin: 0px 3px;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: #ccc rgba(105, 105, 105, 0.4);
        outline: none;
    }
    .tp-scene-graphv_item {
        margin: 3px;
        font-size: 13px;
        padding: 2px;
        color: white;
        user-select: none;
        opacity: 1;
        transition: margin 0.25s;
        min-height: 13px;
        border-radius : 3px;
    }

    .tp-scene-graphv_item:hover {
        background: blue;
    }    
    .tp-scene-graphv_item.dragging {
        background: yellow;
    }
    .tp-scene-graphv_item.nextItem {
        background: red;
        margin-top : 20px;
    }        
    .tp-scene-graphv_item.selected {
        background: rgb( 0, 150, 90 );
    }

    .tp-scene-graphv_item-text {
        align-content: center;
    }

    .tp-scene-graphv_item-expand {
        margin : 0 6px 0 0;
        border-radius: 3px;
    }

    .tp-scene-graphv_item-expand.hover {
        background-color: #888;
    }

    .tp-scene-graphv_item-expand.click {
        background-color: #444;
    }

    .tp-scene-graphv_dummy-button {
        height: 24px;
    }

    .tp-scene-graphv_root-area {
        transition : transform 0.2s;
        display: none;
    }    
        
    .tp-scene-graphv_root-area.expanded {
        display: block;
    }

    .tp-scene-graphv_child-area {
        transition : transform 0.2s;
        display: none;
        padding-left: 24px;
    }

    
    .tp-scene-graphv_child-area.expanded {
        display: block;
    }

    .tp-scene-graphv_control {
        display: flex;
        flex-direction: row;
        justify-content: end;
        margin: 0px 3px;
        background-color: rgb( 105, 105, 105 );
        border-radius: 0px 0px 5px 5px;
        border: 1px solid black;
        border-width: 0px 1px 1px 1px;

    }
    .tp-scene-graphv_btn {
        border-radius: 2px;
        margin: 4px 4px;
        background-color: rgb(55,55,55);
        padding: 5px;
        width: auto;
        color: rgb(125,125,125);
        font-weight: bold;
        user-select: none;
        cursor: pointer;
        transition: background-color 0.1s;
    }
    .tp-scene-graphv_btn:hover {
        background-color: rgb(75,75,75);
    }
    .tp-scene-graphv_btn:active {
        background-color: rgb(100,100,100);
        box-shadow: 1px 1px 1px rgb( 125, 125, 125 );
    }
    `
};