import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import pool from '@/app/lib/db';
import bcrypt from 'bcrypt';
import { createHash } from 'crypto';

async function _queryUser( email ) {
  const result = await pool.query('SELECT * FROM Users WHERE email = $1', [email] );
  return result?.rows?.length > 0 ? result.rows[0] : null;
}

async function _queryPassword( pw, hash ) {
  const valid = bcrypt.compareSync( pw, hash );
  return valid;
}

function _usernameHash( email ) {
  const username = `${email}-${process.env.SOCIAL_TOKEN}`;
  const hash = createHash('sha256');
  hash.update( username );
  const hashbuffer = hash.digest();
  const encoded = hashbuffer.toString('base64').slice(0, 20);

  return encoded;
}

export const authOptions : NextAuthOptions = {
    providers: [
      CredentialsProvider({
        name: "Credentials",
        credentials: {
          email: { label: 'Email', type: 'text' },
          password: {  label: 'Password', type: 'password' },
        },
        authorize: async ( credentials ) => {  
          const { email, password } = credentials;          
          // 사용자 인증 로직 
          const user = await _queryUser( email );
          if ( user ) {
            const valid = await  _queryPassword( password, user.password_hash );
            if ( ! valid ) {
              throw new Error( JSON.stringify( { message: 'Invalid password', password : true } ) );
            }            
            return user;
          } else {
            throw new Error( JSON.stringify( { message: 'Invalid email', email : true } ) );
          }
        },
      }),
      GoogleProvider( {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret:process.env.GOOGLE_CLIENT_SECRET,
      })
    ],
    session: {
      strategy: "jwt",
    },
    pages: {
      signIn: '/',
    },
    callbacks: {
      async signIn( { user, account, profile, email, credentials } ) {
        let success = false;
        if ( account.provider === 'google' ) {
          // const first_name = profile['given_name'];
          // const last_name = profile['family_name'];

          const data = await _queryUser( user.email );

          if ( data === null ) {
            const username = _usernameHash( user.email );
            // regist user information
            const result = await pool.query('INSERT INTO USERS ( username, email ) VALUES ( $1, $2 )', [username, user.email] );
            success = result ? true : false;
          } else {
            success =  true;
          }
        } else {
          success = true;
        }
        return success;
      },
      async jwt( { token, user, account } ) {
        function copyVar( from, to, varName ) {
          if ( from?.[varName] !== null && from?.[varName] !== undefined ) {
            to[varName] = from[varName];
          }
        }
        copyVar( user, token, 'username' );
        copyVar( user, token, 'user_id' );        
        copyVar( user, token, 'is_admin' );        
        copyVar( user, token, 'is_active' );

        token.role = 1;        
        
        return token;
      },
      async session( { session, user, token } ) {        
        const data = await _queryUser( token.email );
        session.user.username = data.username;
        session.user.role = 1;
        session.user.user_id = data.user_id;
        session.user.is_active = data.is_active;
        session.user.is_admin = data.is_admin;
        return session;
      },
    },
};
  