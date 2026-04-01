# NOLCOOL — Nightlife (NOT kids/leisure)
## MUST
- base: "/" ONLY. BrowserRouter ONLY. No # in URL
- Store name (가게이름) = Region+Type+Business. FIRST in title
- No "놀쿨" in any title except homepage
- Keyword density 1.5-2.5% (1000c=5-7x, 2000c=8-12x)
- Mobile: 16px font, 1.7 line-height, 44px touch, no bar overlap
- useEffect cleanup ALL timers. persistSession:true. ErrorBoundary
- Bestseller writing. No AI text. No banned words
- Internal search ONLY. No external redirect
## SEO 2026 — Store Name Top Ranking
- title: Store name first + hook. Under 60 chars
- meta description: 150 chars MAX. Store name + hook + CTA
- H1: Store name once. H2: Store name in 3+ subheadings
- First 100 chars of body: Store name must appear
- Schema: JSON-LD LocalBusiness + NightClub type
- og:image: real store photo 1:1. alt="store name"
- sitemap.xml + robots.txt (Allow: Googlebot, Yeti, GPTBot)
- llms.txt for AI search (ChatGPT/Perplexity/Gemini)
- Core Web Vitals: LCP<2.5s, INP<200ms, CLS<0.1
- Internal links: 3 related venues per page
- Canonical URL on every page. No duplicates
- Image: WebP, lazy load, alt=store name
- E-E-A-T: real visit experience, expert tone, author name
## NEVER
- Auto page transition. Next.js. Change existing URLs
- "| 놀쿨" in title. Brand path in base
- Keyword stuffing over 3%. Duplicate content
- Baby/mom/family/kids images. Banned adult words
