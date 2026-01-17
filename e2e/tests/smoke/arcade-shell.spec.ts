import { test, expect } from "@playwright/test";
import { ArcadeShellPage } from "../../page-objects/arcade-shell.page";

test.describe("Arcade Shell Smoke Tests", () => {
  let arcade: ArcadeShellPage;

  test.beforeEach(async ({ page }) => {
    arcade = new ArcadeShellPage(page);
  });

  test("should load the arcade without errors", async ({ page }) => {
    // Navigate to the arcade with test mode
    await arcade.goto();

    // Verify no console errors
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    // Verify arcade is initialized
    const state = await arcade.getState();
    expect(state).toBe("menu");

    // Verify canvas is visible and rendering
    await expect(arcade.canvas).toBeVisible();
    const isRendering = await arcade.isRendering();
    expect(isRendering).toBe(true);

    // Check for no errors (allow some time for any async errors)
    await page.waitForTimeout(500);
    expect(errors.filter((e) => !e.includes("favicon"))).toHaveLength(0);
  });

  test("should display the main menu with game tiles", async () => {
    await arcade.goto();

    // Take a screenshot of the menu
    const screenshot = await arcade.screenshot();
    expect(screenshot).toBeTruthy();

    // Verify we can navigate the menu
    await arcade.keyboard.menuRight();
    // Wait for game loop to process input (at least 2 frames at 60fps)
    await arcade.page.waitForTimeout(200);

    const menuIndex = await arcade.stateBridge.getMenuSelectedIndex();
    expect(menuIndex).toBe(1);
  });

  test("should navigate menu with keyboard", async () => {
    await arcade.goto();

    // Navigate right (columns = 4)
    for (let i = 0; i < 3; i++) {
      await arcade.keyboard.menuRight();
      await arcade.page.waitForTimeout(200);
    }

    let menuIndex = await arcade.stateBridge.getMenuSelectedIndex();
    expect(menuIndex).toBe(3);

    // Navigate down (to second row)
    await arcade.keyboard.menuDown();
    await arcade.page.waitForTimeout(200);

    menuIndex = await arcade.stateBridge.getMenuSelectedIndex();
    expect(menuIndex).toBe(7); // 3 + 4 = 7 (second row, last column)

    // Navigate left
    await arcade.keyboard.menuLeft();
    await arcade.page.waitForTimeout(200);

    menuIndex = await arcade.stateBridge.getMenuSelectedIndex();
    expect(menuIndex).toBe(6);
  });
});
