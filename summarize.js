import axios from 'axios';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
import { applyKoreanTerms } from "./korean_dict.js";

const payload = {
  model: "gpt-4o-mini",   // 비용 절약형
  messages: [...],
  temperature: 0.2,
  max_tokens: 900         // 과금 캡
};


export async function makeSummary(sourcesBySite){
  const lines = [];
  for(const [site, items] of Object.entries(sourcesBySite)){
    lines.push(`- ${site}:`);
    for(const it of items){
      lines.push(`  • ${it.title} :: ${it.url}`);
    }
  }
  const srcText = lines.join('\n');

  if(!OPENAI_API_KEY){
    return "※ OPENAI_API_KEY 미설정: 링크 목록만 수집됨. 다음 주까지 키를 추가해 주세요.";
  }

  const system = `You are an ARPG build analyst. Produce compact, factual weekly meta summaries for Diablo 4 by class.
- Output in Korean.
- Sections per class: 스타팅/엔드세팅.
- For each: 아이템(유니크/어스펙트), 보석, 문양(글리프), 직업특성, 스킬, 정복자 보드/노드, 시즌기믹, 장비의존/난이도/보스/속도, 변경점.
- If a field is unknown from sources, leave a short placeholder like "(출처 확인 필요)".
- Keep total length under ~140 lines.`;

  const user = `다음은 이번주 수집한 메타 출처의 글 제목/링크입니다. 이를 바탕으로 "직업별 스타팅/엔드세팅 빌드" 요약 표를 만들어 주세요.\n\n${srcText}`;

  const payload = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    temperature: 0.2
  };

  const { data } = await axios.post('https://api.openai.com/v1/chat/completions', payload, {
    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    timeout: 60000
  });
  const text = data.choices?.[0]?.message?.content?.trim() || "(요약 생성 실패)";
  text = await applyKoreanTerms(text);
  return text;
}
