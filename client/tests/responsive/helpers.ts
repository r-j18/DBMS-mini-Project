import { Page, expect } from '@playwright/test';

export async function loginAs(page: Page, role: 'admin' | 'viewer' = 'admin') {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  await page.locator('input[autocomplete="username"]').fill(role === 'admin' ? 'admin' : 'viewer');
  await page.locator('input[autocomplete="current-password"]').fill(role === 'admin' ? 'admin123' : 'viewer123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/');
  await page.waitForLoadState('networkidle');
}

export async function assertNoHorizontalOverflow(page: Page) {
  const overflowInfo = await page.evaluate(() => {
    const docEl = document.documentElement;
    const body = document.body;
    const scrollWidth = Math.max(
      docEl.scrollWidth,
      body ? body.scrollWidth : 0,
      docEl.clientWidth
    );
    const windowWidth = window.innerWidth;
    return {
      scrollWidth,
      windowWidth,
      hasOverflow: scrollWidth > windowWidth + 1, // allow 1px subpixel rounding tolerance
    };
  });
  expect(
    overflowInfo.hasOverflow,
    `Page body has horizontal overflow! scrollWidth=${overflowInfo.scrollWidth} > windowWidth=${overflowInfo.windowWidth}`
  ).toBe(false);
}
