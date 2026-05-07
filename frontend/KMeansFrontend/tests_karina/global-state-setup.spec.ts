import { test as setup } from '@playwright/test';

setup('Zapisanie stanu aplikacji do storageState', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    await page.evaluate(() => {
        localStorage.setItem('test_session_token', 'przykladowa_wartosc');
    });

    await page.context().storageState({ path: 'team-storage-state.json' });
});