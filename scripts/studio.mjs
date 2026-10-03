#!/usr/bin/env node
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv} from './lib/csv.mjs';
import {table} from './lib/format.mjs';

export const reads={projects:'select * from projects order by name',suppliers:'select * from suppliers order by name',schedule:'select id,project,room,name,supplier,quantity,currency,cost,price,margin,approval,required_date from schedule order by project,room,name', 'approvals-due':"select id,project,room,name,revision,approval,order_by from schedule where approval<>'approved' order by order_by",procurement:'select * from procurement order by required_date', 'delivery-chase':"select project,name,supplier,reference,expected_date,quantity,received_quantity,status from procurement where order_id is not null and status<>'received' order by expected_date",margins:'select * from project_totals order by name',tasks:'select t.*,p.name project from tasks t join projects p on p.id=t.project_id order by due_date',timesheets:'select t.*,p.name project,p.currency,round(t.minutes*t.rate/60,2) value from time_entries t join projects p on p.id=t.project_id order by work_date',issues:'select i.*,s.name,s.project from issues i join schedule s on s.id=i.selection_id order by i.created_at',attention:'select project,name,reason from attention order by project,reason,name',compliance:'select project,name,rule,finding from compliance_checks order by project,rule',activity:'select a.*,p.name project from activity a join projects p on p.id=a.project_id order by a.created_at desc'};
export const questions=[
 ['Which unapproved selections have already missed their order deadline?',"select project,name,supplier,order_by,approval from schedule where approval<>'approved' and order_by<current_date"],
 ['Which late deliveries also have an unresolved product issue?',"select p.project,p.name,p.supplier,p.expected_date,i.note from procurement p join issues i on i.selection_id=p.id where p.status='overdue' and i.resolution is null"],
 ['Which rooms have the most unapproved spending?',"select project,room,currency,sum(price) pending_price from schedule where approval<>'approved' group by project,room,currency order by pending_price desc"],
 ['Which selections are priced below supplier cost?',"select project,name,currency,cost,price,margin from schedule where margin<0"],
 ['Which projects exceed their selection budget?',"select name,currency,budget,selections_total,budget_remaining from project_totals where budget_remaining<0"],
 ['How much gross margin remains after recorded design time?',"select name,currency,gross_margin,time_value,gross_margin-time_value margin_less_time from project_totals"],
 ['Which suppliers have outstanding quantities across projects?',"select supplier,currency,sum(quantity-coalesce(received_quantity,0)) outstanding_units,count(distinct project_id) projects from procurement where order_id is not null and status<>'received' group by supplier,currency"],
 ['Which deliveries are expected after the required date?',"select project,name,supplier,required_date,expected_date from procurement where expected_date>required_date and status<>'received'"],
 ['Which active projects have gone quiet for more than fourteen days?',"select p.name,max(a.created_at) last_note from projects p left join activity a on a.project_id=p.id where p.status='active' group by p.id having max(a.created_at)<now()-interval '14 days' or max(a.created_at) is null"],
 ['Which current approvals no longer have a matching selection revision?',"select distinct s.project,s.name,s.revision from schedule s join approvals a on a.selection_id=s.id where a.decision='approved' and a.revision<s.revision and s.approval<>'approved'"]
];
const entities=['projects','suppliers','selections','approvals','orders','tasks','time_entries','issues','activity'];
export function argsOf(args){const opts={},pos=[];for(const a of args){if(a.startsWith('--')){const n=a.indexOf('=');opts[a.slice(2,n<0?undefined:n)]=n<0?true:a.slice(n+1);}else pos.push(a);}return {opts,pos};}
const required=(v,n)=>{if(typeof v!=='string'||!v.trim())throw Error(`Missing ${n}`);return v.trim();};
const num=(v,n,min=0)=>{if(v===undefined||v===''||!Number.isFinite(Number(v))||Number(v)<min)throw Error(`Invalid ${n}`);return Number(v);};
const integer=(v,n,min=0)=>{const x=num(v,n,min);if(!Number.isInteger(x))throw Error(`${n} must be a whole number`);return x;};
const day=(v,n)=>{required(v,n);if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v)throw Error(`Invalid ${n}`);return v;};
const currency=(v)=>{if(!/^[A-Z]{3}$/.test(v||''))throw Error('currency must be three uppercase letters');return v;};
export async function resolve(db,entity,value){
 if(!entities.includes(entity))throw Error('Unknown record type');required(value,entity);
 const field=entity==='orders'?'reference':['projects','suppliers','selections','tasks'].includes(entity)?'name':'id::text';
 const rows=await db.query(`select * from ${entity} where lower(${field})=lower($1) or id::text like $2 order by id`,[value,`${value}%`]);
 if(rows.length!==1)throw Error(`${rows.length?'Ambiguous':'No match'} ${entity}: ${value}\n${rows.map(r=>`${r.id} ${r.name||r.reference||''}`).join('\n')}`);return rows[0];
}
async function tx(db,fn){await db.exec('BEGIN');try{const v=await fn();await db.exec('COMMIT');return v;}catch(e){await db.exec('ROLLBACK');throw e;}}
async function insert(db,t,values){const ks=Object.keys(values);return (await db.query(`insert into ${t} (${ks.join(',')}) values (${ks.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,Object.values(values)))[0];}
export async function run(db,args){
 const {opts:o,pos:p}=argsOf(args);const [cmd,arg]=p;
 if(!cmd||cmd==='help'||o.help)return {help:'Reads: '+Object.keys(reads).join(', '),commands:'project <name|id>; selection <name|id>; questions --question=1..10; add project|supplier|selection|task; approve <selection> --actor= --evidence= [--decision=approved|rejected]; revise <selection> --specification= [--price=]; order <selection> --reference= --expected=YYYY-MM-DD; receive <order> --quantity= --condition= [--date=]; log <project> --note=; time <project> --person= --minutes= --rate= --note=; complete <task>; issue <selection> --note=; resolve <issue-id> --resolution=; privacy-review <project> --date=; import programa --file= --project= --currency= [--map= --dry-run]; export --out=; draft-approval <project>',add:'project: --name= --client= --currency= --budget= [--install=]; supplier: --name= [--email=]; selection: --project= --supplier= --name= --room= --quantity= --cost= --price= [--specification= --sku= --lead-days= --required=]; task: --project= --name= --owner= --due='};
 if(reads[cmd])return db.query(reads[cmd]);
 if(cmd==='questions'){if(!o.question)return questions.map(([question],i)=>({number:i+1,question}));const n=integer(o.question,'question',1);if(n>10)throw Error('question must be 1..10');return db.query(questions[n-1][1]);}
 if(cmd==='project'){const x=await resolve(db,'projects',arg);return {project:x,schedule:await db.query('select * from schedule where project_id=$1',[x.id]),activity:await db.query('select * from activity where project_id=$1 order by created_at',[x.id])};}
 if(cmd==='selection'){const x=await resolve(db,'selections',arg);return {selection:x,approvals:await db.query('select * from approvals where selection_id=$1 order by created_at',[x.id]),orders:await db.query('select * from orders where selection_id=$1',[x.id])};}
 if(cmd==='add'){
  if(arg==='project')return insert(db,'projects',{name:required(o.name,'name'),client:required(o.client,'client'),currency:currency(o.currency),budget:num(o.budget,'budget'),install_date:o.install?day(o.install,'install'):null});
  if(arg==='supplier')return insert(db,'suppliers',{name:required(o.name,'name'),email:o.email||''});
  const pr=await resolve(db,'projects',o.project);
  if(arg==='task')return insert(db,'tasks',{project_id:pr.id,name:required(o.name,'name'),owner:required(o.owner,'owner'),due_date:day(o.due,'due')});
  if(arg==='selection'){const sp=await resolve(db,'suppliers',o.supplier);return insert(db,'selections',{project_id:pr.id,supplier_id:sp.id,name:required(o.name,'name'),room:required(o.room,'room'),quantity:num(o.quantity,'quantity',0.001),unit_cost:num(o.cost,'cost'),unit_price:num(o.price,'price'),specification:o.specification||'',sku:o.sku||'',lead_days:integer(o['lead-days']||0,'lead-days'),required_date:o.required?day(o.required,'required'):null});}
  throw Error('add expects project, supplier, selection or task');
 }
 if(cmd==='approve')return tx(db,async()=>{const s=await resolve(db,'selections',arg);await db.query('select id from selections where id=$1 for update',[s.id]);const current=await resolve(db,'selections',s.id);return insert(db,'approvals',{selection_id:s.id,revision:current.revision,actor:required(o.actor,'actor'),evidence:required(o.evidence,'evidence'),decision:o.decision||'approved'});});
 if(cmd==='revise'){const s=await resolve(db,'selections',arg);return (await db.query('update selections set specification=$1,unit_price=$2 where id=$3 returning *',[required(o.specification,'specification'),o.price===undefined?s.unit_price:num(o.price,'price'),s.id]))[0];}
 if(cmd==='order')return tx(db,async()=>{const s=await resolve(db,'selections',arg);await db.query('select id from selections where id=$1 for update',[s.id]);const [v]=await db.query('select * from schedule where id=$1',[s.id]);if(v.approval!=='approved')throw Error('Current revision needs approval before ordering');return insert(db,'orders',{selection_id:s.id,reference:required(o.reference,'reference'),expected_date:day(o.expected,'expected')});});
 if(cmd==='receive')return tx(db,async()=>{const x=await resolve(db,'orders',arg);const [v]=await db.query('select o.*,s.quantity from orders o join selections s on s.id=o.selection_id where o.id=$1 for update of o',[x.id]);const n=num(o.quantity,'quantity',0.001);if(Number(v.received_quantity)+n>Number(v.quantity))throw Error('Receipt exceeds ordered quantity');return (await db.query('update orders set received_quantity=received_quantity+$1,received_date=$2,condition_note=$3 where id=$4 returning *',[n,day(o.date||new Date().toISOString().slice(0,10),'date'),required(o.condition,'condition'),x.id]))[0];});
 if(cmd==='complete'){const x=await resolve(db,'tasks',arg);return (await db.query('update tasks set done=true where id=$1 returning *',[x.id]))[0];}
 if(cmd==='issue'){const x=await resolve(db,'selections',arg);return insert(db,'issues',{selection_id:x.id,note:required(o.note,'note')});}
 if(cmd==='resolve'){const x=await resolve(db,'issues',arg);return (await db.query('update issues set resolution=$1 where id=$2 returning *',[required(o.resolution,'resolution'),x.id]))[0];}
 if(['log','time','privacy-review','draft-approval'].includes(cmd)){
 const x=await resolve(db,'projects',arg);
 if(cmd==='log')return insert(db,'activity',{project_id:x.id,note:required(o.note,'note')});
 if(cmd==='time')return insert(db,'time_entries',{project_id:x.id,person:required(o.person,'person'),minutes:integer(o.minutes,'minutes',1),rate:num(o.rate,'rate'),note:required(o.note,'note')});
 if(cmd==='privacy-review')return (await db.query('update projects set privacy_review=$1 where id=$2 returning *',[day(o.date,'date'),x.id]))[0];
 const rows=await db.query("select room,name,quantity,currency,price,revision from schedule where project_id=$1 and approval<>'approved' order by room,name",[x.id]);
 const dir=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,'drafts');mkdirSync(dir,{recursive:true});const file=path.join(dir,`approval-${x.id}-${Date.now()}.md`);writeFileSync(file,`# DRAFT: ${x.name}\n\nFor ${x.client}. Please review these selections and reply with the selection and revision you approve.\n\n${rows.map(r=>`${r.room}: ${r.name}, quantity ${r.quantity}, ${r.currency} ${r.price}, revision ${r.revision}`).join('\n')}\n\nNot sent.\n`,{flag:'wx'});return {file,items:rows.length};
 }
 if(cmd==='export'){const out={format:'interior-design-snapshot-v1',created:new Date().toISOString()};for(const t of entities)out[t]=await db.query(`select * from ${t} order by id`);writeFileSync(required(o.out,'out'),JSON.stringify(out,null,2)+'\n',{flag:'wx'});return {file:o.out,records:entities.reduce((n,t)=>n+out[t].length,0)};}
 if(cmd==='import'&&arg==='programa')return importPrograma(db,o);
 throw Error(`Unknown command ${cmd}. Run --help.`);
}
export async function importPrograma(db,o){
 required(o.file,'file');required(o.project,'project');currency(o.currency);
 if(/\.xls$/i.test(o.file))throw Error('Save the legacy XLS export as XLSX or UTF-8 CSV first');
 let rows;
 if(/\.xlsx$/i.test(o.file)){
 const {default:ExcelJS}=await import('exceljs');const book=new ExcelJS.Workbook();await book.xlsx.readFile(o.file);const sheet=o.sheet?book.getWorksheet(o.sheet):book.worksheets[0];if(!sheet)throw Error('Worksheet not found');
 const start=integer(o['header-row']||1,'header-row',1),header=sheet.getRow(start).values.slice(1).map(v=>String(v||'').trim());if(header.some(h=>!h)||new Set(header.map(h=>h.toLowerCase())).size!==header.length)throw Error('XLSX needs unique nonempty headers');
 rows=[];sheet.eachRow((row,n)=>{if(n<=start)return;const vals=header.map((_,i)=>{const c=row.getCell(i+1);if(c.type===ExcelJS.ValueType.Formula)throw Error('Formula cells must be exported as values before import');return c.text;});if(vals.some(v=>v.trim()))rows.push(Object.fromEntries(header.map((h,i)=>[h,vals[i]])));});
 }else rows=parseCsv(readFileSync(o.file,'utf8'));
 if(!rows.length)throw Error('No import rows');
 const map=o.map?JSON.parse(readFileSync(o.map,'utf8')):{};
 const aliases={key:['ID','Product ID','Item ID','Doc Code','Code'],name:['Product Name','Name'],room:['Room','Section','Product Details'],supplier:['Supplier','Supplier Company'],sku:['SKU','Product Code SKU'],specification:['Specification','Description','Product Description'],quantity:['Quantity','Qty'],cost:['Trade Price','Unit Cost'],price:['Unit Price','Unit Client Price','Sell Price'],cost_total:['Cost','Total Cost'],client_total:['Client Price','Total Client Price'],lead:['Lead Days'],required:['Required Date'],image:['Image URL']};
 for(const k of Object.keys(map))if(!aliases[k])throw Error(`Unknown mapping field ${k}`);
 const get=(row,k)=>{const names=map[k]?[map[k]]:aliases[k];const key=Object.keys(row).find(h=>names.some(n=>n.toLowerCase()===h.toLowerCase()));if(map[k]&&!key)throw Error(`Mapped column missing: ${map[k]}`);return key===undefined?'':String(row[key]).trim();};
 const unit=(row,k,total)=>{const q=num(get(row,'quantity'),'quantity',0.001);if(get(row,k)!=='')return num(get(row,k),k);const n=num(get(row,total),total)/q;if(Math.abs(n*100-Math.round(n*100))>0.00001)throw Error(`${total} does not divide into a two-decimal unit price; review and map a unit-price column`);return Math.round(n*100)/100;};
 const parsed=rows.map((row,i)=>{try{return {key:required(get(row,'key'),'stable ID/Code'),name:required(get(row,'name'),'name'),room:required(get(row,'room'),'room'),supplier:required(get(row,'supplier'),'supplier'),sku:get(row,'sku'),specification:get(row,'specification'),quantity:num(get(row,'quantity'),'quantity',0.001),unit_cost:unit(row,'cost','cost_total'),unit_price:unit(row,'price','client_total'),lead_days:integer(get(row,'lead')||0,'lead'),required_date:get(row,'required')?day(get(row,'required'),'required'):null,image_url:get(row,'image')}}catch(e){throw Error(`Row ${i+2}: ${e.message}`);}});
 if(new Set(parsed.map(r=>r.key)).size!==parsed.length)throw Error('Duplicate stable ID/Code in import');
 return tx(db,async()=>{
 let pr=(await db.query('select * from projects where lower(name)=lower($1)',[o.project]))[0];
 if(pr&&pr.currency!==o.currency)throw Error('Project currency does not match import');
 if(!pr)pr=await insert(db,'projects',{name:o.project,client:o.client||'Confirm client',currency:o.currency,budget:0});
 let inserted=0,updated=0;for(const row of parsed){let sp=(await db.query('select * from suppliers where lower(name)=lower($1)',[row.supplier]))[0];if(!sp)sp=await insert(db,'suppliers',{name:row.supplier});
 const {key,supplier,...v}=row;v.project_id=pr.id;v.supplier_id=sp.id;v.source_key=`programa:${pr.id}:${key}`;
 const old=(await db.query('select id from selections where source_key=$1',[v.source_key]))[0];
 if(old){const ks=Object.keys(v);await db.query(`update selections set ${ks.map((k,i)=>`${k}=$${i+1}`).join(',')} where id=$${ks.length+1}`,[...Object.values(v),old.id]);updated++;}else{await insert(db,'selections',v);inserted++;}}
 const known=new Set(Object.keys(rows[0]).filter(h=>Object.keys(aliases).some(k=>(map[k]?[map[k]]:aliases[k]).some(n=>n.toLowerCase()===h.toLowerCase()))));
 const result={rows:parsed.length,inserted,updated,currency:o.currency,cost:Number(parsed.reduce((n,r)=>n+r.quantity*r.unit_cost,0).toFixed(2)),price:Number(parsed.reduce((n,r)=>n+r.quantity*r.unit_price,0).toFixed(2)),unmapped_columns:Object.keys(rows[0]).filter(h=>!known.has(h)),dry_run:!!o['dry-run']};
 if(o['dry-run']){await db.exec('ROLLBACK');await db.exec('BEGIN');}return result;
 });
}
export function present(value){if(Array.isArray(value)){if(!value.length)return '(none)';return table(value,Object.keys(value[0]).map(key=>({key,label:key,width:50,format:v=>v instanceof Date?v.toISOString():typeof v==='object'&&v!==null?JSON.stringify(v):v})));}return JSON.stringify(value,null,2);}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{db=await getDb();const out=await run(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(out,null,2):present(out));}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}}
