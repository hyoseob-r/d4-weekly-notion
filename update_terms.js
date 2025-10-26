// update_terms.js
import axios from "axios";
import fs from "fs";
import path from "path";

const OUT = path.resolve("./data/kr_terms.json");

// 공식/보강 사전 원격 소스 (필요시 추가 가능)
const SOURCES = [
  "https://raw.githubusercontent.com/D4Korean/d4-official-terms/main/kr_terms.json",
  "https://raw.githubusercontent.com/D4Korean/d4-official-terms/refs/heads/main/kr_terms.json",
  "https://raw.githubusercontent.com/D4Korean/d4-season-addons/main/season10_extra.json"
];

// 로컬 기본값 (원격 실패 시)
const LOCAL_BASE = {
  "Whirlwind": "휩쓸기",
  "Hammer of the Ancients": "고대인의 망치",
  "Wrath of the Berserker": "광전사의 분노",
  "Aspect": "어스펙트",
  "Glyph": "문양",
  "Paragon Board": "정복자 보드"
};

// 문자열 정규화
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

  // 기존 로컬 파일 불러오기
  if (fs.existsSync(OUT)) {
    try {
      merged = JSON.parse(fs.readFileSync(OUT, "utf-8"));
      console.log(`[TERMS] loaded existing local: ${Object.keys(merged).length}`);
    } catch {
      merged = { ...LOCAL_BASE };
    }
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
          merged[key] = v;
        }
        console.log(`[TERMS] merged: ${url} (+${Object.keys(json).length})`);
        loadedAny = true;
      }
    } catch (e) {
      console.warn(`[TERMS] fail ${url}: ${e.message}`);
    }
  }

  // 자동 메타데이터 삽입
  merged["_meta"] = {
    version: "Season 10 - The Infernal Hordes",
    updated: new Date().toISOString().split("T")[0],
    source: "Official Korean Patch Notes (Diablo IV 1.6.2)"
  };

  // 키 정렬(긴 항목 우선)
  const ordered = Object.fromEntries(
    Object.keys(merged)
      .sort((a, b) => b.length - a.length)
      .map(k => [k, merged[k]])
  );

  // 폴더 생성 및 저장
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(ordered, null, 2), "utf-8");

  console.log(`[TERMS] saved ${OUT} (${Object.keys(ordered).length}) source=${loadedAny ? "remote+local" : "local-only"}`);
}

main().catch(err => {
  console.error("[TERMS] updater error:", err);
  process.exit(0);
});
