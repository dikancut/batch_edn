import db from '../db/dbcon';
import axios from 'easy-soap-request';
import mysql from 'mysql';
import xml2js from 'xml2js';
import sqlstring from 'sqlstring';
import util from 'util';
import dotenv from 'dotenv';
dotenv.config();

const get_all_product = async (table) => {
    const con = new db();
    
    const r = await con.run_query(`select p.product_code,p.product_code from ${table}`);
    con.end_connection()
    // console.log(r);
    return r;
}

const create_query_log = async (table,param) => {
    let {request,OTF_date,http_code,response} = param;
    // const con = mysql.createConnection({
    //     host            : process.env.DB_DOMAIN,
    //     user            : process.env.DB_USERNAME,
    //     password        : process.env.DB_PASSWORD,
    //     database        : process.env.DB_SCHEMA
    // });
    let req = await parse_log(request);
    req = JSON.stringify(req);
    console.log("request :"+req);
    let resp = await parse_log(response);
    resp = JSON.stringify(resp);
    console.log("response :"+resp);
    const sql = `insert into ${table} (request, OTF_date, http_code,response,created_by,modified_by) values ('${req}','${OTF_date}','${http_code}','${resp}',0,0)`;
    // const data = [[request,OTF_date,http_code,response,0,0]];
    const r = await insertQuery(sql)
    // con.end_connection()
    // con.query(sql, [data], (err, results, fields) => {
    //     if (err) {
    //       return console.error(err.message);
    //     }
    //     // get inserted rows
    //     console.log('Row inserted:' + results.affectedRows);
    //     // return results;
    //   });
    //   con.end()
    // console.log(results);
    
}

const getEdn = async (param = null) =>{
    let date_ob;
    if(param == null || typeof param == 'undefined'){
        date_ob = new Date();
    }else {
        let {date} =  param;
        var dateParts = date.split("-");
        date_ob = new Date(+dateParts[0], dateParts[1] - 1, +dateParts[2]) 
    }
    // adjust 0 before single digit date
    let date = ("0" + date_ob.getDate()).slice(-2);

    // current month
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

    // current year
    let year = date_ob.getFullYear();

    let tgl = year+"/"+month+"/"+date;
    let tgl_iso = year+"-"+month+"-"+date;
    
    
    const config = {
        
            "Content-Type" : "application/soap+xml; charset=utf-8"          
        
    }

    const header = `<?xml version="1.0" encoding="utf-8"?>
    <soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
      <soap12:Body>
        <Get_DN xmlns="http://tempuri.org/">
          <P_LFDAT>${tgl}</P_LFDAT>
        </Get_DN>
      </soap12:Body>
    </soap12:Envelope>`;

    let request = header;
    try{
        // console.log(raw_lama_kebaruan);
        const rr = await axios({url:`https://webservice.sariroti.com/e-DMSWebservice/GetDN.asmx`,xml:header,headers:config,});
        // console.log("t")
        const { headers, body, statusCode } = rr.response;
        // console.log("status_code :" +statusCode);
        // console.log("header :" +header);
        let data_log = [];
        let obj = {"OTF_date":tgl_iso, "http_code" : statusCode, "request":request, "response":body};
        data_log.push(obj);
        // console.log(data_log);
        const log_70 = await create_query_log("sariroti_dms.e_delivery_number_log",obj);
        const log_50 = await create_query_log("sariroti_dms_agent.e_delivery_number_log",obj);
        console.log(log_70);
        // const i_log_70 = await insertQuery(log_70);
        // const i_log_50 = await insertQuery(log_50);
        // let product_70 = await get_all_product("sariroti_dms.product p");
        // let product_50 = await get_all_product("sariroti_dms_agent.product p");
        // console.log(depo);
        let result = await parse(body);
        // let product_70 = await get_all_product("sariroti_dms.product");
        // let product_50 = await get_all_product("sariroti_dms_agent.product");
         var res = result.map(row => ({ 

            delivery_number : row.stVBELN,
            OTF_date : row.stLFDAT.substring(0, 4)+'-'+row.stLFDAT.substring(4, 6)+'-'+row.stLFDAT.substring(6, 8),
            depo_code : row.stKUNAG.substring(2),
            product_code : row.stMATNR,
            satuan : row.stVRKME,
            qty : row.stLFIMG,
            db : row.stVTWEG
            }));
        

        
        let res2 = res.reduce((acc, item) => {
            if (!acc[item.db]) {
              acc[item.db] = [];
            }
          
            acc[item.db].push(item);
            return acc;
          }, {})

          
        let header_70 = res2[70].filter((e, i) => {
            return res2[70].findIndex((x) => {
            return x.dn_number == e.dn_number && x.depo_code == e.depo_code;}) == i;
        });
        
        header_70 = header_70.map(row => ({ 

            delivery_number : row.delivery_number,
            OTF_date : row.OTF_date,
            depo_code : row.depo_code,
            created_by : 0,
            modified_by : 0
            }));
        
        let detail_70 = res2[70].map(row => ({
            edn_number : row.delivery_number,
            OTF_date : row.OTF_date,
            product_id : row.product_code,
            quantity : row.qty,
            satuan : row.satuan,
            created_by : 0,
            modified_by : 0
        }));

        let detail_50 = res2[50].map(row => ({
            edn_number : row.delivery_number,
            OTF_date : row.OTF_date,
            product_id : row.product_code,
            quantity : row.qty,
            satuan : row.satuan,
            created_by : 0,
            modified_by : 0
        }));
        
        let header_50 = res2[50].reduce((arr, item) => {
            let exists = !!arr.find(x => x.delivery_number === item.delivery_number);
            if(!exists){
                arr.push(item);
            }
            return arr;
        }, []);

        // let header_50 = res2[50].filter((e, i) => {
        //     return res2[50].findIndex((x) => {
        //     return x.dn_number == e.dn_number}) == i;
        // });

        // let header_50 = res2[50].reduce((accumulator, current) => {
        //     if (checkIfAlreadyExist(current)) {
        //       return accumulator;
        //     } else {
        //       return [...accumulator, current];
        //     }
          
        //     function checkIfAlreadyExist(currentVal) {
        //       return accumulator.some((item) => {
        //         return (item.dn_number === currentVal.dn_number &&
        //                 item.depo_code === currentVal.depo_code);
        //       });
        //     }
        //   }, []);

        header_50 = header_50.map(row => ({ 

            delivery_number : row.delivery_number,
            OTF_date : row.OTF_date,
            depo_code : row.depo_code,
            created_by : 0,
            modified_by : 0
            }));

        let reslut = {
            "detail":{"50":detail_50,"70":detail_70},
            "header":{
                "70":header_70,
                "50":header_50
                    }
        };

        let sql_insert_header_70 = await createInsertQuery("sariroti_dms.e_delivery_number",header_70);
        let sql_insert_detail_70 = await createInsertQuery("sariroti_dms.e_delivery_number_detail",detail_70);
        let sql_insert_header_50 = await createInsertQuery("sariroti_dms_agent.e_delivery_number",header_50);
        let sql_insert_detail_50 = await createInsertQuery("sariroti_dms_agent.e_delivery_number_detail",detail_50);
        
        let inserting_header_70 = await insertQuery(sql_insert_header_70);
        let inserting_detail_70 = await insertQuery(sql_insert_detail_70);
        let inserting_header_50 = await insertQuery(sql_insert_header_50);
        let inserting_detail_50 = await insertQuery(sql_insert_detail_50);

        console.log(header_70);
        return reslut;
    }
    catch(e){

        console.log(e);
        return e;
    }
}

function update(target, source) {
    Object.entries(source).forEach(([key, value]) => {
        if (value && typeof value === 'object') {
            update(target[key] = target[key] || (Array.isArray(value) ? [] : {}), value);
        } else if (target[key] !== value) {
            target[key] = value;
        }
    });
}

function groupBy2(persons, key) {
    var groups = {}, result = [];
    persons.forEach(function (a) {
        if (!(a[key] in groups)) {
            groups[a[key]] = [];
            result.push(groups[a[key]]);
        }
        groups[a[key]].push(a);
    });
    return result;
  }

async function parse(file) {
    const promise = await new Promise((resolve, reject) => {
      const parser = new xml2js.Parser({explicitArray: false, tagNameProcessors: [xml2js.processors.stripPrefix] });
  
      parser.parseString(file, (error, result) => {
        if (error) reject(error);
        else {
            var soapBody = result.Envelope.Body;

    // Remove optional attribute(s) from <Body> element.
    if (soapBody.$) {
        delete soapBody.$;
    }
            resolve(soapBody.Get_DNResponse.Get_DNResult.DN_LIST);
        }
      });
    });
    return promise;
  }

  async function parse_log(file) {
    const promise = await new Promise((resolve, reject) => {
      const parser = new xml2js.Parser({explicitArray: false, tagNameProcessors: [xml2js.processors.stripPrefix] });
  
      parser.parseString(file, (error, result) => {
        if (error) reject(error);
        else {
            var soapBody = result.Envelope.Body;

    // Remove optional attribute(s) from <Body> element.
    if (soapBody.$) {
        delete soapBody.$;
    }
            resolve(soapBody);
        }
      });
    });
    return promise;
  }

  const createInsertQuery = async (table,param)=>{
    try{
        let column = Object.keys(param[0]);
    let list_column = '';
    let list_value = '';
    
    param.forEach(function(item,index) {
        let value = Object.values(item);
        let isi = value.join("','");
        if(index == 0)
        list_value += `('${isi}')`;
        else list_value += `,('${isi}')`;
    });
    
    for(let keys in column){
        list_column += `,${column[keys]} = values(${column[keys]})`;
    }

    list_column = list_column.slice(1);

    const query_col = column.join(","); 
    const sql = 
        `INSERT INTO ${table} 
            (${query_col}) VALUES 
            ${list_value}
            on duplicate key update 
            ${list_column}
        `;
    return sql;
    }catch(e){
        return e;
    }
    
}

const insertQuery = async (param) =>{
    // console.log(param);
    const con = new db();

    const r = await con.run_query(param);
    con.end_connection()

    return r;
}

export {
    
    getEdn
    
}