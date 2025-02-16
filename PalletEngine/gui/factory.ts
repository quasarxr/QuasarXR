import { Pane, FolderApi, ButtonApi, InputBindingApi, TabPageApi, TabApi, BindingParams, BladeApi, ListBladeApi, TextBladeApi } from 'tweakpane';
import { BindingApi } from '@tweakpane/core';


interface PanePrimitive { value : number | boolean | string };
interface PaneVector2 { x : number, y : number };
interface PaneVector3 { x : number, y : number, z : number };
interface PaneVector4 { x : number, y : number, z : number, w : number };
interface PaneColor { r: 255, g: 255, b: 255, a: 255 };

type PaneParamType = PanePrimitive | PaneVector2 | PaneVector3 | PaneVector4 | PaneColor;

interface GUI_INTERFACE { title : string, emit : string, cat : string, binding : PaneParamType, option : BindingParams };

const _guiJSON = {
    "system" : [

    ],
    "creator" : [

    ],
    "transform" : [

    ],
    "material" : [
        
    ]
};

class PalletGUIFactory {
    constructor() {

    }
}

export { PalletGUIFactory };