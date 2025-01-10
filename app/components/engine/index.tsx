'use client'

import LoadingComponent from '../loading/loadingComponent';
import { CSSProperties, useEffect, forwardRef, useRef, useImperativeHandle, useState, memo } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { logout } from '@/app/actions/auth';
import LoginForm from '@/app/components/login/login';

export interface PalletComponentRef {
    /** */
}

//strict mode
// function forward() {
//     window.history.forward();
// }

// function back() {
//     window.history.back();
// }

let _PalletPromise = null;
let _EngineInstance = null;
let _Module = null; //TODO : remove this variable

interface Props {
    mode? : string;
    url? : string;
    onload? : ( data : any ) => void;
    preload? : ( engine : any ) => void;
    size? : { width: string, height: string };
    scroll? : boolean;
}

const _scrollKeyword = 'no-scroll';

const PalletComponent = forwardRef<PalletComponentRef, Props>( ( { url, mode, onload, preload, size, scroll = true } : Props, ref ) => {
    useImperativeHandle( ref, () => ({
    }));
    
    const currentPath = usePathname();
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const loadingRef = useRef(null);
    const sessionRef = useRef(null);
    const { data : session } = useSession();

    const style : CSSProperties = { display: 'inline-block', position: 'relative', width: size ? size.width : 'inherit', height: size ? size.height : 'inherit', };

    // declare session
    // declare login form
    const [ showLogin, setShowLogin ] = useState(false);
    const loginCallback = () => setShowLogin(true);
    const logoutCallback = () => logout().then( () => {} );

    const updateEngineSession = ( session, callback ) => {
        if ( _EngineInstance !== null ) {
            callback();
            console.log( session );
            _EngineInstance.updateSession( session );
        }
    }

    useEffect( () => {

        if ( _PalletPromise === null ) {
            console.log( 'Create Renderer' );
            _PalletPromise = import ( '@/PalletEngine/module' );
            _PalletPromise.then( pallet => {
                _Module = pallet;
                console.log( _PalletPromise, _Module );
                pallet._engineFactory( { mode : mode }, ( engine ) => {
                    _EngineInstance = engine;

                    if ( preload ) preload( engine );

                    if ( url ) {
                        engine.loadGLTF( url, gltf => {
                            if ( onload ) onload( gltf );
                            engine.sceneGraph.add( gltf.scene );
                        } );
                    }
                    if ( loadingRef.current ) {
                        loadingRef.current.hide();
                    }
                    //engine.resizeRenderer( { canvas : canvasRef.current } );

                    if ( sessionRef.current !== null ) {
                        updateEngineSession( sessionRef.current, () => {} );
                    }
                    
                    pallet._createAuthController( null, loginCallback, logoutCallback );
                } );
            } ).finally( () => {
                console.log( 'promise null' );
                _PalletPromise = null;
            } );
        }

        if ( !scroll ) {
            document.body.classList.add( _scrollKeyword );
        }

        return () => {
            console.log( 'return module : ', _Module );
            document.body.classList.remove( _scrollKeyword );
            _Module._dispose();
        }


    }, [] );

    useEffect( () => {
        sessionRef.current = session;
        updateEngineSession( session, () => console.log( 'session updated' ) );
    }, [ session ] );

    return (
        <div id='canvas-container' ref={containerRef} style={style}>
            { mode === 'editor' && <LoginForm isLogin={showLogin} setIsLogin={setShowLogin} redirect={currentPath}></LoginForm> }
            <LoadingComponent ref={loadingRef} style={{zIndex: 2}}/>
            <canvas className="view" ref={canvasRef} style={{width: "100%", height: "100%" } }></canvas>
        </div>
    )
});

PalletComponent.displayName = 'PalletComponent';
export default PalletComponent;