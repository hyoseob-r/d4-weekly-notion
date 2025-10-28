import { fetchSources } from "./sources.js";
import { makeSummary } from "./summarize.js";
import { createNotionPage, H2, H3, P, Link } from "./notion.js";

async function main() {
  console.log("🔹 빌드 소스 수집 중...");
  const sourcesBySite = await fetchSources();

  console.log("🔹 요약 생성 중...");
  const summary = await makeSummary(sourcesBySite);

  // ✅ 노션 블록 초기화
  let blocks = [];

  // -----------------------------
  // 1️⃣ 요약 섹션
  // -----------------------------
  blocks.push(H2("🧭 이번 주 빌드 요약"));
  blocks.push(P(summary));

  // -----------------------------
  // 2️⃣ 스킬 / 정복자 링크 섹션
  // -----------------------------
  blocks.push(H2("🪓 스킬 / 정복자 링크 모음"));

  for (const [site, items] of Object.entries(sourcesBySite || {})) {
    if (!items || !items.length) continue;

    blocks.push(H3(site));

    for (const it of items) {
      const title = it.title || it.url;
      const pLinks = (it.links?.paragon || []).slice(0, 2);
      const sLinks = (it.links?.skills || []).slice(0, 2);

      // 스킬 트리 링크
      for (const url of sLinks) {
        blocks.push(P(`• ${title} – 스킬 트리`));
        blocks.push(Link("스킬 트리 열기", url));
      }

      // 정복자 보드 링크
      for (const url of pLinks) {
        blocks.push(P(`• ${title} – 정복자 보드`));
        blocks.push(Link("정복자 보드 열기", url));
      }
    }
  }

  // -----------------------------
  // 3️⃣ 노션 페이지 생성
  // -----------------------------
  console.log("🪄 노션 페이지 생성 중...");
  await createNotionPage("Diablo4 Weekly Notion / Update", blocks);

  console.log("✅ 완료되었습니다.");
}

main().catch((err) => {
  console.error("🚨 오류 발생:", err);
  process.exit(1);
});