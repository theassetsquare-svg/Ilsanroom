#!/usr/bin/env node
'use strict';

var seo = require('./seo-engine');
var fs = require('fs');
var path = require('path');

var venuesDir = path.join(__dirname, '..', 'data', 'venues');
var seedPath = path.join(__dirname, '..', 'data', 'venues.seed.json');

// Load seed for full list
var seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

// Sample 5 venues across categories
var sampleSlugs = [
  'busan-yeonsan-mul-night',
  'suwon-chancedom-night',
  'gangnam-club-race',
  'gangnam-lounge-arzu',
  'indukwon-gukbingwan-night',
];

// For venues without individual JSON, create minimal objects from seed
function loadVenue(slug) {
  var filePath = path.join(venuesDir, slug + '.json');
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  // Fallback: find in seed
  var found = seed.venues.find(function (v) { return v.slug === slug; });
  if (found) {
    return {
      id: found.id,
      slug: found.slug,
      storeName: found.storeName,
      regionCity: '',
      regionArea: '',
      category: found.category,
      primaryKeyword: found.storeName,
      secondaryKeywords: [],
      intentKeywords: [],
      status: found.status,
      sourceUrls: [],
      verifiedSignals: [],
      unverifiedFacts: [],
      lastCheckedAt: '2026-03-13',
      waiterName: '',
      phone: '',
      address: '',
      nearStation: '',
      heroImage: '',
      summaryBullets: [],
    };
  }
  return null;
}

console.log('='.repeat(80));
console.log('SEO ENGINE — 5 Sample Preview');
console.log('='.repeat(80));

var allResults = [];

sampleSlugs.forEach(function (slug) {
  var venue = loadVenue(slug);
  if (!venue) {
    console.log('\n[SKIP] ' + slug + ' — not found');
    return;
  }

  var result = seo.generate(venue);
  var validation = seo.validate(result);

  allResults.push({ slug: slug, result: result, validation: validation });

  console.log('\n' + '-'.repeat(60));
  console.log('VENUE: ' + venue.storeName + ' (' + slug + ')');
  console.log('-'.repeat(60));
  console.log('Title:    ' + result.title);
  console.log('          [' + result.titleLength + '자] primary=' + result.primaryInTitle + '회');
  console.log('H1:       ' + result.h1);
  console.log('          [' + result.h1Length + '자] primary=' + result.primaryInH1 + '회');
  console.log('Meta:     ' + result.metaDescription);
  console.log('          [' + result.metaDescriptionLength + '자] primary=' + result.primaryInMeta + '회');
  console.log('URL:      ' + result.pageUrl);
  console.log('Canon:    ' + result.canonical);
  console.log('JSON-LD:  ' + JSON.stringify(result.jsonLd, null, 2).split('\n').slice(0, 5).join('\n') + '\n          ...');
  console.log('Valid:    ' + (validation.valid ? 'PASS' : 'FAIL'));
  if (!validation.valid) {
    validation.errors.forEach(function (e) {
      console.log('          ERROR: ' + e);
    });
  }
});

// Summary table
console.log('\n' + '='.repeat(80));
console.log('SUMMARY TABLE');
console.log('='.repeat(80));
console.log(
  padR('매장', 28) +
  padR('Title길이', 10) +
  padR('H1길이', 8) +
  padR('Meta길이', 10) +
  padR('P-Title', 8) +
  padR('P-Meta', 8) +
  'Valid'
);
console.log('-'.repeat(80));

allResults.forEach(function (item) {
  var r = item.result;
  var v = item.validation;
  console.log(
    padR(r.primaryKeyword, 28) +
    padR(String(r.titleLength), 10) +
    padR(String(r.h1Length), 8) +
    padR(String(r.metaDescriptionLength), 10) +
    padR(String(r.primaryInTitle), 8) +
    padR(String(r.primaryInMeta), 8) +
    (v.valid ? 'PASS' : 'FAIL: ' + v.errors.join(', '))
  );
});

function padR(str, len) {
  while (str.length < len) str += ' ';
  return str;
}
