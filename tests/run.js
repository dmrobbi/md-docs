#!/usr/bin/env node
// zero-dependency test runner for md-docs (Phase 0 / T0.1)
// discovers tests/test-*.js, runs each in an isolated child process.
// all green: exit 0 + "TESTS-OK n/n". --selftest exercises the red path.
'use strict';
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const STUB = 'test-selftest-stub.js';

function discover(dir) {
  return fs.readdirSync(dir)
    .filter((f) => /^test-.*\.js$/.test(f))
    .sort();
}

function runOne(file) {
  const r = spawnSync(process.execPath, [file], {
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 30000,
  });
  return r.status === 0;
}

function runSuite(files, dir, label) {
  let pass = 0;
  const red = [];
  for (const f of files) {
    if (runOne(path.join(dir, f))) pass++;
    else red.push(f);
  }
  return { pass, total: files.length, red };
}

function main() {
  const dir = __dirname;

  if (process.argv.includes('--selftest')) {
    // prove: (a) an intentional red stub fails as a child, (b) the
    // aggregator reports red (and would exit non-zero) while it exists.
    const stubPath = path.join(dir, STUB);
    fs.writeFileSync(stubPath, "require('assert').ok(false, 'selftest-intentional-red');\n");
    const files = discover(dir);
    const { pass, total, red } = runSuite(files, dir);
    fs.rmSync(stubPath, { force: true });
    const stubFails = red.includes(STUB);
    if (!stubFails) { console.error('SELFTEST-FAIL: red stub did not fail'); process.exit(1); }
    if (pass === total) { console.error('SELFTEST-FAIL: aggregator did not see red'); process.exit(1); }
    console.log('SELFTEST-OK red path + red aggregation verified');
  }

  const files = discover(dir).filter((f) => f !== STUB);
  const { pass, total, red } = runSuite(files, dir);
  if (pass === total) {
    console.log(`TESTS-OK ${pass}/${total}`);
    process.exit(0);
  }
  console.error(`TESTS-RED ${pass}/${total} — failing: ${red.join(', ')}`);
  process.exit(1);
}

main();