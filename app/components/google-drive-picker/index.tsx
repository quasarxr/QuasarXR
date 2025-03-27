'use client'
import { 
  useEffect, 
  useState, 
  useRef, 
  forwardRef, 
  useImperativeHandle 
} from 'react';
import { useSession } from 'next-auth/react';
import { google_login } from '@/app/actions/auth';
import { useAuthStore } from '@/store/authStore';

// Type definitions for better type safety
interface GoogleClientData {
  access_token: string;
  token_type: string;
  expires_in: number;
  prompt: string;
  scope: string;
}

interface GoogleDrivePickerProps {
  show: boolean;
}

interface GoogleDrivePickerRef {
  openFolder: () => void;
  addCallback: (func: (url: string) => void) => void;
  getPickFolder: () => string | null;
}

// 빌드시 참조 오류 > 별도 타입 선언
declare global {
  interface Window {
    gapi: any;
    google: any;
  }

  const gapi: any;
  const google: any;
}

const GoogleDrivePicker = forwardRef<GoogleDrivePickerRef, GoogleDrivePickerProps>(
  function GoogleDrivePicker({ show }, ref) {
    // State management
    const [pickerInited, setPickerInited] = useState(false);
    const [gisInited, setGisInited] = useState(false);
    const [pickFolder, setPickFolder] = useState<string | null>(null);

    // Refs
    const tokenClientRef = useRef<any>(null);
    const pickerRef = useRef(null);
    const pickerCallbacksRef = useRef<Array<(url: string, token: string) => void>>([]);

    // Session and authentication
    const { data: session } = useSession();
    const accessToken = useAuthStore(state => state.accessToken);
    const expireAt = Number.parseInt(useAuthStore(state => state.expireAt));

    // Authentication handler
    const handleAuth = async () => {
      try {
        // Remove existing token
        useAuthStore.getState().removeAccessToken();

        if (!tokenClientRef.current) {
          throw new Error("OAuth 클라이언트가 초기화되지 않았습니다.");
        }

        return new Promise((resolve, reject) => {
          tokenClientRef.current.callback = (response: GoogleClientData) => {
            if (response.access_token) {
              const newExpireAt = Date.now() + response.expires_in * 1000;
              
              // Update auth store
              const authStore = useAuthStore.getState();
              authStore.setAccessToken(response.access_token);
              authStore.setTokenExpireAt(`${newExpireAt}`);
              authStore.setTokenType(response.token_type);

              // Update session if exists
              if (session) {
                session.accessToken = response.access_token;
              }
              
              // Reload to apply new token
              window.location.reload();
              resolve(response.access_token);
            } else {
              reject(new Error("No access token received"));
            }
          };

          tokenClientRef.current.requestAccessToken();
        });
      } catch (error) {
        console.error("Authentication error:", error);
        throw error;
      }
    };

    // Load Google APIs
    useEffect(() => {
      const loadGoogleAPIs = () => {
        // Load Gapi script
        const scriptGapi = document.createElement('script');
        scriptGapi.src = 'https://apis.google.com/js/api.js';
        scriptGapi.async = true;
        scriptGapi.defer = true;
        scriptGapi.onload = () => {
          gapi.load('picker', () => { setPickerInited(true) });
        };
        document.body.appendChild(scriptGapi);

        // Load Google Identity Services script
        const scriptGis = document.createElement('script');
        scriptGis.src = 'https://accounts.google.com/gsi/client';
        scriptGis.async = true;
        scriptGis.defer = true;
        scriptGis.onload = () => {
          // Initialize OAuth client
          tokenClientRef.current = google.accounts.oauth2.initTokenClient({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_PICKER || '',
            scope: 'https://www.googleapis.com/auth/drive.file',
            callback: (response: GoogleClientData) => {
              try {
                if (response.access_token) {
                  useAuthStore.getState().setAccessToken(response.access_token);

                  if (session) {
                    session.accessToken = response.access_token;
                  }
                }
              } catch (ex) {
                console.error('Token initialization error:', ex);
              }
            },
          });
          setGisInited(true);
        };
        document.body.appendChild(scriptGis);
      };
      
      loadGoogleAPIs();
    }, [session, accessToken]);

    // Open Google Drive Picker
    const openDrivePicker = () => {
      if (!accessToken) {
        console.log('OAuth 토큰 없음 : Picker disabled');
        google_login();
        return;
      }

      const view = new google.picker.DocsView(google.picker.ViewId.FOLDERS);
      view.setSelectFolderEnabled(true);

      const uploadToGoogleDrive = async ( folderId ) => {
        try {
          const metadata = {
            name : 'untitled.glb',
            parents: [folderId]
          };
          const formData = new FormData();
          formData.append('metadata', new Blob( [JSON.stringify(metadata)], { type: "application/json" }));
          formData.append('file', new Blob( [ "0," ], { type: "application/octet-stream" }));

          const response = await fetch(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
            {
              method: 'POST',
              headers: { 
                Authorization: `Bearer ${accessToken}` 
              },
              body: formData
            }
          );
          const res = await response.json();
          if ( res.id ) {
            alert('File uploaded successfully!');
          } else {
            alert('Upload failed');
          }
        } catch(error) {
          console.error('Upload error:', error);
          alert('Upload failed');
        }
      }

      // Picker callback
      const pickerCallback = (data: any) => {
        if (data.action === google.picker.Action.PICKED) {
          const folder = data.docs[0];
          
          setPickFolder(folder.id);
          
          // Trigger all registered callbacks
          pickerCallbacksRef.current.forEach(func => func(folder.id, accessToken));
        }
      };

      // Create and show picker
      const picker = new google.picker.PickerBuilder()
        .addViewGroup(view)
        .setOAuthToken(accessToken)
        .setDeveloperKey(process.env.NEXT_PUBLIC_DRIVE_PICKER_API || '')
        .setCallback(pickerCallback)
        .setAppId('quasarxr')
        .build();
      
      picker.setVisible(true);
    };

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      openFolder() {
        const isTokenExpired = (expireAt && accessToken) 
          ? Date.now() - expireAt > 0 
          : true;

        if (isTokenExpired) {
          console.log(`Token expired. Refreshing authentication.`);
          handleAuth().then(() => {
            // Authentication refreshed, picker will be opened after reload
          }).catch(error => {
            console.error("Authentication refresh failed:", error);
          });
        } else {
          openDrivePicker();
        }
      },
      addCallback(func) {
        if (!pickerCallbacksRef.current.includes(func)) {
          pickerCallbacksRef.current.push(func);
        }
      },
      getPickFolder() {
        return pickFolder;
      },
    }), [pickerCallbacksRef, pickFolder, accessToken, expireAt]);
    
    return (
      <div ref={pickerRef} style={{ display: show ? 'block' : 'none' }}>
        <button onClick={handleAuth} disabled={!gisInited}>
          Google Drive 로그인
        </button>
        <p>
          Picker 초기화 상태: 
          {pickerInited ? '✅ 완료' : '⏳ 로딩 중...'}
        </p>
        <p>
          OAuth 초기화 상태: 
          {gisInited ? '✅ 완료' : '⏳ 로딩 중...'}
        </p>
        <button 
          onClick={openDrivePicker} 
          disabled={!pickerInited || !accessToken}
        >
          Google Drive Picker
        </button>
        <div id="result"></div>
      </div>
    );
  }
);

export default GoogleDrivePicker;