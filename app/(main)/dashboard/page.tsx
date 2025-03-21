'use client'
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Card from '@/app/components/dashboard/card';
import EmptyCard from '@/app//components/dashboard/empty';
import styles from './styles.module.css';
import { contentList } from '@/app/actions/contents';
import { useRouter } from 'next/navigation';
import GoogleDrivePicker from '../../components/google-drive-picker';

export default function dashboardPage() {

    const { data : session } = useSession();
    const [userItems, setUserItems] = useState([]);
    const router = useRouter();

    async function fetchUserContents( user_id ) {
        const list = await contentList( user_id );
        return list.data;
    };

    useEffect( () => {
        if ( session ) {
            if ( session.user && session.user.user_id ) {
                fetchUserContents( session?.user?.user_id ).then( data => {
                    setUserItems( data );
                } );
            }
        } else {
            router.push( '/' );
        }    
    }, [session] );

    return (
        <div className={styles.mainArea}>
            <Link className={styles.customLink} href="/empty"><EmptyCard/></Link>
            <GoogleDrivePicker show={true}></GoogleDrivePicker>
            {userItems.map( ( item, index ) => 
                (<Card 
                    key={item.id || index} 
                    title={item.title || "Untitled"} 
                    name={item.username || "anonymous" } 
                    like={item.like_count || 0} 
                    favorite={item.favorite_count || 0} 
                    comment={0}
                    user_id={item.user_id}
                    content_id={item.id}/>
                ) ) }
        </div>
    )
}