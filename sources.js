import axios from "axios";
import * as cheerio from "cheerio";

// 수집 대상 사이트
const SITES = {
  maxroll: "https://maxroll.gg/d4/build-guides",
  d4builds: "https://d4builds.gg/",
  icyveins: "https://www.icy-veins.com/d4/",
  reddit: "https://www.reddit.com/r/diablo4/",
  inven: "https://www.inven.co.kr/board/diablo4/6057",
};

// 공용 fetch + HTML 파싱 헬퍼
async function fetchHTML(url) {
  const { data } = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    timeout: 20000,
  });
  return cheerio.load(data);
}

// 빌드 링크 + 세부 본문 일부 파싱
export async function fetchSources() {
   const results = {};
   ...
   return results;
}

  // MAXROLL
  try {
    const $ = await fetchHTML(SITES.maxroll);
    const links = $("a.guide-card").slice(0, 5);
    results["Maxroll"] = await Promise.all(
      links.map(async (_, el) => {
        const url = "https://maxroll.gg" + $(el).attr("href");
        const title = $(el).find("h3").text().trim();
        const $$ = await fetchHTML(url);
        const body = $$("article").text().slice(0, 4000); // 본문 일부만
        return { title, url, body };
      }).get()
    );
  } catch (e) {
    console.error("Maxroll fetch error:", e.message);
  }

  // ICY VEINS
  try {
    const $ = await fetchHTML(SITES.icyveins);
    const links = $("a[href*='build']").slice(0, 5);
    results["Icy Veins"] = await Promise.all(
      links.map(async (_, el) => {
        const url = $(el).attr("href");
        const title = $(el).text().trim();
        const $$ = await fetchHTML(url);
        const body = $$("article").text().slice(0, 4000);
        return { title, url, body };
      }).get()
    );
  } catch (e) {
    console.error("Icy Veins fetch error:", e.message);
  }

  // Reddit
  try {
    const $ = await fetchHTML(SITES.reddit);
    const posts = $("a[data-click-id='body']").slice(0, 5);
    results["Reddit"] = posts.map((_, el) => ({
      title: $(el).text(),
      url: "https://reddit.com" + $(el).attr("href"),
      body: "",
    })).get();
  } catch (e) {
    console.error("Reddit fetch error:", e.message);
  }

  // Inven
  try {
    const $ = await fetchHTML(SITES.inven);
    const posts = $("td.tit > a.subject-link").slice(0, 5);
    results["인벤"] = posts.map((_, el) => ({
      title: $(el).text().trim(),
      url: "https://www.inven.co.kr" + $(el).attr("href"),
      body: "",
    })).get();
  } catch (e) {
    console.error("Inven fetch error:", e.message);
  }

  return results;
}
