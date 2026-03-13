import { test, expect } from '@playwright/test';

test.describe('Algorithm Control Tests', () =>{

  async function setupAlgorithm(page) {
    await page.goto('http://localhost:3000/');
    await page.getByRole('combobox').first().selectOption('grupped');
    await page.getByRole('combobox').nth(3).selectOption('KMeansPlusPlus');
    await page.getByRole('combobox').nth(4).selectOption('Manhattan');
    await page.getByRole('spinbutton').click();
    await page.getByRole('spinbutton').fill('30');
    await page.getByRole('button', { name: 'Initialize' }).click();
    await page.getByText('Initialization Finished.').click();
    await page.getByText('You can now run the algorithm').click();
  }
  test('powinien wyświetlać tytuł sekcji', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await expect(page.getByText('Algorithm Control')).toBeVisible();
  });

  test('powinien pokazać instrukcję w Popover', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.locator('[id="popover::r3::trigger"]').click();
    await expect(page.getByText('• In time - use Play and Stop,')).toBeVisible();
  });

  test('powinien blokować przyciski sterowania przed inicjalizacją', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    const playBtn = page.getByRole('button', { name: /Play/i });
    const stopBtn = page.getByRole('button', { name: /Stop/i });
    const finishBtn = page.getByRole('button', { name: /Finish result/i });

    await expect(playBtn).toBeDisabled();
    await expect(stopBtn).toBeDisabled();
    await expect(finishBtn).toBeDisabled();
  });

  test('przyciski powinny być zablokowane na starcie', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await expect(page.getByRole('button', { name: 'Play' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Stop' })).toBeDisabled();
  });

  test('powinien zmienić stan na Running po kliknięciu Play', async ({ page }) => {
    await setupAlgorithm(page);
    const playBtn = page.getByRole('button', { name: 'Play' });
    await playBtn.click();
    await expect(page.getByText('Running...')).toBeVisible();
  });

  test('powinien umożliwić pauzę algorytmu', async ({ page }) => {
    await setupAlgorithm(page);
    await page.getByRole('button', { name: 'Play' }).click();
    const stopBtn = page.getByRole('button', { name: 'Stop' });
    await stopBtn.click();
    await expect(page.getByRole('button', { name: 'Play' })).toBeEnabled();
  });

  test('powinien zwiększyć iterację przy Step Forward', async ({ page }) => {
    await setupAlgorithm(page);
    await page.locator('button').filter({ has: page.locator('img[src*="forward"]') }).click();
    await expect(page.getByText('Iteration: 1')).toBeVisible();
  });

  test('przycisk Reset powinien czyścić stan algorytmu', async ({ page }) => {
    await setupAlgorithm(page);
    await page.getByRole('button', { name: /reset/i }).last().click();
    await expect(page.getByText('Iteration: 0')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Play' })).toBeDisabled();
  });

  test('przycisk Step Backward jest zablokowany na starcie', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    const stepBackBtn = page.locator('button').filter({ has: page.locator('img[src*="backwards"]') });
    await expect(stepBackBtn).toBeDisabled();
  });

  test('przycisk Step Forward jest zablokowany przed inicjalizacją', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    const stepForwardBtn = page.locator('button').filter({ has: page.locator('img[src*="forward"]') });
    await expect(stepForwardBtn).toBeDisabled();
  });

  test('powinien wyświetlić powiadomienie po kroku w przód', async ({ page }) => {
    await setupAlgorithm(page);
    await page.locator('button').filter({ has: page.locator('img[src*="forward"]') }).click();
    await expect(page.getByText('Step foreward.')).toBeVisible();
  });

  test('powinien wyświetlić powiadomienie po kroku w tył', async ({ page }) => {
    await setupAlgorithm(page);
    await page.locator('button').filter({ has: page.locator('img[src*="forward"]') }).click();
    await page.locator('button').filter({ has: page.locator('img[src*="backwards"]') }).click();

    await expect(page.getByText('Step backward.')).toBeVisible();
  });

  test('powinien odblokować Step Backward po pierwszym kroku w przód', async ({ page }) => {
    await setupAlgorithm(page);
    await page.locator('button').filter({ has: page.locator('img[src*="forward"]') }).click();

    const stepBackBtn = page.locator('button').filter({ has: page.locator('img[src*="backwards"]') });
    await expect(stepBackBtn).toBeEnabled();
  });

  test('powinien cofnąć iterację przy Step Backward', async ({ page }) => {
    await setupAlgorithm(page);
    const stepForwardBtn = page.locator('button').filter({ has: page.locator('img[src*="forward"]') });
    const stepBackBtn = page.locator('button').filter({ has: page.locator('img[src*="backwards"]') });

    await stepForwardBtn.click();
    await expect(page.getByText('Iteration: 1')).toBeVisible();
    await stepBackBtn.click();

    await expect(page.getByText('Iteration: 0')).toBeVisible();
  });

  test('powinien zablokować kroki podczas działania algorytmu (Play)', async ({ page }) => {
    await setupAlgorithm(page);
    await page.getByRole('button', { name: 'Play' }).click();

    const stepForwardBtn = page.locator('button').filter({ has: page.locator('img[src*="forward"]') });
    const stepBackBtn = page.locator('button').filter({ has: page.locator('img[src*="backwards"]') });

    await expect(stepForwardBtn).toBeDisabled();
    await expect(stepBackBtn).toBeDisabled();
  });

  test('powinien wyświetlić powiadomienie po zatrzymaniu (Stop)', async ({ page }) => {
    await setupAlgorithm(page);
    await page.getByRole('button', { name: 'Play' }).click();
    await page.getByRole('button', { name: 'Stop' }).click();

    await expect(page.getByText('Algorytm zapauzowany.')).toBeVisible();
  });

  test('powinien aktywować przycisk Finish result po inicjalizacji', async ({ page }) => {
    await setupAlgorithm(page);
    const finishBtn = page.getByRole('button', { name: /Finish result/i });
    await expect(finishBtn).toBeEnabled();
  });

  test('powinien zablokować przycisk Finish result podczas Play', async ({ page }) => {
    await setupAlgorithm(page);
    await page.getByRole('button', { name: 'Play' }).click();

    const finishBtn = page.getByRole('button', { name: /Finish result/i });
    await expect(finishBtn).toBeDisabled();
  });

  test('powinien wyświetlić powiadomienie po kliknięciu Reset', async ({ page }) => {
    await setupAlgorithm(page);
    await page.getByRole('button', { name: /reset/i }).last().click();
    await expect(page.getByText('Algorithm state reset.')).toBeVisible();
  });

  test('powinien wyłączyć przycisk Stop po kliknięciu Reset', async ({ page }) => {
    await setupAlgorithm(page);
    await page.getByRole('button', { name: 'Play' }).click();
    await page.getByRole('button', { name: /reset/i }).last().click();

    const stopBtn = page.getByRole('button', { name: 'Stop' });
    await expect(stopBtn).toBeDisabled();
  });

  test('powinien zablokować Step Backward po resecie, mimo wcześniejszych iteracji', async ({ page }) => {
    await setupAlgorithm(page);
    await page.locator('button').filter({ has: page.locator('img[src*="forward"]') }).click();
    await page.getByRole('button', { name: /reset/i }).last().click();

    const stepBackBtn = page.locator('button').filter({ has: page.locator('img[src*="backwards"]') });
    await expect(stepBackBtn).toBeDisabled();
  });

  test('powinien wyświetlać domyślną iterację równą 0 po załadowaniu strony', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await expect(page.getByText('Iteration: 0')).toBeVisible();
  });

  test('powinien poprawnie zliczać wielokrotne kroki w przód', async ({ page }) => {
    await setupAlgorithm(page);
    const stepForwardBtn = page.locator('button').filter({ has: page.locator('img[src*="forward"]') });

    await stepForwardBtn.click();
    await expect(page.getByText('Iteration: 1', { exact: true })).toBeVisible();

    await stepForwardBtn.click();
    await expect(page.getByText('Iteration: 2', { exact: true })).toBeVisible();
  });

  test('powinien zablokować przycisk Play po zakończeniu pracy przez Finish result', async ({ page }) => {
    await setupAlgorithm(page);
    await page.getByRole('button', { name: /Finish result/i }).click();
    await expect(page.getByText('Algorithm Converged!')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Play' })).toBeDisabled();
  });

  test('powinien zablokować przycisk Finish result po dojściu algorytmu do zbieżności', async ({ page }) => {
    await setupAlgorithm(page);
    const finishBtn = page.getByRole('button', { name: /Finish result/i });
    await finishBtn.click();
    await expect(page.getByText('Algorithm Converged!')).toBeVisible({ timeout: 15000 });
    await expect(finishBtn).toBeDisabled();
  });

  test('powinien wyświetlać sekcję Animation speed z domyślną wartością 1', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await expect(page.getByText('Animation speed')).toBeVisible();
    const speedValueBox = page.locator('.App-cluser-box').last();
    await expect(speedValueBox).toHaveText('1');
  });
});



test.describe('Clustering Quality Analysis Module', () => {

  async function setupAlgorithm(page) {
    await page.goto('http://localhost:3000/');
    await page.getByRole('combobox').first().selectOption('grupped');
    await page.getByRole('combobox').nth(3).selectOption('KMeansPlusPlus');
    await page.getByRole('combobox').nth(4).selectOption('Manhattan');
    await page.getByRole('spinbutton').click();
    await page.getByRole('spinbutton').fill('30');
    await page.getByRole('button', { name: 'Initialize' }).click();
    await expect(page.getByText('Initialization Finished.')).toBeVisible();
    await page.getByText('You can now run the algorithm').click();
    await page.getByRole('button', { name: 'Finish result' }).click();
    await expect(page.getByText('Algorithm Converged!')).toBeVisible();
  }

  test('powinien wyświetlać tytuł sekcji na starcie', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await expect(page.getByText('Clustering Quality Analysis')).toBeVisible();
  });

  test('przycisk Run analysis powinien być zablokowany bez danych', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    const runBtn = page.getByRole('button', { name: /run analysis/i });

    await expect(runBtn).toBeDisabled();
  });
});


test.describe('Chart Section Tests', () => {

  test('powinien poprawnie przeskalować wykres po wgraniu danych (symulacja)', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    const canvas = page.locator('canvas').first();

    const boxBefore = await canvas.boundingBox();

    await page.getByRole('combobox').first().selectOption('grupped');
    await page.waitForTimeout(1000);

    const boxAfter = await canvas.boundingBox();
    expect(boxAfter?.width).toBeGreaterThan(0);
    expect(boxAfter?.height).toBeGreaterThan(0);
    expect(boxAfter?.width).toBe(boxBefore?.width);
  });

});

test.describe('About & Methodology', () => {
  test('powinio otworzyć się okienko informacyjne', async ({page}) => {
    await page.goto('http://localhost:3000/');
    await page.getByRole('button', {name: 'About & Methodology'}).click();
    await expect(page.getByText('Engineering Thesis Context')).toBeVisible();
  });
});
