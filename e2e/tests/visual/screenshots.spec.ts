import { test, expect } from "@playwright/test";
import { ArcadeShellPage, GameId } from "../../page-objects/arcade-shell.page";

/**
 * Visual regression tests for the Retro Arcade
 *
 * These tests capture baseline screenshots and compare against them.
 * Run with --update-snapshots to regenerate baselines.
 */

test.describe("Visual Regression Tests", () => {
  test.describe("Main Menu", () => {
    test("main menu should match baseline", async ({ page }) => {
      const arcade = new ArcadeShellPage(page);
      await arcade.goto();

      // Wait for menu to fully render
      await page.waitForTimeout(500);

      await expect(page.locator("#game-canvas")).toHaveScreenshot(
        "main-menu.png",
        {
          maxDiffPixelRatio: 0.05, // Allow 5% difference for CRT effects
        },
      );
    });

    test("menu navigation highlight should work", async ({ page }) => {
      const arcade = new ArcadeShellPage(page);
      await arcade.goto();

      // Navigate to second game
      await arcade.keyboard.menuRight();
      await page.waitForTimeout(300);

      await expect(page.locator("#game-canvas")).toHaveScreenshot(
        "menu-selection-pong.png",
        {
          maxDiffPixelRatio: 0.05,
        },
      );
    });
  });

  test.describe("Game Initial States", () => {
    const games: Array<{ id: GameId; name: string }> = [
      { id: "snake", name: "Snake" },
      { id: "pong", name: "Pong" },
      { id: "breakout", name: "Breakout" },
      { id: "flappy", name: "Flappy" },
      { id: "space-invaders", name: "Space Invaders" },
      { id: "frogger", name: "Frogger" },
      { id: "tetris", name: "Tetris" },
      { id: "asteroids", name: "Asteroids" },
      { id: "pacman", name: "Pac-Man" },
      { id: "roguelike", name: "Roguelike" },
    ];

    for (const { id, name } of games) {
      test(`${name} initial state should match baseline`, async ({ page }) => {
        const arcade = new ArcadeShellPage(page);

        // Use a seed for deterministic rendering
        await arcade.goto({ seed: 12345 });
        await arcade.launchGame(id);

        // Wait for game to fully render
        await page.waitForTimeout(500);

        // Pause the game to get a stable screenshot
        await arcade.pauseGame();

        await expect(page.locator("#game-canvas")).toHaveScreenshot(
          `game-${id}-initial.png`,
          {
            maxDiffPixelRatio: 0.1, // Higher tolerance for games with animation
          },
        );
      });
    }
  });

  test.describe("Pause Menu", () => {
    test("pause menu should match baseline", async ({ page }) => {
      const arcade = new ArcadeShellPage(page);
      await arcade.goto({ seed: 12345 });
      await arcade.launchGame("snake");

      // Pause the game
      await arcade.pauseGame();
      await page.waitForTimeout(300);

      await expect(page.locator("#game-canvas")).toHaveScreenshot(
        "pause-menu.png",
        {
          maxDiffPixelRatio: 0.05,
        },
      );
    });

    test("pause menu navigation should work", async ({ page }) => {
      const arcade = new ArcadeShellPage(page);
      await arcade.goto({ seed: 12345 });
      await arcade.launchGame("snake");
      await arcade.pauseGame();

      // Navigate down to "Restart"
      await arcade.keyboard.menuDown();
      await page.waitForTimeout(200);

      await expect(page.locator("#game-canvas")).toHaveScreenshot(
        "pause-menu-restart-selected.png",
        {
          maxDiffPixelRatio: 0.05,
        },
      );
    });
  });
});

test.describe("Game Color Validation", () => {
  test("Snake should use correct colors", async ({ page }) => {
    const arcade = new ArcadeShellPage(page);
    await arcade.goto({ seed: 12345 });
    await arcade.launchGame("snake");

    await page.waitForTimeout(300);

    // Check for snake head color (bright green)
    const hasSnakeHead = await arcade.canvasInspector.hasColorInRegion(
      "#39ff14",
      0,
      0,
      800,
      600,
    );
    expect(hasSnakeHead).toBe(true);

    // Check for food color (pink/red)
    const hasFood = await arcade.canvasInspector.hasColorInRegion(
      "#ff2a6d",
      0,
      0,
      800,
      600,
    );
    expect(hasFood).toBe(true);
  });

  test("Menu should use cyan theme color", async ({ page }) => {
    const arcade = new ArcadeShellPage(page);
    await arcade.goto();

    await page.waitForTimeout(300);

    // Check for cyan color used in menu (title color)
    const hasCyan = await arcade.canvasInspector.hasColorInRegion(
      "#05d9e8",
      0,
      0,
      800,
      600,
    );
    expect(hasCyan).toBe(true);
  });
});
