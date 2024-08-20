import { Pane, FolderApi, ButtonApi, InputBindingApi } from 'tweakpane';
import FileUtil from '../utils/file';
import EventEmitter from '../gui/event';

type GuiComponent = FolderApi | ButtonApi | InputBindingApi<any> ;
const _GuiIDs = [ 'property-panel', 'oncanvas-menu', 'top-menu', 'footer-menu', 'scene-graph' ];

interface guiInterface {
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
    guiMap : Map<string, guiInterface>;
    propMap : Map<string, any>;

    constructor( mode : string ) {
        this.initialize( mode );
    }

    initialize( mode : string ) {
        this.paneMap = new Map();
        _GuiIDs.forEach( name => {
            this.createPane( name ).hidden = true;
        } );

        this.configProperty();
    }

    createPane( id : string, container : HTMLElement = null ) : PalletPane {
        this.paneMap.set( id, new PalletPane( { container: container } as PaneConfig ) );
        return this.paneMap.get( id );
    }

    createCustomElement() {
        return document.createElement('div');
    }

    update( delta ) {

    }

    dispose() {
        this.paneMap.forEach( ( value : Pane, key : string ) => {
            value.dispose();
        } );
    }

    getPane( id : string ) {
        return this.paneMap.get( id );
    }

    configProperty() {
        const params = {
            Import : function() {

            }
        };
        
        const inst = this.paneMap.get('property-panel');
        inst.hidden = false;
        const tab = inst.addTab( {
            pages: [
                { title: 'System' },
                { title: 'Object' },
                { title: 'Property' },
            ]
        } );
        
        const glbBtn = tab.pages[0].addButton( {
            title: 'ImportGLB'
        } );

        this.propertyData.forEach( el => {
            tab.pages[1].addButton( { title: el.title } );
        } )
                
        glbBtn.on( 'click', () => {
            const f = FileUtil.FileSelector();
            f.addEventListener( "change", () => {
                EventEmitter.emit( 'glbopen', URL.createObjectURL( f.files[0] ) );
            } );
        } );
    }

    get propertyData() {
        return [ 
            { title: 'Box', emit: 'createbox' },
            { title: 'Sphere', emit: 'createshere' },
            { title: 'Plane', emit: 'createplane' },
            { title: 'Corn', emit: 'createcorn' },
            { title: 'Cylinder', emit: 'createcylinder' },
            { title: 'DirLight', emit: 'dirlight' },
            { title: 'PointLight', emit: 'pointlight' },
            { title: 'SpotLight', emit: 'spotlight' },
            { title: 'HemisphereLight', emit: 'hemilight' },
        ];
    }

    get systemData() {
        return [
            { title: 'Import', emit: 'glbopen' }
        ]
    }
}