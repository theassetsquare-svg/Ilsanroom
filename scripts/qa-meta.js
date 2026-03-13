#!/usr/bin/env node
/**
 * QA Gate: Meta / SEO Tag Checker
 *
 * Validates per HTML file:
 * - title starts with primary keyword
 * - H1 starts with primary keyword
 * - H1 ≠ title
 * - meta description 80~120 chars
 * - meta description contains primary exactly 1 time
 * - canonical exists
 * - og:title exists
 * - og:description exists
 * - JSON-LD exists
 *
 * Exit code 0 = PASS, 1 = FAIL.
 */
'use strict';

var fs = require('fs');
var path = require('path');

var PUBLIC = path.join(__dirname, '..', 'public');

function findPrimaryKeyword(html) {
  var titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) {
    var parts = titleMatch[1].split(/\s*[—|·]\s*/);
    if (parts[0]) return parts[0].trim();
  }
  return null;
}

function getTitle(html) {
  var m = html.match(/<title>([^<]+)<\/title>/i);
  return m ? m[1].trim() : null;
}

function getH1(html) {
  var m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!m) return null;
  // Strip inner tags
  return m[1].replace(/<[^>]+>/g, '').trim();
}

function getMetaDesc(html) {
  var m = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  if (!m) {
    m = html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i);
  }
  return m ? m[1].trim() : null;
}

function getCanonical(html) {
  var m = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

function hasOgTag(html, property) {
  var regex = new RegExp('<meta\\s+property=["\']og:' + property + '["\']', 'i');
  return regex.test(html);
}

function hasJsonLd(html) {
  return /<script\s+type=["']application\/ld\+json["']/.test(html);
}

function countKeyword(text, keyword) {
  if (!keyword || !text) return 0;
  var escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return (text.match(new RegExp(escaped, 'g')) || []).length;
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
  var errors = [];
  var primary = findPrimaryKeyword(html);
  var title = getTitle(html);
  var h1 = getH1(html);
  var metaDesc = getMetaDesc(html);
  var canonical = getCanonical(html);

  // Title checks
  if (!title) {
    errors.push('Missing <title>');
  } else if (primary && !title.startsWith(primary)) {
    errors.push('Title does not start with primary "' + primary + '"');
  }

  // H1 checks
  if (!h1) {
    errors.push('Missing <h1>');
  } else if (primary && !h1.startsWith(primary)) {
    errors.push('H1 does not start with primary "' + primary + '"');
  }

  // H1 ≠ Title
  if (title && h1 && title === h1) {
    errors.push('H1 is identical to title');
  }

  // Meta description
  if (!metaDesc) {
    errors.push('Missing meta description');
  } else {
    if (metaDesc.length < 80) {
      errors.push('Meta description too short: ' + metaDesc.length + ' chars (min 80)');
    }
    if (metaDesc.length > 120) {
      errors.push('Meta description too long: ' + metaDesc.length + ' chars (max 120)');
    }
    if (primary) {
      var pkInMeta = countKeyword(metaDesc, primary);
      if (pkInMeta !== 1) {
        errors.push('Meta description: primary keyword count = ' + pkInMeta + ' (must be exactly 1)');
      }
    }
  }

  // Canonical
  if (!canonical) {
    errors.push('Missing canonical link');
  }

  // OG tags
  if (!hasOgTag(html, 'title')) errors.push('Missing og:title');
  if (!hasOgTag(html, 'description')) errors.push('Missing og:description');

  // JSON-LD
  if (!hasJsonLd(html)) errors.push('Missing JSON-LD');

  return {
    file: path.relative(PUBLIC, filePath),
    primary: primary,
    title: title ? title.substring(0, 50) + (title.length > 50 ? '...' : '') : null,
    h1: h1 ? h1.substring(0, 50) : null,
    metaLen: metaDesc ? metaDesc.length : 0,
    errors: errors,
  };
}

// ── Main ──
var files = findHtmlFiles(PUBLIC);
var allPass = true;
var totalErrors = 0;

console.log('═'.repeat(70));
console.log('QA GATE: META / SEO TAG CHECKER');
console.log('═'.repeat(70));

files.forEach(function (f) {
  var result = checkFile(f);
  var status = result.errors.length === 0 ? 'PASS' : 'FAIL';
  if (status === 'FAIL') allPass = false;
  totalErrors += result.errors.length;

  console.log('\n[' + status + '] ' + result.file);
  console.log('  title="' + (result.title || 'N/A') + '" h1="' + (result.h1 || 'N/A') + '" meta=' + result.metaLen + 'chars');
  if (result.errors.length > 0) {
    result.errors.forEach(function (e) {
      console.log('  ✗ ' + e);
    });
  }
});

console.log('\n' + '═'.repeat(70));
if (allPass) {
  console.log('RESULT: PASS — all meta checks passed across ' + files.length + ' file(s)');
} else {
  console.log('RESULT: FAIL — ' + totalErrors + ' error(s) across ' + files.length + ' file(s)');
}
console.log('═'.repeat(70));

process.exit(allPass ? 0 : 1);
