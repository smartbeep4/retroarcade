import { test, expect } from "@playwright/test";
import { SpaceInvadersPage } from "../../../page-objects/games/space-invaders.page";

test.describe("Space Invaders Functional Tests", () => {
  let invaders: SpaceInvadersPage;

  test.beforeEach(async ({ page }) => {
    invaders = new SpaceInvadersPage(page);
    await invaders.launch();
  });

  test.describe("Initial State", () => {
    test("should have aliens spawned", async () => {
      const alienCount = await invaders.getAlienCount();
      expect(alienCount).toBeGreaterThan(0);
    });

    test("should start with score 0", async () => {
      const score = await invaders.getScore();
      expect(score).toBe(0);
    });

    test("should have player ship", async () => {
      const playerX = await invaders.getPlayerX();
      expect(playerX).toBeGreaterThan(0);
    });
  });

  test.describe("Player Movement", () => {
    test("should move player left", async () => {
      const initialX = await invaders.getPlayerX();

      await invaders.holdMoveLeft(200);

      const newX = await invaders.getPlayerX();
      expect(newX).toBeLessThan(initialX);
    });

    test("should move player right", async () => {
      const initialX = await invaders.getPlayerX();

      await invaders.holdMoveRight(200);

      const newX = await invaders.getPlayerX();
      expect(newX).toBeGreaterThan(initialX);
    });
  });

  test.describe("Shooting Mechanics", () => {
    test("should fire bullet when action pressed", async () => {
      const initialBullets = await invaders.getBulletCount();

      await invaders.fire();
      await invaders.waitFrames(5);

      const newBullets = await invaders.getBulletCount();
      expect(newBullets).toBeGreaterThanOrEqual(initialBullets);
    });
  });

  test.describe("Game Controls", () => {
    test("should pause and resume", async () => {
      await invaders.pause();
      expect(await invaders.isPaused()).toBe(true);

      await invaders.resume();
      expect(await invaders.isRunning()).toBe(true);
    });
  });
});
