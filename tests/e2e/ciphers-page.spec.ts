import { test, expect } from '@playwright/test';

test.describe('Ciphers Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ciphers');
  });

  test('should load the ciphers page', async ({ page }) => {
    await expect(page).toHaveTitle(/Top 20 Cipher Sandbox/);
    
    // Check main heading
    await expect(page.getByRole('heading', { name: 'All Cryptographic Algorithms' })).toBeVisible();
    
    // Check description
    await expect(page.getByText('Explore our complete collection of')).toBeVisible();
  });

  test('should display search and filter controls', async ({ page }) => {
    // Search input
    await expect(page.getByPlaceholder('Search ciphers...')).toBeVisible();
    
    // Category filter
    const categorySelect = page.locator('select');
    await expect(categorySelect).toBeVisible();
    
    // View mode toggles
    await expect(page.locator('[data-testid="grid-view"], button[aria-label*="grid"], button:has-text("Grid")').first()).toBeVisible();
    await expect(page.locator('[data-testid="list-view"], button[aria-label*="list"], button:has-text("List")').first()).toBeVisible();
  });

  test('should filter ciphers by category', async ({ page }) => {
    const categorySelect = page.locator('select').first();
    
    // Test symmetric filter
    await categorySelect.selectOption('symmetric');
    
    // Should show only symmetric ciphers
    const resultHeading = page.getByRole('heading', { name: /Symmetric Ciphers/ });
    await expect(resultHeading).toBeVisible();
    
    // Test asymmetric filter
    await categorySelect.selectOption('asymmetric');
    
    // Should show only asymmetric ciphers
    const asymmetricHeading = page.getByRole('heading', { name: /Asymmetric Ciphers/ });
    await expect(asymmetricHeading).toBeVisible();
    
    // Test all ciphers
    await categorySelect.selectOption('all');
    
    // Should show all ciphers
    const allHeading = page.getByRole('heading', { name: /All Ciphers/ });
    await expect(allHeading).toBeVisible();
  });

  test('should search ciphers', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search ciphers...');
    
    // Search for AES
    await searchInput.fill('AES');
    
    // Should show AES in results
    await expect(page.getByText('Advanced Encryption Standard (AES)')).toBeVisible();
    
    // Should update results heading
    await expect(page.getByRole('heading', { name: /Search Results/ })).toBeVisible();
    
    // Test no results
    await searchInput.fill('nonexistentcipher12345');
    await expect(page.getByText(/No ciphers found matching/)).toBeVisible();
    
    // Test clear filters
    await page.getByRole('button', { name: 'Clear Filters' }).click();
    await expect(searchInput).toHaveValue('');
  });

  test('should switch between grid and list views', async ({ page }) => {
    // Start in grid view (default)
    const gridButton = page.locator('button').filter({ hasText: /grid/i }).or(page.locator('[data-testid="grid-view"]')).first();
    const listButton = page.locator('button').filter({ hasText: /list/i }).or(page.locator('[data-testid="list-view"]')).first();
    
    // Switch to list view
    if (await listButton.isVisible()) {
      await listButton.click();
      
      // Verify list view is active
      await expect(listButton).toHaveClass(/bg-white|active|selected/);
    }
    
    // Switch back to grid view
    if (await gridButton.isVisible()) {
      await gridButton.click();
      
      // Verify grid view is active
      await expect(gridButton).toHaveClass(/bg-white|active|selected/);
    }
  });

  test('should display category statistics', async ({ page }) => {
    // Check category stats buttons
    await expect(page.getByText('All Ciphers')).toBeVisible();
    await expect(page.getByText('Symmetric')).toBeVisible();
    await expect(page.getByText('Asymmetric')).toBeVisible();
    await expect(page.getByText('Post-Quantum')).toBeVisible();
    
    // Each should show a count
    const categoryButtons = page.locator('button').filter({ hasText: /\(\d+\)/ });
    const buttonCount = await categoryButtons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('should navigate to cipher detail pages', async ({ page }) => {
    // Wait for cipher cards to load
    const cipherLinks = page.locator('[href^="/cipher/"]');
    await expect(cipherLinks.first()).toBeVisible();
    
    // Click on first cipher
    const firstCipherLink = cipherLinks.first();
    const href = await firstCipherLink.getAttribute('href');
    await firstCipherLink.click();
    
    // Should navigate to cipher detail page
    await expect(page).toHaveURL(href || '/cipher/aes');
    
    // Should show cipher details
    await expect(page.getByRole('heading')).toBeVisible();
  });

  test('should show cipher information in cards', async ({ page }) => {
    // Wait for cipher cards to load
    const cipherCards = page.locator('[href^="/cipher/"]');
    await expect(cipherCards.first()).toBeVisible();
    
    const firstCard = cipherCards.first();
    
    // Should show cipher name
    await expect(firstCard).toContainText(/\w+/);
    
    // Should show category badge
    const categoryBadges = page.locator('.cipher-category-symmetric, .cipher-category-asymmetric, .cipher-category-post-quantum').or(
      page.locator('span').filter({ hasText: /symmetric|asymmetric|post-quantum/ })
    );
    await expect(categoryBadges.first()).toBeVisible();
  });

  test('should handle empty search results', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search ciphers...');
    
    // Search for something that doesn't exist
    await searchInput.fill('xyz123nonexistent');
    
    // Should show no results message
    await expect(page.getByText(/No ciphers found matching/)).toBeVisible();
    
    // Should show clear filters button
    await expect(page.getByRole('button', { name: 'Clear Filters' })).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Main elements should still be visible
    await expect(page.getByRole('heading', { name: 'All Cryptographic Algorithms' })).toBeVisible();
    await expect(page.getByPlaceholder('Search ciphers...')).toBeVisible();
    
    // Filter controls should adapt to mobile
    const categorySelect = page.locator('select').first();
    await expect(categorySelect).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Test tab navigation to search
    await page.keyboard.press('Tab');
    
    const searchInput = page.getByPlaceholder('Search ciphers...');
    await expect(searchInput).toBeFocused();
    
    // Test search with keyboard
    await searchInput.type('AES');
    
    // Test tab navigation to category filter
    await page.keyboard.press('Tab');
    
    const categorySelect = page.locator('select').first();
    await expect(categorySelect).toBeFocused();
  });

  test('should maintain state when navigating back', async ({ page }) => {
    // Set search and category filter
    await page.getByPlaceholder('Search ciphers...').fill('AES');
    await page.locator('select').first().selectOption('symmetric');
    
    // Click on a cipher
    const cipherLink = page.locator('[href^="/cipher/"]').first();
    await cipherLink.click();
    
    // Navigate back
    await page.goBack();
    
    // State should be preserved
    await expect(page.getByPlaceholder('Search ciphers...')).toHaveValue('AES');
    await expect(page.locator('select').first()).toHaveValue('symmetric');
  });
});
