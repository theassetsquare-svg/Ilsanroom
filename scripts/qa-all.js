#!/usr/bin/env node
/**
 * QA Gate: Run All Checks
 *
 * Runs: similarity → density → repeat → meta
 * All must PASS for deployment to proceed.
 * Exit code 0 = ALL PASS, 1 = ANY FAIL.
 */
'use strict';

var child = require('child_process');
var path = require('path');

var CHECKS = [
  { name: 'qa:similarity', script: 'qa-similarity.js' },
  { name: 'qa:density',    script: 'qa-density.js' },
  { name: 'qa:repeat',     script: 'qa-repeat.js' },
  { name: 'qa:meta',       script: 'qa-meta.js' },
];

var results = [];
var allPass = true;

console.log('╔' + '═'.repeat(68) + '╗');
console.log('║  QA GATE: FULL SUITE                                              ║');
console.log('╚' + '═'.repeat(68) + '╝');

CHECKS.forEach(function (check) {
  var scriptPath = path.join(__dirname, check.script);
  console.log('\n▶ Running ' + check.name + '...');

  try {
    var output = child.execSync('node "' + scriptPath + '"', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 30000,
    });
    console.log(output);
    results.push({ name: check.name, pass: true });
  } catch (err) {
    // Non-zero exit = FAIL
    if (err.stdout) console.log(err.stdout);
    if (err.stderr) console.error(err.stderr);
    results.push({ name: check.name, pass: false });
    allPass = false;
  }
});

// Summary
console.log('\n╔' + '═'.repeat(68) + '╗');
console.log('║  QA SUMMARY                                                       ║');
console.log('╠' + '═'.repeat(68) + '╣');

results.forEach(function (r) {
  var icon = r.pass ? '✓' : '✗';
  var status = r.pass ? 'PASS' : 'FAIL';
  var line = '║  ' + icon + ' ' + r.name + ': ' + status;
  while (line.length < 69) line += ' ';
  line += '║';
  console.log(line);
});

console.log('╠' + '═'.repeat(68) + '╣');
var finalLine = allPass
  ? '║  DEPLOY: READY                                                     ║'
  : '║  DEPLOY: BLOCKED — fix failing checks before deployment            ║';
console.log(finalLine);
console.log('╚' + '═'.repeat(68) + '╝');

process.exit(allPass ? 0 : 1);
