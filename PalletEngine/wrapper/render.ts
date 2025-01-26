import { WebGLRenderer } from 'three';

enum PowerPreference { HighPerformance = "high-performance", LowPower = "low-power", Default = "default" };

export type RenderOptions = {
    canvas : HTMLCanvasElement,
    context? : RenderingContext,
    alpha? : boolean,
    precision? : string,
    premultipliedAlpha? : boolean,
    antialias? : boolean,
    logarithmicDepthBuffer? : boolean,
    depth? : boolean,
    stencil? : boolean,
    preserveDrawingBuffer? : boolean,
    powerPreference? : PowerPreference
}

export class PalletRenderer {
    static renderer : WebGLRenderer = null;
    static canvas : HTMLCanvasElement = null;
    static option : RenderOptions = { alpha: true } as RenderOptions;
    static Get() {
        if ( ! PalletRenderer.renderer ) {
            PalletRenderer.Create( {} as RenderOptions );
        }
        return PalletRenderer.renderer;
    }
    
    static Canvas() {
        if ( PalletRenderer.renderer ) { 
            return PalletRenderer.renderer.domElement;
        }
        return null;
    }

    static Create( opt : RenderOptions ) : WebGLRenderer {
        PalletRenderer.renderer = new WebGLRenderer( opt );
        return PalletRenderer.renderer;
    }

    static Release() {
        PalletRenderer.renderer.dispose();
    }

    static AnimationLoop( func : Function ) {
        
    }
}
