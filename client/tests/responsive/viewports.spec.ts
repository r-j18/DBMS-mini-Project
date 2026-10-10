import { test, expect } from '@playwright/test';
import { loginAs, assertNoHorizontalOverflow } from './helpers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VIEWPORTS = [
  { width: 320, height: 640, label: '320x640' },
  { width: 360, height: 740, label: '360x740' },
  { width: 390, height: 844, label: '390x844', takeScreenshot: true },
  { width: 768, height: 1024, label: '768x1024' },
  { width: 820, height: 1180, label: '820x1180', takeScreenshot: true },
  { width: 1024, height: 768, label: '1024x768' },
  { width: 1280, height: 800, label: '1280x800' },
];

const PAGES_ADMIN = [
  { path: '/login', name: 'login' },
  { path: '/', name: 'dashboard' },
  { path: '/criminals', name: 'criminals' },
  { path: '/criminals/201', name: 'criminal-detail' },
  { path: '/police', name: 'police' },
  { path: '/police/101', name: 'police-detail' },
  { path: '/court-records', name: 'court-records' },
  { path: '/jail', name: 'jail' },
  { path: '/queries', name: 'queries' },
  { path: '/schema', name: 'schema' },
  { path: '/users', name: 'users' },
  { path: '/audit-log', name: 'audit-log' },
  { path: '/board', name: 'case-board' },
];

const PAGES_VIEWER = [
  { path: '/', name: 'dashboard' },
  { path: '/criminals', name: 'criminals' },
  { path: '/police', name: 'police' },
  { path: '/court-records', name: 'court-records' },
  { path: '/jail', name: 'jail' },
  { path: '/queries', name: 'queries' },
  { path: '/schema', name: 'schema' },
  { path: '/board', name: 'case-board' },
];

test.describe('Responsive Viewports & Overflow Suite', () => {
  const screenshotsDir = path.resolve(__dirname, 'screenshots');

  test.beforeAll(() => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  for (const vp of VIEWPORTS) {
    test.describe(`Viewport: ${vp.label}`, () => {
      test(`Admin role - No overflow, zero console errors across all pages`, async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on('pageerror', (err) => consoleErrors.push(err.message));
        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            const text = msg.text();
            if (!text.includes('401') && !text.includes('403') && !text.includes('favicon') && !text.includes('Failed to load resource')) {
              consoleErrors.push(text);
            }
          }
        });

        await page.setViewportSize({ width: vp.width, height: vp.height });

        // Test login page first (unauthenticated)
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        await assertNoHorizontalOverflow(page);

        if (vp.takeScreenshot) {
          await page.screenshot({
            path: path.join(screenshotsDir, `admin-login-${vp.label}.png`),
            fullPage: false,
          });
        }

        // Authenticate as Admin
        await loginAs(page, 'admin');

        for (const p of PAGES_ADMIN.filter((x) => x.path !== '/login')) {
          await page.goto(p.path);
          await page.waitForLoadState('networkidle');

          // Verify no horizontal overflow
          await assertNoHorizontalOverflow(page);

          // On mobile viewports, verify inputs and primary submit buttons have >= 40px height
          if (vp.width < 768) {
            const inputs = await page.evaluate(() => {
              const elements = Array.from(document.querySelectorAll('form input:not([type="hidden"]), form select, form textarea, form button[type="submit"]'));
              return elements
                .filter(el => {
                  const rect = el.getBoundingClientRect();
                  return rect.width > 0 && rect.height > 0;
                })
                .map(el => {
                  const rect = el.getBoundingClientRect();
                  return { tag: el.tagName, height: rect.height };
                });
            });

            for (const item of inputs) {
              expect(item.height, `Interactive input should have accessible touch height on mobile`).toBeGreaterThanOrEqual(40);
            }
          }

          // Take screenshot if this is a screenshot viewport
          if (vp.takeScreenshot) {
            await page.screenshot({
              path: path.join(screenshotsDir, `admin-${p.name}-${vp.label}.png`),
              fullPage: false,
            });
          }
        }

        // Assert no JS runtime errors occurred
        expect(consoleErrors, `Console errors logged on ${vp.label}: ${consoleErrors.join(', ')}`).toEqual([]);
      });

      test(`Viewer role - Verification and permissions`, async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on('pageerror', (err) => consoleErrors.push(err.message));
        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            const text = msg.text();
            if (!text.includes('401') && !text.includes('403') && !text.includes('favicon') && !text.includes('Failed to load resource')) {
              consoleErrors.push(text);
            }
          }
        });

        await page.setViewportSize({ width: vp.width, height: vp.height });

        // Authenticate as Viewer
        await loginAs(page, 'viewer');

        for (const p of PAGES_VIEWER) {
          await page.goto(p.path);
          await page.waitForLoadState('networkidle');
          await assertNoHorizontalOverflow(page);

          if (vp.takeScreenshot) {
            await page.screenshot({
              path: path.join(screenshotsDir, `viewer-${p.name}-${vp.label}.png`),
              fullPage: false,
            });
          }
        }

        expect(consoleErrors).toEqual([]);
      });
    });
  }
});
