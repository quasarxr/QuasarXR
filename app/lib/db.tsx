import { Pool } from 'pg';

const pool = new Pool( { 
    host: process.env.NEXT_PUBLIC_DB_HOST,
    database: process.env.NEXT_PUBLIC_DB_NAME,
    user: process.env.NEXT_PUBLIC_DB_USER,
    password: process.env.NEXT_PUBLIC_DB_PWD,
    port: process.env.NEXT_PUBLIC_DB_PORT,
} );

export default pool;