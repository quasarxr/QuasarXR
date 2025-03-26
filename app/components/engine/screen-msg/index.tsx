'use client'
import {
    useState,
    forwardRef,
    useImperativeHandle
} from 'react';

import styles from './styles.module.css'

interface ScreenMsgProps {
    message? : string
    show? : boolean
}
  
interface ScreenMsgRef {
    showMsg: ( text : string ) => void;
}

const ScreenMessage = forwardRef<ScreenMsgRef, ScreenMsgProps>(
    ({ message, show }, ref) => {       
        const [ textMessage, setTextMessage ] = useState( message );
        const [ showMesage, setShowMessage ] = useState( false );
        useImperativeHandle(ref, () => ({
            showMsg( text : string ) {
                setTextMessage( text );
                setShowMessage( true );
                setTimeout( () => {
                    setShowMessage( false );
                }, 2000 );
            }
        }), []);
        return (
            <div className={styles.msg_outer} style={{ display: showMesage ? 'block' : 'none' }}>
                <span className={styles.msg_text}>{textMessage}</span>
            </div>
        );
});

export default ScreenMessage;