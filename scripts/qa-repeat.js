#!/usr/bin/env node
/**
 * QA Gate: Repeat-Word Checker
 *
 * Rule J: No meaningful word ≥ 5 occurrences (primary keyword exempt within density range).
 * Scans all HTML files in public/.
 * Exit code 0 = PASS, 1 = FAIL.
 */
'use strict';

var fs = require('fs');
var path = require('path');

var PUBLIC = path.join(__dirname, '..', 'public');

// Words to ignore (particles, common HTML/structural words)
var STOP_WORDS = new Set([
  '있는', '하는', '되는', '있다', '한다', '된다', '이다', '그리고', '또는', '하지',
  '없는', '없다', '대한', '통해', '위해', '때문', '경우', '이상', '이하', '다음',
  '해당', '관련', '현재', '기준', '기반', '목적', '이용', '제공', '사항', '내용',
]);

// Min length for meaningful word
var MIN_LEN = 2;
var MAX_COUNT = 4;

function extractText(html) {
  // Remove scripts and styles
  var text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  // Remove tags
  text = text.replace(/<[^>]+>/g, ' ');
  // Decode common entities
  text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&copy;/g, '');
  return text;
}

function getKoreanWords(text) {
  var matches = text.match(/[가-힣]{2,}/g) || [];
  return matches.filter(function (w) {
    return w.length >= MIN_LEN && !STOP_WORDS.has(w);
  });
}

function findPrimaryKeyword(html) {
  // Try to extract from <title> tag — primary keyword is at the start
  var titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) {
    var title = titleMatch[1];
    // Primary keyword is before the first separator (—, |, ·)
    var parts = title.split(/\s*[—|·]\s*/);
    if (parts[0]) return parts[0].trim();
  }
  return null;
}

function checkFile(filePath) {
  var html = fs.readFileSync(filePath, 'utf8');
  var text = extractText(html);
  var words = getKoreanWords(text);
  var primary = findPrimaryKeyword(html);

  // Count frequencies
  var freq = {};
  words.forEach(function (w) {
    freq[w] = (freq[w] || 0) + 1;
  });

  var violations = [];
  Object.keys(freq).forEach(function (word) {
    if (freq[word] > MAX_COUNT) {
      // Primary keyword exempt
      if (primary && word === primary) return;
      // Also exempt if word is a substring of primary
      if (primary && primary.indexOf(word) !== -1) return;
      violations.push({ word: word, count: freq[word] });
    }
  });

  violations.sort(function (a, b) { return b.count - a.count; });

  return {
    file: path.relative(PUBLIC, filePath),
    totalWords: words.length,
    primary: primary,
    violations: violations,
  };
}

// Find all HTML files
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
var allPass = true;
var totalViolations = 0;

console.log('═'.repeat(70));
console.log('QA GATE: REPEAT-WORD CHECKER');
console.log('Rule: meaningful word ≤ ' + MAX_COUNT + ' occurrences (primary exempt)');
console.log('═'.repeat(70));

files.forEach(function (f) {
  var result = checkFile(f);
  var status = result.violations.length === 0 ? 'PASS' : 'FAIL';
  if (status === 'FAIL') allPass = false;
  totalViolations += result.violations.length;

  console.log('\n[' + status + '] ' + result.file + ' (' + result.totalWords + ' words, primary="' + (result.primary || 'N/A') + '")');
  if (result.violations.length > 0) {
    result.violations.forEach(function (v) {
      console.log('  ✗ "' + v.word + '" = ' + v.count + '회 (max ' + MAX_COUNT + ')');
    });
  }
});

console.log('\n' + '═'.repeat(70));
if (allPass) {
  console.log('RESULT: PASS — 0 repeat-word violations across ' + files.length + ' file(s)');
} else {
  console.log('RESULT: FAIL — ' + totalViolations + ' violation(s) across ' + files.length + ' file(s)');
}
console.log('═'.repeat(70));

process.exit(allPass ? 0 : 1);
