#!/usr/bin/env node

/**
 * Script to update imports from local directories to @bermuda/shared
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const srcDir = path.join(__dirname, 'src');

// Patterns to replace
const importPatterns = [
  // Match imports from ../services/
  { pattern: /from ['"]\.\.\/services\/([^'"]+)['"]/g, replacement: "from '@bermuda/shared'" },
  // Match imports from ./services/
  { pattern: /from ['"]\.\/services\/([^'"]+)['"]/g, replacement: "from '@bermuda/shared'" },
  // Match imports from ../utils/
  { pattern: /from ['"]\.\.\/utils\/([^'"]+)['"]/g, replacement: "from '@bermuda/shared'" },
  // Match imports from ./utils/
  { pattern: /from ['"]\.\/utils\/([^'"]+)['"]/g, replacement: "from '@bermuda/shared'" },
  // Match imports from ../types
  { pattern: /from ['"]\.\.\/types['"]/g, replacement: "from '@bermuda/shared'" },
  // Match imports from ./types
  { pattern: /from ['"]\.\/types['"]/g, replacement: "from '@bermuda/shared'" },
];

function updateFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let updated = content;
  let changed = false;

  for (const { pattern, replacement } of importPatterns) {
    const newContent = updated.replace(pattern, replacement);
    if (newContent !== updated) {
      changed = true;
      updated = newContent;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`Updated: ${filePath}`);
    return true;
  }
  return false;
}

function processDirectory(dir) {
  let count = 0;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, dist, build, etc.
      if (!['node_modules', 'dist', 'build', '.git'].includes(file)) {
        count += processDirectory(filePath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      // Skip service/util/type files themselves
      if (!filePath.includes('/services/') &&
          !filePath.includes('/utils/') &&
          !filePath.endsWith('/types.ts')) {
        if (updateFile(filePath)) {
          count++;
        }
      }
    }
  }

  return count;
}

console.log('Updating imports to use @bermuda/shared...');
const updatedCount = processDirectory(srcDir);
console.log(`\nUpdated ${updatedCount} files`);
