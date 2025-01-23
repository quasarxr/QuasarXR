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
    TpPluginBundle,
} from '@tweakpane/core';
import { library, icon, IconName, IconPrefix } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';

library.add( fas );

function createFontAwesomeIcon() {
    const iconName  = 'folder-open';
    const prefix : IconPrefix = 'fas';
    const size = '1x';

    const iconElement = document.createElement('i');
    const iconDefinition = icon({ prefix, iconName }, { transform: { size: 17, x: 0.5, y: 1.5 } } );

    if ( iconDefinition ) {
        iconElement.innerHTML = iconDefinition.html[0];
        iconElement.classList.add( 'fa-' + iconName, 'fa-' + size );
    } else {
        console.error( `Icon ${iconName} not found` );
    }
    return iconElement;
}

export class RenderViewApi extends BladeApi<RenderViewBladeController> {
    bShow : boolean = false;

    public render() {
        this.controller.renderView();
    }

    public getImageBuffer() {
        return this.controller.buffer;
    }

    public clear() {
        this.controller.clearView();
    }

    public enabled( flag : boolean ) {
        if ( flag ) {
            this.controller.show();
        } else {
            this.controller.hide();
        }
        this.bShow = flag;
    }
}

interface ControllerConfig {
    blade: Blade;
    viewProps: ViewProps;
}

export class RenderViewBladeController extends BladeController<RenderView> {
    constructor(doc: Document, config: ControllerConfig) {
        super({
            blade: config.blade,
            view: new RenderView( doc, { viewProps: config.viewProps } ),
            viewProps: config.viewProps,
        });
    }

    renderView() {
        this.view.renderView();
    }

    clearView() {
        this.view.clearView();
    }

    get buffer() {
        return this.view.buffer;
    }

    show() {
        this.view.element.parentElement.style.display = 'block';
    }

    hide() {
        this.view.element.parentElement.style.display = 'none';
    }
}

interface ViewConfig { 
    viewProps: ViewProps;
}

const className = ClassName('renderview');
const className1 = ClassName('space');

export class RenderView implements View {
    public readonly element: HTMLElement;
    public readonly renderElement: HTMLElement;
    public readonly canvas : HTMLCanvasElement;
    public readonly context : CanvasRenderingContext2D;
    buffers : ImageData[];
    activeIndex : number;

    constructor( doc: Document, config: ViewConfig ) {
        this.element = doc.createElement('div');
        this.element.classList.add(className());
        config.viewProps.bindClassModifiers( this.element );

        this.renderElement = doc.createElement('div');
        this.renderElement.classList.add( className1() );
        this.element.appendChild( this.renderElement );

        this.canvas = doc.createElement('canvas');
        this.canvas.width = 250;
        this.canvas.height = 150;
        this.canvas.style.transform = 'scale( 1, -1 )';
        this.canvas.style.borderRadius = '6px';

        this.context = this.canvas.getContext("2d");
        this.buffers = [ this.context.createImageData( 250, 150 ), this.context.createImageData( 250, 150 ) ];
        this.renderElement.appendChild( this.canvas );

        this.activeIndex = 0;
    }

    renderView() {
        this.context.putImageData( this.buffers[ this.activeIndex ], 0 , 0 );
        //this.activeIndex = this.activeIndex === 0 ? 1 : 0;
    }

    clearView() {
        this.context.clearRect( 0, 0, 250, 150 );
    }

    get buffer() {
        return this.buffers[ this.activeIndex ];
    }
}

interface PluginParams extends BaseBladeParams {
    view: 'renderview';
};

export const RenderViewPlugin : BladePlugin<PluginParams> = 
    createPlugin({
        id: 'renderview',
        type: 'blade',
        accept(args) {
            const result = parseRecord<PluginParams>( args, (p) => ({
                view: p.required.constant('renderview'),
            }));
            return result ? {params: result} : null;
        },
        controller( args ) {
            return new RenderViewBladeController(args.document, {
                blade: args.blade,
                viewProps: args.viewProps,
            } );
        },
        api(args) {
            if ( !(args.controller instanceof RenderViewBladeController) ) {
                return null;
            }
            return new RenderViewApi(args.controller);
        }
    });


export const RenderViewBundle : TpPluginBundle = {
    id: 'renderview',
    plugins: [
        RenderViewPlugin
    ],
    css: `
    .tp-spacev { height : 150px; }
    `
};