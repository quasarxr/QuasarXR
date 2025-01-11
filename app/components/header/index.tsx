'use client'
import styles from './styles.module.css';
import SignupForm from '../signup';
import LoginForm from '../login';
import { logout } from '@/app/actions/auth'; 
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';


export default function Header() {
    const [ language, setLanguage ] = useState( 'Eng' );
    const [showSignup, setShowSignup] = useState(false);
    const handleSignClick = () => setShowSignup(true);
    const [showLogin, setShowLogin ] = useState(false);
    const handleLoginClick = () => setShowLogin(true);
    const handleLogoutClick = () => {
        logout().then( () => {
        } );
    }
    const { data : session } = useSession();
    const showCommercialMenu = true;

    const router = useRouter();
    const routeHandler = ( link : string ) => ( event => router.push( link ) )

    return (
        <section>
            <div className={styles['layout-head']}>
                <SignupForm isSignedUp={showSignup} setIsSignedUp={setShowSignup}/>
                <LoginForm isLogin={showLogin} setIsLogin={setShowLogin}/>
                
                <div className={styles['content-area']}>
                    <div className={styles['button-link']} onClick={routeHandler('/')}>{ language ? 'QuasarXR' : '로고' }</div>
                    <div className={styles['button-link']} onClick={routeHandler('/feature')}>{ language ? 'Feature' : '특징' }</div>
                    <div className={styles['button-link']} onClick={routeHandler('/empty')}>{ language ? 'Creator' : '만들기' }</div>
                    <div className={styles['button-link']} onClick={routeHandler('/explorer')}>{ language ? 'Explorer' : '탐색' }</div>
                    <div className={styles['button-link']} onClick={routeHandler('/help')}>{ language ? 'Help' : '도움말' }</div>
                    { session?.user?.email && <div className={styles['auth-text']}> {session.user.username} </div> }
                    { session?.user?.email && <div className={styles['button-link']} onClick={handleLogoutClick}>{ language ? 'Logout' : '나가기' }</div> }
                    { ! session?.user?.email && <div className={styles['button-link']} onClick={handleSignClick}>{ language ? 'Signup' : '가입하기' }</div> }
                    { ! session?.user?.email && <div className={styles['button-link']} onClick={handleLoginClick}>{ language ? 'Login' : '들어가기' }</div> }
                </div>
            </div>
        </section>
    )
}