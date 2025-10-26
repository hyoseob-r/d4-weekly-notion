// update_terms.js — KR 용어 사전 자동 갱신 + 시즌 자동 감지 메타
import axios from "axios";
import fs from "fs";
import path from "path";

const OUT = path.resolve("./data/kr_terms.json");

// 1) 공식/보강 사전 소스 (있으면 병합, 없으면 기존 유지)
const SOURCES = [
  "https://raw.githubusercontent.com/D4Korean/d4-official-terms/main/kr_terms.json",
  "https://raw.githubusercontent.com/D4Korean/d4-official-terms/refs/heads/main/kr_terms.json",
  // 시즌 보강(예시 소스; 없으면 자동 스킵)
  "https://raw.githubusercontent.com/D4Korean/d4-season-addons/main/season10_extra.json"
];

// 2) 시즌 자동 감지용 후보 소스 (여러 개 시도, 실패시 기존 _meta 유지)
const SEASON_SOURCES = [
  // 블리자드 뉴스(영문) 태그/검색 페이지들
  "https://news.blizzard.com/en-us/diablo4",
  "https://news.blizzard.com/en-us/diablo4?tags=patch-notes",
  // 한국 공식(차단될 수 있어 예비로)
  "https://news.blizzard.com/ko-kr/diablo4",
  // 커뮤니티 미러(접속 쉬움)
  "https://diablo4.wiki.fextralife.com/Seasons"
];

const LOCAL_BASE = {
  "Whirlwind": "휩쓸기",
  "Hammer of the Ancients": "고대인의 망치",
  "Wrath of the Berserker": "광전사의 분노",
  "Aspect": "어스펙트",
  "Glyph": "문양",
  "Paragon Board": "정복자 보드"
};

const norm = (s) => (s || "").replace(/[’‘]/g,"'").replace(/[“”]/g,'"').trim();

async function fetchText(url){
  const { data } = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0 (D4WeeklyBot/1.0)" },
    timeout: 20000
  });
  return typeof data === "string" ? data : JSON.stringify(data);
}

async function getJSON(url) {
  const { data } = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0 (D4WeeklyBot/1.0)" },
    timeout: 20000
  });
  return data;
}

function loadLocalJSONSafe(file){
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {}
  return null;
}

// 시즌 문자열 파서: Season 10, Season of the Infernal Hordes 등 추출
function parseSeason(html){
  if (!html) return null;
  // 1) "Season 10" 형태
  const mNum = html.match(/Season\s+(\d{1,2})/i);
  // 2) "Season of the Xxxxx" 형태
  const mTitle = html.match(/Season\s+of\s+the\s+([A-Za-z][A-Za-z\s'-]+)/i);

  let num = mNum ? mNum[1] : null;
  let title = mTitle ? mTitle[1].trim() : null;

  // 보정: 흔한 테마명 키워드들(대소문자 무시)
  const known = [
    "Malignant","Blood","Construct","Loot Reborn","Infernal Hordes","Vessel of Hatred",
    "Sanctuary","Storm","Ethereal"
  ];
  if (!title){
    const mKnown = new RegExp(`Season\\s+of\\s+the\\s+(${known.join("|")})`, "i").exec(html);
    if (mKnown) title = mKnown[1];
  }

  if (!num && !title) return null;
  return { num, title };
}

async function detectSeasonMeta(prevMeta){
  for (const url of SEASON_SOURCES){
    try{
      const html = await fetchText(url);
      const info = parseSeason(html);
      if (info){
        const ver =
          info.num && info.title
            ? `Season ${info.num} - ${info.title}`
            : info.num
              ? `Season ${info.num}`
              : `Season of the ${info.title}`;
        return {
          version: ver,
          updated: new Date().toISOString().split("T")[0],
          source: url
        };
      }
    }catch(e){
      // 계속 다음 소스 시도
    }
  }
  // 모두 실패 → 이전 메타 유지(있으면), 없으면 디폴트
  if (prevMeta && typeof prevMeta === "object"){
    return {
      version: prevMeta.version || "Season (unknown)",
      updated: new Date().toISOString().split("T")[0],
      source: prevMeta.source || "local"
    };
  }
  return {
    version: "Season 10 - The Infernal Hordes",
    updated: new Date().toISOString().split("T")[0],
    source: "local"
  };
}

async function main(){
  // 1) 기존 사전 로드
  let merged = loadLocalJSONSafe(OUT) || { ...LOCAL_BASE };

  // 2) 원격 사전 병합
  let loadedAny = false;
  for (const url of SOURCES){
    try{
      const json = await getJSON(url);
      if (json && typeof json === "object"){
        for (const [k, v] of Object.entries(json)){
          const key = norm(k);
          if (!key) continue;
          merged[key] = v;
        }
        console.log(`[TERMS] merged: ${url} (+${Object.keys(json).length})`);
        loadedAny = true;
      }
    }catch(e){
      console.warn(`[TERMS] fail ${url}: ${e.message}`);
    }
  }

  // 3) 시즌 메타 자동 감지 (_meta 유지 또는 교체)
  const prevMeta = merged["_meta"] || null;
  const meta = await detectSeasonMeta(prevMeta);
  merged["_meta"] = meta;

  // 4) 키 정렬(긴 키 우선)
  const ordered = Object.fromEntries(
    Object.keys(merged)
      .sort((a,b)=>b.length - a.length)
      .map(k => [k, merged[k]])
  );

  // 5) 저장
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(ordered, null, 2), "utf-8");

  console.log(`[TERMS] saved ${OUT} (${Object.keys(ordered).length}) source=${loadedAny ? "remote+local" : "local-only"}`);
  console.log(`[SEASON] ${meta.version} (updated ${meta.updated}) ← ${meta.source}`);
}

main().catch(err=>{
  console.error("[TERMS] updater error:", err);
  process.exit(0); // 실패해도 메인 잡은 진행
});
