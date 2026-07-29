import puppeteer from 'puppeteer-core';
const CHROME = process.env.CHROME_PATH || '/usr/bin/chromium';
const b = await puppeteer.launch({ executablePath: CHROME, headless:'new', args:['--no-sandbox'] });
const p = await b.newPage();
await p.goto('https://nolcool.com/rooms/ilsan/ilsanroom/?cb='+Date.now(), {waitUntil:'networkidle2', timeout:60000});
// 모든 wixsite 링크 찾기 + 화면에 보이는지
const links = await p.$$eval('a[href*="qotjsdnr12397.wixsite.com"]', els => els.map(a => {
  const r = a.getBoundingClientRect();
  const st = getComputedStyle(a);
  const visible = r.width>0 && r.height>0 && st.display!=='none' && st.visibility!=='hidden' && st.opacity!=='0';
  // 조상 중 숨김 있는지
  let hidden=false, n=a;
  while(n){ const s=getComputedStyle(n); if(s.display==='none'||s.visibility==='hidden'||s.opacity==='0'){hidden=true;break;} n=n.parentElement; }
  return { text:a.textContent, href:a.href, boxVisible:visible, ancestorHidden:hidden, rectW:Math.round(r.width), rectH:Math.round(r.height) };
}));
console.log('wixsite 링크 개수:', links.length);
console.log(JSON.stringify(links, null, 2));
await b.close();
