'use client'
import { useEffect, useState, useRef, forwardRef, useImperativeHandle  } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import styles from './styles.module.css';
import { google_login } from '@/app/actions/auth';
import GoogleDriveUploader from './google-drive-uploader';

const GoogleDrivePicker = forwardRef( function GoogleDrivePicker( { show } : { show : boolean }, ref ) {
    const [pickerInited, setPickerInited] = useState(false);
    const [gisInited, setGisInited] = useState(false);
    const tokenClientRef = useRef<any>(null);
    const [accessToken, setAccessToken ] = useState<string | null>( null );
    const [ pickFolder , setPickFolder ] = useState<string | null>( null );

    const { data: session, update } = useSession();
    const pickerRef = useRef(null);
    const pickerCallbacks = [];
    
    const handleAuth = () => {
        return new Promise( ( resolve, reject ) => {

            if ( !tokenClientRef.current ) {
                console.error( "OAuth 클라이언트가 초기화되지 않았습니다.");
                reject("OAuth 클라이언트 미초기화");
                return;
            }

            tokenClientRef.current.callback = async (response) => {
                console.log( 'token callback 1 ' );
                if (response.error) {
                    console.error("OAuth 인증 실패:", response.error);
                    reject(response.error);
                    return;
                }

                console.log("OAuth 인증 성공! Access Token:", response.access_token);
                setAccessToken(response.access_token);
                session.accessToken = response.access_token;
                resolve(response.access_token);
                console.log("handleAuth 내부 resolve 호출됨");
            }
            
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
                        console.log('callback request Token:', response.access_token );
                        try {
                            if ( response.access_token ) {
                                setAccessToken( response.access_token );
                                if ( session ) {
                                    console.log('update session Token:', response.access_token);
                                    session.accessToken = response.access_token;
                                }
                                console.log('Access Token:', response.access_token);
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

        return () => {
        }
    }, [ session ] );

    useEffect( () => {
        if ( session?.accessToken && !accessToken ) {
            console.log( session, 'session update' );
            //setAccessToken( session.accessToken );
            openPicker1();
        }        
    }, [session?.accessToken]);
    

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

    function pickerCallback1( data ) {
        let url = 'nothing';
        if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
            const doc = data[google.picker.Response.DOCUMENTS][0];
            url = doc[google.picker.Document.URL];
        }
        setPickFolder( url );
        pickerCallbacks.forEach( func => func( url ) );
    }

    const openPicker = () => {
        if ( !session?.accessToken ) {
            console.log( 'OAuth 토큰 없음 : Picker disabled' );
            google_login();
            return;
        }
        const view = new google.picker.DocsView( google.picker.ViewId.FOLDERS );
        view.setSelectFolderEnabled( true );

        // TODO(developer): Replace with your API key
        const picker = new google.picker.PickerBuilder()
        .addViewGroup( view )
        .setOAuthToken(session?.accessToken)
        .setDeveloperKey(`${process.env.NEXT_PUBLIC_DRIVE_PICKER_API}`)
        .setCallback(pickerCallback)
        .setAppId('quasarxr')
        .build();
        picker.setVisible(true);
    };

    const openPicker1 = async () => {

        console.log("Current Access Token:", session );

        if ( !session?.accessToken ) {
            console.log( 'OAuth 토큰 없음 : Picker disabled' );
            try {
                await handleAuth();
                console.log( 'OAuth 인증 완료! Picker 실행' );
            } catch( error ) {
                console.error( "OAuth 인증 실패 : ", error );
                return;
            }
        }
        const view = new google.picker.DocsView( google.picker.ViewId.FOLDERS );
        view.setSelectFolderEnabled( true );
        console.log( session, accessToken );
        // TODO(developer): Replace with your API key
        const picker = new google.picker.PickerBuilder()
            .addViewGroup( view )
            .setOAuthToken(session?.accessToken)
            .setDeveloperKey(`${process.env.NEXT_PUBLIC_DRIVE_PICKER_API}`)
            .setCallback(pickerCallback1)
            .setAppId('quasarxr')
            .build();
        picker.setVisible(true);
    };

    useImperativeHandle( ref, () => { 
        return {
            openFolder() {
                openPicker1();
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
    }, [ session ]);
    
    return (
        <div ref={pickerRef} style={{ display: show ? 'block' : 'none' }}>
            <button onClick={handleAuth} disabled={!gisInited}>
                Google Drive 로그인
            </button>
            <p>Picker 초기화 상태: {pickerInited ? '✅ 완료' : '⏳ 로딩 중...'}</p>
            <p>OAuth 초기화 상태: {gisInited ? '✅ 완료' : '⏳ 로딩 중...'}</p>
            <button onClick={openPicker} disabled={!pickerInited || !accessToken}>
                Google Drive Picker
            </button>
            <div id={"result"}></div>
        </div>
    )
} );

export default GoogleDrivePicker;