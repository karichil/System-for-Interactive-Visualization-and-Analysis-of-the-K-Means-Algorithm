import { test, expect } from '@playwright/test';
import * as path from 'path'

async function uploadDataset(page, file: string) {

    const filePath = path.resolve(__dirname, 'data', file);

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
});

test('Dataset section visible', async ({ page }) => {
    await expect(page.getByText('Data').first()).toBeVisible();
});

test('Upload dropzone visible', async ({ page }) => {
    await expect(page.getByText(/drag & drop csv/i)).toBeVisible();
});

test('Example dataset selector visible', async ({ page }) => {
    await expect(page.getByText('Example data')).toBeVisible();
});

test('Reset button visible', async ({ page }) => {
    await expect(page.getByText('Reset').first()).toBeVisible();
});

test('Upload dermatology dataset', async ({ page }) => {
    await uploadDataset(page, 'dermatology_bez_wieku.csv');
});

test('Upload random points dataset', async ({ page }) => {
    await uploadDataset(page, 'random_points.csv');
});

test('Upload simulated dataset', async ({ page }) => {
    await uploadDataset(page, 'simulated_points.csv');
});

test('X axis selector visible after dataset load', async ({ page }) => {
    await uploadDataset(page, 'random_points.csv');
    await expect(page.getByText('X-Axis')).toBeVisible();
});

test('Y axis selector visible after dataset load', async ({ page }) => {
    await uploadDataset(page, 'random_points.csv');
    await expect(page.getByText('Y-Axis')).toBeVisible();
});

test('Axis dropdowns visible', async ({ page }) => {
    await uploadDataset(page, 'random_points.csv');
    await expect(page.getByText('X-Axis')).toBeVisible();
    await expect(page.getByText('Y-Axis')).toBeVisible();});

test('Dataset info appears after upload', async ({ page }) => {
    await uploadDataset(page, 'random_points.csv');
    await expect(page.getByText('X-Axis')).toBeVisible();
    await expect(page.getByText('Y-Axis')).toBeVisible();});

test('Reset dataset button clickable', async ({ page }) => {
    await uploadDataset(page, 'random_points.csv');
    const reset = page.getByText('Reset').first();
    await reset.click();
    await expect(reset).toBeVisible();
});

test('Dataset section still visible after reset', async ({ page }) => {
    await uploadDataset(page, 'random_points.csv');
    await page.getByText('Reset').first().click();
    await expect(page.getByText('Data').first()).toBeVisible();
});

test('Upload dataset twice', async ({ page }) => {
    await uploadDataset(page, 'random_points.csv');
    await uploadDataset(page, 'simulated_points.csv');
    await expect(page.getByText('X-Axis')).toBeVisible();
});

test('Dataset area remains visible after upload', async ({ page }) => {
    await uploadDataset(page, 'random_points.csv');
    await expect(page.getByText('Data').first()).toBeVisible();
});