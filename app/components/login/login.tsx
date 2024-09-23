'use client'
import React from 'react';
import { useState, useEffect } from 'react';
import { useFormState } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { login } from '@/app/actions/auth';
import { LoginFormState } from '@/app/lib/definitions';
import styles from '../styles.module.css';
import { useRouter } from 'next/navigation';

interface Props {
    isLogin : boolean,
    setIsLogin : Function
}

const normalBorder = '1px solid #319cd0';
const errorBorder = '1px solid #ff3131';
const normalBg = '#efefef';
const errorBg = 'rgba(255, 150, 150, 0.25)';

const LoginForm = ({ isLogin, setIsLogin } : Props) => {
    const [ passwordVisible, setPasswordVisible ] = useState(false);
    const [ emailBorder, setEmailBorder ] = useState(normalBorder);    
    const [ passwordBorder, setPasswordBorder ] = useState(normalBorder);
    const [ emailBg, setEmailBg ] = useState(normalBg);
    const [ pwBg, setpwBg ] = useState(normalBg);
    const initialValue : LoginFormState = { errors: {} }
    const [ state, formAction, isPending ] = useFormState(login, initialValue);
    const router = useRouter();

    useEffect( () => {
        if ( state.redirect ) {
            // login successful
            setIsLogin(false);
            router.push( state.redirect );
        }

        if ( state.errors?.email ) {
            setEmailBorder( errorBorder );
            setEmailBg( errorBg );
        } else {
            setEmailBorder( normalBorder );
            setEmailBg( normalBg );
        }

        if ( state.errors?.password ) {
            setPasswordBorder( errorBorder );
            setpwBg( errorBg );
        } else {
            setPasswordBorder( normalBorder );
            setpwBg( normalBg );
        }
    }, [ state ] );

    const loginRef = React.useRef<HTMLFormElement>(null);

    const formStyle : React.CSSProperties = {
        opacity: isLogin ? 1 : 0,
        pointerEvents: isLogin ? 'auto' : 'none',
    };

    const formClick = () => {        
        setIsLogin(false);
        loginRef.current.reset();
    }

    return (
        <form action={formAction} className={styles.authRoot} style={formStyle} ref={loginRef}>
            <div className={styles.authBackground} onClick={ formClick }/>
            <section className={styles.authContents}>
                <h2>LOGIN</h2>
                <div>
                    <label>Email</label>
                    <input className={styles.authInput} style={{ border: emailBorder, background: emailBg }} name="email" placeholder="user@Email.com" autoComplete="username"/>
                </div>
                <div>
                    <label>Password</label>
                    <section>
                        <div style={{ position: 'relative' }}>
                            <input className={styles.authInput} style={{ border: passwordBorder, background: pwBg }}
                                type={passwordVisible ? 'text' : 'password'}
                                placeholder="enter your password"
                                autoComplete="current-password"
                                name="password"
                            />
                            <FontAwesomeIcon 
                                onClick={() => setPasswordVisible(!passwordVisible) } 
                                icon={passwordVisible ? faEyeSlash : faEye} 
                                style={{ 
                                    position: 'absolute', 
                                    right: '5px',
                                    top: '50%', 
                                    transform: 'translateY(-50%)', 
                                    cursor: 'pointer' 
                                }}
                            />
                        </div>
                    </section>
                </div>
                <div style={{margin: '0px 0px 0px 5px', height: 'auto', color: "red", fontSize: '12px'}}>
                    { state?.errors?.email && <p style={{margin: '5px'}}>{"email information is not valid"}</p> }
                    { state?.errors?.password && <p style={{margin: '5px'}}>{"incorrect password, put right password again"}</p> }
                </div>
                <button type="submit" disabled={isPending}>LOGIN</button>
            </section>
        </form>
    );
};

export default LoginForm;
