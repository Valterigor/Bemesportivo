import { getStore } from '@netlify/blobs';
import { randomUUID } from 'node:crypto';

const headers={
  'Content-Type':'application/json; charset=utf-8',
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Methods':'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers':'Content-Type',
  'Cache-Control':'no-store',
  'X-Content-Type-Options':'nosniff'
};
const memoryKey='__beGameRanking';
const json=(statusCode,payload)=>({statusCode,headers,body:JSON.stringify(payload)});
const clean=(value,max=16)=>String(value||'').replace(/[<>\u0000-\u001f]/g,'').trim().slice(0,max);

function options(){
  const siteID=process.env.NETLIFY_SITE_ID||process.env.SITE_ID||'';
  const token=process.env.NETLIFY_BLOBS_TOKEN||process.env.NETLIFY_AUTH_TOKEN||'';
  return siteID&&token?{siteID,token}:undefined;
}
async function readRanking(){
  try{
    const saved=await getStore('bem-esportivo-game',options()).get('ranking',{type:'json'});
    return saved&&Array.isArray(saved.entries)?{sessions:[],...saved}:{entries:[],sessions:[],updatedAt:null};
  }catch(error){return globalThis[memoryKey]||{entries:[],sessions:[],updatedAt:null}}
}
async function writeRanking(data){
  data.updatedAt=new Date().toISOString();
  try{await getStore('bem-esportivo-game',options()).setJSON('ranking',data)}catch(error){globalThis[memoryKey]=data}
}
function publicEntries(entries){return entries.slice(0,100).map(({name,score,level,character,createdAt})=>({name,score,level,character,createdAt}))}
function body(event){try{return JSON.parse(event.isBase64Encoded?Buffer.from(event.body||'','base64').toString('utf8'):event.body||'{}')}catch(error){return {}}}

export async function handler(event){
  if(event.httpMethod==='OPTIONS')return {statusCode:204,headers,body:''};
  const data=await readRanking();
  if(event.httpMethod==='GET')return json(200,{ok:true,ranking:publicEntries(data.entries),updatedAt:data.updatedAt});
  if(event.httpMethod!=='POST')return json(405,{ok:false,error:'Método não permitido.'});

  const input=body(event),name=clean(input.name)||'Atleta BE',deviceId=clean(input.deviceId,64);
  if(input.action==='start'){
    if(!deviceId)return json(400,{ok:false,error:'Aparelho inválido.'});
    const token=randomUUID(),now=Date.now();
    data.sessions=[...(data.sessions||[]).filter(session=>now-session.startedAt<10800000),{token,deviceId,startedAt:now}].slice(-1000);
    await writeRanking(data);
    return json(200,{ok:true,runToken:token,startedAt:now});
  }
  const score=Math.floor(Number(input.score)),level=Math.floor(Number(input.level)),character=Math.floor(Number(input.character)||0);
  if(!deviceId||!Number.isFinite(score)||score<0||score>1000000||!Number.isFinite(level)||level<1||level>100)return json(400,{ok:false,error:'Resultado inválido.'});
  if(score>level*10000)return json(400,{ok:false,error:'Pontuação incompatível com a fase.'});
  const session=(data.sessions||[]).find(item=>item.token===clean(input.runToken,64)&&item.deviceId===deviceId),elapsed=session?Date.now()-session.startedAt:0;
  if(!session||elapsed<3000||elapsed>10800000)return json(403,{ok:false,error:'Partida não validada.'});
  if(score>Math.floor(elapsed/1000)*200+500)return json(400,{ok:false,error:'Pontuação incompatível com o tempo de partida.'});

  const now=Date.now(),key=`${deviceId}:${name.toLowerCase()}`;
  const previous=data.entries.find(entry=>entry.key===key);
  if(previous&&now-new Date(previous.submittedAt||0).getTime()<4000)return json(429,{ok:false,error:'Aguarde antes de enviar novamente.'});
  const entry={key,name,score,level,character:Math.max(0,Math.min(5,character)),createdAt:previous?.createdAt||new Date().toISOString(),submittedAt:new Date().toISOString()};
  data.entries=[...data.entries.filter(item=>item.key!==key),previous&&previous.score>score?previous:entry]
    .sort((a,b)=>b.score-a.score||b.level-a.level).slice(0,500);
  await writeRanking(data);
  return json(200,{ok:true,ranking:publicEntries(data.entries),position:data.entries.findIndex(item=>item.key===key)+1,updatedAt:data.updatedAt});
}
