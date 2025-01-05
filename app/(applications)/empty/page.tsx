'use client'

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import * as THREE from 'three'
import '@/styles/global.css'
import { useSession } from 'next-auth/react';
import styles from './styles.module.css';
import { login, logout } from '@/app/actions/auth';
import { LoginFormState } from '@/app/lib/definitions';
import LoginForm from '@/app/components/login/login';

let PalletPromise = null;

export default function Page() {
  //strict mode
  function forward() {
    window.history.forward();
  }
  function back() {
    window.history.back();
  }
    
  const { data : session, status } = useSession();
  const engineRef = useRef( null );
  const sessionRef = useRef( null );
  const router = useRouter();
  const pathName = usePathname();

  const [showLogin, setShowLogin ] = useState(false);
  const handleLoginClick = () => setShowLogin(true);

  const updateSession = ( session, status, callback ) => {
    if ( engineRef.current !== null ) {
      callback();
      engineRef.current.updateSession( session );
      console.log( session, status );


    }
  }

  useEffect( () => {
    if ( PalletPromise === null ) {
      PalletPromise = import( '../../../PalletEngine/module' );
      PalletPromise.then( pallet => {
        pallet._engineFactory( { mode : 'editor' }, ( engine ) => {
          console.log( engine, 'engine initialized' );
          engineRef.current = engine;

          pallet._createAuthController( null, () => {
            console.log( 'login registered' );
            handleLoginClick();
          }, () => {
            console.log( 'logout registered' );
            logout().then( () => {
              console.log( 'logout' );
              //engineRef.current.updateSession( null );
            } );
          } );

          if ( sessionRef.current !== null ) {
            updateSession( sessionRef.current, undefined, () => console.log('engine first') );
          }
        } );
      } );
    }
  }, [] );

  useEffect( () => {
    sessionRef.current = session;
    updateSession( session, status, () => console.log('session first') );
  }, [ session, status ] );

  const styleText = {
    width: "100%",
    height: "100%",
    background: "#3c3c3c"
  } ;



  return (
  <div style={styleText}>    
    <div>
      <LoginForm isLogin={showLogin} setIsLogin={setShowLogin} redirect={pathName}/>
      <canvas style={styleText} className="view"></canvas>
    </div>
  </div> );
}