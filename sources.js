import axios from 'axios';
import * as cheerio from 'cheerio';

async function fetchList(url, selector, attr='href', titleSel=null){
  try{
    const { data } = await axios.get(url, { timeout: 15000, headers: { 'User-Agent':'Mozilla/5.0 (compatible; D4Bot/1.0)' } });
    const $ = cheerio.load(data);
    const items = [];
    $(selector).each((_, el)=>{
      const href = $(el).attr(attr);
      const title = titleSel ? $(el).find(titleSel).text().trim() : $(el).text().trim();
      if(href && title){
        const abs = href.startsWith('http') ? href : new URL(href, url).toString();
        items.push({ title, url: abs });
      }
    });
    return items.slice(0, 5);
  }catch(e){
    return [];
  }
}

export async function fetchSources(){
  const maxroll = await fetchList('https://maxroll.gg/d4/build-guides', 'a.group', 'href', '.title') || [];
  const d4builds = await fetchList('https://d4builds.gg/', 'a.card', 'href', '.name') || [];
  const icy = await fetchList('https://www.icy-veins.com/diablo-4/', 'a[href*="build"]', 'href') || [];
  const reddit = await fetchList('https://www.reddit.com/r/diablo4/', 'a[data-click-id="body"]', 'href') || [];
  const inven = await fetchList('https://www.inven.co.kr/diablo4', 'a', 'href') || [];

  function uniq(arr){
    const seen = new Set(); const out=[];
    for(const it of arr){
      if(!seen.has(it.url)){ seen.add(it.url); out.push(it);}
    }
    return out.slice(0, 6);
  }

  return {
    Maxroll: uniq(maxroll.length?maxroll:[{title:'Maxroll Diablo 4', url:'https://maxroll.gg/d4'}]),
    D4builds: uniq(d4builds.length?d4builds:[{title:'D4builds.gg', url:'https://d4builds.gg'}]),
    IcyVeins: uniq(icy.length?icy:[{title:'Icy Veins D4', url:'https://www.icy-veins.com/diablo-4/'}]),
    Reddit: uniq(reddit.length?reddit:[{title:'r/diablo4', url:'https://www.reddit.com/r/diablo4/'}]),
    Inven: uniq(inven.length?inven:[{title:'디아블로 인벤', url:'https://www.inven.co.kr/diablo4'}]),
  };
}
