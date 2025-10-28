// 🔗 빌더/플래너 링크 전용 섹션
blocks.push(H2("스킬/정복자 링크 모음"));

// site → items 순회하며 링크만 삽입
for (const [site, items] of Object.entries(sourcesBySite || {})) {
  if (!items || !items.length) continue;
  blocks.push(H3(site));
  for (const it of items) {
    const title = it.title || it.url;
    const pLinks = (it.links?.paragon || []).slice(0, 2);
    const sLinks = (it.links?.skills  || []).slice(0, 2);

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