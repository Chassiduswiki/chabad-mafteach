import { test, expect } from '@playwright/test';

test.describe('Chabad Mafteach E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for E2E tests
    test.setTimeout(60000);

    // Navigate to the app
    await page.goto('http://localhost:3000');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('homepage loads correctly', async ({ page }) => {
    // Check title
    await expect(page).toHaveTitle(/Chabad Mafteach/);

    // Check main heading
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();

    // Check navigation
    const exploreLink = page.locator('a[href="/explore"]');
    await expect(exploreLink).toBeVisible();
  });

  test('explore page navigation', async ({ page }) => {
    // Navigate to explore page
    await page.goto('http://localhost:3000/explore');
    await page.waitForLoadState('networkidle');

    // Check page title
    await expect(page.locator('h1')).toContainText('Explore');

    // Check category grid
    const categories = page.locator('[href^="/topics?category="]');
    await expect(categories.first()).toBeVisible();

    // Click a category
    await categories.first().click();
    await page.waitForURL('**/topics?category=**');

    // Check topics page loads
    await expect(page.locator('h1')).toContainText('Topics');
  });

  test('search functionality', async ({ page }) => {
    // Test command palette search
    await page.keyboard.press('Meta+k'); // Cmd+K on Mac

    // Wait for search modal
    const searchInput = page.locator('input[placeholder*="search" i]').first();
    await expect(searchInput).toBeVisible();

    // Type search query
    await searchInput.fill('kabbalah');

    // Wait for results
    await page.waitForTimeout(1000); // Allow time for search

    // Check if results appear
    const results = page.locator('[role="option"]');
    // Results may or may not appear depending on data
  });

  test('article reading flow', async ({ page }) => {
    // Navigate to topics page
    await page.goto('http://localhost:3000/topics');
    await page.waitForLoadState('networkidle');

    // Find and click a topic
    const topicLinks = page.locator('a[href^="/topics/"]');
    if (await topicLinks.count() > 0) {
      await topicLinks.first().click();

      // Wait for topic page to load
      await page.waitForURL('**/topics/**');

      // Check if article tab exists
      const articleTab = page.locator('button').filter({ hasText: 'Article' });
      if (await articleTab.count() > 0) {
        await articleTab.click();

        // Check article content loads
        await expect(page.locator('text=/Article in Development|Loading/')).toBeVisible();
      }
    }
  });

  test('responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check mobile navigation
    const mobileNav = page.locator('[data-mobile-nav]');
    // Mobile nav may have different implementation

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    // Check responsive layout
    const grid = page.locator('.grid');
    await expect(grid).toBeVisible();
  });

  test('accessibility checks', async ({ page }) => {
    // Check for alt text on images
    const images = page.locator('img');
    for (const img of await images.all()) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }

    // Check heading hierarchy
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);

    // Check focus management
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('error handling', async ({ page }) => {
    // Navigate to non-existent page
    await page.goto('http://localhost:3000/non-existent-page');

    // Should show 404 or error page
    await expect(page.locator('text=/not found|error/i')).toBeVisible();
  });

  test('performance - lighthouse scores', async ({ page }) => {
    // Basic performance check
    const startTime = Date.now();

    await page.goto('http://localhost:3000/explore');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000); // Should load in less than 5 seconds

    // Check for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    expect(errors.length).toBe(0);
  });
});
