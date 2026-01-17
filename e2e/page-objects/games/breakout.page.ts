import { Page, expect } from "@playwright/test";
import { GamePage } from "../game.page";
import { GameId } from "../arcade-shell.page";

/**
 * BreakoutPage - Page object for the Breakout game
 */
export class BreakoutPage extends GamePage {
  readonly gameId: GameId = "breakout";

  constructor(page: Page) {
    super(page);
  }

  /**
   * Get Breakout-specific game state
   */
  async getBreakoutState(): Promise<any> {
    return await this.stateBridge.getGameById("breakout");
  }

  /**
   * Get remaining brick count
   */
  async getBrickCount(): Promise<number> {
    const state = await this.getBreakoutState();
    return state?.brickCount ?? 0;
  }

  /**
   * Get ball position (first ball in array)
   */
  async getBallPosition(): Promise<{ x: number; y: number } | null> {
    const state = await this.getBreakoutState();
    const ball = state?.balls?.[0];
    return ball ? { x: ball.x, y: ball.y } : null;
  }

  /**
   * Check if ball is attached to paddle
   */
  async isBallAttached(): Promise<boolean> {
    const state = await this.getBreakoutState();
    return state?.balls?.[0]?.attached ?? true;
  }

  /**
   * Get paddle position
   */
  async getPaddleX(): Promise<number> {
    const state = await this.getBreakoutState();
    return state?.paddle?.x ?? 0;
  }

  /**
   * Move paddle left
   */
  async paddleLeft(): Promise<void> {
    await this.move("left");
  }

  /**
   * Move paddle right
   */
  async paddleRight(): Promise<void> {
    await this.move("right");
  }

  /**
   * Hold paddle left for duration
   */
  async holdPaddleLeft(durationMs: number): Promise<void> {
    await this.holdMove("left", durationMs);
  }

  /**
   * Hold paddle right for duration
   */
  async holdPaddleRight(durationMs: number): Promise<void> {
    await this.holdMove("right", durationMs);
  }

  /**
   * Launch ball (if not already launched)
   */
  async launchBall(): Promise<void> {
    await this.action();
  }

  /**
   * Verify initial breakout state
   */
  async verifyInitialState(): Promise<void> {
    await super.verifyInitialState();

    const state = await this.getBreakoutState();
    expect(state).not.toBeNull();
    expect(state?.brickCount).toBeGreaterThan(0);
  }
}
