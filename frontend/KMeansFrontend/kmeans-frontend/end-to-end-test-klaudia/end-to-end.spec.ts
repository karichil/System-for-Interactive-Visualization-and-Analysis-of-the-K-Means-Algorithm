import { test, expect } from '@playwright/test';

test.describe('KMeans Frontend Extended Tests', () => {
  test('01 - Slider set clusters 2', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.getByRole('combobox').first().selectOption('grid');

    await page.locator('[id="slider::r2::track"]').click();
    await expect(page.getByRole('slider').first()).toBeVisible();
  });

  test('02 - Slider min value 1', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.getByRole('combobox').first().selectOption('grid');

    await page.getByRole('slider').first().click();
    await page.getByText('1').first().click();
    await expect(page.getByRole('slider').first()).toBeVisible();
  });

  test('03 - Slider max value 20', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.getByRole('combobox').first().selectOption('grid');

    await page.getByRole('slider').first().click();
    await page.keyboard.press('End');
    await page.getByText('20').first().click();
  });

  test('04 - Initialize KMeans++', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.getByRole('combobox').first().selectOption('grid');
    await page.locator('[id="slider::r2::track"]').click();

    await page.getByRole('combobox').nth(3).selectOption('KMeansPlusPlus');
    await page.getByRole('button', { name: 'Re-Initialize' }).click();
    await expect(page.getByText(/Initialization Finished/i)).toBeVisible();
  });

  test('05 - Initialize Manual', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.getByRole('combobox').first().selectOption('grid');
    await page.locator('[id="slider::r2::track"]').click();

    await page.getByRole('combobox').nth(3).selectOption('Manual');
    await page.getByRole('button', { name: 'Initialize' }).click();
    await page.locator('canvas').click({ position: { x: 237, y: 256 } });
    await page.locator('canvas').click({ position: { x: 576, y: 195 } });
    await page.getByRole('button', { name: 'Re-Initialize' }).click();
    await expect(page.getByText(/Initialization Finished/i)).toBeVisible();
  });

  test('06 - Initialize Random', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.getByRole('combobox').first().selectOption('grid');
    await page.locator('[id="slider::r2::track"]').click();

    await page.getByRole('combobox').nth(3).selectOption('Random');
    await page.getByRole('button', { name: 'Initialize' }).click();
    await expect(page.getByText(/Initialization Finished/i)).toBeVisible();
  });

  test('07 - Add points', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.getByRole('combobox').first().selectOption('grid');
    await page.getByRole('button', { name: 'Points' }).click();
    await page.locator('canvas').click({ position: { x: 152, y: 121 } });
    await page.locator('canvas').click({ position: { x: 198, y: 121 } });
  });

  test('08 - Remove points', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.getByRole('combobox').first().selectOption('grid');
    await page.getByRole('button', { name: 'Points' }).click();
    await page.locator('canvas').click({ position: { x: 152, y: 121 } });
    await page.locator('canvas').click({ position: { x: 198, y: 121 } });
    await page.locator('canvas').click({
      position: { x: 152, y: 121 },
      button: 'right',
    });
    await page.getByText('Point removed').click();
    await expect(page.getByText(/Point removed/i)).toBeVisible();
  });

  test('09 - Add centroids', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.getByRole('combobox').first().selectOption('grid');
    await page.getByRole('slider').first().click();
    await page.getByText('1').first().click();
    await page.getByRole('combobox').nth(3).selectOption('Manual');
    await page.locator('canvas').click({ position: { x: 152, y: 121 } });
  });

  test('10 - Remove centroids', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.getByRole('combobox').first().selectOption('grid');
    await page.getByRole('slider').first().click();
    await page.keyboard.press('End');
    await page.getByText('20').first().click();
    await page.getByRole('combobox').nth(3).selectOption('Manual');
    await page.locator('canvas').click({ position: { x: 152, y: 121 } });
    await page.locator('canvas').click({
      position: { x: 152, y: 121 },
      button: 'right',
    });
    await page.getByText('Centroid removed').click();
    await page.getByRole('status', { name: 'Centroid removed' }).click();
    await expect(page.getByText(/Centroid removed/i)).toBeVisible();
  });

  // Unused tests

  // test('01 - Load KMeans frontend', async ({ page }) => {
  //   await page.goto('http://localhost:3000/');
  //   await expect(page.getByRole('heading', { name: 'K-Means Interactive Lab' })).toBeVisible();
  // });

  // test('08 - Initialize with Manhattan metric', async ({ page }) => {
  //   await page.goto('http://localhost:3000/');
  //   await page.getByRole('combobox').first().selectOption('grid');
  //   await page.locator('[id="slider::r2::track"]').click();
  //   await page.getByRole('combobox').nth(3).selectOption('Random');
  //   await page.getByRole('combobox').nth(4).selectOption('Manhattan');
  //   await page.getByRole('button', { name: 'Initialize' }).click();
  //   await expect(page.getByText(/Initialization Finished/i)).toBeVisible();
  // });

  // test('09 - Change metric to Euclidean', async ({ page }) => {
  //   await page.goto('http://localhost:3000/');
  //   await page.getByRole('combobox').first().selectOption('grid');
  //   await page.locator('[id="slider::r2::track"]').click();
  //   await page.getByRole('combobox').nth(3).selectOption('Random');
  //   await page.getByRole('combobox').nth(4).selectOption('Euclidean');
  //   await page.getByRole('button', { name: 'Initialize' }).click();
  //   await expect(page.getByText(/Initialization Finished/i)).toBeVisible();
  // });

  // test('10 - Max iterations 106', async ({ page }) => {
  //   await page.goto('http://localhost:3000/');
  //   await page.getByRole('combobox').first().selectOption('grid');
  //   await page.locator('[id="slider::r2::track"]').click();
  //   await page.getByRole('combobox').nth(3).selectOption('Random');
  //   await page.getByRole('spinbutton').fill('106');
  //   await page.getByRole('button', { name: 'Initialize' }).click();
  //   await expect(page.getByText(/Initialization Finished/i)).toBeVisible();
  // });

  // test('11 - Max iterations -1', async ({ page }) => {
  //   await page.goto('http://localhost:3000/');
  //   await page.getByRole('combobox').first().selectOption('grid');
  //   await page.locator('[id="slider::r2::track"]').click();
  //   await page.getByRole('combobox').nth(3).selectOption('Random');
  //   await page.getByRole('spinbutton').fill('-1');
  //   await page.getByRole('button', { name: 'Initialize' }).click();
  //   await expect(page.getByText(/Initialization Finished/i)).toBeVisible();
  // });

  // test('12 - Max iterations -100', async ({ page }) => {
  //   await page.goto('http://localhost:3000/');
  //   await page.getByRole('combobox').first().selectOption('grid');
  //   await page.locator('[id="slider::r2::track"]').click();
  //   await page.getByRole('combobox').nth(3).selectOption('Random');
  //   await page.getByRole('spinbutton').fill('-100');
  //   await page.getByRole('button', { name: 'Initialize' }).click();
  //   await expect(page.getByText(/Initialization Finished/i)).toBeVisible();
  // });

  // test('13 - Max iterations 0', async ({ page }) => {
  //   await page.goto('http://localhost:3000/');
  //   await page.getByRole('combobox').first().selectOption('grid');
  //   await page.locator('[id="slider::r2::track"]').click();
  //   await page.getByRole('combobox').nth(3).selectOption('Random');
  //   await page.getByRole('spinbutton').fill('0');
  //   await page.getByRole('button', { name: 'Initialize' }).click();
  //   await expect(page.getByText(/Initialization Finished/i)).toBeVisible();
  // });

  // test('14 - Max iterations blank', async ({ page }) => {
  //   await page.goto('http://localhost:3000/');
  //   await page.getByRole('combobox').first().selectOption('grid');
  //   await page.locator('[id="slider::r2::track"]').click();
  //   await page.getByRole('combobox').nth(3).selectOption('Random');
  //   await page.getByRole('spinbutton').fill('');
  //   await page.getByRole('button', { name: 'Initialize' }).click();
  //   await expect(page.getByText(/Initialization Finished/i)).toBeVisible();
  // });

  // test('15 - Reset clears graph', async ({ page }) => {
  //   await page.goto('http://localhost:3000/');
  //   await page.getByRole('combobox').first().selectOption('grid');
  //   await page.locator('[id="slider::r2::track"]').click();
  //   await page.getByRole('combobox').nth(3).selectOption('Random');
  //   await page.getByRole('button', { name: 'Reset' }).nth(1).click();
  //   await expect(page.getByRole('slider').first()).toBeVisible();
  // });

  // test('16 - Max 2 centroids enforced', async ({ page }) => {
  //   await page.goto('http://localhost:3000/');
  //   await page.getByRole('combobox').first().selectOption('grid');
  //   const slider = page.getByRole('slider').first();
  //   await slider.focus();
  //   await page.keyboard.press('Home');
  //   await page.keyboard.press('ArrowRight');
  //   await page.getByRole('combobox').nth(3).selectOption('Manual');
  //   await page.getByRole('button', { name: 'Initialize' }).click();
  //   const canvas = page.locator('canvas');
  //   await canvas.click({ position: { x: 200, y: 200 } });
  //   await canvas.click({ position: { x: 400, y: 400 } });
  //   await canvas.click({ position: { x: 450, y: 450 } });
  //   await expect(page.locator('div.chakra-toast__title').filter({ hasText: /Limit reached/i })).toBeVisible();
  // });

  // test('17 - Place cluster in same position', async ({ page }) => {
  //   await page.goto('http://localhost:3000/');
  //   await page.getByRole('combobox').first().selectOption('grid');
  //   await page.getByText('K-means parametersClusters (k').click();
  //   await page.getByRole('combobox').nth(3).selectOption('Manual');
  //   await page.locator('canvas').click({ position: { x: 266, y: 311 } });
  //   await page.locator('canvas').click({ position: { x: 266, y: 311 } });
  //   await page.locator('canvas').click({ position: { x: 262, y: 310 } });
  // });

  // test('18 - Place cluster at 0,0', async ({ page }) => {
  //   await page.goto('http://localhost:3000/');
  //   await page.getByRole('combobox').first().selectOption('grid');
  //   await page.locator('[id="slider::r2::track"]').click();
  //   await page.getByRole('combobox').nth(3).selectOption('Manual');
  //   await page.locator('canvas').click({ position: { x: 0, y: 0 } });
  // });

  // test('19 - Run algorithm', async ({ page }) => {
  //   await page.goto('http://localhost:3000/');
  //   await page.getByRole('combobox').first().selectOption('grid');
  //   await page.locator('[id="slider::r2::control"]').click();
  //   await page.getByRole('combobox').nth(3).selectOption('Random');
  //   await page.getByRole('button', { name: 'Re-Initialize' }).click();
  //   await page.getByRole('button', { name: 'Play' }).click();
  //   await expect(page.locator('div.chakra-toast__title').filter({ hasText: /Algorithm Converged!/i }).first()).toBeVisible();
  // });

  // test('20 - Re-Initialize button', async ({ page }) => {
  //   await page.goto('http://localhost:3000/');
  //   await page.waitForLoadState('networkidle');
  //   await page.getByRole('combobox').first().selectOption('grid');
  //   await page.getByRole('slider').first().press('Home');
  //   await page.getByRole('slider').first().press('ArrowRight');
  //   await page.getByRole('combobox').nth(3).selectOption('Manual');
  //   page.on('dialog', dialog => {
  //     console.log(`Dialog message: ${dialog.message()}`);
  //     dialog.dismiss().catch(() => {});
  //   });
  //   await page.getByRole('button', { name: 'Initialize' }).click();
  //   await page.getByRole('combobox').nth(3).selectOption('KMeansPlusPlus');
  //   await page.getByRole('button', { name: 'Re-Initialize' }).click();
  //   await expect(page.getByText(/Initialization Finished/i)).toBeVisible();
  // });

  // test('21 - Reset keeps metric', async ({ page }) => {
  //   await page.goto('http://localhost:3000/');
  //   await page.getByRole('combobox').first().selectOption('grid');
  //   await page.locator('[id="slider::r2::track"]').click();
  //   await page.getByRole('combobox').nth(3).selectOption('Random');
  //   await page.getByRole('combobox').nth(4).selectOption('Manhattan');
  //   await page.getByRole('button', { name: 'Reset' }).nth(1).click();
  // });

  // test('22 - Reset keeps max iterations', async ({ page }) => {
  //   await page.goto('http://localhost:3000/');
  //   await page.getByRole('combobox').first().selectOption('grid');
  //   await page.locator('[id="slider::r2::track"]').click();
  //   await page.getByRole('combobox').nth(3).selectOption('Random');
  //   await page.getByRole('spinbutton').fill('10');
  //   await page.getByRole('button', { name: 'Reset' }).nth(1).click();
  // });

  // test('23 - Algorithm finished messages', async ({ page }) => {
  //   await page.goto('http://localhost:3000/');
  //   await page.getByRole('combobox').first().selectOption('grid');
  //   await page.locator('[id="slider::r2::track"]').click();
  //   await page.getByRole('combobox').nth(3).selectOption('Random');
  //   await page.getByRole('button', { name: 'Initialize' }).click();
  //   await page.getByRole('status', { name: 'Initialization Finished.' }).click();
  // });

  // test('24 - Switch data distribution to Grupped', async ({ page }) => {
  //   await page.goto('http://localhost:3000/');
  //   await page.getByRole('combobox').first().selectOption('Grupped');
  //   await page.locator('[id="slider::r2::track"]').click();
  //   await page.getByRole('combobox').nth(3).selectOption('Random');
  //   await page.getByRole('button', { name: 'Re-Initialize' }).click();
  //   await expect(page.getByText(/Initialization Finished/i)).toBeVisible();
  // });

  // test('25 - Switch data distribution to Scattered', async ({ page }) => {
  //   await page.goto('http://localhost:3000/');
  //   await page.getByRole('combobox').first().selectOption('Scattered');
  //   await page.locator('[id="slider::r2::track"]').click();
  //   await page.getByRole('combobox').nth(3).selectOption('Random');
  //   await page.getByRole('button', { name: 'Re-Initialize' }).click();
  //   await expect(page.getByText(/Initialization Finished/i)).toBeVisible();
  // });

  // test('26 - Check if Start and Stop buttons work', async ({ page }) => {
  //   await page.goto('http://localhost:3000/');
  //   await page.getByRole('combobox').first().selectOption('grid');
  //   await page.locator('[id="slider::r2::track"]').click();
  //   await page.getByRole('combobox').nth(3).selectOption('KMeansPlusPlus');
  //   await page.getByRole('combobox').nth(4).selectOption('Manhattan');
  //   await page.getByRole('button', { name: 'Re-Initialize' }).click();
  //   await page.getByRole('button', { name: 'Play' }).click();
  //   await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
  //   await page.getByRole('button', { name: 'Stop' }).click();
  //   await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
  // });
});
