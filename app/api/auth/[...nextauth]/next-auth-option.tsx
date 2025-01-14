import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import pool from '@/app/lib/db';
import bcrypt from 'bcrypt';

async function searchUser( condition ) {

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
          const result = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);            
          if ( result?.rows?.length === 0 ) {
            throw new Error( JSON.stringify( { message: 'Invalid email', email : true } ) );
          }
  
          const user = result.rows[0];
          const isValidPassword = bcrypt.compareSync( password, user.password_hash );          
          if ( !isValidPassword ) {
            throw new Error( JSON.stringify( { message: 'Invalid password', password : true } ) );
          }

          if (user) {
            return user;
          }
          return null;
        },
      }),
      // GoogleProvider({
      //     clientId: process.env.GOOGLE_ID,
      //     clientSecret:process.env.GOOGLE_SECRET,
  
      // })
    ],
    session: {
      strategy: "jwt",
    },
    pages: {
      signIn: '/',
    },
    callbacks: {
      async jwt( { token, user } ) {
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
        session.user.username = token.username;
        session.user.role = token.role;
        session.user.user_id = token.user_id;
        session.user.is_active = token.is_active;
        session.user.is_admin = token.is_admin;
        
        return session;
      },
    },
};
  