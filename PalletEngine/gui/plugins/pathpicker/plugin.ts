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
    TpEvent,
    TpPluginBundle,
    LabelPropsObject,
    ValueMap,
    Controller,
    LabelController,
    LabelView,
    LabelProps,
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

export class PathPickerApi extends BladeApi<PathPickerBladeController> {
    public get path(): string | null {
        return this.controller.valueController.view.inputElement.textContent;
    }

    public get cache(): File | null {
        return this.controller.valueController.view.cache;
    }

    public on( cb ) {
        console.log( cb );
        this.controller.valueController.view.buttonElement.addEventListener('click', event => {
            cb();
        } );
    }

    public setName( name ) {
        console.log( 'setName', name );
        this.controller.valueController.view.inputElement.setAttribute('value', name );
    }
}

interface LabelControllerConfig {
    blade: Blade;
    labelProps: LabelProps;
    valueController: PathPickerController;
}

export class PathPickerBladeController extends BladeController<LabelView> {
    public readonly labelController: LabelController<PathPickerController>;
    public readonly valueController: PathPickerController;

    constructor(doc: Document, config: LabelControllerConfig) {
        const pc = config.valueController;
        const lc = new LabelController( doc, {
            blade: config.blade,
            props: config.labelProps,
            valueController: pc,   
        });
        super({
            blade: config.blade,
            view: lc.view,
            viewProps: pc.viewProps,
        });
        this.valueController = pc;
        this.labelController = lc;
    }

}

interface ControllerConfig {
    viewProps : ViewProps,
}

export class PathPickerController implements Controller<PathPickerView> {
    public readonly view: PathPickerView;
    public readonly viewProps: ViewProps;
    constructor( doc: Document, config : ControllerConfig ) {
        this.view = new PathPickerView( doc, { viewProps: config.viewProps } );
        this.viewProps = config.viewProps;
    }
}

interface ViewConfig { 
    viewProps: ViewProps;
}

const className = ClassName('pathpicker');

export class PathPickerView implements View {
    public readonly element: HTMLElement;
    //public readonly buttonelement: HTMLButtonElement;
    public readonly rootElement: HTMLElement;
    public readonly inputElement : HTMLElement;
    public readonly buttonElement : HTMLElement;
    public readonly cache : File;

    constructor( doc: Document, config: ViewConfig ) {
        this.element = doc.createElement('div');
        this.element.classList.add(className());
        config.viewProps.bindClassModifiers(this.element);

        this.rootElement = doc.createElement('div');
        this.rootElement.classList.add(className('col'));
        this.element.appendChild( this.rootElement );

        this.inputElement = doc.createElement('input');
        this.inputElement.classList.add(className('text'));
        this.rootElement.appendChild(this.inputElement);

        this.buttonElement = doc.createElement('div');
        this.buttonElement.classList.add(className('button'));

        const icon = createFontAwesomeIcon();
        this.buttonElement.appendChild( icon );

        this.rootElement.appendChild(this.buttonElement);
    }
}

interface PluginParams extends BaseBladeParams {
    view: 'pathpicker';
    label?: string;
    path?: string;
};

export const PathPickerPlugin : BladePlugin<PluginParams> = 
    createPlugin({
        id: 'pathpicker',
        type: 'blade',
        accept(args) {
            const result = parseRecord<PluginParams>( args, (p) => ({
                view: p.required.constant('pathpicker'),
                label: p.optional.string,
                path: p.optional.string,
            }));
            return result ? {params: result} : null;
        },
        controller( args ) {
            return new PathPickerBladeController(args.document, {
                blade: args.blade,
                labelProps: ValueMap.fromObject<LabelPropsObject>({
                    label: args.params.label
                }),                
                valueController: new PathPickerController(args.document, {
                    viewProps: args.viewProps,
                }),
            } );
        },
        api(args) {
            if ( !(args.controller instanceof PathPickerBladeController) ) {
                return null;
            }
            return new PathPickerApi(args.controller);
        }
    });


export const PathPickerBundle : TpPluginBundle = {
    id: 'pathpicker',
    plugins: [
        PathPickerPlugin
    ],
    css: `
        .tp-pathpickerv_button { background-color: rgba(187, 188, 196, 0.4); width: 20px; height: 20px; flex-shrink: 0; box-sizing: border-box; border-radius: 2px; display: flex; justify-content: center; align-items: center; color: #ffe164; }
        .tp-pathpickerv_button:hover { background-color: rgba(187, 188, 196, 0.55); }
        .tp-pathpickerv_button:active { background-color: rgba(187, 188, 196, 0.65); }
        .tp-pathpickerv_button:focus { background-color: rgba(187, 188, 196, 0.7); }

        .tp-pathpickerv_text { font-size: 10px; pointer-events: none; flex: 1; min-width: 0; height: 20px; color: hsl(230, 7%, 75%); background-color: rgba(187, 188, 196, 0.1); outline: none; border-radius: 2px; box-sizing: border-box; border-width: 0; }
        .tp-pathpickerv_text:hover { background-color: rgba(187, 188, 196, 0.15); }
        .tp-pathpickerv_text:active { background-color: rgba(187, 188, 196, 0.25); }
        .tp-pathpickerv_text:focus { background-color: rgba(187, 188, 196, 0.2); }

        .tp-pathpickerv_col { display: flex; align-items: center; }
    `
};