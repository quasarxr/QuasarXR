import { SignupFormSchema, SignupFormState, LoginFormState } from '@/app/lib/definitions';
import { redirect, useRouter } from 'next/navigation';
import { signIn, signOut } from 'next-auth/react';

export async function signup(state: SignupFormState, formData: FormData) {
  // Call the provider or db to create a user...
  const newState : SignupFormState = {};
  console.log( formData.get('username'), formData.get('email'), formData.get('password') )
  try {
    const response = await fetch('/api/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: formData.get('username'),
        email: formData.get('email'),
        password: formData.get('password')
      })
    });
  
    if ( !response.ok ) {
      throw new Error('Signup failed');
    }

    // signup successful
    const data = await response.json();
    
    // signin
    login( {} , formData );

    newState.redirect = '/';

  } catch ( err ) {
    console.error(err);
    newState.errors = { message : [ 'Signup failed, please try again' ] };
  }
  return newState;
}

export async function login( state: LoginFormState, formData : FormData ) {
  const newState : LoginFormState = {};
  try {
    const $email = formData.get('email');
    const $password = formData.get('password');

    const result = await signIn("credentials", { redirect: false, email: $email, password: $password } );

    if ( ! result.ok ) {
      newState.errors = JSON.parse( result.error );
      return newState;
    }
    newState.redirect = '/';
  } catch (error) {
    newState.errors = { message : [ 'Login failed, fetch api failed' ] };
  }

  return newState;
}

export async function logout() {
  await signOut();
}