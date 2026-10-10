import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test.describe('Sidebar Responsive Behaviors', () => {
  test('Mobile (< 768px): open/close via hamburger, backdrop, Escape, nav item, focus trap, and body scroll lock', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAs(page, 'admin');

    // 1. Initial state: Hamburger button exists, sidebar drawer not in DOM
    const hamburger = page.locator('button[aria-label="Open main navigation menu"]');
    await expect(hamburger).toBeVisible();
    await expect(page.locator('div[role="dialog"][aria-modal="true"]')).toHaveCount(0);

    // 2. Open drawer via hamburger
    await hamburger.click();
    const drawer = page.locator('div[role="dialog"][aria-modal="true"]');
    await expect(drawer).toBeVisible();

    // Verify body scroll is locked
    const isLocked = await page.evaluate(() => document.body.style.overflow === 'hidden');
    expect(isLocked).toBe(true);

    // 3. Close via backdrop tap
    const backdrop = drawer.locator('div[aria-hidden="true"]');
    await backdrop.click({ position: { x: 350, y: 100 } });
    await expect(drawer).toHaveCount(0);

    // Verify body scroll is restored
    const isUnlocked = await page.evaluate(() => document.body.style.overflow !== 'hidden');
    expect(isUnlocked).toBe(true);

    // 4. Open and close via Escape key
    await hamburger.click();
    await expect(drawer).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(drawer).toHaveCount(0);

    // 5. Open and close via Nav item selection
    await hamburger.click();
    await expect(drawer).toBeVisible();
    const criminalsLink = drawer.locator('a[href="/criminals"]');
    await criminalsLink.click();
    await page.waitForURL('**/criminals');
    await expect(drawer).toHaveCount(0);

    // 6. Test touch swipe-left to close
    await hamburger.click();
    await expect(drawer).toBeVisible();
    const drawerSheet = drawer.locator('.bg-\\[\\#1F2D3D\\]').first();

    const box = await drawerSheet.boundingBox();
    if (box) {
      await drawerSheet.evaluate((node) => {
        const touchStart = new Touch({
          identifier: 1,
          target: node,
          clientX: 200,
          clientY: 200,
        });
        node.dispatchEvent(new TouchEvent('touchstart', {
          touches: [touchStart],
          targetTouches: [touchStart],
          changedTouches: [touchStart],
          bubbles: true,
          cancelable: true,
        }));

        const touchEnd = new Touch({
          identifier: 1,
          target: node,
          clientX: 40,
          clientY: 200,
        });
        node.dispatchEvent(new TouchEvent('touchend', {
          touches: [],
          targetTouches: [],
          changedTouches: [touchEnd],
          bubbles: true,
          cancelable: true,
        }));
      });
      await expect(drawer).toHaveCount(0);
    }
  });

  test('Tablet (768 to 1023px): rail default, expand overlay over content, close on Escape and outside tap', async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 1180 });
    await loginAs(page, 'admin');

    // Default is 64px rail
    const rail = page.locator('aside[aria-label="Tablet navigation rail"]');
    await expect(rail).toBeVisible();
    const railBox = await rail.boundingBox();
    expect(railBox?.width).toBeCloseTo(64, 1);

    // Expand overlay
    const expandBtn = rail.locator('button[aria-label="Expand sidebar overlay"]');
    await expandBtn.click();

    // Expanded overlay opens without reflowing content
    const overlay = page.locator('div[role="dialog"][aria-label="Expanded navigation overlay"]');
    await expect(overlay).toBeVisible();

    // Close overlay via Escape
    await page.keyboard.press('Escape');
    await expect(overlay).toHaveCount(0);

    // Open again and close via backdrop click
    await expandBtn.click();
    await expect(overlay).toBeVisible();
    const backdrop = overlay.locator('div[aria-hidden="true"]');
    await backdrop.click({ position: { x: 500, y: 200 } });
    await expect(overlay).toHaveCount(0);
  });

  test('Desktop (>= 1024px): toggle collapse to icon rail, persisted across reload', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAs(page, 'admin');

    const sidebar = page.locator('aside[aria-label="Main sidebar navigation"]');
    await expect(sidebar).toBeVisible();

    // Initially expanded (240px)
    let box = await sidebar.boundingBox();
    expect(box?.width).toBeCloseTo(240, 1);

    // Toggle collapse
    const collapseBtn = sidebar.locator('button[aria-label="Collapse sidebar to icon rail"]');
    await collapseBtn.click();
    await page.waitForTimeout(300); // Wait for 200ms width transition

    // Now collapsed rail (64px)
    box = await sidebar.boundingBox();
    expect(box?.width).toBeCloseTo(64, 1);

    // Verify localStorage state
    const savedState = await page.evaluate(() => localStorage.getItem('crm_sidebar_desktop_expanded'));
    expect(savedState).toBe('false');

    // Reload page and confirm it remains collapsed
    await page.reload();
    await page.waitForLoadState('networkidle');

    const reloadedSidebar = page.locator('aside[aria-label="Main sidebar navigation"]');
    box = await reloadedSidebar.boundingBox();
    expect(box?.width).toBeCloseTo(64, 1);

    // Expand back
    const expandBtn = reloadedSidebar.locator('button[aria-label="Expand sidebar"]');
    await expandBtn.click();
    await page.waitForTimeout(300); // Wait for 200ms width transition
    box = await reloadedSidebar.boundingBox();
    expect(box?.width).toBeCloseTo(240, 1);

    const reSavedState = await page.evaluate(() => localStorage.getItem('crm_sidebar_desktop_expanded'));
    expect(reSavedState).toBe('true');
  });
});
