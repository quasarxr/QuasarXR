'use client'
import styles from './styles.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp, faHeart, faComment, faBars } from '@fortawesome/free-solid-svg-icons';
import CardThumbnail from '../thumbnail';
import Link from 'next/link';

interface Props {
    title : string;
    name : string;
    like? : number;
    favorite? : number;
    comment? : number;
    user_id? : string;
    content_id? : string;
}
export default function Card( props : Props) {
    const assetRoute = `/user/${props.user_id}/${props.content_id}`;
    return (
    <Link className={styles.customLink} href={assetRoute}>
        <div className={styles.card}>
            <div>
                <CardThumbnail/>
            </div>
            <section className={styles.textArea}>
                <div>{ props.title }</div>
                <div>{ props.name } </div>
            </section>
            <div className={styles.iconArea}>
                <div className={styles.iconBox}>
                    <FontAwesomeIcon icon={ faThumbsUp } className={styles.icon}/>
                    <div className={styles.iconText}>
                        { `${props.like}` }
                    </div>
                </div>

                <div className={styles.iconBox}>
                    <FontAwesomeIcon icon={ faHeart } className={styles.icon}/>
                    <div className={styles.iconText}>
                        { `${props.favorite}` }
                    </div>
                </div>
                
                <div className={styles.iconBox}>
                    <FontAwesomeIcon icon={ faComment } className={styles.icon}/>
                    <div className={styles.iconText}>
                        { `${props.comment}` }
                    </div>
                </div>
            </div>
        </div>
    </Link>
    );
}