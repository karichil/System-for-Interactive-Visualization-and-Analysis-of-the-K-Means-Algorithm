import { test, expect } from '@playwright/test';
import * as path from 'path'
async function loadDataset(page) {

    const filePath = path.resolve(__dirname, 'data', 'random_points.csv');

    const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        page.getByText(/drag & drop csv/i).click()
    ]);

    await fileChooser.setFiles(filePath);

    await expect(page.getByText('X-Axis')).toBeVisible({ timeout: 10000 });
}

test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await loadDataset(page);
});

test('Manual editing section visible', async ({ page }) => {
    await expect(page.getByText('Manual editing')).toBeVisible();
});

test('Points button visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Points' })).toBeVisible();
});

test('Centroids button visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Centroids' })).toBeVisible();
});

test('Points button enabled', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Points' })).toBeEnabled();
});

test('Centroids button enabled', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Centroids' })).toBeEnabled();
});

test('Switch to points editing mode', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Points' });
    await button.click();
    await expect(button).toBeVisible();
});

test('Switch to centroids editing mode', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Centroids' });
    await button.click();
    await expect(button).toBeVisible();
});

test('Manual editing instructions visible', async ({ page }) => {
    await expect(page.getByText('Click to add')).toBeVisible();
});

test('Drag instruction visible', async ({ page }) => {
    await expect(page.getByText('Drag to move')).toBeVisible();
});

test('Delete instruction visible', async ({ page }) => {
    await expect(page.getByText('Right click to delete')).toBeVisible();
});

test('Points button still visible after click', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Points' });
    await button.click();
    await expect(button).toBeVisible();
});

test('Centroids button still visible after click', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Centroids' });
    await button.click();
    await expect(button).toBeVisible();
});

test('Manual editing panel stable after interactions', async ({ page }) => {
    await page.getByRole('button', { name: 'Points' }).click();
    await page.getByRole('button', { name: 'Centroids' }).click();
    await expect(page.getByText('Manual editing')).toBeVisible();
});

test('Editing buttons exist together', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Points' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Centroids' })).toBeVisible();
});

test('Manual editing section remains visible', async ({ page }) => {
    await expect(page.getByText('Manual editing')).toBeVisible();
});