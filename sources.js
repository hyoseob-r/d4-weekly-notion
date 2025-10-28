function pickLinks($$, baseUrl) {
  const anchors = $$("a[href]");
  const out = { paragon: [], skills: [] };
  const toAbs = (href) => href.startsWith("http") ? href : new URL(href, baseUrl).toString();

  anchors.each((_, a) => {
    const href = $$(a).attr("href") || "";
    const url = toAbs(href);
    const u = url.toLowerCase();

    // 정복자/플래너(보드 경로) 후보
    if (
      u.includes("paragon") ||
      u.includes("/board") ||
      u.includes("/planner") ||
      u.includes("planner.maxroll.gg/d4") ||
      u.includes("d4planner.io")
    ) out.paragon.push(url);

    // 스킬/트리/빌더 후보
    if (
      u.includes("skill") ||
      u.includes("/tree") ||
      u.includes("/builder") ||
      u.includes("/builds") ||
      u.includes("maxroll.gg/d4/") ||
      u.includes("d4builds.gg") ||
      u.includes("mobalytics.gg/diablo-4")
    ) out.skills.push(url);
  });

  const uniq = (arr) => Array.from(new Set(arr)).slice(0, 3);
  out.paragon = uniq(out.paragon);
  out.skills  = uniq(out.skills);
  return out;
}