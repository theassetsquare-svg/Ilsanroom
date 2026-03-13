#!/usr/bin/env node
'use strict';

var tmpl = require('./template-engine');
var fs = require('fs');
var path = require('path');

var seedPath = path.join(__dirname, '..', 'data', 'venues.seed.json');
var venuesDir = path.join(__dirname, '..', 'data', 'venues');
var seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

// Load all venues (full JSON if available, else minimal from seed)
var allVenues = seed.venues.map(function (sv) {
  var fp = path.join(venuesDir, sv.slug + '.json');
  if (fs.existsSync(fp)) {
    return JSON.parse(fs.readFileSync(fp, 'utf8'));
  }
  return {
    id: sv.id,
    slug: sv.slug,
    storeName: sv.storeName,
    regionCity: '',
    regionArea: '',
    category: sv.category,
    primaryKeyword: sv.storeName,
    secondaryKeywords: [],
    status: sv.status,
  };
});

// Generate blueprints for all
var blueprints = allVenues.map(function (v) {
  return tmpl.generateBlueprint(v, allVenues);
});

// ── Matrix ──
console.log('='.repeat(100));
console.log('TEMPLATE ROTATION MATRIX — ' + blueprints.length + ' venues');
console.log('='.repeat(100));
console.log(
  pad('매장', 26) +
  pad('Template', 6) +
  pad('이름', 22) +
  pad('Sections', 8) +
  pad('FAQ#', 5) +
  pad('Table', 6) +
  pad('Cards', 6) +
  'List'
);
console.log('-'.repeat(100));

blueprints.forEach(function (bp) {
  console.log(
    pad(bp.storeName, 26) +
    pad(bp.templateKey, 6) +
    pad(bp.templateName, 22) +
    pad(String(bp.sectionOrder.length), 8) +
    pad(String(bp.faqCount), 5) +
    pad(bp.usesTable ? 'Y' : 'N', 6) +
    pad(bp.usesCards ? 'Y' : 'N', 6) +
    (bp.usesList ? 'Y' : 'N')
  );
});

// ── Collision check ──
console.log('\n' + '='.repeat(100));
console.log('CLUSTER COLLISION CHECK');
console.log('='.repeat(100));

var clusters = {};
blueprints.forEach(function (bp) {
  var venue = allVenues.find(function (v) { return v.slug === bp.venue; });
  var key = (venue.category || '') + '|' + (venue.regionCity || '');
  if (!clusters[key]) clusters[key] = [];
  clusters[key].push(bp);
});

var collisionCount = 0;
Object.keys(clusters).forEach(function (key) {
  var group = clusters[key];
  if (group.length < 2) return;
  // Skip clusters where regionCity is empty (incomplete data)
  if (key.indexOf('|') === key.length - 1 && key.split('|')[1] === '') {
    console.log(pad(key || '(no region)', 30) + pad(group.length + ' venues', 30) + 'SKIP (data incomplete)');
    return;
  }
  var templates = group.map(function (bp) { return bp.templateKey; });
  var unique = templates.filter(function (t, i) { return templates.indexOf(t) === i; });
  var status = unique.length === templates.length ? 'OK' : 'COLLISION';
  if (status === 'COLLISION') collisionCount++;
  console.log(
    pad(key, 30) +
    pad(templates.join(', '), 30) +
    status
  );
});

if (collisionCount === 0) {
  console.log('\nAll clusters PASS — no template collisions.');
} else {
  console.log('\nWARNING: ' + collisionCount + ' cluster(s) have template collisions.');
}

// ── Phrase diversity sample ──
console.log('\n' + '='.repeat(100));
console.log('PHRASE DIVERSITY SAMPLE (first 5 venues)');
console.log('='.repeat(100));

blueprints.slice(0, 5).forEach(function (bp) {
  console.log('\n--- ' + bp.storeName + ' [' + bp.templateKey + '] ---');
  console.log('Intro:      ' + bp.phrases.intro.substring(0, 60) + '...');
  console.log('Transition: ' + bp.phrases.transition);
  console.log('CL Head:    ' + bp.phrases.checklistHeading);
  console.log('FAQ Opener:  ' + bp.phrases.faqOpener);
  console.log('Conclusion: ' + bp.phrases.conclusion.substring(0, 60) + '...');
  console.log('Sections:   ' + bp.sectionOrder.join(' → '));
  console.log('FAQ Qs:     ' + bp.faqSet.map(function (f) { return f.q.substring(0, 25) + '...'; }).join(' | '));
});

// ── Section order uniqueness ──
console.log('\n' + '='.repeat(100));
console.log('SECTION ORDER UNIQUENESS');
console.log('='.repeat(100));

var orderMap = {};
blueprints.forEach(function (bp) {
  var key = bp.sectionOrder.join(',');
  if (!orderMap[key]) orderMap[key] = [];
  orderMap[key].push(bp.storeName);
});

var uniqueOrders = Object.keys(orderMap).length;
console.log('Unique section orders: ' + uniqueOrders + ' / ' + tmpl.TEMPLATE_KEYS.length + ' templates');
Object.keys(orderMap).forEach(function (key) {
  console.log('  [' + orderMap[key].length + ' venues] ' + key);
});

function pad(str, len) {
  while (str.length < len) str += ' ';
  return str.substring(0, len);
}
