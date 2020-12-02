import mysql from 'mysql'
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
    connectionLimit : process.env.CONNECTION_LIMIT,
    host            : process.env.DB_DOMAIN,
    user            : process.env.DB_USERNAME,
    password        : process.env.DB_PASSWORD,
    database        : process.env.DB_SCHEMA
})


export default pool
