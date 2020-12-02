import util from "util";
import db from "./db";
import pooler from './pooler'
import dbcon from "./dbcon";



const run_query = async(params) => {
    const {query, connection} = params;
    const prom_query = util.promisify(connection.query).bind(connection);
    const r = await prom_query(query);
    connection.release();
    return r;
}

const get_connection = _ => {
    return new Promise((resolve, reject) => {
        db.getConnection((err, conn) => {
            if (err) {
                reject(err)
            }
            resolve(conn)
        })
    });
}


export{
    run_query,
    get_connection,
    pooler,
    dbcon
}