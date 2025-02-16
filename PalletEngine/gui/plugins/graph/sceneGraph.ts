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

const SVG_DOWN = '<svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
  '<path transform="translate( -2, 0 ) rotate( 0, 12, 12 )" d="M8 10L11.8665 14L16 10" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>\n' +
  '</svg>\n';
const SVG_RIGHT = '<svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
  '<path transform="translate( -2, 0 ) rotate( -90, 12, 12 ) " d="M8 10L11.8665 14L16 10" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>\n' +
  '</svg>\n';

let _updateRequested = false;
let _pendingData = null;

let _draggingItem : GraphItem = null;
let _selectedItem : GraphItem = null;

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

    public updateName( name : string ) {
        this.controller.updateName( name );
    }
}

interface ControllerConfig {
    document : Document;
    blade: Blade;
    viewProps: ViewProps;
}

type SceneCallback = { func : ( ...args : any [] ) => void }

export class SceneGraphBladeController extends BladeController<SceneGraphView> {

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
}

interface ViewConfig {
    viewProps : ViewProps;
}

const _className = ClassName('scene-graph');

class GraphItem extends HTMLDivElement {
    
    document : Document;

    rootDiv : HTMLElement;
    expandDiv : HTMLDivElement;
    expandButton : HTMLElement;

    constructor( document, object ) {
        super();
        this.document = document;
        this.draggable = true;
        this.initialize( object );
    }

    initialize( data ) {

        this.rootDiv = this.document.createElement( 'div' );
        this.rootDiv.style.display = 'flex';        
        this.rootDiv.classList.add( _className( 'item' ) );

        this.expandDiv = this.document.createElement( 'div' );
        this.expandDiv.classList.add( _className('child-area') );

        const text = this.document.createElement( 'div' );
        text.textContent = data['name'] || data['type'];
        text.classList.add( _className( 'item-text' ) );
        this.rootDiv.appendChild( text );

        const btn = this.createExpandButton( data.children.length > 0 );

        this.rootDiv.insertBefore( btn, text );
        this.appendChild( this.rootDiv );
        this.appendChild( this.expandDiv );
    }

    get select() {
        return this.rootDiv.classList.contains( 'selected' );
    }

    set select( value ) {
        if ( value ) {
            this.rootDiv.classList.add( 'selected' ); 
        } else {
            this.rootDiv.classList.remove( 'selected' );
        }
    }
    
    toggleSelect() {
        this.rootDiv.classList.toggle( 'selected' );
    }

    createExpandButton( show : boolean ) {
        this.expandButton = this.document.createElement( 'div' );
        this.expandButton.innerHTML = SVG_RIGHT;
        this.expandButton.classList.add( _className( 'item-expand' ) );
        //expandButton.classList.add( 'expanded' );

        this.expandButton.addEventListener( 'mousedown', e => {
            e.stopPropagation();
            this.expandButton.classList.add( 'click' );
        } );

        this.expandButton.addEventListener( 'mouseover', e => {
            e.stopPropagation();
            this.expandButton.classList.add( 'hover' );
        } );

        this.expandButton.addEventListener( 'mouseleave', e => {
            e.stopPropagation();
            this.expandButton.classList.remove( 'hover' );
        } );

        this.expandButton.addEventListener( 'mouseup', e => {
            e.stopPropagation();
            this.expandDiv.classList.toggle( 'expanded' );
            this.expandButton.classList.remove( 'click' );
            this.expandButton.classList.toggle( 'expanded' );
            
            if ( this.expandButton.classList.contains( 'expanded' ) ) {
                this.expandButton.innerHTML = SVG_DOWN;
            } else {
                this.expandButton.innerHTML = SVG_RIGHT;
            }
        } );

        this.ExpandButton = show;

        return this.expandButton;
    }

    get parentItem() : GraphItem {
        return this.parentElement?.parentElement as GraphItem || null;
    }

    set ExpandButton( value : boolean ) {
        this.expandButton.style.visibility = value ? 'visible' : 'hidden';
    }

    updateExpandButton() {
        this.ExpandButton = this.expandDiv.children.length > 0;
    }

    insertItem( item : GraphItem ) {
        this.expandDiv.appendChild( item );
    }

    removeItem( item : GraphItem ) {
        if ( this.expandDiv.contains( item ) ) {
            this.expandDiv.removeChild( item );
        }
    }

    addEventListener( eventName, callback ) {
        this.rootDiv.addEventListener( eventName, callback );
    }

    get expanded() {
        return this.expandDiv.classList.contains( 'expanded' );
    }

    set expanded( value ) {
        if ( value ) {
            this.expandButton.innerHTML = SVG_DOWN;
            this.expandDiv.classList.add( 'expanded' );
        } else {
            this.expandButton.innerHTML = SVG_RIGHT;
            this.expandDiv.classList.remove( 'expanded' );
        }
    }
}

customElements.define('scenegrpah-item', GraphItem, { extends: 'div' } );

export class SceneGraphView implements View {
    private document : Document;
    private modelToItem : WeakMap<object, GraphItem>; // uuid to created item
    private itemToModel : WeakMap<GraphItem, object>;

    public readonly element : HTMLElement;
    public readonly graph : HTMLElement;

    constructor( doc : Document, config : ViewConfig ) {
        this.document = doc;
        this.element = doc.createElement( 'div' );
        this.element.classList.add( _className() );
        config.viewProps.bindClassModifiers( this.element );
        this.graph = doc.createElement( 'div' );
        this.graph.setAttribute( 'tabindex', '-1' );
        this.graph.classList.add(_className('g'));
        
        this.element.appendChild( this.graph );

        this.modelToItem = new WeakMap();
        this.itemToModel = new WeakMap();

        this.setupEvent();
    }
    
    connectEvent( item : GraphItem ) {
        item.addEventListener( 'mousedown', e => {
            if ( _draggingItem !== null && item !== _draggingItem ) {
                _draggingItem.classList.remove( 'dragging' );
            }
            _draggingItem = item;
        } );

        item.addEventListener( 'mouseup', e => {
            e.stopPropagation();
            console.log( 'mouseup', e );
            if ( _selectedItem ) {
                _selectedItem.select = false;
            }
            _selectedItem = item;
            item.select = true;
            EventEmitter.emit( 'scenegraph-select', this.itemToModel.get( item ) );
        } );

        item.addEventListener( 'dragstart', event => {
            //event.preventDefault();
            event.stopPropagation();
            console.log( 'dragstart : ', event.target );
            event.dataTransfer.effectAllowed = 'move';
            item.classList.add( 'dragging' );
            _draggingItem = item;
        } );

        item.addEventListener( 'dragend', event => {
            event.preventDefault();
            event.stopPropagation();
            console.log( 'dragend : ', _draggingItem );
            _draggingItem?.classList.remove( 'dragging' );
            _draggingItem = null;
        } );

        item.addEventListener( 'drop', event => {
            if ( _draggingItem === item ) return;
            event.preventDefault();
            event.stopPropagation();
            console.log( 'drop : ', event.target, _draggingItem === event.target );

            const drag = this.itemToModel.get( _draggingItem );
            const drop = this.itemToModel.get( item );
            EventEmitter.emit( 'scenegraph-drag-drop', { 'drop' : drop , 'drag' : drag } );
        } );

        item.addEventListener('dragover', event => {
            if ( _draggingItem === item ) return;
            event.preventDefault();
            event.stopPropagation();
            item.classList.add( 'dragover' );
        } );

        item.addEventListener('dragleave', event => {
            if ( _draggingItem === item ) return;
            event.preventDefault();
            item.classList.remove( 'dragover' );
        } );
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

                currentData.traverse( object => {
                    let gi = this.modelToItem.get( object );
                    const visible = object.userData.browsable || object === currentData;

                    if ( visible ) {
                        if ( gi ) {
                            gi.updateExpandButton();
                        } else {
                            gi = new GraphItem( this.document, object );
                            this.connectEvent( gi );
                            this.itemToModel.set( gi, object );
                            this.modelToItem.set( object, gi );
                        }
                        
                        if ( object.parent ) {
                            const parentItem = this.modelToItem.get( object.parent );
                            parentItem.insertItem( gi );
                            parentItem.updateExpandButton();
                        } else {
                            rootArea.appendChild( gi );
                        }
                    }
                } );
            }.bind( this ))().then( res => {
                //console.log( 'scene update done' );
            } );
        }

        _updateRequested = false;        
    }

    changeElementName( name : string ) {
        if ( _selectedItem ) _selectedItem.textContent = name;
    }

    setupEvent() {
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

        EventEmitter.on( 'scenegraph-selection-update', model => {
            if ( _selectedItem ) {
                _selectedItem.select = false;
            }
            if ( model ) {
                const currentItem = this.modelToItem.get( model );
                if ( currentItem ) {
                    currentItem.select = true;
                }
                _selectedItem = currentItem;

                let iter = currentItem.parentItem;
                while( iter ) {
                    console.log( iter );
                    iter.expanded = true;
                    iter = iter.parentItem;
                }
            }
        } );
    }

    clearGraph() {
        while( this.graph.firstChild ) {
            this.graph.removeChild( this.graph.firstChild );
        }
    }

    toggleSelect( element : HTMLElement ) {
        element?.classList.toggle( 'selected' );
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
    .tp-scene-graphv_item.dragover {
        background: red;
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