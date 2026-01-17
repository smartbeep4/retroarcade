import { test, expect } from "@playwright/test";
import { PacmanPage } from "../../../page-objects/games/pacman.page";

test.describe("Pac-Man Functional Tests", () => {
  let pacman: PacmanPage;

  test.beforeEach(async ({ page }) => {
    pacman = new PacmanPage(page);
    await pacman.launch();
  });

  test.describe("Initial State", () => {
    test("should have Pac-Man at starting position", async () => {
      const pos = await pacman.getPacmanPosition();
      expect(pos).not.toBeNull();
    });

    test("should have dots to eat", async () => {
      const dots = await pacman.getDotsRemaining();
      expect(dots).toBeGreaterThan(0);
    });

    test("should not be powered up initially", async () => {
      const powered = await pacman.isPoweredUp();
      expect(powered).toBe(false);
    });

    test("should start with score 0", async () => {
      const score = await pacman.getScore();
      expect(score).toBe(0);
    });
  });

  test.describe("Movement", () => {
    test("should move up", async () => {
      await pacman.moveUp();
      await pacman.waitFrames(10);

      const isRunning = await pacman.isRunning();
      expect(isRunning).toBe(true);
    });

    test("should move down", async () => {
      await pacman.moveDown();
      await pacman.waitFrames(10);

      const isRunning = await pacman.isRunning();
      expect(isRunning).toBe(true);
    });

    test("should move left", async () => {
      await pacman.moveLeft();
      await pacman.waitFrames(10);

      const isRunning = await pacman.isRunning();
      expect(isRunning).toBe(true);
    });

    test("should move right", async () => {
      await pacman.moveRight();
      await pacman.waitFrames(10);

      const isRunning = await pacman.isRunning();
      expect(isRunning).toBe(true);
    });
  });

  test.describe("Ghost AI", () => {
    test("should have ghosts in the game", async () => {
      const ghosts = await pacman.getGhostPositions();
      expect(ghosts.length).toBeGreaterThan(0);
    });

    test("ghosts should be in scatter mode initially", async () => {
      const mode = await pacman.getGhostMode();
      expect(mode).toBe("scatter");
    });
  });

  test.describe("Game Controls", () => {
    test("should pause and resume", async () => {
      await pacman.pause();
      expect(await pacman.isPaused()).toBe(true);

      await pacman.resume();
      expect(await pacman.isRunning()).toBe(true);
    });
  });
});
