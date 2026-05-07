import { test, expect } from '@playwright/test';

test.use({ storageState: 'team-storage-state.json' });

/*Wszytskie testy zostały wykonane wspólnie przez cały zespół*/

test.describe('Testy zespołowe z użyciem storageState', () => {

    /*Weryfikacja, czy plik storageState poprawnie załadował się do przeglądarki
    i czy nasza zapisana wartość sesji przetrwała.*/
    test('1. Odczytanie wgranej wartości z localStorage', async ({ page }) => {
        await page.goto('http://localhost:3000/');
        const savedToken = await page.evaluate(() => localStorage.getItem('test_session_token'));
        expect(savedToken).toBe('przykladowa_wartosc');
    });

    /*Sprawdzenie, czy załadowanie sztucznego stanu do przeglądarki
      nie psuje poprawnego renderowania głównego interfejsu aplikacji.*/
    test('Aplikacja renderuje strukturę UI poprawnie z załadowanym stanem sesji', async ({ page }) => {
        await page.goto('http://localhost:3000/');

        await expect(page.getByText('Algorithm Control')).toBeVisible();
        await expect(page.getByRole('combobox').first()).toBeVisible();
        await expect(page.getByRole('button', { name: 'Initialize' })).toBeVisible();
        await expect(page.locator('canvas').first()).toBeVisible();
    });

    /*Sprawdzenie poprawności działania interakcji przy aktywnym stanie.*/
    test('Pełna interakcja z algorytmem i walidacja utrzymania stanu po akcjach biznesowych', async ({ page }) => {
        await page.goto('http://localhost:3000/');

        await page.getByRole('combobox').first().selectOption('grupped');
        await page.getByRole('combobox').nth(3).selectOption('KMeansPlusPlus');
        await page.getByRole('combobox').nth(4).selectOption('Manhattan');
        await page.getByRole('spinbutton').fill('30');

        await page.getByRole('button', { name: 'Initialize' }).click();

        await expect(page.getByText('Initialization Finished.')).toBeVisible({ timeout: 100000 });
        await page.getByText('You can now run the algorithm').click();

        await expect(page.getByRole('button', { name: 'Play' })).toBeEnabled();

        const savedToken = await page.evaluate(() => localStorage.getItem('test_session_token'));
        expect(savedToken).toBe('przykladowa_wartosc');
    });

});