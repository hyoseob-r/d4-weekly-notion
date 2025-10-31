import axios from 'axios';

/** Notion Axios 클라이언트 */
export function notionClient(token){
  return axios.create({
    baseURL: 'https://api.notion.com/v1/',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    timeout: 20000
  });
}

/** 블록 헬퍼들 */
export function H1(t){
  return {object:'block',type:'heading_1',heading_1:{rich_text:[{type:'text',text:{content:t}}]}};
}
export function H2(t){
  return {object:'block',type:'heading_2',heading_2:{rich_text:[{type:'text',text:{content:t}}]}};
}
export function H3(t){
  return {object:'block',type:'heading_3',heading_3:{rich_text:[{type:'text',text:{content:t}}]}};
}
export function P(t){
  return {object:'block',type:'paragraph',paragraph:{rich_text:[{type:'text',text:{content:t}}]}};
}
export function Bulleted(t){
  return {object:'block',type:'bulleted_list_item',bulleted_list_item:{rich_text:[{type:'text',text:{content:t}}]}};
}
export function Link(label, url){
  return {object:'block',type:'paragraph',paragraph:{rich_text:[{type:'text',text:{content:`• ${label}`, link:{url}}}]}};
}

/**
 * ✅ 기존 "두 개의 DB(스타팅/일반)"을 재사용할 때 쓰는 행 생성 함수
 * @param {AxiosInstance} client - notionClient() 로 만든 axios 인스턴스
 * @param {string} databaseId    - 대상 데이터베이스 ID
 * @param {object} props         - { title, className, source, articleUrl, skillUrl, paragonUrl, collectedAt }
 * @param {object} schema        - 컬럼명 매핑(옵션) { title, class, source, article, skill, paragon, date }
 */
export function createDbRow(client, databaseId, props = {}, schema = {}){
  const S = {
    title:   schema.title   || '제목',
    class:   schema.class   || '직업',
    source:  schema.source  || '출처',
    article: schema.article || '원문',
    skill:   schema.skill   || '스킬트리',
    paragon: schema.paragon || '정복자',
    date:    schema.date    || '수집일'
  };

  const properties = {};
  properties[S.title] = {
    title: [{ type: 'text', text: { content: props.title || '(제목 없음)' } }]
  };
  if (props.className)  properties[S.class]   = { select: { name: props.className } };
  if (props.source)     properties[S.source]  = { select: { name: props.source } };
  if (props.articleUrl) properties[S.article] = { url: props.articleUrl };
  if (props.skillUrl)   properties[S.skill]   = { url: props.skillUrl };
  if (props.paragonUrl) properties[S.paragon] = { url: props.paragonUrl };
  if (props.collectedAt)properties[S.date]    = { date: { start: props.collectedAt } };

  return client.post('pages', {
    parent: { database_id: databaseId },
    properties
  });
}

/**
 * (선택) DB가 하나뿐일 때: "분류(스타팅/일반)" 컬럼을 써서 한 DB에 넣는 버전
 * @param {AxiosInstance} client
 * @param {string} databaseId
 * @param {object} props  - { title, className, isStarting, source, articleUrl, skillUrl, paragonUrl, collectedAt }
 * @param {object} schema - { title, class, kind, source, article, skill, paragon, date }
 */
export function createDbRowSingle(client, databaseId, props = {}, schema = {}){
  const S = {
    title:   schema.title   || '제목',
    class:   schema.class   || '직업',
    kind:    schema.kind    || '분류',      // '스타팅' | '일반'
    source:  schema.source  || '출처',
    article: schema.article || '원문',
    skill:   schema.skill   || '스킬트리',
    paragon: schema.paragon || '정복자',
    date:    schema.date    || '수집일'
  };

  const properties = {};
  properties[S.title] = {
    title: [{ type: 'text', text: { content: props.title || '(제목 없음)' } }]
  };
  if (props.className) properties[S.class] = { select: { name: props.className } };
  properties[S.kind] = { select: { name: props.isStarting ? '스타팅' : '일반' } };
  if (props.source)     properties[S.source]  = { select: { name: props.source } };
  if (props.articleUrl) properties[S.article] = { url: props.articleUrl };
  if (props.skillUrl)   properties[S.skill]   = { url: props.skillUrl };
  if (props.paragonUrl) properties[S.paragon] = { url: props.paragonUrl };
  if (props.collectedAt)properties[S.date]    = { date: { start: props.collectedAt } };

  return client.post('pages', {
    parent: { database_id: databaseId },
    properties
  });
}

/**
 * (옵션) 부모 "페이지" 아래에 자식 페이지/DB를 만들어야 할 때 쓰는 헬퍼
 * - DB 자동 생성은 나중에 필요하면 붙입니다.
 */
export function createChildPage(client, parentPageId, title, childrenBlocks = []){
  return client.post('pages', {
    parent: { page_id: parentPageId },
    properties: {
      title: [{ type: 'text', text: { content: title || '(제목 없음)' } }]
    },
    children: childrenBlocks
  });
}
