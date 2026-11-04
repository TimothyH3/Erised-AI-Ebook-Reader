/**
 * Erised AI - Test Suite Runner
 *
 * Discovers and executes all unit test suites in tests/unit/
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const testsDir = path.join(rootDir, 'tests', 'unit');

console.log('====================================================');
console.log('         ERISED AI • UNIT TEST SUITE RUNNER         ');
console.log('====================================================\n');

if (!fs.existsSync(testsDir)) {
  console.error(`Tests directory not found: ${testsDir}`);
  process.exit(1);
}

const testFiles = fs.readdirSync(testsDir).filter(f => f.startsWith('test_') && f.endsWith('.js'));
console.log(`Discovered ${testFiles.length} test suites in tests/unit/:\n`);

let passedCount = 0;
let failedCount = 0;
const failedSuites = [];

for (const testFile of testFiles) {
  const fullPath = path.join(testsDir, testFile);
  process.stdout.write(`• Running ${testFile.padEnd(46)} `);
  try {
    execSync(`node "${fullPath}"`, {
      cwd: rootDir,
      stdio: 'pipe',
      encoding: 'utf-8'
    });
    console.log('✓ PASS');
    passedCount++;
  } catch (err) {
    console.log('✗ FAIL');
    failedCount++;
    failedSuites.push({
      file: testFile,
      output: err.stdout || err.stderr || err.message
    });
  }
}

console.log('\n====================================================');
console.log(`SUMMARY: ${passedCount} Passed, ${failedCount} Failed out of ${testFiles.length} suites`);
console.log('====================================================\n');

if (failedCount > 0) {
  console.error('FAILURE DETAILS:');
  for (const failure of failedSuites) {
    console.error(`\n--- [${failure.file}] ---`);
    console.error(failure.output);
  }
  process.exit(1);
} else {
  console.log('ALL SUITES PASSED! ✓');
  process.exit(0);
}

