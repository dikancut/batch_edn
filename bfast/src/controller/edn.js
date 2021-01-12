import db from '../db/dbcon';
import axios from 'easy-soap-request';
import mysql from 'mysql';
import xml2js from 'xml2js';
import sqlstring from 'sqlstring';
import util from 'util';
import dotenv from 'dotenv';
import cluster from 'cluster';
import v8 from 'v8';
dotenv.config();

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
    let is_resp_json = isJsonParsable(resp);
    console.log("response :"+resp);
    let sql = '';
    if(is_resp_json)
    sql = `insert into ${table} (request, OTF_date, http_code,response,created_by,modified_by) values ('${req}','${OTF_date}','${http_code}','${resp}',0,0)`;
    else sql = `insert into ${table} (request, OTF_date, http_code,response,created_by,modified_by) values ('${req}','${OTF_date}','${http_code}','${response}',0,0)`;
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

const grouping_array = async (param) =>{
    console.log(param);
    let {arr,group,sum} = param;
    if(arr != null && typeof arr != 'undefined' && arr != 'undefined'
    && group != null && typeof group != 'undefined' && group != 'undefined'
    && sum != null && typeof sum != 'undefined' && sum != 'undefined'
    ){
        var helper = {};
        let key = '';
        let arrayLength = group.length;
        var result = arr.reduce(function(r, o) {
            for (var i = 0; i < arrayLength; i++) {
                if(i == 0 ) key += o[group[i]];
                else key += '-' + o[group[i]];
                // key = o.shape  + '-' + o.color;
                
                //Do something
            }
        
        
        if(!helper[key]) {
            helper[key] = Object.assign({}, o); // create a copy of o
            r.push(helper[key]);
        } else {
            let arrlength = sum.length;
            for (var o = 0; o < arrlength; o++) {
                helper[key][sum[o]] += o[sum[i]];
                // key = o.shape  + '-' + o.color;
                
                //Do something
            }
            // helper[key].used += o.used;
            // helper[key].instances += o.instances;
        }

    return r;
    }, []);
    return result;
    }else return null;
    
}

const isJsonParsable = (string) => {
    try {
        JSON.parse(string);
    } catch (e) {
        return false;
    }
    return true;
}

function today() {
    let date_today = new Date().toLocaleDateString("en-CA");
    let ret = {"date":date_today};
    return ret;
} 

const getEdn = async (param = null) =>{
    // console.log(param);
    let {date_from,date_to} =  param;
    let date_ob_from;let date_ob_to
    if(date_from == null || typeof date_from == 'undefined' || date_from == 'undefined' || date_to == null || typeof date_to == 'undefined' || date_to == 'undefined'){
        date_ob_to = new Date();
        date_ob_from = new Date(date_ob_to.getFullYear(), date_ob_to.getMonth(), 1);
        // console.log(date_ob); 
    }else {
        
        var datePartsfrom = date_from.split("-");
        date_ob_from = new Date(+datePartsfrom[0], datePartsfrom[1] - 1, +datePartsfrom[2]) ;
    
        var datePartsto = date_to.split("-");
        date_ob_to = new Date(+datePartsto[0], datePartsto[1] - 1, +datePartsto[2]);
    }
    // adjust 0 before single digit date
    // let date_str_from = ("0" + date_ob_from.getDate()).slice(-2);

    // // current month
    // let month_from = ("0" + (date_ob_from.getMonth() + 1)).slice(-2);

    // // current year
    // let year_from = date_ob_from.getFullYear();

    
    // let tgl_iso_from = year_from+"-"+month_from+"-"+date_str_from;
    let from = await get_date_string(date_ob_from);
    let to = await get_date_string(date_ob_to);
    console.log("from :" +date_ob_from);console.log("to :" +date_ob_to);
    
    try{
        // console.log(raw_lama_kebaruan);

        
        let batch_oos = await Promise.all([get_stock({"from":from,"to":to}),get_batch_total_store_oos({"from":from,"to":to}),batch_sof({"from":from,"to":to})]) ;
        // let query_batch_oos = await createInsertQuery("batch_trigger_oos",batch_oos);
        // let ins = await insertQuery(query_batch_oos);
        //  console.log(query_batch_oos);
         
            let res = await Promise.all([get_batch_account({"from":from,"to":to}),get_batch_channel({"from":from,"to":to}),batch_sof_monthly({"from":from,"to":to})]);
            // console.log(res);
            
         

        //  let group_account = ["date","product","account","branch"];
        //  let sum_account = ["nilai","total"];
        
        //  let batch_oos_account = await grouping_array({"arr":batch_oos,"group":group_account,"sum":sum_account});
        //  console.log(batch_oos_account);
        // batch_oos = null
        return res;
    }
    catch(e){

        console.log(e);
        return e;
    }
}

const get_date_string = async (from)=>{
    let date_ob_from = new Date(from);
    let date_str_from = ("0" + date_ob_from.getDate()).slice(-2);

    // current month
    let month_from = ("0" + (date_ob_from.getMonth() + 1)).slice(-2);

    // current year
    let year_from = date_ob_from.getFullYear();

    
    let tgl_iso_from = year_from+"-"+month_from+"-"+date_str_from;
    return tgl_iso_from;
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

const get_batch_account = async (param) =>{
    let {from,to} = param;
    const con = new db();
    const r = await con.run_query(`
    insert into batch_trigger_oos_account (branch, account, product,
         value, total, date, last_update, month,year, role)
           SELECT branch,account,product,sum(nilai) value,
           sum(total) total, date , now() last_update, month(date) month,year(date) year,role
           FROM batch_trigger_oos
           where date >= '${from}'
           and date <= '${to}'
           group by branch,account,product,date,role 
    on duplicate key update value = value,total = total,last_update = last_update`);
    con.end_connection();
    return r;
}

const get_batch_oos_monthly = async (param) =>{
    let {from,to} = param;
    const con = new db();
    const r = await con.run_query(`
    insert into batch_trigger_oos_monthly_dashboard (region, territory,
         branch, channel, account, role, nilai, total, year, month,
          last_update, oos_sof_product)
         SELECT region,territory,branch,channel,account,role,sum(nilai) nilai,sum(total) total
         ,year(date) year,month(date) month,now() last_update,oos_sof_product  
         FROM batch_trigger_oos
         where date >= '${from}'
         and date <= '${to}'
         group by branch,account,year(date),month(date),role 
    on duplicate key update value = nilai,total = total,last_update = last_update, oos_sof_product = oos_sof_product`);
    con.end_connection();
    return r;
}

const get_batch_channel = async (param)=>{
    let {from,to} = param;
    const con = new db();
    const r = await con.run_query(`
    insert into batch_trigger_oos_channel (branch, channel, product,
         value, total, date, last_update, role)
         SELECT branch,channel,product,sum(nilai) value,sum(total) total,date,now() last_update,role  FROM batch_trigger_oos
         where date >= '${from}'
         and date <= '${to}'
         group by branch,channel,product,date,role 
    on duplicate key update value = value,total = total,last_update = last_update`);
    con.end_connection();
    return r;
}

const get_batch_total_store_oos = async (param) =>{
    let {from,to} = param;
    const con = new db();
    const r = await con.run_query(`
    insert into batch_trigger_total_store_oos(total, region, territory, branch, channel, subchannel, account_group, account, brand, subbrand, brand_group, product_group, product, store, date, last_update, role)

select rs.total,st.region_id region,sb.territory_id territory,sb.id_branch branch, ss.channel_id channel,ss.id_subchannel subchannel,
sag.id_account_group account_group,
sa.id_account account,
 pjv.brand_id brand,pjv.subbrand_id subbrand,pjv.brand_group_id brand_group,pjv.product_group_id product_group,pjv.id_product product,
rs.store_id,rs.tanggal_mulai date, now() last_update, 
rs.role_id role
from
(select rs.tanggal_mulai,rs.store_id,rs.product_id,uk.role_id,sum(total) total from
(SELECT v.tanggal_mulai,v.store_id,v.karyawan_id,rs.product_id,count(store_id) as total FROM visit v
join report_stock rs on v.id_visit = rs.visit_id
where v.tanggal_mulai >= '${from}' 
and v.tanggal_mulai <= '${to}'
and rs.value_oos != 2
group by v.tanggal_mulai,v.store_id,rs.product_id,v.karyawan_id) rs
join store s on s.id_store = rs.store_id
join usr_karyawan uk on rs.karyawan_id = uk.id_karyawan
group by rs.product_id,rs.store_id,rs.tanggal_mulai,uk.role_id) rs
join store s on s.id_store = rs.store_id
join sr_branch sb on s.branch_id = sb.id_branch
join sr_territory st on sb.territory_id = st.id_territory
join sg_account sa on s.account_id = sa.id_account
join sg_account_group sag on sa.account_group_id = sag.id_account_group
join sg_subchannel ss on ss.id_subchannel = sa.subchannel_id
join product_join_view pjv on pjv.id_product = rs.product_id
where pjv.is_competitor = 0
on duplicate key update total = rs.total
    `);
    con.end_connection();
    return r;
}

const get_stock = async (param) =>{
    let {from,to} = param;
    const con = new db();
    const r = await con.run_query(`
    INSERT INTO batch_trigger_oos 
            (region,territory,branch,channel,subchannel,account,product,principal,productgroup,brandgroup,subbrand,brand,is_competitor,nilai,total,date,oos_sof_product,year,month,role)
    select st.region_id region,sb.territory_id territory,sb.id_branch branch, ss.channel_id channel, ss.id_subchannel subchannel,
    sa.id_account account,rs.product_id product,pjv.principal_id principal,pjv.product_group_id productgroup,pjv.brand_group_id brandgroup,
    pjv.subbrand_id subbrand, pjv.brand_id brand,pjv.is_competitor is_competitor,rs.nilai,rs.total,
    rs.tanggal_mulai date ,pjv.oos_sos_product as oos_sof_product,year(rs.tanggal_mulai) year,month(rs.tanggal_mulai) month, 
    rs.role_id role
    from
    (select rs.tanggal_mulai,s.account_id,s.branch_id,rs.product_id,uk.role_id,sum(nilai) nilai,sum(total) total from
    (SELECT v.tanggal_mulai,v.store_id,v.karyawan_id,rs.product_id,sum(if(value_oos = 1,cast(1 as signed),cast(0 as signed))) as nilai,count(0) as total FROM visit v
    join report_stock rs on v.id_visit = rs.visit_id
    where v.tanggal_mulai >= '${from}' 
    and v.tanggal_mulai <= '${to}'
    and rs.value_oos != 2
    group by v.tanggal_mulai,v.store_id,rs.product_id,v.karyawan_id) rs
    join store s on s.id_store = rs.store_id
    join usr_karyawan uk on rs.karyawan_id = uk.id_karyawan
    group by rs.product_id,s.branch_id,s.account_id,rs.tanggal_mulai,uk.role_id) rs
    join sr_branch sb on rs.branch_id = sb.id_branch
    join sr_territory st on sb.territory_id = st.id_territory
    join sg_account sa on rs.account_id = sa.id_account
    join sg_account_group sag on sa.account_group_id = sag.id_account_group
    join sg_subchannel ss on ss.id_subchannel = sa.subchannel_id
    join product_join_view pjv on pjv.id_product = rs.product_id 
    on duplicate key update 
            region = values(region),territory = values(territory),branch = values(branch),channel = values(channel),subchannel = values(subchannel),account = values(account),product = values(product),principal = values(principal),productgroup = values(productgroup),brandgroup = values(brandgroup),subbrand = values(subbrand),brand = values(brand),is_competitor = values(is_competitor),nilai = values(nilai),total = values(total),date = values(date),oos_sof_product = values(oos_sof_product),year = values(year),month = values(month),role = values(role)
    `);
    con.end_connection();
    return r;
}

const batch_sof = async (param)=>{
    let {from,to} = param;
    const con = new db();
    const r = await con.run_query(`
        INSERT INTO batch_trigger_sof (region, territory, branch,
             channel, subchannel, account, product, principal,
              productgroup, brandgroup, subbrand, brand, is_competitor,
               nilai, date, last_update, oos_sof_product, role)

               select st.region_id region,sb.territory_id territory,sb.id_branch branch, ss.channel_id channel,ss.id_subchannel subchannel,
               sa.id_account account,rs.product_id product,pjv.principal_id principal,pjv.product_group_id productgroup,pjv.brand_group_id brandgroup,
               pjv.subbrand_id subbrand, pjv.brand_id brand,pjv.is_competitor is_competitor,rs.nilai,
               rs.tanggal_mulai date, now() last_update,pjv.oos_sos_product as oos_sof_product, 
               rs.role_id role
               from
               (select rs.tanggal_mulai,s.account_id,s.branch_id,rs.product_id,uk.role_id,sum(nilai) nilai from
               (SELECT v.tanggal_mulai,v.store_id,v.karyawan_id,rs.product_id,sum(facing) as nilai FROM visit v
               join report_stock rs on v.id_visit = rs.visit_id
               where v.tanggal_mulai >= '${from}' 
               and v.tanggal_mulai <= '${to}'
               
               and facing is not null
               group by v.tanggal_mulai,v.store_id,rs.product_id,v.karyawan_id) rs
               join store s on s.id_store = rs.store_id
               join usr_karyawan uk on rs.karyawan_id = uk.id_karyawan
               group by rs.product_id,s.branch_id,s.account_id,rs.tanggal_mulai,uk.role_id) rs
               join sr_branch sb on rs.branch_id = sb.id_branch
               join sr_territory st on sb.territory_id = st.id_territory
               join sg_account sa on rs.account_id = sa.id_account
               join sg_account_group sag on sa.account_group_id = sag.id_account_group
               join sg_subchannel ss on ss.id_subchannel = sa.subchannel_id
               join product_join_view pjv on pjv.id_product = rs.product_id

               on duplicate key update nilai = rs.nilai,last_update = last_update
    `);
    con.end_connection();
    return r;
}

const batch_sof_monthly = async (param) =>{
    let {from,to} = param;
    const con = new db();
    const r = await con.run_query(`
        INSERT INTO batch_trigger_sof_monthly_dashboard (region,
             territory, branch, channel, account, role, nilai, year, month,
              is_competitor, oos_sof_product, last_update)

               SELECT region, territory, branch, channel, account, role, sum(nilai) nilai, year(date) year,
 month(date) month, is_competitor,
 oos_sof_product, now() last_update

 FROM beiersdorf.batch_trigger_sof
 where date >= '${from}'
 and date <= '${to}'
 group by branch,account,role,year(date),month(date),is_competitor
               on duplicate key update nilai = nilai,last_update = last_update
    `);
    con.end_connection();
    return r;
}



export {
    
    getEdn
    
}