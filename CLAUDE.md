# NOLCOOL — Nightlife (NOT kids/leisure)
## MUST
- base: "/" ONLY. BrowserRouter ONLY. No # in URL
- Store name = Region+Type+Business. FIRST in title
- No "놀쿨" in any title except homepage
- Keyword density 1.5-2.5% (1000c=5-7x, 2000c=8-12x)
- Mobile: 16px font, 1.7 line-height, 44px touch, no bar overlap
- useEffect cleanup ALL timers. persistSession:true. ErrorBoundary
- Bestseller writing. No AI text.
- All links open in new tab! target="_blank" rel="noopener noreferrer" Internal search ONLY
## SEO 2026
- title: Store name + hook. Under 60 chars
- meta description: 150 chars. H1+H2 with store name 3+ times
- Schema: JSON-LD NightClub. og:image: real photo 1:1
- sitemap.xml + robots.txt (Googlebot/Yeti/GPTBot) + llms.txt
- Core Web Vitals: LCP<2.5s, INP<200ms, CLS<0.1
- E-E-A-T: real experience, expert tone. Canonical URL. NEVER duplicate title/content across domains!. og:image 1200x1200 (1:1) every page!
## NEVER
- Auto page transition. Next.js. Change existing URLs
- Brand name in title. Brand path. Stuffing over 3%
- Baby/mom/family/kids images. No family content (parents birthday/family gathering/reunion/anniversary = DELETE!). Banned adult words
## ★ CROSS-SITE UNIQUENESS (CRITICAL)
- Every site for the same store MUST have 100% unique title + body text
- Similarity between ANY two sites < 10%
- Each site = different hook angle for the same store
  - Site A: experience/review angle ("직접 가봤다")
  - Site B: guide/info angle ("완벽 가이드")
  - Site C: comparison/ranking angle ("TOP 비교")
- Body text: completely rewrite from scratch. NEVER reuse sentences across sites
- Before finalizing: compare all titles across sites. 0% match required
- If ANY title matches another site = FAIL. Rewrite immediately without asking
