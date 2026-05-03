import {test, expect} from '@playwright/test';

test.describe('Testy end-to-end', () => {

    /*Autorem wszytskich testów z pliku jest Karina Chilkiewicz*/

    async function loadDataAndInitialize(page) {
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

    /*Test przechodzi przez całą główną ścieżkę użytkownika: od inicjalizacji danych,
     przez całkowite wykonanie algorytmu (do zbieżności), aż po poprawne odblokowanie i
     otwarcie modułu analizy jakości grupowania.*/
    test('Otwarcie analizy jakości grupowania po zakończeniu algorytmu', async ({ page }) => {
        await loadDataAndInitialize(page);
        await page.getByRole('button', { name: /Finish result/i }).click();
        await expect(page.getByText('Algorithm Converged!')).toBeVisible({ timeout: 15000 });

        const runAnalysisBtn = page.getByRole('button', { name: /run analysis/i });
        await expect(runAnalysisBtn).toBeEnabled();
        await runAnalysisBtn.click();

        await expect(page.getByText('Clustering Quality Analysis')).toBeVisible({ timeout: 20000 });
    });

    /*Weryfikacja działania resetu podczas działania algorytmu. Test wykonuje sztuczne kroki w przód,
     upewniając się, że iteracja wzrosła, a następnie wymusza reset i weryfikuje,
     czy stan algorytmu poprawnie powrócił do punktu początkowego (iteracja 0).*/
    test('Resetowanie stanu algorytmu w trakcie działania', async ({ page }) => {
        await loadDataAndInitialize(page);
        const stepForwardBtn = page.locator('button').filter({ has: page.locator('img[src*="forward"]') });

        await stepForwardBtn.click();
        await stepForwardBtn.click();

        await expect(page.getByText('Iteration: 2', { exact: true })).toBeVisible({ timeout: 15000 });

        await page.getByRole('button', { name: /reset/i }).last().click();

        await expect(page.getByText('Algorithm state reset.')).toBeVisible();

        await expect(page.getByText('Iteration: 0', { exact: true })).toBeVisible({ timeout: 15000 });
        await expect(page.getByRole('button', { name: 'Play' })).toBeDisabled();
    });

    /*Sprawdzenie działania pzrebiegu krok po kroku. Test weryfikuje, czy wskaźnika iteracji oarz powiadomienia toast
     spójnie i poprawnie reagują na wykonywanie przez użytkownika korków w przód i w tył.*/
    test('Przebieg algorytmu krok po kroku, działanie korku do przodu i tyłu oraz zmiany iteracji', async ({ page }) => {
        await loadDataAndInitialize(page);
        const stepForwardBtn = page.locator('button').filter({ has: page.locator('img[src*="forward"]') });
        const stepBackBtn = page.locator('button').filter({ has: page.locator('img[src*="backwards"]') });

        await stepForwardBtn.click();
        await expect(page.getByText('Iteration: 1')).toBeVisible({ timeout: 20000 });
        await expect(page.getByText('Step forward.')).toBeVisible({ timeout: 20000 });

        await stepBackBtn.click();
        await expect(page.getByText('Iteration: 0')).toBeVisible({ timeout: 6000 });
        await expect(page.getByText('Step backward.')).toBeVisible({ timeout: 20000 });
    });

    test('Przebieg algorytmu dla Finish result', async ({ page }) => {
        await loadDataAndInitialize(page);

        const finishBtn = page.getByRole('button', { name: /Finish result/i });
        await expect(finishBtn).toBeEnabled();
        await finishBtn.click();

        await expect(page.getByText('Algorithm Converged!')).toBeVisible({ timeout: 20000 });
        await expect(page.getByRole('button', { name: 'Play' })).toBeDisabled();
        await expect(finishBtn).toBeDisabled();
    });

    test('Przebieg algorytmu w czasie rzeczywistym, działanie przycisków Play i Stop', async ({ page }) => {
        await loadDataAndInitialize(page);
        const playBtn = page.getByRole('button', { name: 'Play' });
        const stopBtn = page.getByRole('button', { name: 'Stop' });

        await playBtn.click();
        await expect(page.getByText('Running...')).toBeVisible();
        await expect(page.locator('button').filter({ has: page.locator('img[src*="forward"]') })).toBeDisabled();

        await stopBtn.click();
        await expect(page.getByText('Algorytm zapauzowany.')).toBeVisible({ timeout: 20000 });
        await expect(playBtn).toBeEnabled();
    });

    test('Blokada kontrolek sterujących przed inicjalizacją danych', async ({ page }) => {
        await page.goto('http://localhost:3000/');

        await expect(page.getByRole('button', { name: 'Play' })).toBeDisabled();
        await expect(page.getByRole('button', { name: 'Stop' })).toBeDisabled();
        await expect(page.getByRole('button', { name: /Finish result/i })).toBeDisabled();
        await expect(page.locator('button').filter({ has: page.locator('img[src*="forward"]') })).toBeDisabled();
    });

    test('Prawidłowe renderowanie obszaru roboczego po załadowaniu danych', async ({ page }) => {
        await page.goto('http://localhost:3000/');
        const canvas = page.locator('canvas').first();

        await page.getByRole('combobox').first().selectOption('grupped');

        await page.waitForTimeout(1000);
        const boxAfter = await canvas.boundingBox();

        expect(boxAfter?.width).toBeGreaterThan(0);
        expect(boxAfter?.height).toBeGreaterThan(0);
    });

    test('Otwarcie okna informacyjnego About & Methodology', async ({ page }) => {
        await page.goto('http://localhost:3000/');

        await page.getByRole('button', {name: 'About & Methodology'}).click();
        await expect(page.getByText('Engineering Thesis Context')).toBeVisible();
    });

});