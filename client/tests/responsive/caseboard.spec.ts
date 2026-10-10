import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test.describe('Case Board Touch Interactions Suite', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });

  test('Case Board touch gestures, zoom buttons, filters sheet, and details bottom sheet', async ({ page }) => {
    await loginAs(page, 'admin');

    await page.goto('/board');
    await page.waitForLoadState('networkidle');

    // 1. Verify canvas has touch-action: none for gestures
    const corkboard = page.locator('.corkboard-bg');
    await expect(corkboard).toBeVisible();
    const touchAction = await corkboard.evaluate((el) => window.getComputedStyle(el).touchAction);
    expect(touchAction).toBe('none');

    // 2. Verify Zoom in, Zoom out, and Fit buttons are visible on mobile
    const zoomInBtn = page.locator('button[aria-label="Zoom in"]');
    const zoomOutBtn = page.locator('button[aria-label="Zoom out"]');
    const fitBtn = page.locator('button[aria-label="Fit to screen"], button[aria-label="Fit to view"]');

    await expect(zoomInBtn).toBeVisible();
    await expect(zoomOutBtn).toBeVisible();
    await expect(fitBtn).toBeVisible();

    // Test Zoom In
    const initialTransform = await page.locator('.corkboard-bg > div').first().getAttribute('style');
    await zoomInBtn.click();
    const zoomedTransform = await page.locator('.corkboard-bg > div').first().getAttribute('style');
    expect(zoomedTransform).not.toEqual(initialTransform);

    // Test Fit to View
    await fitBtn.click();

    // 3. Test Filters bottom sheet on mobile
    const filtersBtn = page.locator('button:has-text("Filters")');
    await expect(filtersBtn).toBeVisible();
    await filtersBtn.click();

    // Bottom sheet dialog for board filters
    const filterSheet = page.locator('div[role="dialog"][aria-label="Filter Case Board"]');
    await expect(filterSheet).toBeVisible();

    // Close filters sheet
    const closeFilterBtn = filterSheet.locator('button[aria-label="Close filters"]');
    await closeFilterBtn.click();
    await expect(filterSheet).toHaveCount(0);

    // 4. Test Card click opens Details Bottom Sheet on mobile
    const firstCard = page.locator('[data-testid="criminal-node"]').first();
    await expect(firstCard).toBeVisible();
    await firstCard.dispatchEvent('click');

    // Inspector dialog opens as bottom sheet
    const inspector = page.locator('div[role="dialog"][aria-label="Evidence dossier inspector"]');
    await expect(inspector).toBeVisible();

    // Close details sheet
    const closeInspectorBtn = inspector.locator('button[aria-label="Close dossier"]');
    await page.waitForTimeout(300);
    await closeInspectorBtn.click({ force: true });
    await expect(inspector).toHaveCount(0);

    // 5. Test Background pan with pointer events
    const initialPos = await corkboard.evaluate((el) => {
      const child = el.firstElementChild as HTMLElement;
      return child ? child.style.transform : '';
    });

    const box = await corkboard.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 200, box.y + 300);
      await page.mouse.down();
      await page.mouse.move(box.x + 260, box.y + 350, { steps: 5 });
      await page.mouse.up();
    }

    const pannedPos = await corkboard.evaluate((el) => {
      const child = el.firstElementChild as HTMLElement;
      return child ? child.style.transform : '';
    });
    expect(pannedPos).not.toEqual(initialPos);
  });
});
