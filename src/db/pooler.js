import mysql from 'mysql'
import dotenv from 'dotenv'
import util from 'util'

dotenv.config();

export default class {
    constructor(){
        this.pool = mysql.createPool({
            connectionLimit : process.env.CONNECTION_LIMIT,
            host            : process.env.DB_DOMAIN,
            user            : process.env.DB_USERNAME,
            password        : process.env.DB_PASSWORD,
            database        : process.env.DB_SCHEMA
        })

        this.get_con = util.promisify(this.pool.getConnection).bind(this.pool);

    }

    run_query = async (query) => {
        let con = await this.get_con();
        let run_query = util.promisify(con.query).bind(con);
        return await run_query(query);
    }
}