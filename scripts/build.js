#!/usr/bin/env node
/**
 * Build Script (placeholder)
 *
 * Currently the site is single-page static HTML.
 * This will be replaced with the multi-page build in a later step.
 * For now it just validates that public/index.html exists.
 */
'use strict';

var fs = require('fs');
var path = require('path');

var indexPath = path.join(__dirname, '..', 'public', 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('BUILD FAIL: public/index.html not found');
  process.exit(1);
}

console.log('BUILD: public/index.html exists (' + fs.statSync(indexPath).size + ' bytes)');
console.log('BUILD: PASS (placeholder — multi-page build pending)');
