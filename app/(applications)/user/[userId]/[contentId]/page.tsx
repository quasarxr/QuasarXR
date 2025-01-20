'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import PalletComponent from '@/app/components/engine';
import { fileBuffer } from '@/app/actions/contents';



export default function userPage() {

    const { userId, contentId } = useParams<{ userId : string; contentId : string }>();
    const [contentURL, setContentURL] = useState( null );

    async function requestFileURL( userId, contentId ) {
        const blob = await fileBuffer( userId, contentId );
        const url = URL.createObjectURL( blob );
        return url;
    }

    useEffect( () => {
        requestFileURL( userId, contentId ).then( res => {
            setContentURL( res );
        })
    }, [] );

    return (
        <div>
            <PalletComponent url={contentURL} mode={"editor"} size={{ width : "100vw", height: "100vh" }} scroll={false}/>
        </div>
    )

}