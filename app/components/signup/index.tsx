'use client'
import React from 'react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { useFormState } from 'react-dom';
import { signup } from '@/app/actions/auth';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import styles from '../styles.module.css';

interface Props {
    isSignedUp : boolean,
    setIsSignedUp : Function
}

const normalStyleBorder = '1px solid #319cd0';
const errorStyleBorder = '1px solid #ff3131';

const SignupForm = ({ isSignedUp, setIsSignedUp } : Props ) => {
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [policyAgreement, setPolicyAgreement ] = useState(false);
    const [usernameBorder, setUserNameBorder ] = useState('1px solid #319cd0');
    const [emailBorder, setEmailBorder ] = useState('1px solid #319cd0');
    const [passwordBorder, setPasswordBorder ] = useState('1px solid #319cd0');
    const [state, action] = useFormState( signup, undefined );
    const router = useRouter();

    useEffect( () => {
        if ( state?.redirect ) {
            // signup successful
            setIsSignedUp(false);
            router.push( state.redirect );
        }
    }, [ state ] );

    const { register, handleSubmit, watch, trigger, formState: { errors } } = useForm( { mode: 'onChange' } );

    const formRef = React.useRef<HTMLFormElement>(null);

    const formStyle : React.CSSProperties = {
        opacity: isSignedUp ? 1 : 0,
        pointerEvents: isSignedUp ? 'auto' : 'none',
    };

    const formClick = () => {
        setIsSignedUp( false );
        formRef.current.reset();
        setUserNameBorder( normalStyleBorder );
        setEmailBorder( normalStyleBorder );
        setPasswordBorder( normalStyleBorder );
        errors.username = {};
        errors.email = {};
        errors.password = {};
    }

    return (
        <form action={action} className={styles.authRoot} style={formStyle} ref={formRef}>
            <div className={styles.authBackground} onClick={ formClick }/>
            <div className={styles.authContents}>
                <h2>Sign Up</h2>
                <div>
                    <label>Username</label>
                    <input className={styles.authInput} name="username" style={{ border: usernameBorder }} placeholder='username' {...register("username", 
                        { 
                            required: true, 
                            minLength: 3, 
                            maxLength: 20,
                            onChange: async (ev) => {                                
                                await trigger( 'username' );
                                setUserNameBorder( errors?.username?.type ? errorStyleBorder : normalStyleBorder );
                            }
                        })}/>
                </div>

                <div className={styles.authErrorDiv}>
                    {errors?.username?.type === 'required' && <p className={styles.authErrorItem}>{"This field is required"}</p>}
                    {errors?.username?.type === 'pattern' && <p className={styles.authErrorItem}>{"Invalid username"}</p>}
                    {errors?.username?.type === 'database' && <p className={styles.authErrorItem}>{"This username is not available"}</p>}
                    {errors?.username?.type === 'minLength' && <p className={styles.authErrorItem}>{"username too short"}</p>}
                    {errors?.username?.type === 'maxLength' && <p className={styles.authErrorItem}>{"username too long"}</p>}
                </div>

                <div>
                    <label>Email</label>
                    <input className={styles.authInput} name="email" style={{border: emailBorder}} placeholder="user@email.com" 
                        {...register("email", 
                            { 
                                required: true, 
                                pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                onChange: async (ev) => {
                                    await trigger( 'email' );
                                    setEmailBorder( errors?.email?.type ? errorStyleBorder : normalStyleBorder );
                                } 
                            })}
                        autoComplete="username"
                    />
                </div>
                
                <div className={styles.authErrorDiv}>
                    {errors?.email?.type === 'required' && <p className={styles.authErrorItem}>{"This field is required"}</p>}
                    {errors?.email?.type === 'pattern' && <p className={styles.authErrorItem}>{"Invalid email address"}</p>}
                </div>

                <div>
                    <label>Password</label>
                    <div style={{position: 'relative'}}>
                        <div style={ { display: 'block' } }>
                            <input className={styles.authInput} style={{border: passwordBorder}} name="password"
                                type={passwordVisible ? 'text' : 'password'}
                                placeholder="Enter your password"
                                {...register("password", 
                                    { required: true, 
                                        pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*():'"`~|]{8,}$/,
                                        onChange: async (ev) => {
                                            await trigger( 'password' );
                                            setPasswordBorder( errors?.password?.type ? errorStyleBorder : normalStyleBorder );
                                        }
                                    })
                                }
                                autoComplete="current-password"
                            />
                            <FontAwesomeIcon 
                                onClick={ () => setPasswordVisible(!passwordVisible) } 
                                icon={passwordVisible ? faEyeSlash : faEye} 
                                className={styles.authFasIcon}
                            />
                        </div>
                    </div>

                    <div className={styles.authErrorDiv}>
                        {errors?.password?.type === 'required' && <p className={styles.authErrorItem}>{"This field is required"}</p>}
                        {errors?.password?.type === 'pattern' && <p className={styles.authErrorItem}>{"Invalid password"}</p>}
                        {errors?.password?.type === 'minLength' && <p className={styles.authErrorItem}>{"password too short"}</p>}
                        {errors?.password?.type === 'maxLength' && <p className={styles.authErrorItem}>{"password too long"}</p>}
                    </div>
                </div>
                <div>
                    <input type="checkbox" onChange={ev=> setPolicyAgreement(ev.target.checked) }/> I agree to the <Link href="privacy" passHref legacyBehavior><a target="_blank" rel="noopener noreferrer">Terms of Use</a></Link> and Privacy Policy
                </div>
                <div>
                    <input type="checkbox"/>I want receive newsletter
                </div>
                <div style={{ height: '30px'}}/>
                <button disabled={!policyAgreement} type="submit">Create Account</button>
            </div>
        </form>
    );
};

export default SignupForm;
