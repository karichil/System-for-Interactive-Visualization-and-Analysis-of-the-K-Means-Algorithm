import { test, expect } from '@playwright/test';

test.describe('Testy frontendowe z mockowaniem (Algorithm Control)', () => {

    async function setupInitialState(page) {
        await page.goto('http://localhost:3000/');
        await page.getByRole('combobox').first().selectOption('grupped');
        await page.getByRole('combobox').nth(3).selectOption('KMeansPlusPlus');
        await page.getByRole('combobox').nth(4).selectOption('Manhattan');
        await page.getByRole('spinbutton').click();
        await page.getByRole('spinbutton').fill('30');
        await page.getByRole('button', { name: 'Initialize' }).click();
        await expect(page.getByText('Initialization Finished.')).toBeVisible({ timeout: 100000 });
        await page.getByText('You can now run the algorithm').click();
    }

    test('Wykonanie kroku do przodu (Step Forward)', async ({ page }) => {
        await setupInitialState(page);

        await page.route('**/api/KMeansAlgoritm/step-forward', async route => {
            await route.fulfill({
                json: { Centroids: [], Points: [], Iteration: 1, IsFinished: false }
            });
        });

        await page.locator('button').filter({ has: page.locator('img[src*="forward"]') }).click();

        await expect(page.getByText('Iteration: 1', { exact: true })).toBeVisible();
        await expect(page.getByText('Step forward.')).toBeVisible();
    });

    test('Zakończenie algorytmu (Finish Result)', async ({ page }) => {
        await setupInitialState(page);

        await page.route('**/api/KMeansAlgoritm/finish-result', async route => {
            await route.fulfill({
                json: { Centroids: [], Points: [], Iteration: 5, IsFinished: true }
            });
        });

        await page.getByRole('button', { name: /Finish result/i }).click();

        await expect(page.getByText('Iteration: 5', { exact: true })).toBeVisible();
        await expect(page.getByText('Algorithm Converged!')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Play' })).toBeDisabled();
    });

    test('Resetowanie stanu algorytmu (Reset)', async ({ page }) => {
        await setupInitialState(page);

        await page.route('**/api/KMeansAlgoritm/step-forward', async route => {
            await route.fulfill({ json: { Centroids: [], Points: [], Iteration: 3, IsFinished: false } });
        });
        await page.locator('button').filter({ has: page.locator('img[src*="forward"]') }).click();
        await expect(page.getByText('Iteration: 3', { exact: true })).toBeVisible();

        await page.route('**/api/KMeansAlgoritm/clear', async route => {
            await route.fulfill({ status: 200 });
        });

        await page.getByRole('button', { name: /Reset/i }).click();

        await expect(page.getByText('Iteration: 0', { exact: true })).toBeVisible();
        await expect(page.getByText('Algorithm state reset.')).toBeVisible();
    });

});