'use client'
import styles from './styles.module.css';
import { useState } from 'react';

type ComponentParam = {
    process? : () => void;
    callback? : () => void;
}

export default function LoadingComponent( payload : ComponentParam ) {
    const [ isVisible, setIsVisible ] = useState( true );
    return (
    <div className={styles.wrapper}>
        { isVisible && <div className={styles.loader}></div> }
        { isVisible && <div className={styles.loadingText}>Loading</div> }
    </div>)
}