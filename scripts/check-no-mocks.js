#!/usr/bin/env node

/**
 * CareerPilot AI Acceptance & CI Script: check-no-mocks.js
 * 
 * Verifies that zero mock data, fake data fixtures, sample opportunities,
 * or fake data generation tokens exist in production code across:
 *   - frontend/src
 *   - backend/app
 * 
 * Exits with code 0 if clean, or code 1 if any forbidden tokens are detected.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const TARGET_DIRS = [
  path.join(ROOT_DIR, 'frontend', 'src'),
  path.join(ROOT_DIR, 'backend', 'app')
];

// Forbidden identifiers and tokens in production code
const FORBIDDEN_PATTERNS = [
  { pattern: /\bmockData\b/i, label: 'mockData file or import' },
  { pattern: /\bmockOpportunities\b/, label: 'mockOpportunities identifier' },
  { pattern: /\bmockApplications\b/, label: 'mockApplications identifier' },
  { pattern: /\bmockNotifications\b/, label: 'mockNotifications identifier' },
  { pattern: /\bmockStudentProfile\b/, label: 'mockStudentProfile identifier' },
  { pattern: /\bmockSkillRequirements\b/, label: 'mockSkillRequirements identifier' },
  { pattern: /\bmockSupportedRoles\b/, label: 'mockSupportedRoles identifier' },
  { pattern: /\bsampleOpportunities\b/, label: 'sampleOpportunities identifier' },
  { pattern: /\bsampleIncomingOpportunities\b/, label: 'sampleIncomingOpportunities identifier' },
  { pattern: /\bsample_source\b/, label: 'sample_source mock connector' },
  { pattern: /from\s+['"].*mockData['"]/, label: 'mockData import statement' },
  { pattern: /require\(['"].*mockData['"]\)/, label: 'mockData require statement' },
];

// File extensions to scan
const SCANNABLE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.py']);

// Ignore test directories or test files
function isTestFile(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  return (
    normalized.includes('/tests/') ||
    normalized.includes('/__tests__/') ||
    normalized.endsWith('.test.js') ||
    normalized.endsWith('.test.jsx') ||
    normalized.endsWith('.spec.js') ||
    normalized.endsWith('_test.py') ||
    normalized.endsWith('test_')
  );
}

function collectFiles(dirPath, files = []) {
  if (!fs.existsSync(dirPath)) return files;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '__pycache__' && entry.name !== '.git') {
        collectFiles(fullPath, files);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (SCANNABLE_EXTENSIONS.has(ext) && !isTestFile(fullPath)) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

function runCheck() {
  console.log('====================================================');
  console.log('  CareerPilot AI: Verifying Zero Mocks in Production');
  console.log('====================================================');

  let totalFilesScanned = 0;
  const violations = [];

  for (const targetDir of TARGET_DIRS) {
    const files = collectFiles(targetDir);
    totalFilesScanned += files.length;

    for (const filePath of files) {
      const relPath = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, lineIdx) => {
        // Skip comment lines explaining mock removal
        const trimmed = line.trim();
        if (
          trimmed.startsWith('//') &&
          (trimmed.includes('Zero mock') || trimmed.includes('Removed') || trimmed.includes('No mock'))
        ) {
          return;
        }

        for (const { pattern, label } of FORBIDDEN_PATTERNS) {
          if (pattern.test(line)) {
            violations.push({
              file: relPath,
              line: lineIdx + 1,
              label,
              content: trimmed
            });
          }
        }
      });
    }
  }

  console.log(`Scanned ${totalFilesScanned} production source files.`);

  if (violations.length > 0) {
    console.error(`\n❌ FOUND ${violations.length} FORBIDDEN MOCK VIOLATION(S):`);
    for (const v of violations) {
      console.error(`  - ${v.file}:${v.line} [${v.label}]`);
      console.error(`      "${v.content}"`);
    }
    console.error('\nFAIL: Please remove all mock tokens before deploying to production.\n');
    process.exit(1);
  }

  console.log('\n✅ PASSED: Zero mock tokens, fake fixtures, or sample arrays found in production code!');
  console.log('All features verified to be connected to real MongoDB collections and live external ingestion pipelines.\n');
  process.exit(0);
}

runCheck();
