import { Page, expect } from "@playwright/test";
import { GamePage } from "../game.page";
import { GameId } from "../arcade-shell.page";

/**
 * FlappyPage - Page object for the Flappy Bird game
 */
export class FlappyPage extends GamePage {
  readonly gameId: GameId = "flappy";

  constructor(page: Page) {
    super(page);
  }

  /**
   * Get Flappy-specific game state
   */
  async getFlappyState(): Promise<any> {
    return await this.stateBridge.getGameById("flappy");
  }

  /**
   * Get bird Y position
   */
  async getBirdY(): Promise<number> {
    const state = await this.getFlappyState();
    return state?.bird?.y ?? 0;
  }

  /**
   * Get bird velocity (vy)
   */
  async getBirdVelocity(): Promise<number> {
    const state = await this.getFlappyState();
    return state?.bird?.vy ?? 0;
  }

  /**
   * Get number of pipes
   */
  async getPipeCount(): Promise<number> {
    const state = await this.getFlappyState();
    return state?.pipes?.length ?? 0;
  }

  /**
   * Check if game has started
   */
  async hasGameStarted(): Promise<boolean> {
    const state = await this.getFlappyState();
    return state?.started ?? false;
  }

  /**
   * Flap (jump)
   */
  async flap(): Promise<void> {
    await this.action();
  }

  /**
   * Start the game with first flap
   */
  async startGame(): Promise<void> {
    await this.flap();
    await this.page.waitForTimeout(100);
  }

  /**
   * Perform multiple flaps with delay
   */
  async flapMultiple(count: number, delayMs: number = 200): Promise<void> {
    for (let i = 0; i < count; i++) {
      await this.flap();
      if (i < count - 1) {
        await this.page.waitForTimeout(delayMs);
      }
    }
  }

  /**
   * Verify initial flappy state
   */
  async verifyInitialState(): Promise<void> {
    await super.verifyInitialState();

    const state = await this.getFlappyState();
    expect(state).not.toBeNull();
  }
}
