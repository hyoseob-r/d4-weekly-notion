import { notionClient, H1, H2, H3, P, Link } from './notion.js';
import { fetchSources } from './sources.js';
import { makeSummary } from './summarize.js';

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

if (!NOTION_TOKEN || !DATABASE_ID) {
  console.error('Missing NOTION_TOKEN or NOTION_DATABASE_ID env.');
  process.exit(1);
}

function todayKSTISO() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const kst = new Date(utc + (9 * 60 * 60000));
  return kst.toISOString().slice(0, 10);
}

async function run(){
  const notion = notionClient(NOTION_TOKEN);

  // 1) Collect sources (titles+urls)
  const sourcesBySite = await fetchSources();

  // 2) Summarize via OpenAI (or fallback text)
  const summary = await makeSummary(sourcesBySite);

  // 3) Build Notion blocks (cap under 95)
  const blocks = [];
  blocks.push(H1('📘 주간 메타 빌드 요약'));
  blocks.push(P(`생성일: ${todayKSTISO()} (KST)`));
  blocks.push(H2('출처 링크'));
  for(const [site, items] of Object.entries(sourcesBySite)){
    blocks.push(H3(site));
    for(const it of items){
      blocks.push(Link(it.title, it.url));
    }
  }
  blocks.push(H2('요약'));
  for(const line of summary.split('\n')){
    if(line.trim().length) blocks.push(P(line));
  }
  if(blocks.length > 95) blocks.length = 95;

  const payload = {
    parent: { database_id: DATABASE_ID },
    properties: {
      Name: { title: [{ text: { content: `Diablo IV 주간 메타 빌드 – ${todayKSTISO()} KST` } }] },
      Week: { rich_text: [{ text: { content: todayKSTISO() } }] }
    },
    children: blocks
  };

  const res = await notion.post('pages', payload);
  console.log('Created Notion page:', res.data.id);
}

run().catch(e => {
  console.error('Failed:', e.response?.data || e.message);
  process.exit(1);
});
