'use client'
import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import styles from './styles.module.css';
import "@googleworkspace/drive-picker-element";
import {  google_login } from '@/app/actions/auth';


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
                        if (response.access_token) {
                            accessTokenRef.current = response.access_token;
                            console.log('Access Token:', response.access_token);
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
    }, [] );
    
    const handleAuth = () => {
        if (tokenClientRef.current) {
            tokenClientRef.current.requestAccessToken();
        }
    };

    // A simple callback implementation.
    function pickerCallback(data) {
        let url = 'nothing';
        if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
            const doc = data[google.picker.Response.DOCUMENTS][0];
            url = doc[google.picker.Document.URL];
        }
        const message = `You picked: ${url}`;
        document.getElementById('result').textContent = message;
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
        
    useEffect( () => {
    }, [ session?.accessToken ] );
    
    return (
        <div ref={pickerRef}>
            <button onClick={handleAuth} disabled={!gisInited}>
                Google Drive 로그인
            </button>
            <p>Picker 초기화 상태: {pickerInited ? '✅ 완료' : '⏳ 로딩 중...'}</p>
            <p>OAuth 초기화 상태: {gisInited ? '✅ 완료' : '⏳ 로딩 중...'}</p>
            <button onClick={openPicker} disabled={!pickerInited || !session?.accessToken}>
                Google Drive Picker
            </button>
            <div id={"result"}></div>
        </div>
    )
}