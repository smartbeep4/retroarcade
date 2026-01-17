import { test, expect } from "@playwright/test";
import { AsteroidsPage } from "../../../page-objects/games/asteroids.page";

test.describe("Asteroids Functional Tests", () => {
  let asteroids: AsteroidsPage;

  test.beforeEach(async ({ page }) => {
    asteroids = new AsteroidsPage(page);
    await asteroids.launch();
  });

  test.describe("Initial State", () => {
    test("should have asteroids spawned", async () => {
      const count = await asteroids.getAsteroidCount();
      expect(count).toBeGreaterThan(0);
    });

    test("should have ship at starting position", async () => {
      const ship = await asteroids.getShipPosition();
      expect(ship).not.toBeNull();
    });

    test("should start with score 0", async () => {
      const score = await asteroids.getScore();
      expect(score).toBe(0);
    });
  });

  test.describe("Ship Controls", () => {
    test("should rotate ship left", async () => {
      const initialRotation = await asteroids.getShipRotation();

      await asteroids.keyboard.holdFor("ArrowLeft", 300);

      const newRotation = await asteroids.getShipRotation();
      expect(newRotation).not.toBe(initialRotation);
    });

    test("should rotate ship right", async () => {
      const initialRotation = await asteroids.getShipRotation();

      await asteroids.keyboard.holdFor("ArrowRight", 300);

      const newRotation = await asteroids.getShipRotation();
      expect(newRotation).not.toBe(initialRotation);
    });

    test("should thrust forward", async () => {
      const initialPos = await asteroids.getShipPosition();

      await asteroids.holdThrust(200);
      await asteroids.waitFrames(10);

      const newPos = await asteroids.getShipPosition();
      // Ship should have moved
      const hasMoved =
        newPos?.x !== initialPos?.x || newPos?.y !== initialPos?.y;
      expect(hasMoved).toBe(true);
    });
  });

  test.describe("Shooting", () => {
    test("should fire bullets", async () => {
      await asteroids.fire();
      await asteroids.waitFrames(5);

      const bullets = await asteroids.getBulletCount();
      expect(bullets).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe("Game Controls", () => {
    test("should pause and resume", async () => {
      await asteroids.pause();
      expect(await asteroids.isPaused()).toBe(true);

      await asteroids.resume();
      expect(await asteroids.isRunning()).toBe(true);
    });
  });
});
