import { test, expect } from '@playwright/test';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

function createToken(role: 'admin' | 'editor') {
  return jwt.sign({ userId: 'e2e-user', role }, JWT_SECRET);
}

test.describe('Admin Dashboard Access', () => {
  test('redirects unauthenticated users to signin', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForURL('**/auth/signin');
    await expect(page).toHaveURL(/auth\/signin/);
  });

  test('allows admin users to access dashboard', async ({ page, context }) => {
    const token = createToken('admin');
    await context.addCookies([
      {
        name: 'auth_token',
        value: token,
        url: 'http://localhost:3000',
      },
    ]);

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Performance Console')).toBeVisible();
    await expect(page.getByText('Technical Ops')).toBeVisible();
  });
});
