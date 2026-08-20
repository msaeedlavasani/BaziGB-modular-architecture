import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * اسکریپت MOD-011: بررسی مرزهای پکیج‌ها (Boundary Enforcement)
 * هدف: اطمینان از اینکه پکیج‌های منطق بازی و موتور اصلی به فریم‌ورک‌ها یا API مرورگر وابسته نیستند.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PACKAGES_DIR = path.join(ROOT, 'packages');

const RESTRICTED_IMPORTS = [
  'react',
  'react-dom',
  'next',
  '@nestjs/',
  '@prisma/client',
  '@mui/',
  'socket.io'
];

const RESTRICTED_APIS = [
  'window',
  'document',
  'localStorage'
];

let hasError = false;
const violations = [];

/**
 * بازگشتی تمام فایل‌های TS/TSX را اسکن می‌کند
 */
function scanDir(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (file === 'node_modules' || file === 'dist' || file === '.turbo') continue;
      scanDir(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      checkFile(fullPath);
    }
  }
}

/**
 * محتوای فایل را برای موارد غیرمجاز چک می‌کند
 */
function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(ROOT, filePath);
  const isGame = filePath.includes(path.join('packages', 'games'));

  // ۱. چک کردن Importهای ممنوعه
  for (const restricted of RESTRICTED_IMPORTS) {
    // جستجو برای import ... from 'pkg' یا import 'pkg'
    const importRegex = new RegExp(`from\\s+['"]${restricted}['"]|import\\s+['"]${restricted}['"]`, 'g');
    if (importRegex.test(content)) {
      violations.push(`[Import Restricted] ${relativePath}: Dependency on '${restricted}' is not allowed in packages.`);
      hasError = true;
    }
  }

  // ۲. چک کردن APIهای مرورگر (فقط در src)
  if (filePath.includes(path.sep + 'src' + path.sep)) {
    for (const api of RESTRICTED_APIS) {
      // جستجوی کلمه کلیدی به صورت جداگانه (نه بخشی از کلمه دیگر)
      const apiRegex = new RegExp(`\\b${api}\\b`, 'g');
      if (apiRegex.test(content)) {
        violations.push(`[Browser API] ${relativePath}: Use of '${api}' is not allowed in logic packages.`);
        hasError = true;
      }
    }
  }

  // ۳. قانون اختصاصی بازی‌ها: فقط مجاز به استفاده از engine و داخلی خودشان هستند
  if (isGame) {
    // استخراج تمام importها
    const allImports = content.match(/from\s+['"]([^'"]+)['"]/g) || [];
    for (const imp of allImports) {
      const moduleName = imp.match(/['"]([^'"]+)['"]/)[1];
      
      // اگر ماژول خارجی است (شروع با @bazigb یا یک نام پکیج)
      if (!moduleName.startsWith('.')) {
        if (moduleName.startsWith('@bazigb/') && moduleName !== '@bazigb/engine') {
          // بازی نباید از بازی دیگر یا سرور/وب استفاده کند
          violations.push(`[Cross-Package] ${relativePath}: Game packages can only import from '@bazigb/engine'. Found '${moduleName}'.`);
          hasError = true;
        }
      }
    }
  }
}

console.log('🔍 Checking package boundaries...');
scanDir(PACKAGES_DIR);

if (hasError) {
  console.error('\n❌ Boundary Violations Found:');
  violations.forEach(v => console.error(`  - ${v}`));
  process.exit(1);
} else {
  console.log('\n✅ No boundary violations found. All packages are clean.');
  process.exit(0);
}
