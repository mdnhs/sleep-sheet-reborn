const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, searchRegex, replacement, importStatement) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.match(searchRegex)) {
    content = content.replace(searchRegex, replacement);
    if (importStatement && !content.includes('hasPermission')) {
      content = importStatement + '\n' + content;
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

const analyticsPath = path.join(__dirname, 'features/analytics/server/route.ts');
replaceInFile(
  analyticsPath,
  /if\s*\(!user\s*\|\|\s*user\.role\s*!==\s*"ADMIN"\)\s*\{/g,
  'if (!hasPermission(user, PERMISSIONS.VIEW_ANALYTICS)) {',
  'import { hasPermission, PERMISSIONS } from "@/lib/permissions";'
);

const settingsPath = path.join(__dirname, 'features/settings/server/route.ts');
replaceInFile(
  settingsPath,
  /if\s*\(!user\s*\|\|\s*\(user\.role\s*!==\s*"ADMIN"\s*&&\s*user\.role\s*!==\s*"MODERATOR"\)\)\s*\{/g,
  'if (!hasPermission(user, PERMISSIONS.MANAGE_SETTINGS)) {',
  'import { hasPermission, PERMISSIONS } from "@/lib/permissions";'
);
