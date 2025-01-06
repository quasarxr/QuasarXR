'use client'

import LoadingComponent from '../loading/loadingComponent';
import { CSSProperties, useEffect, forwardRef, useRef, useImperativeHandle, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { logout } from '@/app/actions/auth';
import LoginForm from '@/app/components/login/login';
import style from './style.module.css';

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

interface Props {
    mode? : string;
    url? : string;
    onload? : (() => void) | [() => void];
    size? : { width: string, height: string }
    scroll? : boolean;
}

const _scrollKeyword = 'no-scroll';

const PalletComponent = forwardRef<PalletComponentRef, Props>( ( { url, mode, onload, size, scroll = true } : Props, ref ) => {
    let PalletPromise = null;
    let engineInstance = useRef( null );
    useImperativeHandle( ref, () => ({
    }));
    
    const currentPath = usePathname();
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
        if ( engineInstance.current !== null ) {
            callback();
            console.log( session );
            engineInstance.current.updateSession( session );
        }
    }

    useEffect( () => {

        if ( PalletPromise === null ) {
            PalletPromise = import ( '@/PalletEngine/module' );
            PalletPromise.then( pallet => {
                pallet._engineFactory( { mode : mode }, ( engine ) => {
                    engineInstance.current = engine;
                    if ( url ) {
                        engine.loadGLTF( url, gltf => {
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
            } );
        }

        if ( !scroll ) {
            document.body.classList.add( _scrollKeyword );
            return () => document.body.classList.remove( _scrollKeyword );
        }

    } );

    useEffect( () => {
        sessionRef.current = session;
        updateEngineSession( session, () => console.log( 'session updated' ) );
    }, [ session ] );

    return (
        <div id='canvas-container' style={style}>
            <LoginForm isLogin={showLogin} setIsLogin={setShowLogin} redirect={currentPath}></LoginForm>
            <LoadingComponent ref={loadingRef} style={{zIndex: 2}}/>
            <canvas className="view" ref={canvasRef} style={{width: "100%", height: "100%" } }></canvas>
        </div>
    )
});

PalletComponent.displayName = 'PalletComponent';
export default PalletComponent;