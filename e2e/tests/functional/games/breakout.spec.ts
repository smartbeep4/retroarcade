import { test, expect } from "@playwright/test";
import { BreakoutPage } from "../../../page-objects/games/breakout.page";

test.describe("Breakout Functional Tests", () => {
  let breakout: BreakoutPage;

  test.beforeEach(async ({ page }) => {
    breakout = new BreakoutPage(page);
    await breakout.launch();
  });

  test.describe("Initial State", () => {
    test("should have bricks to destroy", async () => {
      const brickCount = await breakout.getBrickCount();
      expect(brickCount).toBeGreaterThan(0);
    });

    test("should have ball ready", async () => {
      const ball = await breakout.getBallPosition();
      expect(ball).not.toBeNull();
    });

    test("should start with score 0", async () => {
      const score = await breakout.getScore();
      expect(score).toBe(0);
    });
  });

  test.describe("Paddle Movement", () => {
    test("should move paddle left", async () => {
      const initialX = await breakout.getPaddleX();

      await breakout.holdPaddleLeft(200);

      const newX = await breakout.getPaddleX();
      expect(newX).toBeLessThan(initialX);
    });

    test("should move paddle right", async () => {
      const initialX = await breakout.getPaddleX();

      await breakout.holdPaddleRight(200);

      const newX = await breakout.getPaddleX();
      expect(newX).toBeGreaterThan(initialX);
    });
  });

  test.describe("Ball Mechanics", () => {
    test("should move ball over time", async () => {
      // Launch the ball first (press Space)
      await breakout.launchBall();
      await breakout.page.waitForTimeout(100);

      const initialBall = await breakout.getBallPosition();

      await breakout.waitFrames(30);

      const newBall = await breakout.getBallPosition();
      const hasMoved =
        newBall?.x !== initialBall?.x || newBall?.y !== initialBall?.y;
      expect(hasMoved).toBe(true);
    });
  });

  test.describe("Game Controls", () => {
    test("should pause and resume", async () => {
      await breakout.pause();
      expect(await breakout.isPaused()).toBe(true);

      await breakout.resume();
      expect(await breakout.isRunning()).toBe(true);
    });
  });
});
