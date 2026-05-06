import { expect, Page, test } from "@playwright/test";
import * as path from "path";

const APP_URL = "http://localhost:3000";

const fileResult = {
  headers: ["x", "y"],
  processedData: [
    [1, 2],
    [3, 4],
  ],
};

const dataset = {
  points: [
    { x: 1, y: 2, clusterId: -1 },
    { x: 3, y: 4, clusterId: -1 },
  ],
};

async function mockApi(page: Page) {
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
        json: fileResult,
      });
      return;
    }

    if (url.includes("/api/DataSet/create")) {
      await route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        json: dataset,
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

async function uploadDataset(page: Page) {
  const filePath = path.resolve(__dirname, "data", "random_points.csv");

  await page.locator('input[type="file"]').setInputFiles(filePath);
  await expect(page.getByRole("button", { name: "Points" })).toBeEnabled();
}

test.describe("Manual editing", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.goto(APP_URL, { waitUntil: "domcontentloaded" });
  });

  test("shows editing controls and instructions", async ({ page }) => {
    await expect(page.getByText("Manual editing")).toBeVisible();
    await expect(page.getByRole("button", { name: "Points" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Centroids" })).toBeVisible();
    await expect(page.getByText("Click to add")).toBeVisible();
    await expect(page.getByText("Drag to move")).toBeVisible();
    await expect(page.getByText("Right click to delete")).toBeVisible();
  });

  test("disables point editing before a dataset is loaded", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Points" })).toBeDisabled();
  });

  test("enables point editing after loading a dataset", async ({ page }) => {
    await uploadDataset(page);

    await expect(page.getByRole("button", { name: "Points" })).toBeEnabled();
  });

  test("keeps editing panel available while switching modes", async ({ page }) => {
    await uploadDataset(page);

    await page.getByRole("button", { name: "Points" }).click();
    await page.getByRole("button", { name: "Centroids" }).click();

    await expect(page.getByText("Manual editing")).toBeVisible();
    await expect(page.getByRole("button", { name: "Points" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Centroids" })).toBeEnabled();
  });

  test("sends dataset creation request before enabling manual point editing", async ({ page }) => {
    const createRequest = page.waitForRequest("**/api/DataSet/create");

    await uploadDataset(page);

    expect((await createRequest).postDataJSON()).toEqual({
      data: fileResult.processedData,
      x: 0,
      y: 1,
    });
  });
});
