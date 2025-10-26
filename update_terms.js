// update_terms.js
import axios from "axios";
import fs from "fs";
import path from "path";

const OUT = path.resolve("./data/kr_terms.json");

// 1) 우선순위 높은 순서대로 원격 사전 소스들 (필요시 더 추가 가능)
const SOURCES = [
  "https://raw.githubusercontent.com/D4Korean/d4-official-terms/main/kr_terms.json",
  "https://raw.githubusercontent.com/D4Korean/d4-official-terms/refs/heads/main/kr_terms.json",
  // 시즌 전용 보강(예시; 나중에 실제 소스로 교체 가능)
  "https://raw.githubusercontent.com/D4Korean/d4-season-addons/main/season5_extra.json"
];

// 2) 로컬 기본값(없으면 생성용)
const LOCAL_BASE = {
  "Whirlwind": "휩쓸기",
  "Hammer of the Ancients": "고대인의 망치",
  "Wrath of the Berserker": "광전사의 분노",
  "Aspect": "어스펙트",
  "Glyph": "문양",
  "Paragon Board": "정복자 보드"
};

// 3) normalize
const norm = s => (s || "").replace(/[’‘]/g,"'").replace(/[“”]/g,'"').trim();

async function getJSON(url) {
  const { data } = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0 (D4WeeklyBot/1.0)" },
    timeout: 20000
  });
  return data;
}

async function main() {
  let merged = {};
  // 기존 파일 있으면 베이스로 불러오기
  if (fs.existsSync(OUT)) {
    try {
      merged = JSON.parse(fs.readFileSync(OUT, "utf-8"));
      console.log(`[TERMS] loaded existing local: ${Object.keys(merged).length}`);
    } catch {}
  } else {
    merged = { ...LOCAL_BASE };
  }

  // 원격 소스 병합
  let loadedAny = false;
  for (const url of SOURCES) {
    try {
      const json = await getJSON(url);
      if (json && typeof json === "object") {
        for (const [k, v] of Object.entries(json)) {
          const key = norm(k);
          if (!key) continue;
          merged[key] = v; // 뒤에 오는 소스가 우선(시즌 보강 덮어쓰기)
        }
        console.log(`[TERMS] merged: ${url} (+${Object.keys(json).length})`);
        loadedAny = true;
      }
    } catch (e) {
      console.warn(`[TERMS] fail ${url}: ${e.message}`);
    }
  }

  // 키 길이 내림차순 정렬(가독성)
  const ordered = Object.fromEntries(
    Object.keys(merged)
      .sort((a, b) => b.length - a.length)
      .map(k => [k, merged[k]])
  );

  // 디렉터리 보장
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(ordered, null, 2), "utf-8");

  console.log(`[TERMS] saved ${OUT} (${Object.keys(ordered).length}) source=${loadedAny ? "remote+local" : "local-only"}`);
}

main().catch(err => {
  console.error("[TERMS] updater error:", err);
  process.exit(0); // 실패해도 메인 작업은 계속
});
