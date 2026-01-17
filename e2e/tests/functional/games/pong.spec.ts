import { test, expect } from "@playwright/test";
import { PongPage } from "../../../page-objects/games/pong.page";

test.describe("Pong Functional Tests", () => {
  let pong: PongPage;

  test.beforeEach(async ({ page }) => {
    pong = new PongPage(page);
    await pong.launch();
  });

  test.describe("Initial State", () => {
    test("should start with scores at 0", async () => {
      const playerScore = await pong.getPlayerScore();
      const aiScore = await pong.getAIScore();

      expect(playerScore).toBe(0);
      expect(aiScore).toBe(0);
    });

    test("should have ball in play", async () => {
      const ball = await pong.getBallPosition();
      expect(ball).not.toBeNull();
    });
  });

  test.describe("Paddle Movement", () => {
    test("should move paddle up", async () => {
      // Start the game first (press Space)
      await pong.keyboard.press(" ");
      await pong.page.waitForTimeout(200);

      const initialY = await pong.getPlayerPaddleY();

      await pong.keyboard.holdFor("ArrowUp", 400);
      await pong.page.waitForTimeout(100);

      const newY = await pong.getPlayerPaddleY();
      expect(newY).toBeLessThan(initialY);
    });

    test("should move paddle down", async () => {
      // Start the game first (press Space)
      await pong.keyboard.press(" ");
      await pong.page.waitForTimeout(200);

      const initialY = await pong.getPlayerPaddleY();

      await pong.keyboard.holdFor("ArrowDown", 400);
      await pong.page.waitForTimeout(100);

      const newY = await pong.getPlayerPaddleY();
      expect(newY).toBeGreaterThan(initialY);
    });
  });

  test.describe("Ball Physics", () => {
    test("should move ball position over time", async () => {
      // Start the game first (press Space)
      await pong.keyboard.press(" ");
      await pong.page.waitForTimeout(200);

      const initialBall = await pong.getBallPosition();

      await pong.page.waitForTimeout(500);

      const newBall = await pong.getBallPosition();

      // Ball should have moved
      const hasMoved =
        newBall?.x !== initialBall?.x || newBall?.y !== initialBall?.y;
      expect(hasMoved).toBe(true);
    });
  });

  test.describe("Game Controls", () => {
    test("should pause and resume", async () => {
      await pong.pause();
      expect(await pong.isPaused()).toBe(true);

      await pong.resume();
      expect(await pong.isRunning()).toBe(true);
    });
  });
});
