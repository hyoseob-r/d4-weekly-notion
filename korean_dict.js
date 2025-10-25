// korean_dict.js
// 공식 KR 용어 사전 자동 적용 + 시즌 최신 보강 + 이중표기 옵션

import axios from "axios";

// 커뮤니티가 유지하는 공식 KR 용어 사전(JSON, 영→한 매핑)
const DICT_URL = "https://raw.githubusercontent.com/D4Korean/d4-official-terms/main/kr_terms.json";

// 크롤링/LLM 결과에서 자주 튀는 표기들 보강(없으면 무시)
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

function normalizeKey(s) {
  return (s || "")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .trim();
}

// 길이가 긴 키부터 치환해서 부분 매칭 부작용 감소
function sortKeysByLengthDesc(obj) {
  return Object.keys(obj).sort((a, b) => b.length - a.length);
}

export async function loadKRDict() {
  if (dictCache) return dictCache;
  try {
    const { data } = await axios.get(DICT_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (D4WeeklyBot/1.0)" },
      timeout: 20000
    });
    // 안전 합치기: 원본 사전이 우선, PATCH_MAP은 보강
    dictCache = { ...PATCH_MAP, ...data };
  } catch (e) {
    // 원본 사전 못 불러오면 보강 맵만 사용
    dictCache = { ...PATCH_MAP };
    console.error("KR 용어 사전 로드 실패:", e.message);
  }
  // 키 정규화
  const fixed = {};
  for (const [k, v] of Object.entries(dictCache)) {
    fixed[normalizeKey(k)] = v;
  }
  dictCache = fixed;
  return dictCache;
}

/**
 * 텍스트에 공식 한글 용어 적용
 * @param {string} text
 * @param {{bilingual?: boolean}} opts
 */
export async function applyKoreanTerms(text, opts = {}) {
  const { bilingual = false } = opts;
  const dict = await loadKRDict();

  let out = text || "";
  const keys = sortKeysByLengthDesc(dict);

  for (const engRaw of keys) {
    const eng = normalizeKey(engRaw);
    if (!eng) continue;
    const kor = dict[engRaw] || dict[eng];
    if (!kor) continue;

    // 단어 경계: 영문/숫자 조합을 기준으로 최소한의 경계만 적용
    const pattern = `(?<![A-Za-z0-9])${eng.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![A-Za-z0-9])`;
    const re = new RegExp(pattern, "gi");

    out = out.replace(re, (m) => {
      return bilingual ? `${kor} (${m})` : kor;
    });
  }
  return out;
}
