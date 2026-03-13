#!/usr/bin/env node
/**
 * QA Gate: Keyword Density Checker
 *
 * Rule H:
 * - Primary keyword density: 1.0% ~ 1.5%
 * - First 100 words must contain primary keyword at least 1 time
 *
 * Scans all HTML files in public/.
 * Exit code 0 = PASS, 1 = FAIL.
 */
'use strict';

var fs = require('fs');
var path = require('path');

var PUBLIC = path.join(__dirname, '..', 'public');

var DENSITY_MIN = 0.010;
var DENSITY_MAX = 0.015;

function extractText(html) {
  var text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&copy;/g, '');
  return text;
}

function getKoreanWords(text) {
  return text.match(/[가-힣]{2,}/g) || [];
}

function countKeyword(text, keyword) {
  if (!keyword) return 0;
  var escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  var regex = new RegExp(escaped, 'g');
  return (text.match(regex) || []).length;
}

function findPrimaryKeyword(html) {
  var titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) {
    var parts = titleMatch[1].split(/\s*[—|·]\s*/);
    if (parts[0]) return parts[0].trim();
  }
  return null;
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

function checkFile(filePath) {
  var html = fs.readFileSync(filePath, 'utf8');
  var text = extractText(html);
  var words = getKoreanWords(text);
  var primary = findPrimaryKeyword(html);
  var errors = [];

  if (!primary) {
    errors.push('Cannot detect primary keyword from title');
    return { file: path.relative(PUBLIC, filePath), errors: errors, stats: null };
  }

  var totalWords = words.length;
  var primaryCount = countKeyword(text, primary);
  var density = totalWords > 0 ? primaryCount / totalWords : 0;

  // First 100 words check
  var first100 = words.slice(0, 100).join(' ');
  var primaryInFirst100 = countKeyword(first100, primary);

  if (density < DENSITY_MIN) {
    errors.push('Density too low: ' + (density * 100).toFixed(2) + '% (min ' + (DENSITY_MIN * 100) + '%)');
  }
  if (density > DENSITY_MAX) {
    errors.push('Density too high: ' + (density * 100).toFixed(2) + '% (max ' + (DENSITY_MAX * 100) + '%)');
  }
  if (primaryInFirst100 < 1) {
    errors.push('Primary keyword missing in first 100 words');
  }

  return {
    file: path.relative(PUBLIC, filePath),
    errors: errors,
    stats: {
      primary: primary,
      totalWords: totalWords,
      primaryCount: primaryCount,
      density: density,
      densityPct: (density * 100).toFixed(2) + '%',
      first100Has: primaryInFirst100,
    },
  };
}

// ── Main ──
var files = findHtmlFiles(PUBLIC);
var allPass = true;
var totalErrors = 0;

console.log('═'.repeat(70));
console.log('QA GATE: KEYWORD DENSITY CHECKER');
console.log('Rule: primary density 1.0%~1.5%, first 100 words ≥ 1');
console.log('═'.repeat(70));

files.forEach(function (f) {
  var result = checkFile(f);
  var status = result.errors.length === 0 ? 'PASS' : 'FAIL';
  if (status === 'FAIL') allPass = false;
  totalErrors += result.errors.length;

  if (result.stats) {
    console.log('\n[' + status + '] ' + result.file);
    console.log('  primary="' + result.stats.primary + '" count=' + result.stats.primaryCount + ' total=' + result.stats.totalWords + ' density=' + result.stats.densityPct + ' first100=' + result.stats.first100Has);
  } else {
    console.log('\n[' + status + '] ' + result.file);
  }
  if (result.errors.length > 0) {
    result.errors.forEach(function (e) {
      console.log('  ✗ ' + e);
    });
  }
});

console.log('\n' + '═'.repeat(70));
if (allPass) {
  console.log('RESULT: PASS — all density checks passed across ' + files.length + ' file(s)');
} else {
  console.log('RESULT: FAIL — ' + totalErrors + ' error(s) across ' + files.length + ' file(s)');
}
console.log('═'.repeat(70));

process.exit(allPass ? 0 : 1);
