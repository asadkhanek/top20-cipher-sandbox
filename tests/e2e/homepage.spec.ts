import { test, expect } from '@playwright/test';

test.describe('HomePage E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the homepage', async ({ page }) => {
    await expect(page).toHaveTitle(/Top 20 Cipher Sandbox/);
    
    // Check main heading
    await expect(page.getByRole('heading', { name: /Cryptography.*Sandbox/ })).toBeVisible();
    
    // Check description
    await expect(page.getByText('Interactive playground for exploring 20 encryption algorithms')).toBeVisible();
  });

  test('should display cipher statistics', async ({ page }) => {
    // Check that statistics cards are visible
    await expect(page.getByText('Symmetric Ciphers')).toBeVisible();
    await expect(page.getByText('Asymmetric Ciphers')).toBeVisible();
    await expect(page.getByText('Post-Quantum Ready')).toBeVisible();
    
    // Check that numbers are displayed
    const symmetricCount = page.locator('text=Symmetric Ciphers').locator('..');
    await expect(symmetricCount).toContainText(/\d+/);
  });

  test('should have functional search', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search ciphers...');
    
    // Test search input exists
    await expect(searchInput).toBeVisible();
    
    // Test search functionality
    await searchInput.fill('AES');
    
    // Should show AES in results
    await expect(page.getByText('Advanced Encryption Standard (AES)')).toBeVisible();
    
    // Test search with no results
    await searchInput.fill('nonexistentcipher123');
    await expect(page.getByText(/No ciphers found matching/)).toBeVisible();
    
    // Test clear search
    await page.getByRole('button', { name: 'Clear Search' }).click();
    await expect(searchInput).toHaveValue('');
  });

  test('should navigate to all ciphers page', async ({ page }) => {
    // Click "View All Ciphers" button
    await page.getByRole('link', { name: 'View All Ciphers' }).click();
    
    // Should navigate to /ciphers
    await expect(page).toHaveURL('/ciphers');
    
    // Should show all ciphers page content
    await expect(page.getByRole('heading', { name: 'All Cryptographic Algorithms' })).toBeVisible();
  });

  test('should navigate to individual cipher pages', async ({ page }) => {
    // Find and click on AES cipher card
    const aesCard = page.getByText('Advanced Encryption Standard (AES)').first();
    await aesCard.click();
    
    // Should navigate to AES cipher page
    await expect(page).toHaveURL('/cipher/aes');
    
    // Should show cipher details
    await expect(page.getByRole('heading', { name: /AES/ })).toBeVisible();
  });

  test('should display cipher categories', async ({ page }) => {
    // Check category sections
    await expect(page.getByText('Symmetric Encryption')).toBeVisible();
    await expect(page.getByText('Asymmetric Encryption')).toBeVisible();
    await expect(page.getByText('Post-Quantum Cryptography')).toBeVisible();
    
    // Check category descriptions
    await expect(page.getByText('Fast encryption using the same key')).toBeVisible();
    await expect(page.getByText('Public-key cryptography using separate keys')).toBeVisible();
    await expect(page.getByText('Next-generation algorithms designed to resist quantum')).toBeVisible();
  });

  test('should display featured ciphers', async ({ page }) => {
    // Check that featured ciphers section exists
    await expect(page.getByRole('heading', { name: 'Featured Ciphers' })).toBeVisible();
      // Should show multiple cipher cards (up to 6)
    const cipherCards = page.locator('[href^="/cipher/"]');
    const cardCount = await cipherCards.count();
    expect(cardCount).toBeLessThanOrEqual(6);
    expect(cardCount).toBeGreaterThan(0);
    
    // Each card should have required elements
    const firstCard = cipherCards.first();
    await expect(firstCard).toBeVisible();
  });

  test('should display why use section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Why Use Cipher Sandbox?' })).toBeVisible();
    
    // Check feature points
    await expect(page.getByText('Secure Implementation')).toBeVisible();
    await expect(page.getByText('Interactive Learning')).toBeVisible();
    await expect(page.getByText('Modern Algorithms')).toBeVisible();
    await expect(page.getByText('Educational Focus')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Main elements should still be visible
    await expect(page.getByRole('heading', { name: /Cryptography.*Sandbox/ })).toBeVisible();
    await expect(page.getByPlaceholder('Search ciphers...')).toBeVisible();
    await expect(page.getByText('Symmetric Ciphers')).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');
    
    // Should focus on search input
    const searchInput = page.getByPlaceholder('Search ciphers...');
    await expect(searchInput).toBeFocused();
    
    // Test search with keyboard
    await searchInput.type('AES');
    await page.keyboard.press('Enter');
    
    // Should still show AES results
    await expect(page.getByText('Advanced Encryption Standard (AES)')).toBeVisible();
  });
});
