// index.js — 기존 DB 재사용: 스타팅/일반 테이블에 링크만 적재
import { fetchSources, classifyItem } from "./sources.js";
import { notionClient, createDbRow } from "./notion.js";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DB_STARTING = process.env.NOTION_DB_STARTING_ID; // 기존 스타팅 DB
const DB_GENERAL  = process.env.NOTION_DB_GENERAL_ID;  // 기존 일반 DB

if (!NOTION_TOKEN) throw new Error("ENV NOTION_TOKEN 누락");
if (!DB_STARTING) throw new Error("ENV NOTION_DB_STARTING_ID 누락");
if (!DB_GENERAL) throw new Error("ENV NOTION_DB_GENERAL_ID 누락");

const nc = notionClient(NOTION_TOKEN);

function dedupe(arr){
  const seen = new Set();
  const out = [];
  for (const x of arr){
    const key = `${(x.title||'').trim()}|${(x.url||'').trim()}`;
    if (!seen.has(key)) { seen.add(key); out.push(x); }
  }
  return out;
}
function todayKST(){
  const now = new Date();
  const kst = new Date(now.getTime() + 9*60*60*1000);
  return kst.toISOString().slice(0,10);
}

async function main(){
  const sourcesBySite = await fetchSources();

  // 평면화
  const flat = [];
  for (const [site, items] of Object.entries(sourcesBySite || {})) {
    for (const it of (items || [])) {
      flat.push({
        source: site,
        title: it.title,
        url: it.url,
        skillUrl: (it.links?.skills || [])[0] || null,
        paragonUrl: (it.links?.paragon || [])[0] || null
      });
    }
  }

  // 분류
  const rows = dedupe(flat).map(it => {
    const { className, isStarting } = classifyItem(it);
    return {
      className,
      isStarting,
      source: it.source,
      title: it.title,
      articleUrl: it.url,
      skillUrl: it.skillUrl,
      paragonUrl: it.paragonUrl,
      collectedAt: todayKST()
    };
  }).filter(r => !!r.className);

  // 직업 버킷
  const classes = ["Barbarian","Sorcerer","Rogue","Druid","Necromancer","Spiritborn"];
  const byClass = Object.fromEntries(classes.map(c => [c, { starting: [], general: [] }]));
  for (const r of rows){
    if (!byClass[r.className]) byClass[r.className] = { starting: [], general: [] };
    if (r.isStarting) byClass[r.className].starting.push(r);
    else byClass[r.className].general.push(r);
  }

  // 적재
  let created = 0;
  const SCHEMA = { title:'제목', class:'직업', source:'출처', article:'원문', skill:'스킬트리', paragon:'정복자', date:'수집일' };
  for (const c of Object.keys(byClass)){
    for (const r of byClass[c].starting){
      await createDbRow(nc, DB_STARTING, r, SCHEMA);
      created++;
    }
    for (const r of byClass[c].general){
      await createDbRow(nc, DB_GENERAL, r, SCHEMA);
      created++;
    }
  }

  console.log(`✅ Notion rows created: ${created}`);
}

main().catch(err=>{
  console.error("🚨", err?.response?.data || err);
  process.exit(1);
});
