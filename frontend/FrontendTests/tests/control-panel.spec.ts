import { expect, test, type Page } from "@playwright/test";

type InitPayload = {
  DataSet: { Points: Array<{ X: number; Y: number; ClusterId: number }> };
  CentroidManager: { Centroids: Array<{ X: number; Y: number; ClusterId: number }> };
  MaxIterations: number;
  MetricName: string;
};

const datasetPoints = [
  { x: 1, y: 2, clusterId: -1 },
  { x: 3, y: 4, clusterId: -1 },
  { x: 5, y: 6, clusterId: -1 }
];

async function mockBaseRoutes(page: Page, includeRandomInitRoute = true) {
  await page.route("**/api/FileManager/load?path=ExampleData/scattered.csv", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        headers: ["f1", "f2", "f3"],
        processedData: [
          [1, 2, 10],
          [3, 4, 20],
          [5, 6, 30]
        ]
      })
    });
  });

  await page.route("**/api/DataSet/create", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ points: datasetPoints })
    });
  });

  if (includeRandomInitRoute) {
    await page.route("**/api/CentroidManager/init?mode=Random&k=*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([{ x: 2, y: 3, clusterId: 0 }])
      });
    });
  }
}

async function loadExampleAndPrepareRandomInit(page: Page) {
  const dataPanel = page.locator(".App-group-box").filter({ has: page.getByText("Example data") }).first();
  const paramsPanel = page.locator(".App-group-box").filter({ has: page.getByText("K-means parameters") }).first();

  await dataPanel.locator("select").first().selectOption("scattered");
  await paramsPanel.locator("select").first().selectOption("Random");
}

async function openApp(page: Page, includeRandomInitRoute = true) {
  await mockBaseRoutes(page, includeRandomInitRoute);
  await page.goto("/");
}

test("Reset w panelu K-means przywraca domyslne wartosci", async ({ page }) => {
  let randomInitCalls = 0;
  await page.route("**/api/CentroidManager/init?mode=Random&k=*", async (route) => {
    randomInitCalls += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{ x: 2, y: 3, clusterId: 0 }])
    });
  });
  await openApp(page, false);

  const paramsPanel = page.locator(".App-group-box").filter({ has: page.getByText("K-means parameters") }).first();

  await loadExampleAndPrepareRandomInit(page);
  await expect.poll(() => randomInitCalls).toBe(1);
  await expect(paramsPanel.getByRole("button", { name: /Re-Initialize/ })).toBeVisible();
  await paramsPanel.getByRole("button", { name: "Reset" }).click();
  await expect(paramsPanel.getByRole("button", { name: /^Initialize$/ })).toBeVisible();
  await paramsPanel.locator("select").first().selectOption("Random");
  await expect.poll(() => randomInitCalls).toBe(2);
  await expect(paramsPanel.getByRole("button", { name: /Re-Initialize/ })).toBeVisible();
});

test("Initialize wysyla wybrane MetricName i MaxIterations", async ({ page }) => {
  await openApp(page);
  const paramsPanel = page.locator(".App-group-box").filter({ has: page.getByText("K-means parameters") }).first();
  let capturedPayload: InitPayload | null = null;

  await page.route("**/api/KMeansAlgoritm/initialize", async (route) => {
    capturedPayload = route.request().postDataJSON() as InitPayload;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{ x: 2, y: 3, clusterId: 0 }])
    });
  });

  await loadExampleAndPrepareRandomInit(page);
  await paramsPanel.locator("select").nth(1).selectOption("Manhattan");
  await paramsPanel.locator('input[type="number"]').fill("12");
  await paramsPanel.getByRole("button", { name: /Initialize/ }).click();

  await expect.poll(() => capturedPayload?.MetricName).toBe("Manhattan");
  await expect.poll(() => capturedPayload?.MaxIterations).toBe(12);
  await expect(page.getByText("Initialization Finished.")).toBeVisible();
});

test("Po Finish result blokuje Play/Finish i wylacza edycje Points", async ({ page }) => {
  await openApp(page);
  const paramsPanel = page.locator(".App-group-box").filter({ has: page.getByText("K-means parameters") }).first();
  const algoPanel = page.locator(".App-group-box").filter({ has: page.getByText("Algorithm Control") }).first();
  const manualPanel = page.locator(".App-group-box").filter({ has: page.getByText("Manual editing") }).first();

  await page.route("**/api/KMeansAlgoritm/initialize", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{ x: 2, y: 3, clusterId: 0 }])
    });
  });

  await page.route("**/api/KMeansAlgoritm/finish-result", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        centroids: [{ x: 2.2, y: 3.3, clusterId: 0 }],
        points: [
          { x: 1, y: 2, clusterId: 0 },
          { x: 3, y: 4, clusterId: 0 },
          { x: 5, y: 6, clusterId: 0 }
        ],
        iteration: 4,
        isFinished: true
      })
    });
  });

  await loadExampleAndPrepareRandomInit(page);
  await paramsPanel.getByRole("button", { name: /^Initialize$/ }).click();

  const playButton = algoPanel.getByRole("button", { name: /^Play$/ });
  const stopButton = algoPanel.getByRole("button", { name: "Stop" });
  const finishButton = algoPanel.getByRole("button", { name: /Finish result/ });
  const resetButton = algoPanel.getByRole("button", { name: "Reset" });

  await expect(playButton).toBeEnabled();
  await expect(stopButton).toBeDisabled();
  await expect(finishButton).toBeEnabled();

  await finishButton.click();

  await expect(algoPanel.getByText("Iteration: 4")).toBeVisible();
  await expect(playButton).toBeDisabled();
  await expect(finishButton).toBeDisabled();
  await expect(resetButton).toBeEnabled();
  await expect(manualPanel.getByRole("button", { name: "Points" })).toBeDisabled();
  await expect(manualPanel.getByRole("button", { name: "Centroids" })).toBeEnabled();
});
