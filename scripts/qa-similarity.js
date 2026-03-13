#!/usr/bin/env node
/**
 * QA Gate: Similarity Checker (Raw Cosine)
 *
 * Rule I: MAX cosine similarity ≤ 10% between any two pages.
 * Uses TF-IDF weighted cosine similarity on Korean bigrams.
 *
 * Exit code 0 = PASS, 1 = FAIL.
 */
'use strict';

var fs = require('fs');
var path = require('path');

var PUBLIC = path.join(__dirname, '..', 'public');
var MAX_SIMILARITY = 0.10;

function extractText(html) {
  var text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/&[a-z]+;/g, ' ');
  return text;
}

function getKoreanBigrams(text) {
  var words = text.match(/[가-힣]{2,}/g) || [];
  var bigrams = {};
  for (var i = 0; i < words.length - 1; i++) {
    var bg = words[i] + ' ' + words[i + 1];
    bigrams[bg] = (bigrams[bg] || 0) + 1;
  }
  // Also include single words for short pages
  words.forEach(function (w) {
    bigrams['_' + w] = (bigrams['_' + w] || 0) + 1;
  });
  return bigrams;
}

function cosineSimilarity(a, b) {
  var keys = new Set(Object.keys(a).concat(Object.keys(b)));
  var dotProduct = 0;
  var normA = 0;
  var normB = 0;

  keys.forEach(function (key) {
    var va = a[key] || 0;
    var vb = b[key] || 0;
    dotProduct += va * vb;
    normA += va * va;
    normB += vb * vb;
  });

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (normA * normB);
}

function findHtmlFiles(dir) {
  var results = [];
  var entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach(function (e) {
    var full = path.join(dir, e.name);
    if (e.isDirectory()) {
      results = results.concat(findHtmlFiles(full));
    } else if (e.name.endsWith('.html')) {
      results.push(full);
    }
  });
  return results;
}

// ── Main ──
var files = findHtmlFiles(PUBLIC);

console.log('═'.repeat(70));
console.log('QA GATE: SIMILARITY CHECKER (Cosine)');
console.log('Rule: MAX cosine similarity ≤ ' + (MAX_SIMILARITY * 100) + '%');
console.log('Files found: ' + files.length);
console.log('═'.repeat(70));

if (files.length < 2) {
  console.log('\nOnly ' + files.length + ' HTML file(s) — similarity check requires ≥ 2 pages.');
  console.log('RESULT: SKIP (single page site, will validate after multi-page build)');
  process.exit(0);
}

// Build bigram vectors
var pages = files.map(function (f) {
  var html = fs.readFileSync(f, 'utf8');
  var text = extractText(html);
  return {
    file: path.relative(PUBLIC, f),
    bigrams: getKoreanBigrams(text),
  };
});

// Pairwise comparison
var maxSim = 0;
var maxPair = null;
var violations = [];

for (var i = 0; i < pages.length; i++) {
  for (var j = i + 1; j < pages.length; j++) {
    var sim = cosineSimilarity(pages[i].bigrams, pages[j].bigrams);
    if (sim > maxSim) {
      maxSim = sim;
      maxPair = [pages[i].file, pages[j].file];
    }
    if (sim > MAX_SIMILARITY) {
      violations.push({
        a: pages[i].file,
        b: pages[j].file,
        similarity: sim,
      });
    }
  }
}

if (violations.length > 0) {
  console.log('\nVIOLATIONS (similarity > ' + (MAX_SIMILARITY * 100) + '%):');
  violations.sort(function (a, b) { return b.similarity - a.similarity; });
  violations.forEach(function (v) {
    console.log('  ✗ ' + (v.similarity * 100).toFixed(1) + '% — ' + v.a + ' vs ' + v.b);
  });
}

console.log('\nMAX similarity: ' + (maxSim * 100).toFixed(1) + '%');
if (maxPair) {
  console.log('  between: ' + maxPair[0] + ' vs ' + maxPair[1]);
}

var pass = violations.length === 0;
console.log('\n' + '═'.repeat(70));
if (pass) {
  console.log('RESULT: PASS — max similarity ' + (maxSim * 100).toFixed(1) + '% ≤ ' + (MAX_SIMILARITY * 100) + '%');
} else {
  console.log('RESULT: FAIL — ' + violations.length + ' pair(s) exceed ' + (MAX_SIMILARITY * 100) + '% threshold');
}
console.log('═'.repeat(70));

process.exit(pass ? 0 : 1);
