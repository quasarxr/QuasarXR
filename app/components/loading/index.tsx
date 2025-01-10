'use client'
import styles from './styles.module.css';
import { useRef, forwardRef, useImperativeHandle } from 'react';
import { CSSProperties } from 'react';

interface Props {
    style? : CSSProperties;
    onprocess? : () => void;
    onloaded? : () => void;
}

const LoadingComponent = forwardRef( ( props : Props, ref ) => {
    const wrapper = useRef( null );
    
    useImperativeHandle( ref, () => ({
        show() {
            wrapper.current.style.display = 'block';
        },
        hide() {
            wrapper.current.style.display = 'none';
        }
    }));
    
    return (
    <div className={styles.wrapper} ref={wrapper} style={{ ...( props.style ? props.style : {}) }}>
        <div className={styles.loader}></div>
        <div className={styles.loadingText}>Loading</div>
    </div>)
} );

LoadingComponent.displayName = 'LoadingComponent';
export default LoadingComponent;