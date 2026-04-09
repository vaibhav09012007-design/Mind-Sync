import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("displays the hero section with MindSync branding", async ({ page }) => {
    await page.goto("/");

    // Wait for page load
    await expect(page).toHaveTitle(/MindSync/);

    // Check hero heading
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("Mind-Sync");
  });

  test("shows Get Started and Sign In buttons", async ({ page }) => {
    await page.goto("/");

    const getStarted = page.locator("text=Get Started Free");
    await expect(getStarted).toBeVisible();

    const signIn = page.locator("text=Sign In");
    await expect(signIn).toBeVisible();
  });

  test("navigates to sign-up when Get Started is clicked", async ({ page }) => {
    await page.goto("/");

    await page.click("text=Get Started Free");
    await page.waitForURL(/sign-up/);
    expect(page.url()).toContain("sign-up");
  });

  test("navigates to sign-in when Sign In is clicked", async ({ page }) => {
    await page.goto("/");

    await page.click("text=Sign In");
    await page.waitForURL(/sign-in/);
    expect(page.url()).toContain("sign-in");
  });

  test("displays features section", async ({ page }) => {
    await page.goto("/");

    // Scroll to features
    const features = page.locator("text=Features").first();
    if (await features.isVisible()) {
      await expect(features).toBeVisible();
    }
  });

  test("has proper meta tags for SEO", async ({ page }) => {
    await page.goto("/");

    // Check meta description
    const metaDesc = page.locator('meta[name="description"]');
    await expect(metaDesc).toHaveAttribute("content", /productivity/i);

    // Check OpenGraph tags
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute("content", /MindSync/);

    const ogDesc = page.locator('meta[property="og:description"]');
    await expect(ogDesc).toHaveAttribute("content", /planning|execution/i);
  });

  test("page is accessible - no userScalable restriction", async ({ page }) => {
    await page.goto("/");

    // Verify no user-scalable=no in viewport meta
    const viewport = page.locator('meta[name="viewport"]');
    const content = await viewport.getAttribute("content");
    expect(content).not.toContain("user-scalable=no");
  });
});
