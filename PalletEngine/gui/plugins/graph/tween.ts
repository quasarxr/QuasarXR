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

export class TweenGraphApi extends BladeApi<TweenGraphBladeController> {

    public clear() {
        this.controller.viewClear();
    }
    public update( data : [ unknown ] ) {
        this.controller.viewUpdate( data );
    }

    public onUpdateModel( callback ) {
        this.controller.modelUpdateCallback.func = callback;
    }
}

interface ControllerConfig {
    document : Document;
    blade: Blade;
    viewProps: ViewProps;
}

type TweenCallback = { func : ( ...args : any [] ) => void }

export class TweenGraphBladeController extends BladeController<TweenGraphView> {

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
        this.modelUpdateCallback = { func : undefined };
        this.assignViewEvents();
    }

    public viewUpdate( data : [ unknown ] ) {
        this.view.updateGraph( data );
    }

    public viewClear() {
        this.view.clearGraph();
    }

    private assignViewEvents() {
        this.view.assignEvents( this.modelUpdateCallback );
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

    public readonly element : HTMLElement;
    public readonly graph : HTMLElement;
    constructor( doc : Document, config : ViewConfig ) {
        this.document = doc;
        this.element = doc.createElement( 'div' );
        this.element.classList.add( className() );
        config.viewProps.bindClassModifiers( this.element );
        this.graph = doc.createElement( 'div' );
        this.graph.classList.add(className('g'));
        
        this.element.appendChild( this.graph );
        this.draggingElement = null;
        this.nextSibiling = null;
        
        this.dragStartIndex = -1;
        this.dropInsertIndex = -1;
    }

    updateGraph( data : [ unknown ] ) {
        this.clearGraph();
        if ( data instanceof Array ) {
            data.forEach( ( item, index, arr ) => {
                this.graph.appendChild( this.createGraphItem( item, index ) );
            } );
        }
    }

    updateModel() {

    }

    createGraphItem( data, index ) : HTMLElement {
        const element = this.document.createElement( 'div' );
        element.draggable = true;
        element.classList.add( className('item') );
        element.textContent = `tween-${data._id}`;

        element.addEventListener( 'mousedown', e => {
            e.stopPropagation();
            if ( this.draggingElement !== null && element !== this.draggingElement ) {
                this.draggingElement.classList.remove( 'dragging' );
            }
            element.classList.add( 'dragging' );
            this.draggingElement = element;
            this.dragStartIndex = Array.from( this.graph.children ).indexOf(element);
            console.log( 'drag start index : ', this.dragStartIndex );
        } );

        element.addEventListener( 'dragstart', event => {
            event.dataTransfer.effectAllowed = 'move';
        } );

        element.addEventListener( 'dragend', event => {
            event.dataTransfer.dropEffect = 'move';
        } );

        return element;
    }

    assignEvents( modelUpdate : TweenCallback ) {
        this.graph.addEventListener( 'click', ev => {
            ev.stopPropagation();
            if ( this.draggingElement ) {
                this.draggingElement.classList.remove( 'dragging' );                
                this.draggingElement = null;
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

                if ( modelUpdate.func ) {
                    modelUpdate.func( this.dragStartIndex, this.dropInsertIndex );
                } else {
                    console.log( 'model null' );
                }
            }

            this.dragStartIndex = -1;
            this.dropInsertIndex = -1;
        } );
    }

    clearGraph() {
        while( this.graph.firstChild ) {
            this.graph.removeChild( this.graph.firstChild );
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
        border-radius: 5px;
        border: 1px solid black;
        background-color: rgb( 107, 107, 107 );
        margin: 0px 3px;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: #ccc rgba(95, 95, 95, 0.4);
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
    }

    .tp-tween-graphv_item:hover {
        background: blue;
    }

    .tp-tween-graphv_item:active {
        background: white;
    }
    
    .tp-tween-graphv_item.dragging {
        background: yellow;
    }
    .tp-tween-graphv_item.nextItem {
        background: red;
        margin-top : 20px;
    }
    `
};