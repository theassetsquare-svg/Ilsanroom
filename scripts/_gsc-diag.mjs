#!/usr/bin/env node
// TEMP — 새 속성+스코프로 searchAnalytics(gscQuery) 200 검증. 실행 후 삭제.
import { getAccessToken, gscQuery, SITE_PROPERTY } from './lib/gsc-auth.mjs';
const token = await getAccessToken();
console.log('property:', SITE_PROPERTY, '| token:', token ? 'OK' : 'NULL');
if (token) {
  const q = await gscQuery(token, { dimensions: ['query'], rowLimit: 5, days: 28 });
  console.log('searchAnalytics rows:', q.rows.length, '| range:', q.start, '→', q.end);
  console.log('sample:', JSON.stringify(q.rows.slice(0, 3).map(r => ({ q: r.keys?.[0], clicks: r.clicks, imp: r.impressions }))));
}
