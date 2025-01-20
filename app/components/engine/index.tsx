'use client'

import LoadingComponent from '../loading';
import { CSSProperties, useEffect, forwardRef, useRef, useImperativeHandle, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { logout } from '@/app/actions/auth';
import LoginForm from '@/app/components/login';

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

const PalletComponent = forwardRef<PalletComponentRef, Props>( ( { url = undefined, mode, onload, preload, size, scroll = true } : Props, ref ) => {
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
    const [ engineInstance, setEngineInstance ] = useState( null );
    const loginCallback = () => setShowLogin(true);
    const logoutCallback = () => logout().then( () => {} );

    const updateEngineSession = ( session, callback ) => {
        if ( engineInstance ) {
            callback();
            engineInstance.updateSession( session );
        }
    }

    const loadGLB = ( dataURL ) => {
        if ( engineInstance && dataURL !== null && dataURL !== '' ) {
            engineInstance.loadGLTF( dataURL, gltf => {
                if ( onload ) onload( gltf );
            }, true );
        }
    }

    // TODO : refactoring here
    useEffect( () => {
        if ( _PalletPromise === null ) {
            _PalletPromise = import ( '@/PalletEngine/module' );
            _PalletPromise.then( pallet => {
                _Module = pallet;
                pallet._engineFactory( { mode : mode }, ( engine ) => {
                    setEngineInstance( engine );

                    if ( preload ) preload( engine );

                    //loadGLB( url );
                    if ( loadingRef.current ) {
                        loadingRef.current.hide();
                    }
                    //engine.resizeRenderer( { canvas : canvasRef.current } );
                    
                    pallet._createAuthController( sessionRef.current, loginCallback, logoutCallback );
                } );
            } ).finally( () => {
                _PalletPromise = null;
            } );
        }

        if ( !scroll ) {
            document.body.classList.add( _scrollKeyword );
        }

        return () => {
            document.body.classList.remove( _scrollKeyword );
            if ( _Module ) {
                _Module._dispose();
            }           
        }
    }, [] );

    useEffect( () => {
        loadGLB( url );
    }, [ url, engineInstance ] );

    useEffect( () => {
        sessionRef.current = session;
        updateEngineSession( session, () => {} );
    }, [ session, engineInstance ] );

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