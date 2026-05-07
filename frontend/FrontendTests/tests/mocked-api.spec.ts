import { expect, test, type Page } from "@playwright/test";

type UpdateAxesPayload = {
  data: number[][];
  x: number;
  y: number;
};

const basePoints = [
  { x: 1, y: 2, clusterId: -1 },
  { x: 3, y: 4, clusterId: -1 },
  { x: 5, y: 6, clusterId: -1 }
];

async function mockDatasetRoutes(page: Page) {
  await page.route("**/api/FileManager/upload", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        headers: ["featureA", "featureB", "featureC"],
        processedData: [
          [1, 2, 100],
          [3, 4, 200],
          [5, 6, 300]
        ]
      })
    });
  });

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
      body: JSON.stringify({ points: basePoints })
    });
  });
}

async function prepareInitializedAlgorithm(page: Page) {
  const dataPanel = page.locator(".App-group-box").filter({ has: page.getByText("Example data") }).first();
  const paramsPanel = page.locator(".App-group-box").filter({ has: page.getByText("K-means parameters") }).first();

  await dataPanel.locator("select").first().selectOption("scattered");
  await paramsPanel.locator("select").first().selectOption("Random");
  await paramsPanel.getByRole("button", { name: /Initialize/ }).click();
}

test("Zmiana osi po uploadzie wysyla poprawny payload do update-axes", async ({ page }) => {
  let updateAxesPayload: UpdateAxesPayload | null = null;

  await mockDatasetRoutes(page);
  await page.route("**/api/DataSet/update-axes", async (route) => {
    updateAxesPayload = route.request().postDataJSON() as UpdateAxesPayload;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ points: basePoints })
    });
  });

  await page.goto("/");

  const dataPanel = page.locator(".App-group-box").filter({ has: page.getByText("Example data") }).first();
  await dataPanel.locator('input[type="file"]').setInputFiles({
    name: "sample.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("featureA,featureB,featureC\n1,2,100\n3,4,200\n5,6,300\n")
  });

  await dataPanel.locator("select").nth(1).selectOption("2");

  await expect.poll(() => updateAxesPayload?.x).toBe(2);
  await expect.poll(() => updateAxesPayload?.y).toBe(1);
  await expect.poll(() => updateAxesPayload?.data?.length).toBe(3);
});

test("Play uruchamia auto-run i wysyla run-intime z domyslna predkoscia", async ({ page }) => {
  let runIntimeUrl = "";

  await mockDatasetRoutes(page);
  await page.route("**/api/CentroidManager/init?mode=Random&k=*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{ x: 2, y: 3, clusterId: 0 }])
    });
  });
  await page.route("**/api/KMeansAlgoritm/initialize", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{ x: 2, y: 3, clusterId: 0 }])
    });
  });
  await page.route("**/api/KMeansAlgoritm/run-intime?**", async (route) => {
    runIntimeUrl = route.request().url();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: ""
    });
  });

  await page.goto("/");
  await prepareInitializedAlgorithm(page);

  const algoPanel = page.locator(".App-group-box").filter({ has: page.getByText("Algorithm Control") }).first();
  const playButton = algoPanel.getByRole("button", { name: /^Play$/ });
  const stopButton = algoPanel.getByRole("button", { name: "Stop" });

  await playButton.click();

  await expect.poll(() => runIntimeUrl).toContain("run-intime?maxIterations=100&speed=1");
  await expect(algoPanel.getByRole("button", { name: /Running.../ })).toBeVisible();
  await expect(stopButton).toBeEnabled();
});

test("Stop wysyla pause i przywraca stan kontrolki do Play", async ({ page }) => {
  let pauseCalls = 0;

  await mockDatasetRoutes(page);
  await page.route("**/api/CentroidManager/init?mode=Random&k=*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{ x: 2, y: 3, clusterId: 0 }])
    });
  });
  await page.route("**/api/KMeansAlgoritm/initialize", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{ x: 2, y: 3, clusterId: 0 }])
    });
  });
  await page.route("**/api/KMeansAlgoritm/run-intime?**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: ""
    });
  });
  await page.route("**/api/KMeansAlgoritm/pause", async (route) => {
    pauseCalls += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: ""
    });
  });

  await page.goto("/");
  await prepareInitializedAlgorithm(page);

  const algoPanel = page.locator(".App-group-box").filter({ has: page.getByText("Algorithm Control") }).first();
  await algoPanel.getByRole("button", { name: /^Play$/ }).click();
  await algoPanel.getByRole("button", { name: "Stop" }).click();

  await expect.poll(() => pauseCalls).toBe(1);
  await expect(algoPanel.getByRole("button", { name: /^Play$/ })).toBeVisible();
  await expect(algoPanel.getByRole("button", { name: "Stop" })).toBeDisabled();
});
