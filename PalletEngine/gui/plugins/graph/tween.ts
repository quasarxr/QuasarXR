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

    }
    public update( data : [] ) {
        console.log( data );
    }
}

interface ControllerConfig {
    document : Document;
    blade: Blade;
    viewProps: ViewProps;
}

export class TweenGraphBladeController extends BladeController<TweenGraphView> {
    constructor( config : ControllerConfig ) {
        const param = {
            blade : config.blade,
            view : new TweenGraphView( config.document, {
                viewProps : config.viewProps,
            } ),
            viewProps : config.viewProps,
        }
        super( param );
    }

    public viewUpdate( data : [] ) {

    }
}

interface ViewConfig {
    viewProps : ViewProps;
}

const className = ClassName('tween-graph');

export class TweenGraphView implements View {
    public readonly element : HTMLElement;
    public readonly graph : HTMLElement;
    constructor( doc : Document, config : ViewConfig ) {
        this.element = doc.createElement( 'div' );
        this.element.classList.add( className() );
        config.viewProps.bindClassModifiers( this.element );
        this.graph = doc.createElement( 'div' );
        this.graph.classList.add(className('g'));
        this.element.appendChild( this.graph );
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
        background-color: white;
        opacity: 0.3;
        margin: 0px 3px;
    }`
};