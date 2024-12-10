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

export class TweenGraphApi extends BladeApi<TweenGraphBladeController> {

    public clear() {
        this.controller.viewClear();
    }
    public update( data : unknown[] ) {
        this.controller.viewUpdate( data );
    }

    private setCallback( key, callback ) {
        return this.controller.callbackMap.get( key ).func = callback;
    }

    public onUpdateModel( callback ) {
        this.setCallback( CB_KEY.MODELUPDATE, callback );
    }

    public onTweenAdd( callback ) {
        this.setCallback( CB_KEY.ADD, callback );
    }

    public onTweenRemove( callback ) {
        this.setCallback( CB_KEY.REMOVE, callback );
    }

    public onTweenPreview( callback ) {
        this.setCallback( CB_KEY.PREVIEW, callback );
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

type TweenCallback = { func : ( ...args : any [] ) => void }

export class TweenGraphBladeController extends BladeController<TweenGraphView> {

    callbackMap : Map<string, TweenCallback>;
    presets : string[];
    modelAddCallback : TweenCallback;
    modelUpdateCallback : TweenCallback;

    constructor( config : ControllerConfig ) {
        const param = {
            blade : config.blade,
            view : new TweenGraphView( config.document, {
                viewProps : config.viewProps,
            } ),
            viewProps : config.viewProps,
        }
        super( param );

        this.callbackMap = new Map<string, TweenCallback>();
        Object.values( CB_KEY ).forEach( cbName => {
            this.callbackMap.set( cbName, { func: undefined } );
        } )
        this.assignViewEvents();
    }

    public viewUpdate( data : unknown[] ) {
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

const className = ClassName('tween-graph');

export class TweenGraphView implements View {
    private readonly document : Document;

    private draggingElement : HTMLElement;
    private nextSibiling : HTMLElement;

    private dragStartIndex : Number;
    private dropInsertIndex : Number;

    private selectedElement : HTMLElement;

    public readonly element : HTMLElement;
    public readonly graph : HTMLElement;

    public readonly controlArea : HTMLElement;
    public readonly controlAdd : HTMLElement;
    public readonly controlRemove : HTMLElement;
    public readonly controlPreview : HTMLElement;

    constructor( doc : Document, config : ViewConfig ) {
        this.document = doc;
        this.element = doc.createElement( 'div' );
        this.element.classList.add( className() );
        config.viewProps.bindClassModifiers( this.element );
        this.graph = doc.createElement( 'div' );
        this.graph.setAttribute( 'tabindex', '-1' );
        this.graph.classList.add(className('g'));
        
        this.element.appendChild( this.graph );

        this.controlArea = doc.createElement( 'div' );
        this.controlArea.classList.add( className('control') );
        this.element.appendChild( this.controlArea );

        this.controlAdd = doc.createElement( 'div' );
        this.controlAdd.classList.add( className( 'btn' ) );
        this.controlAdd.textContent = 'Add';
        this.controlAdd.addEventListener( 'click', event => {
            EventEmitter.emit('tween-add', undefined );
        } );
        this.controlArea.appendChild( this.controlAdd );
        
        this.controlRemove = doc.createElement( 'btn' );
        this.controlRemove.classList.add( className( 'btn' ) );
        this.controlRemove.textContent = 'Remove';
        this.controlRemove.addEventListener( 'click', event => {
            const index = this.selectedElement?.getAttribute( 'graphIndex' );
            EventEmitter.emit( 'tween-remove', index );

        } );
        this.controlArea.appendChild( this.controlRemove );

        this.controlPreview = doc.createElement( 'btn' );
        this.controlPreview.classList.add( className( 'btn' ) );
        this.controlPreview.textContent = 'Preview';
        this.controlPreview.addEventListener( 'click', event => {
            EventEmitter.emit( 'tween-preview', undefined );
        } );
        this.controlArea.appendChild( this.controlPreview );

        

        this.draggingElement = null;
        this.nextSibiling = null;
        
        this.dragStartIndex = -1;
        this.dropInsertIndex = -1;
    }

    updateGraph( data : unknown[] ) {
        this.clearGraph();
        if ( data instanceof Array ) {
            data.forEach( ( item, index, arr ) => {
                this.graph.appendChild( this.createItem( item, index ) );
            } );
        }
    }

    changeElementName( name : string ) {
        if ( this.selectedElement ) this.selectedElement.textContent = name;
    }

    createItem( data, index ) : HTMLElement {
        const element = this.document.createElement( 'div' );
        element.draggable = true;
        element.classList.add( className('item') );
        element.textContent = data['name'];
        element.setAttribute( 'graphIndex', `${index}` );

        element.addEventListener( 'mousedown', e => {
            e.stopPropagation();
            if ( this.draggingElement !== null && element !== this.draggingElement ) {
                this.draggingElement.classList.remove( 'dragging' );
            }
            element.classList.add( 'dragging' );
            this.draggingElement = element;
            this.dragStartIndex = Array.from( this.graph.children ).indexOf( element );
        } );

        element.addEventListener( 'mouseup', e => {
            e.stopPropagation();
            this.selectedElement?.classList.remove( 'selected' );
            this.selectedElement = element;
            element.classList.toggle( 'selected' );
            
            EventEmitter.emit( 'tweenGraph-update-signal', element.getAttribute( 'graphIndex' ) );
        } );

        element.addEventListener( 'dragstart', event => {
            event.dataTransfer.effectAllowed = 'move';
        } );

        element.addEventListener( 'dragend', event => {
            event.dataTransfer.dropEffect = 'move';
        } );

        return element;
    }

    assignEvents( callbacks : Map<string, TweenCallback> ) {
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
            console.log( event );
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
    view : 'tweengraph';
};

export const TweenGraphPlugin : BladePlugin<PluginParams> =
    createPlugin( {
        id : 'tweengraph',
        type : 'blade',
        accept( args ) {
            const result = parseRecord<PluginParams>( args, (p) => ({
                view: p.required.constant('tweengraph'),
            }));
            return result ? { params : result } : null;
        },
        controller( args ) {
            return new TweenGraphBladeController( {
                document : args.document,
                blade : args.blade,
                viewProps : args.viewProps,
            } );
        },
        api( args ) {
            if ( ! ( args.controller instanceof TweenGraphBladeController ) ) {
                return null;
            }
            return new TweenGraphApi( args.controller );
        }

    } );

export const TweenGraphBundle : TpPluginBundle = {
    id: 'tweengraph',
    plugins: [
        TweenGraphPlugin
    ],
    css : `.tp-tween-graphv_g {
        height: 250px;
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
    .tp-tween-graphv_item {
        margin: 3px;
        border: 1px solid darkgrey;
        border-radius: 3px;
        font-size: 13px;
        background: darkgrey;
        padding: 2px;
        color: white;
        user-select: none;
        opacity: 1;
        transition: margin 0.25s;
        min-height: 13px;
    }

    .tp-tween-graphv_item:hover {
        background: blue;
    }    
    .tp-tween-graphv_item.dragging {
        background: yellow;
    }
    .tp-tween-graphv_item.nextItem {
        background: red;
        margin-top : 20px;
    }        
    .tp-tween-graphv_item.selected {
        background: rgb( 0, 150, 90 );
    }

    .tp-tween-graphv_control {
        display: flex;
        flex-direction: row;
        justify-content: end;
        margin: 0px 3px;
        background-color: rgb( 105, 105, 105 );
        border-radius: 0px 0px 5px 5px;
        border: 1px solid black;
        border-width: 0px 1px 1px 1px;

    }
    .tp-tween-graphv_btn {
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
    .tp-tween-graphv_btn:hover {
        background-color: rgb(75,75,75);
    }
    .tp-tween-graphv_btn:active {
        background-color: rgb(100,100,100);
        box-shadow: 1px 1px 1px rgb( 125, 125, 125 );
    }
    `
};