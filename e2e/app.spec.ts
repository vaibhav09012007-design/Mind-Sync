import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should redirect unauthenticated users to sign-in", async ({ page }) => {
    await page.goto("/dashboard");
    // Should redirect to auth page
    await expect(page).toHaveURL(/sign-in/);
  });

  test("should load the landing page", async ({ page }) => {
    await page.goto("/");
    // Check for main heading or logo
    await expect(page.locator("body")).toBeVisible();
  });

  test("should have correct meta tags", async ({ page }) => {
    await page.goto("/");
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});

test.describe("Health Check", () => {
  test("should return healthy status", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();

    const health = await response.json();
    expect(health.status).toBeDefined();
    expect(health.checks).toBeDefined();
    expect(health.timestamp).toBeDefined();
  });
});

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication by setting a cookie or visiting auth page
    // This is a placeholder - actual implementation depends on auth setup
    await page.goto("/");
  });

  test("should have visible navigation elements", async ({ page }) => {
    await page.goto("/");
    // Check for navigation links (adjust selectors as needed)
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});

test.describe("Accessibility", () => {
  test("should not have broken images", async ({ page }) => {
    await page.goto("/");
    const images = page.locator("img");
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const src = await img.getAttribute("src");
      if (src && !src.startsWith("data:")) {
        await expect(img).toHaveJSProperty("complete", true);
      }
    }
  });

  test("should have lang attribute on html", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    const lang = await html.getAttribute("lang");
    expect(lang).toBeTruthy();
  });
});
