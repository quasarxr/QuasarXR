'use client'
import styles from './styles.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

export default function EmptyCard() {
    return ( <div className={styles.card}>
        <div className={styles.iconArea}>
            <div className={styles.iconBox}>
                <FontAwesomeIcon icon={ faPlus } className={styles.icon}/>
            </div>
        </div>
        <div className={styles.textArea}>
            Create Content
        </div>
    </div>);
}