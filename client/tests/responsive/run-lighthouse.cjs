const { chromium } = require('@playwright/test');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const USER_DATA_DIR = path.join(__dirname, '.chrome-lighthouse-data');

async function run() {
  console.log('--- Setting up logged-in browser session for Lighthouse ---');
  if (fs.existsSync(USER_DATA_DIR)) {
    fs.rmSync(USER_DATA_DIR, { recursive: true, force: true });
  }

  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: true,
    args: ['--remote-debugging-port=9222', '--no-sandbox', '--disable-dev-shm-usage'],
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();
  console.log('Logging in as admin...');
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="text"]', 'admin');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('http://localhost:5173/**');
  console.log('Login successful! Current URL:', page.url());

  const pagesToAudit = [
    { name: 'login', url: 'http://localhost:5173/login' },
    { name: 'dashboard', url: 'http://localhost:5173/' },
    { name: 'criminals', url: 'http://localhost:5173/criminals' },
  ];

  const results = {};

  for (const p of pagesToAudit) {
    console.log(`\nAuditing ${p.name} (${p.url})...`);
    const outputPath = path.join(__dirname, `lighthouse-${p.name}.json`);
    const cmd = `npx lighthouse ${p.url} --port=9222 --output=json --output-path=${outputPath} --only-categories=accessibility,best-practices,performance --no-enable-error-reporting --skip-about-blank`;
    try {
      execSync(cmd, { stdio: 'pipe' });
      const report = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      results[p.name] = {
        accessibility: Math.round((report.categories.accessibility?.score || 0) * 100),
        bestPractices: Math.round((report.categories['best-practices']?.score || 0) * 100),
        performance: Math.round((report.categories.performance?.score || 0) * 100),
      };
      console.log(`Scores for ${p.name}:`, results[p.name]);
    } catch (err) {
      console.error(`Error auditing ${p.name}:`, err.message);
    }
  }

  await context.close();
  console.log('\n=== Final Lighthouse Audit Summary ===');
  console.table(results);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
