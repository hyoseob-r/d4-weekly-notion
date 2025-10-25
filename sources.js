import axios from "axios";
import * as cheerio from "cheerio";

async function fetchHTML(url) {
  const { data } = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0 (D4WeeklyBot/1.0)" },
    timeout: 20000
  });
  return cheerio.load(data);
}

function clean(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

export async function fetchSources() {
  const results = {};

  // Maxroll
  try {
    const $ = await fetchHTML("https://maxroll.gg/d4/build-guides");
    const cards = $("a.guide-card, a.group").slice(0, 5);
    const arr = [];
    for (let i = 0; i < cards.length; i++) {
      const el = cards[i];
      const href = $(el).attr("href") || "";
      const url = href.startsWith("http")
        ? href
        : new URL(href, "https://maxroll.gg").toString();
      const title =
        clean($(el).find("h3,.title").text()) || clean($(el).text());
      let body = "";
      try {
        const $$ = await fetchHTML(url);
        body = clean($$("article").text()).slice(0, 4000);
      } catch {}
      arr.push({ title, url, body });
    }
    results["Maxroll"] = arr;
  } catch {
    results["Maxroll"] = [];
  }

  // Icy Veins
  try {
    const $ = await fetchHTML("https://www.icy-veins.com/diablo-4/");
    const links = $("a[href*='build']").slice(0, 5);
    const arr = [];
    for (let i = 0; i < links.length; i++) {
      const el = links[i];
      const url = $(el).attr("href") || "";
      const title = clean($(el).text());
      let body = "";
      try {
        const $$ = await fetchHTML(url);
        body = clean($$("article").text()).slice(0, 4000);
      } catch {}
      arr.push({ title, url, body });
    }
    results["Icy Veins"] = arr;
  } catch {
    results["Icy Veins"] = [];
  }

  // D4builds (동적 사이트 → 링크만)
  try {
    const $ = await fetchHTML("https://d4builds.gg/");
    const links = $("a.card").slice(0, 5);
    const arr = [];
    for (let i = 0; i < links.length; i++) {
      const el = links[i];
      const href = $(el).attr("href") || "";
      const url = href.startsWith("http")
        ? href
        : new URL(href, "https://d4builds.gg").toString();
      const title = clean($(el).find(".name").text()) || clean($(el).text());
      arr.push({ title, url, body: "" });
    }
    results["D4builds"] = arr;
  } catch {
    results["D4builds"] = [];
  }

  // Reddit (본문 크롤링 비활성: 링크만)
  try {
    const $ = await fetchHTML("https://www.reddit.com/r/diablo4/");
    const posts = $("a[data-click-id='body']").slice(0, 5);
    const arr = [];
    for (let i = 0; i < posts.length; i++) {
      const el = posts[i];
      const href = $(el).attr("href") || "";
      const url = href.startsWith("http")
        ? href
        : new URL(href, "https://www.reddit.com").toString();
      const title = clean($(el).text());
      arr.push({ title, url, body: "" });
    }
    results["Reddit"] = arr;
  } catch {
    results["Reddit"] = [];
  }

  // 인벤 (목록 링크만)
  try {
    const $ = await fetchHTML("https://www.inven.co.kr/board/diablo4/6057");
    const posts = $("td.tit > a.subject-link").slice(0, 5);
    const arr = [];
    for (let i = 0; i < posts.length; i++) {
      const el = posts[i];
      const href = $(el).attr("href") || "";
      const url = href.startsWith("http")
        ? href
        : new URL(href, "https://www.inven.co.kr").toString();
      const title = clean($(el).text());
      arr.push({ title, url, body: "" });
    }
    results["인벤"] = arr;
  } catch {
    results["인벤"] = [];
  }

  return results;
}
