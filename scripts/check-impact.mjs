import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

/**
 * اسکریپت MOD-013: تست تأثیر تغییرات (Impact Analysis)
 * هدف: شناسایی پکیج‌های تغییر یافته و پکیج‌های وابسته به آن‌ها و اجرای تست روی آن‌ها.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function getChangedFiles() {
  try {
    // تلاش برای مقایسه با origin/main
    return execSync('git diff --name-only origin/main...HEAD', { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean);
  } catch (e) {
    try {
      // فال‌بک به آخرین کامیت
      return execSync('git diff --name-only HEAD~1', { encoding: 'utf8' })
        .split('\n')
        .filter(Boolean);
    } catch (e2) {
      console.warn('⚠️ Could not determine changed files via git. Checking all.');
      return [];
    }
  }
}

function getAllWorkspaces() {
  const rootPkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const workspaces = [];
  
  // حل کردن الگوهای گلب (بسیار ساده برای این ساختار)
  const patterns = rootPkg.workspaces || [];
  for (const pattern of patterns) {
    if (pattern.endsWith('/*')) {
      const baseDir = pattern.replace('/*', '');
      const fullBaseDir = path.join(ROOT, baseDir);
      if (fs.existsSync(fullBaseDir)) {
        const dirs = fs.readdirSync(fullBaseDir);
        for (const dir of dirs) {
          const pkgPath = path.join(fullBaseDir, dir, 'package.json');
          if (fs.existsSync(pkgPath)) {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            workspaces.push({
              name: pkg.name,
              dir: path.join(baseDir, dir),
              scripts: pkg.scripts || {},
              dependencies: { ...pkg.dependencies, ...pkg.devDependencies }
            });
          }
        }
      }
    }
  }
  return workspaces;
}

function main() {
  const changedFiles = getChangedFiles();
  const workspaces = getAllWorkspaces();
  
  if (changedFiles.length === 0) {
    console.log('✨ No changes detected.');
    return;
  }

  const affectedPackages = new Set();
  const changedPackages = new Set();

  // ۱. شناسایی پکیج‌های مستقیماً تغییر کرده
  for (const file of changedFiles) {
    const ws = workspaces.find(w => file.startsWith(w.dir + path.sep) || file === w.dir);
    if (ws) {
      changedPackages.add(ws.name);
      affectedPackages.add(ws.name);
    } else {
      // اگر فایل ریشه تغییر کرده (مثل package.json اصلی)، همه متاثر می‌شوند
      if (file === 'package.json' || file === 'package-lock.json' || file.endsWith('.json')) {
        workspaces.forEach(w => affectedPackages.add(w.name));
      }
    }
  }

  // ۲. پیدا کردن وابستگان (Transitive Dependents)
  let added;
  do {
    added = false;
    for (const ws of workspaces) {
      if (affectedPackages.has(ws.name)) continue;
      
      const isDependent = Object.keys(ws.dependencies).some(dep => affectedPackages.has(dep));
      if (isDependent) {
        affectedPackages.add(ws.name);
        added = true;
      }
    }
  } while (added);

  console.log(`📦 Changed Packages: ${Array.from(changedPackages).join(', ') || 'None (Global)'}`);
  console.log(`🎯 Affected Packages: ${Array.from(affectedPackages).join(', ')}`);

  let hasError = false;
  for (const pkgName of affectedPackages) {
    const ws = workspaces.find(w => w.name === pkgName);
    console.log(`\n🚀 Testing impact on: ${pkgName}...`);
    
    // اجرای Typecheck
    if (ws.scripts.typecheck) {
      try {
        console.log(`  Running typecheck...`);
        execSync(`npm run typecheck -w ${pkgName}`, { stdio: 'inherit' });
      } catch (e) {
        console.error(`  ❌ Typecheck failed for ${pkgName}`);
        hasError = true;
      }
    }

    // اجرای Tests
    if (ws.scripts.test) {
      try {
        console.log(`  Running tests...`);
        execSync(`npm run test -w ${pkgName}`, { stdio: 'inherit' });
      } catch (e) {
        console.error(`  ❌ Tests failed for ${pkgName}`);
        hasError = true;
      }
    }
  }

  if (hasError) {
    console.error('\n❌ Impact check failed. Please fix the errors above.');
    process.exit(1);
  } else {
    console.log('\n✅ All affected packages passed!');
    process.exit(0);
  }
}

main();
