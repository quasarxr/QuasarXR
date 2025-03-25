'use client'
import { useEffect, useState, useRef, forwardRef, useImperativeHandle  } from 'react';
import { useSession } from 'next-auth/react';
import styles from './styles.module.css';
import { google_login } from '@/app/actions/auth';
import { useAuthStore } from '@/store/authStore';
import { shallow } from "zustand/shallow";

type GoogleClientData = { 
    access_token : string,
    token_type : string, 
    expires_in : number, 
    prompt : string, 
    scope : string,
}

const GoogleDrivePicker = forwardRef( function GoogleDrivePicker( { show } : { show : boolean }, ref ) {
    const [pickerInited, setPickerInited] = useState(false);
    const [gisInited, setGisInited] = useState(false);
    const tokenClientRef = useRef<any>(null);
    const [ pickFolder , setPickFolder ] = useState<string | null>( null );

    const { data: session } = useSession();
    const pickerRef = useRef(null);
    const pickerCallbacks = [];

    const accessToken = useAuthStore( state => state.accessToken );
    const expireAt = Number.parseInt( useAuthStore( state => state.expireAt ) );
    console.log( 'token expire time : ', expireAt, Date.now(), expireAt );

    const handleAuth = () => {
        console.log( 'call handleAuth' );
        useAuthStore.getState().removeAccessToken();
        return new Promise( ( resolve, reject ) => {
            if ( !tokenClientRef.current ) {
                console.error( "OAuth 클라이언트가 초기화되지 않았습니다.");
                reject("OAuth 클라이언트 미초기화");
                return;
            }

            tokenClientRef.current.callback = ( response ) => {
                const res : GoogleClientData = response;
                console.log( res );

                if ( res.access_token ) {
                    console.log("OAuth 인증 성공! Access Token:", res.access_token);
                    const newExpireAt = Date.now() + res.expires_in; // 만료 시간 계산
                    console.log( newExpireAt, Date.now() , newExpireAt - Date.now() );
                    // 전역 범위 토큰 저장
                    useAuthStore.getState().setAccessToken( res.access_token );
                    useAuthStore.getState().setTokenExpireAt( `${newExpireAt}` );
                    useAuthStore.getState().setTokenType( res.token_type );

                    if ( session ) {
                        // 세션 업데이트
                        session.accessToken = res.access_token;
                    }
                    
                    window.location.reload();
                    resolve(res.access_token);
                    console.log("handleAuth 내부 resolve 호출됨");
                }
            };
            tokenClientRef.current.requestAccessToken(); 
        } );
    };

    useEffect( () => {
        const loadGoogleAPIs = () => {
            const scriptGapi = document.createElement( 'script' );
            scriptGapi.src = 'https://apis.google.com/js/api.js';
            scriptGapi.async = true;
            scriptGapi.defer = true;
            scriptGapi.onload = () => {
                gapi.load( 'picker', () => { setPickerInited( true ) } );
            };

            document.body.appendChild( scriptGapi );

            const scriptGis = document.createElement( 'script' );
            scriptGis.src = 'https://accounts.google.com/gsi/client';
            scriptGis.async = true;
            scriptGis.defer = true;
            scriptGis.onload = () => {
                // OAuth 초기화
                tokenClientRef.current = google.accounts.oauth2.initTokenClient({
                    client_id: `${process.env.NEXT_PUBLIC_GOOGLE_DRIVE_PICKER}`,
                    scope: 'https://www.googleapis.com/auth/drive.file',
                    callback: (response) => {
                        try {
                            if ( response.access_token ) {

                                useAuthStore.getState().setAccessToken( response.access_token ); // 전역 범위 토큰 저장
                                console.log( 'tokenClientRef 토큰 저장', response.access_token );

                                if ( session ) {
                                    session.accessToken = response.access_token;
                                }
                            }
                        } catch( ex ) {
                            console.log( ex );
                        }
                    },
                });
                setGisInited(true);
            };
            document.body.appendChild(scriptGis);
        };
        
        loadGoogleAPIs();
    }, [ session, accessToken ] );

    const onButtonClicked = () => {
        if ( !accessToken ) {
            console.log( 'OAuth 토큰 없음 : Picker disabled' );
            google_login();
            return;
        }
        const view = new google.picker.DocsView( google.picker.ViewId.FOLDERS );
        view.setSelectFolderEnabled( true );

        // A simple callback implementation.
        function pickerCallback(data) {
            let url = 'nothing';
            if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
                const doc = data[google.picker.Response.DOCUMENTS][0];
                url = doc[google.picker.Document.URL];
            }
            const message = `You picked: ${url}`;
            document.getElementById('result').textContent = message;
            setPickFolder( url );
        }

        // TODO(developer): Replace with your API key
        const picker = new google.picker.PickerBuilder()
        .addViewGroup( view )
        .setOAuthToken( accessToken )
        .setDeveloperKey(`${process.env.NEXT_PUBLIC_DRIVE_PICKER_API}`)
        .setCallback(pickerCallback)
        .setAppId('quasarxr')
        .build();
        picker.setVisible(true);
    };

    const externalPickerHandle = ( token ) => {
        function pickerCallback( data ) {
            let url = 'nothing';
            if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
                const doc = data[google.picker.Response.DOCUMENTS][0];
                url = doc[google.picker.Document.URL];
                setPickFolder( url );
                pickerCallbacks.forEach( func => func( url ) );
            }
        }

        const view = new google.picker.DocsView( google.picker.ViewId.FOLDERS );
        view.setSelectFolderEnabled( true );

        const picker = new google.picker.PickerBuilder()
            .addViewGroup( view )
            .setOAuthToken( token )
            .setDeveloperKey(`${process.env.NEXT_PUBLIC_DRIVE_PICKER_API}`)
            .setCallback( pickerCallback )
            .setAppId('quasarxr')
            .build();
        picker.setVisible(true);
    };

    useImperativeHandle( ref, () => { 
        return {
             openFolder() {
                const expired = (expireAt && accessToken) ? expireAt > Date.now() : true;
                console.log( 'openFolder', expireAt, Date.now(), accessToken );
                if ( expired ) {
                    console.log( `externalPickerHandle OAuth 토큰 없음 : Picker disabled, accessToken : ${accessToken} / expireTime : ${expireAt}` );
                    try {
                        handleAuth();
                    } catch( error ) {
                        console.error( "OAuth 인증 실패 : ", error );
                        return;
                    }
                } else {                    
                    externalPickerHandle( accessToken );
                }
            },
            addCallback( func ) {
                if ( ! pickerCallbacks.includes( func ) ) {
                    console.log( 'push picker callback' );
                    pickerCallbacks.push( func );
                }
            },
            getPickFolder() {
                return pickFolder;
            },
        }
    }, [ pickerCallbacks, pickFolder, tokenClientRef, accessToken, expireAt ] );
    
    return (
        <div ref={pickerRef} style={{ display: show ? 'block' : 'none' }}>
            <button onClick={handleAuth} disabled={!gisInited}>
                Google Drive 로그인
            </button>
            <p>Picker 초기화 상태: {pickerInited ? '✅ 완료' : '⏳ 로딩 중...'}</p>
            <p>OAuth 초기화 상태: {gisInited ? '✅ 완료' : '⏳ 로딩 중...'}</p>
            <button onClick={onButtonClicked} disabled={!pickerInited || !accessToken}>
                Google Drive Picker
            </button>
            <div id={"result"}></div>
        </div>
    )
} );

export default GoogleDrivePicker;