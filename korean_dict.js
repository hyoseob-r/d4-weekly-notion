// korean_dict.js
import axios from "axios";
import fs from "fs";

const DICT_URLS = [
  "https://raw.githubusercontent.com/D4Korean/d4-official-terms/main/kr_terms.json",
  "https://raw.githubusercontent.com/D4Korean/d4-official-terms/refs/heads/main/kr_terms.json"
];

const LOCAL_DICT_PATH = "./data/kr_terms.json";

const PATCH_MAP = {
  "Whirlwind": "휩쓸기",
  "Hammer of the Ancients": "고대인의 망치",
  "Upheaval": "격돌",
  "Bash": "강타",
  "Charge": "돌진",
  "Wrath of the Berserker": "광전사의 분노",
  "Iron Skin": "강철 피부",
  "Ramaladni's Magnum Opus": "라마라드니의 명작",
  "Harlequin Crest": "할리퀸 관모",
  "The Butcher's Cleaver": "도살자의 식칼",
  "The Grandfather": "그랜드파더",
  "Glyph of the Berserker": "광전사의 문양",
  "Glyph of the Iron Skin": "철피부의 문양",
  "Aspect": "어스펙트",
  "Glyph": "문양",
  "Paragon Board": "정복자 보드",
  "Attack Speed": "공격 속도",
  "Critical Strike Damage": "극대화 피해",
  "Damage Reduction": "피해 감소",
  "Maximum Life": "최대 생명력"
};

let dictCache = null;

function normalizeKey(s){ return (s||"").replace(/[’‘]/g,"'").replace(/[“”]/g,'"').trim(); }
function sortKeysByLengthDesc(obj){ return Object.keys(obj).sort((a,b)=>b.length-a.length); }

async function loadRemote() {
  for (const url of DICT_URLS) {
    try {
      const { data } = await axios.get(url, {
        headers: { "User-Agent": "Mozilla/5.0 (D4WeeklyBot/1.0)" },
        timeout: 20000
      });
      console.log(`[KR-DICT] loaded remote: ${url}`);
      return data;
    } catch(e) {
      console.warn(`[KR-DICT] remote fail ${url}: ${e.message}`);
    }
  }
  return null;
}

function loadLocal() {
  try {
    if (fs.existsSync(LOCAL_DICT_PATH)) {
      const raw = fs.readFileSync(LOCAL_DICT_PATH, "utf-8");
      console.log("[KR-DICT] loaded local:", LOCAL_DICT_PATH);
      return JSON.parse(raw);
    }
  } catch(e) {
    console.warn("[KR-DICT] local load fail:", e.message);
  }
  return null;
}

export async function loadKRDict() {
  if (dictCache) return dictCache;

  // 1) 원격 시도 → 2) 로컬 파일 → 3) 패치맵
  const remote = await loadRemote();
  const local = loadLocal();
  const base = remote || local || {};
  let merged = { ...PATCH_MAP, ...base };

  const fixed = {};
  for (const [k, v] of Object.entries(merged)) fixed[normalizeKey(k)] = v;
  dictCache = fixed;

  const source = remote ? "remote" : local ? "local" : "patch";
  console.log(`[KR-DICT] using source: ${source}, size: ${Object.keys(dictCache).length}`);
  return dictCache;
}

export async function applyKoreanTerms(text, opts = {}) {
  const { bilingual = false } = opts;
  const dict = await loadKRDict();
  let out = text || "";
  let hit = 0;

  for (const eng of sortKeysByLengthDesc(dict)) {
    const kor = dict[eng];
    const pattern = `(?<![A-Za-z0-9])${eng.replace(/[.*+?^${}()|[\\]\\\\]/g,"\\$&")}(?![A-Za-z0-9])`;
    const re = new RegExp(pattern, "gi");
    const before = out;
    out = out.replace(re, m => bilingual ? `${kor} (${m})` : kor);
    if (out !== before) hit++;
  }
  console.log(`[KR-DICT] replacements: ${hit}`);
  return out;
}
