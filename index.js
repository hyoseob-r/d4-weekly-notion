import axios from 'axios';

/**
 * Minimal weekly Diablo IV meta build updater for Notion.
 * - Creates a new Notion page with a Markdown-style body (as Notion blocks).
 * - Runs headless (no paid APIs). Sources are linked; details can be refined later.
 * ENV:
 *   NOTION_TOKEN: Notion Internal Integration Token
 *   NOTION_DATABASE_ID: Database ID to create pages into
 */

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

if (!NOTION_TOKEN || !DATABASE_ID) {
  console.error('Missing NOTION_TOKEN or NOTION_DATABASE_ID env.');
  process.exit(1);
}

const notion = axios.create({
  baseURL: 'https://api.notion.com/v1/',
  headers: {
    'Authorization': `Bearer ${NOTION_TOKEN}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json'
  }
});

function todayKSTISO() {
  const now = new Date();
  // Convert to KST offset +09:00
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const kst = new Date(utc + (9 * 60 * 60000));
  return kst.toISOString().slice(0, 19).replace('T',' ');
}

const sources = [
  { name: 'Maxroll.gg', url: 'https://maxroll.gg/d4' },
  { name: 'D4builds.gg', url: 'https://d4builds.gg' },
  { name: 'Icy Veins', url: 'https://www.icy-veins.com/diablo-4/' },
  { name: 'Reddit r/diablo4', url: 'https://www.reddit.com/r/diablo4/' },
  { name: '디아블로 인벤', url: 'https://www.inven.co.kr/diablo4' }
];

// Predefined classes for the template
const classes = ['Barbarian','Druid','Rogue','Sorcerer','Necromancer'];

function paragraph(text) {
  return {
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [{ type: 'text', text: { content: text } }]
    }
  };
}

function heading(text, level=2) {
  const key = level === 1 ? 'heading_1' : (level === 2 ? 'heading_2' : 'heading_3');
  return {
    object: 'block',
    type: key,
    [key]: {
      rich_text: [{ type: 'text', text: { content: text } }]
    }
  };
}

function bulleted(items) {
  return items.map(t => ({
    object: 'block',
    type: 'bulleted_list_item',
    bulleted_list_item: {
      rich_text: [{ type: 'text', text: { content: t } }]
    }
  }));
}

function linkList(items) {
  return items.map(s => ({
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [{
        type: 'text',
        text: { content: `• ${s.name}`, link: { url: s.url } }
      }]
    }
  }));
}

function classTemplate(cls) {
  const blocks = [];
  blocks.push(heading(`■ ${cls}`, 2));
  blocks.push(heading('스타팅 빌드', 3));
  blocks.push(paragraph('아이템 세팅: '));
  blocks.push(paragraph('보석 세팅: '));
  blocks.push(paragraph('룬/문양(정복자 글리프): '));
  blocks.push(paragraph('직업 특성(전문화): '));
  blocks.push(paragraph('스킬 세팅: '));
  blocks.push(paragraph('정복자 보드/노드: '));
  blocks.push(paragraph('시즌 전용 기믹: '));
  blocks.push(paragraph('난이도·장비 의존도·보스전/속도 파밍 효율: '));

  blocks.push(heading('엔드세팅 빌드', 3));
  blocks.push(paragraph('아이템 세팅: '));
  blocks.push(paragraph('보석 세팅: '));
  blocks.push(paragraph('룬/문양(정복자 글리프): '));
  blocks.push(paragraph('직업 특성(전문화): '));
  blocks.push(paragraph('스킬 세팅: '));
  blocks.push(paragraph('정복자 보드/노드: '));
  blocks.push(paragraph('시즌 전용 기믹: '));
  blocks.push(paragraph('난이도·장비 의존도·보스전/속도 파밍 효율: '));

  blocks.push(paragraph('지난주 대비 변경점: '));
  return blocks;
}

async function createPage() {
  const title = `Diablo IV 주간 메타 빌드 – ${todayKSTISO()} KST`;
  const children = [];

  children.push(heading('📘 주간 메타 빌드 요약', 1));
  children.push(paragraph('본 문서는 자동 생성되었습니다. 각 클래스별 스타팅/엔드세팅 섹션에 최신 정보를 기입하세요.'));
  children.push(heading('출처', 2));
  children.push(...linkList(sources));

  classes.forEach(cls => {
    children.push(...classTemplate(cls));
  });

  const payload = {
    parent: { database_id: DATABASE_ID },
    properties: {
      Name: { title: [{ text: { content: title } }] },
      Week: { rich_text: [{ text: { content: new Date().toISOString().slice(0,10) } }] }
    },
    children
  };

  const res = await notion.post('pages', payload);
  return res.data;
}

try {
  const out = await createPage();
  console.log('Created Notion page:', out.id);
} catch (e) {
  console.error('Failed to create Notion page:', e.response?.data || e.message);
  process.exit(1);
}
