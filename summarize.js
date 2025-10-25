import axios from "axios";
import { applyKoreanTerms } from "./korean_dict.js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function makeSummary(sourcesBySite) {
  const lines = [];
  for (const [site, items] of Object.entries(sourcesBySite || {})) {
    lines.push(`- ${site}:`);
    for (const it of (items || [])) {
      lines.push(`  • ${it.title} :: ${it.url}`);
      if ((it.body || "").length > 0) {
        lines.push(`    (본문 일부) ${it.body.slice(0, 200)}`);
      }
    }
  }
  const srcText = lines.join("\n");

  if (!OPENAI_API_KEY) {
    return "※ OPENAI_API_KEY 미설정: 링크 목록만 수집됨.";
  }

  const system =
    "You are an ARPG build analyst. Output in Korean. For each class, provide Starter and Endgame builds with: 아이템(유니크/어스펙트), 보석, 문양(글리프), 직업특성, 스킬, 정복자 보드/노드, 시즌 전용 기믹, 장비의존/난이도/보스/속도, 지난주 대비 변경점. Keep it concise.";

  const user =
    "아래는 이번 주 수집한 출처의 빌드 제목/링크와 일부 본문입니다. 이를 바탕으로 직업별 스타팅/엔드세팅 빌드 요약 표를 만들어 주세요.\n\n" +
    srcText;

  const payload = {
    model: "gpt-4o-mini",
    temperature: 0.2,
    max_tokens: 900,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ]
  };

  const { data } = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    payload,
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      timeout: 60000
    }
  );

  let text = data?.choices?.[0]?.message?.content?.trim() || "(요약 생성 실패)";
  text = await applyKoreanTerms(text);
  return text;
}
