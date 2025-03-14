'use client'
import '@googleworkspace/drive-picker-element';
import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import styles from './styles.module.css';


export default function GoogleDrivePicker() {
    const [pickerInited, setPickerInited] = useState(false);
    const [gisInited, setGisInited] = useState(false);
    const tokenClientRef = useRef<any>(null);
    const accessTokenRef = useRef<string | null>(null);

    const { data: session } = useSession();
    const pickerRef = useRef(null);
    

    useEffect( () => {

        const loadGoogleAPIs = () => {
            const scriptGapi = document.createElement( 'script' );
            scriptGapi.src = 'https://apis.google.com/js/api.js';
            scriptGapi.async = true;
            scriptGapi.defer = true;
            scriptGapi.onload = () => {
                gapi.load( 'picker', () => { setPickerInited( true ) } );
            };

            pickerRef.current.appendChild( scriptGapi );

            const scriptGis = document.createElement( 'script' );
            scriptGis.src = 'https://accounts.google.com/gsi/client';
            scriptGis.async = true;
            scriptGis.defer = true;
            scriptGis.onload = () => {
                // OAuth 초기화
                tokenClientRef.current = google.accounts.oauth2.initTokenClient({
                    client_id: process.env.GOOGLE_CLIENT_ID!,
                    scope: 'https://www.googleapis.com/auth/drive.readonly',
                    callback: (response) => {
                        if (response.access_token) {
                            accessTokenRef.current = response.access_token;
                            console.log('Access Token:', response.access_token);
                        }
                    },
                });
                setGisInited(true);
            };
            pickerRef.current.appendChild(scriptGis);
        };
        
        loadGoogleAPIs();
    }, [] );
    
    const handleAuth = () => {
        if (tokenClientRef.current) {
            tokenClientRef.current.requestAccessToken();
        }
    };
        
    useEffect( () => {
        if ( session ) {
            console.log('!!!!picker', session.accessToken);
        }
    }, [ session ] );
    
    return (
        <div ref={pickerRef}>
            <button onClick={handleAuth} disabled={!gisInited}>
                Google Drive 로그인
            </button>
            <p>Picker 초기화 상태: {pickerInited ? '✅ 완료' : '⏳ 로딩 중...'}</p>
            <p>OAuth 초기화 상태: {gisInited ? '✅ 완료' : '⏳ 로딩 중...'}</p>
        </div>
    )
}