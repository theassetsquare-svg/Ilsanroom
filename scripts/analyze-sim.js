#!/usr/bin/env node
/**
 * Temporary analysis script: shows which shared Korean terms
 * drive cosine similarity between the top-5 most similar page pairs.
 *
 * Uses the exact same extractText / getKoreanBigrams / cosineSimilarity
 * logic from qa-similarity.js.
 */
'use strict';

var fs = require('fs');
var path = require('path');

var PUBLIC = path.join(__dirname, '..', 'public');

// ── Copied verbatim from qa-similarity.js ──

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

// ── Analysis ──

var files = findHtmlFiles(PUBLIC);
var pages = files.map(function (f) {
  var html = fs.readFileSync(f, 'utf8');
  var text = extractText(html);
  return {
    file: path.relative(PUBLIC, f),
    bigrams: getKoreanBigrams(text),
  };
});

// Collect all pairs with similarity
var pairs = [];
for (var i = 0; i < pages.length; i++) {
  for (var j = i + 1; j < pages.length; j++) {
    var sim = cosineSimilarity(pages[i].bigrams, pages[j].bigrams);
    pairs.push({ a: pages[i], b: pages[j], similarity: sim });
  }
}

pairs.sort(function (x, y) { return y.similarity - x.similarity; });

var TOP_N = 5;
var TOP_TERMS = 20;

console.log('='.repeat(80));
console.log('SHARED-TERM ANALYSIS: Top ' + TOP_N + ' most similar pairs');
console.log('='.repeat(80));

for (var p = 0; p < Math.min(TOP_N, pairs.length); p++) {
  var pair = pairs[p];
  var a = pair.a;
  var b = pair.b;

  console.log('\n' + '-'.repeat(80));
  console.log('#' + (p + 1) + '  ' + (pair.similarity * 100).toFixed(1) + '%  |  '
    + a.file + '  vs  ' + b.file);
  console.log('-'.repeat(80));

  // Find shared terms and their contribution (product of raw counts)
  var shared = [];
  var allKeys = new Set(Object.keys(a.bigrams).concat(Object.keys(b.bigrams)));

  // We need to compute the contribution each shared term makes to the
  // dot-product portion of cosine similarity.  The cosine formula is
  //   sum(va*vb) / (normA * normB)
  // so the contribution of each term to the final number is
  //   (va * vb) / (normA * normB).
  // We sort by va*vb (the raw dot-product addend) which gives the same
  // ranking since the denominator is constant per pair.

  allKeys.forEach(function (key) {
    var va = a.bigrams[key] || 0;
    var vb = b.bigrams[key] || 0;
    if (va > 0 && vb > 0) {
      shared.push({ term: key, va: va, vb: vb, product: va * vb });
    }
  });

  shared.sort(function (x, y) { return y.product - x.product; });

  // Compute norms for contribution %
  var normA = 0;
  var normB = 0;
  allKeys.forEach(function (key) {
    var va = a.bigrams[key] || 0;
    var vb = b.bigrams[key] || 0;
    normA += va * va;
    normB += vb * vb;
  });
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  var denom = normA * normB;

  var totalShared = shared.length;
  var totalKeysA = Object.keys(a.bigrams).length;
  var totalKeysB = Object.keys(b.bigrams).length;

  console.log('  Terms in A: ' + totalKeysA + '  |  Terms in B: ' + totalKeysB
    + '  |  Shared: ' + totalShared);
  console.log('');
  console.log('  Rank  | Contribution | countA | countB | Term');
  console.log('  ' + '-'.repeat(74));

  for (var t = 0; t < Math.min(TOP_TERMS, shared.length); t++) {
    var s = shared[t];
    var contrib = ((s.product / denom) * 100).toFixed(2);
    var label = s.term.startsWith('_') ? s.term.slice(1) + '  (unigram)' : s.term + '  (bigram)';
    var rank = String(t + 1);
    while (rank.length < 4) rank = ' ' + rank;
    var cA = String(s.va);
    while (cA.length < 5) cA = ' ' + cA;
    var cB = String(s.vb);
    while (cB.length < 5) cB = ' ' + cB;
    var ctr = String(contrib + '%');
    while (ctr.length < 10) ctr = ' ' + ctr;
    console.log('  ' + rank + '  | ' + ctr + '  | ' + cA + '  | ' + cB + '  | ' + label);
  }
}

console.log('\n' + '='.repeat(80));
console.log('Done. Use this to identify boilerplate/shared terms to differentiate.');
console.log('='.repeat(80));
