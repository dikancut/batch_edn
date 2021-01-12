import mysql from 'mysql'
import dotenv from 'dotenv';
import util from 'util';
dotenv.config();

export default class{
    constructor(nama){
        
        this.connection = mysql.createConnection({
            host            : process.env.DB_DOMAIN,
            user            : process.env.DB_USERNAME,
            password        : process.env.DB_PASSWORD,
            database        : process.env.DB_SCHEMA,
            port            : 3306,
            dateStrings: 'date'
        })
    }

    run_query = async (query) => {
        const rq_prom = util.promisify(this.connection.query).bind(this.connection);

        const r = await rq_prom(query);

        return r;
    }

    end_connection = _ => {
        try{
            this.connection.end((err) => {
                console.log('connection ended');
            })
        }
        catch (e) {
            this.connection.destroy();
        }

    }
}