import db from '../db/dbcon';
import axios from 'axios';

const loop_date = async (param)=>{
    let tasks = [];
    const {start_date,end_date} = param;
    var start = new Date(start_date); //yyyy-mm-dd
var end = new Date(end_date); //yyyy-mm-dd

while(start <= end){

    var mm = ((start.getMonth()+1)>=10)?(start.getMonth()+1):'0'+(start.getMonth()+1);
    var dd = ((start.getDate())>=10)? (start.getDate()) : '0' + (start.getDate());
    var yyyy = start.getFullYear();
    var date = yyyy+"-"+mm+"-"+dd; //yyyy-mm-dd

    tasks.push(get_osa_pervisit(date));
    // console.log(date);

    start = new Date(start.setDate(start.getDate() + 1)); //date increase by 1
}
}

const get_osa_pervisit = async (param)=>{
    const con = new db();
    // const {start_date,end_date} = param;
    const r = await con.run_query(`
    SELECT v.visit_id,v.store_id,v.tanggal visit_date,sum(if(rp.jawaban_oos = 1,cast(1 as signed),cast(0 as signed))) as osa_actual,
count(1) as osa_target,if(count(1) > 0,round(sum(if(rp.jawaban_oos = 1,cast(1 as signed),cast(0 as signed)))/count(1)*100),0) as compliance_osa
 FROM visit v
join uli_fem.report_product_gt rp on v.visit_id = rp.visit_id
join store s on v.store_id = s.store_id
 join product_per_account ppa on ppa.product_id = rp.product_id and ppa.account_id = s.account_id
where v.tanggal = '${param}' 
and ppa.is_check_osa = 1
group by v.visit_id
    `);
    con.end_connection();
    return r;
}

export {
    loop_date,
    get_osa_pervisit
}