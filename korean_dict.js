// korean_dict.js
// 블리자드 공식 KR 명칭 자동 매핑 (매주 자동 갱신)

import axios from "axios";
import fs from "fs";

// GitHub의 KR 용어 사전 JSON (커뮤니티 유지 오픈소스)
const DICT_URL =
  "https://raw.githubusercontent.com/D4Korean/d4-official-terms/main/kr_terms.json";

let cache = {};

export async function getKRDictionary() {
  if (Object.keys(cache).length) return cache;
  try {
    const { data } = await axios.get(DICT_URL, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 20000,
    });
    cache = data;
    return cache;
  } catch (e) {
    console.error("⚠️ KR 용어 사전 로드 실패:", e.message);
    return {};
  }
}

// 영어 명칭을 공식 한글 용어로 치환
export async function applyKoreanTerms(text) {
  const dict = await getKRDictionary();
  let result = text;
  for (const [eng, kor] of Object.entries(dict)) {
    const regex = new RegExp(`\\b${eng}\\b`, "gi");
    result = result.replace(regex, kor);
  }
  return result;
}
