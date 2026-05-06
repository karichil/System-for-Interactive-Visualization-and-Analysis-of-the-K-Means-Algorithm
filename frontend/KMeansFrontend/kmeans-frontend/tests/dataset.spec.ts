import { expect, Page, test } from "@playwright/test";
import * as path from "path";

const APP_URL = "http://localhost:3000";

const uploadedFileResult = {
  headers: ["x", "y", "group"],
  processedData: [
    [1, 2, 0],
    [3, 4, 1],
    [5, 6, 1],
  ],
};

const createdDataset = {
  points: [
    { x: 1, y: 2, clusterId: -1 },
    { x: 3, y: 4, clusterId: -1 },
    { x: 5, y: 6, clusterId: -1 },
  ],
};

async function mockDatasetApi(page: Page) {
  await page.route("**/api/**", async (route) => {
    const request = route.request();

    if (request.method() === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: corsHeaders(),
      });
      return;
    }

    const url = request.url();

    if (url.includes("/api/FileManager/upload")) {
      await route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        json: uploadedFileResult,
      });
      return;
    }

    if (url.includes("/api/FileManager/load")) {
      await route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        json: uploadedFileResult,
      });
      return;
    }

    if (url.includes("/api/DataSet/create")) {
      await route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        json: createdDataset,
      });
      return;
    }

    if (url.includes("/api/DataSet/reset-data")) {
      await route.fulfill({
        status: 204,
        headers: corsHeaders(),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      headers: jsonHeaders(),
      json: {},
    });
  });
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
    "access-control-allow-headers": "*",
  };
}

function jsonHeaders() {
  return {
    ...corsHeaders(),
    "content-type": "application/json",
  };
}

async function gotoApp(page: Page) {
  await mockDatasetApi(page);
  await page.goto(APP_URL, { waitUntil: "domcontentloaded" });
}

async function uploadDataset(page: Page, fileName = "random_points.csv") {
  const filePath = path.resolve(__dirname, "data", fileName);

  await page.locator('input[type="file"]').setInputFiles(filePath);

  await expect(page.getByText("X-Axis")).toBeVisible();
  await expect(page.getByText("Y-Axis")).toBeVisible();
  await expect(page.getByRole("button", { name: "Points" })).toBeEnabled();
}

test.describe("Dataset section", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  test("shows the dataset controls", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Data", exact: true })).toBeVisible();
    await expect(page.getByText(/drag & drop csv file/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Example data" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset" }).first()).toBeVisible();
  });

  test("uploads a CSV file and creates a dataset", async ({ page }) => {
    const createRequest = page.waitForRequest("**/api/DataSet/create");

    await uploadDataset(page);

    const request = await createRequest;
    expect(request.method()).toBe("POST");
    expect(request.postDataJSON()).toEqual({
      data: uploadedFileResult.processedData,
      x: 0,
      y: 1,
    });
  });

  test("loads example data from the selector", async ({ page }) => {
    const loadRequest = page.waitForRequest("**/api/FileManager/load?path=ExampleData/grid.csv");

    await page.getByRole("combobox").first().selectOption("grid");

    await expect(page.getByText("Grid Dataset")).toBeVisible();
    await expect(page.getByText(/grid pattern/i)).toBeVisible();
    await expect(loadRequest).resolves.toBeTruthy();
  });

  test("enables axis selectors for uploaded own data", async ({ page }) => {
    await uploadDataset(page);

    const selects = page.getByRole("combobox");
    await expect(selects.nth(1)).toBeEnabled();
    await expect(selects.nth(2)).toBeEnabled();
  });

  test("resets a loaded dataset", async ({ page }) => {
    const resetRequest = page.waitForRequest("**/api/DataSet/reset-data");

    await uploadDataset(page);
    await page.getByRole("button", { name: "Reset" }).first().click();

    expect((await resetRequest).method()).toBe("DELETE");
    await expect(page.getByRole("heading", { name: "Data", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Points" })).toBeDisabled();
  });
});
