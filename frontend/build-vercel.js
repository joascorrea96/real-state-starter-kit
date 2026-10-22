const { execSync } = require('child_process');
const fs = require('fs');

// Vercel reserves variables starting with VERCEL_
// We use APP_TARGET: 'real-state' (admin) or 'real-state-public' (public site)
const app = process.env.APP_TARGET || process.env.TARGET_APP || 'real-state-public';

console.log(`[Vercel Build] Building application: ${app}...`);
execSync(`npx ng build ${app} --configuration production`, { stdio: 'inherit' });

const outputDir = `dist/apps/${app}/browser`;
console.log(`[Vercel Build] Copying files from ${outputDir} to dist/current...`);

if (fs.existsSync('dist/current')) {
  fs.rmSync('dist/current', { recursive: true, force: true });
}
fs.mkdirSync('dist/current', { recursive: true });
fs.cpSync(outputDir, 'dist/current', { recursive: true });

console.log(`[Vercel Build] Build completed successfully for ${app}!`);
