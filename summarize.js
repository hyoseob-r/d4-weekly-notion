import axios from "axios";
import { applyKoreanTerms } from "./korean_dict.js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function makeSummary(sourcesBySite) {
  // 1) 수집 링크를 짧은 텍스트로
  const lines = [];
  for (const [site, items] of Object.entries(sourcesBySite || {})) {
    lines.push(`- ${site}`);
    for (const it of items || []) {
      const bodyHint = (it.body || "").slice(0, 400);
      lines.push(`  • ${it.title} :: ${it.url}${bodyHint ? `\n    ${bodyHint}` : ""}`);
    }
  }
  const srcText = lines.join("\n");

  if (!OPENAI_API_KEY) return "※ OPENAI_API_KEY 미설정: 링크만 정리됨.";

  // 2) 반드시 JSON으로만 응답시키는 프롬프트
  const system = `
You are an ARPG build analyst. Respond ONLY with minified JSON that strictly matches this schema:

{
  "classes": [
    {
      "name": "Barbarian|Sorcerer|Rogue|Druid|Necromancer(etc, Korean allowed)",
      "starting": {
        "items": "…",
        "gems": "…",
        "glyphs": "…",
        "traits": "…",
        "skills": "…",
        "boards": "…",
        "season": "…",
        "gear": "Low|Medium|High or text",
        "difficulty": "Easy|Normal|Hard or text",
        "boss": "…",
        "speed": "…",
        "changes": "…"
      },
      "endgame": { SAME_FIELDS_AS_starting }
    }
  ]
}
If unknown, use "-" not null. No markdown fences, no commentary. Korean output preferred.
  `.trim();

  const user = `
아래는 이번 주 출처(제목/링크/본문일부)입니다. 이를 기반으로 직업별 스타팅/엔드세팅 빌드를 위 JSON 스키마로만 응답하세요.

${srcText}
  `.trim();

  const payload = {
    model: "gpt-4o-mini",
    temperature: 0.1,
    max_tokens: 1200,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ]
  };

  const { data } = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    payload,
    {
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      timeout: 90000
    }
  );

  let raw = data?.choices?.[0]?.message?.content ?? "";
  // 3) 코드펜스 제거(혹시 붙어오면)
  raw = raw.replace(/^```json\s*|\s*```$/g, "");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.warn("JSON parse failed, fallback to raw text:", e.message);
    let txt = await applyKoreanTerms(raw, { bilingual: process.env.KR_BILINGUAL === "true" });
    return txt;
  }

  // 4) 렌더: 섹션 분리형 (스타팅/엔드)
  const out = [];
  const classes = Array.isArray(parsed?.classes) ? parsed.classes : [];
  for (const cls of classes) {
    const name = cls?.name || "클래스";
    const st = cls?.starting || {};
    const ed = cls?.endgame || {};

    const block = [
      `### ${name}`,
      "",
      `#### ⚔ 스타팅 빌드`,
      `- **아이템**: ${st.items || "-"}`,
      `- **보석**: ${st.gems || "-"}`,
      `- **문양**: ${st.glyphs || "-"}`,
      `- **직업특성**: ${st.traits || "-"}`,
      `- **스킬**: ${st.skills || "-"}`,
      `- **정복자 보드**: ${st.boards || "-"}`,
      `- **시즌 기믹**: ${st.season || "-"}`,
      `- **장비의존**: ${st.gear || "-"}`,
      `- **난이도**: ${st.difficulty || "-"}`,
      `- **보스 대응**: ${st.boss || "-"}`,
      `- **속도**: ${st.speed || "-"}`,
      `- **주간 변경점**: ${st.changes || "-"}`,
      "",
      `---`,
      "",
      `#### 💀 엔드게임 빌드`,
      `- **아이템**: ${ed.items || "-"}`,
      `- **보석**: ${ed.gems || "-"}`,
      `- **문양**: ${ed.glyphs || "-"}`,
      `- **직업특성**: ${ed.traits || "-"}`,
      `- **스킬**: ${ed.skills || "-"}`,
      `- **정복자 보드**: ${ed.boards || "-"}`,
      `- **시즌 기믹**: ${ed.season || "-"}`,
      `- **장비의존**: ${ed.gear || "-"}`,
      `- **난이도**: ${ed.difficulty || "-"}`,
      `- **보스 대응**: ${ed.boss || "-"}`,
      `- **속도**: ${ed.speed || "-"}`,
      `- **주간 변경점**: ${ed.changes || "-"}`
    ].join("\n");

    out.push(block, ""); // 클래스 간 빈 줄
  }

  // 5) 공식 KR 용어 사전 적용 (이중표기 옵션 지원)
  let finalText = out.join("\n").trim();
  finalText = await applyKoreanTerms(finalText, { bilingual: process.env.KR_BILINGUAL === "true" });

  return finalText || "(내용 없음)";
}
