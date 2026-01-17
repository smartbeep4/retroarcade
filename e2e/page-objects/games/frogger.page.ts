import { Page, expect } from "@playwright/test";
import { GamePage } from "../game.page";
import { GameId } from "../arcade-shell.page";

/**
 * FroggerPage - Page object for the Frogger game
 */
export class FroggerPage extends GamePage {
  readonly gameId: GameId = "frogger";

  constructor(page: Page) {
    super(page);
  }

  /**
   * Get Frogger-specific game state
   */
  async getFroggerState(): Promise<any> {
    return await this.stateBridge.getGameById("frogger");
  }

  /**
   * Get frog position in grid (col, row)
   */
  async getFrogPosition(): Promise<{ col: number; row: number } | null> {
    const state = await this.getFroggerState();
    return state?.frog ? { col: state.frog.col, row: state.frog.row } : null;
  }

  /**
   * Get number of filled home bases
   */
  async getHomesFilled(): Promise<number> {
    const state = await this.getFroggerState();
    return state?.homesFilled ?? 0;
  }

  /**
   * Get remaining time
   */
  async getTimeRemaining(): Promise<number> {
    const state = await this.getFroggerState();
    return state?.timeRemaining ?? 0;
  }

  /**
   * Hop up
   */
  async hopUp(): Promise<void> {
    await this.move("up");
  }

  /**
   * Hop down
   */
  async hopDown(): Promise<void> {
    await this.move("down");
  }

  /**
   * Hop left
   */
  async hopLeft(): Promise<void> {
    await this.move("left");
  }

  /**
   * Hop right
   */
  async hopRight(): Promise<void> {
    await this.move("right");
  }

  /**
   * Perform a sequence of hops
   */
  async hopSequence(
    directions: Array<"up" | "down" | "left" | "right">,
    delayMs: number = 200,
  ): Promise<void> {
    for (const dir of directions) {
      await this.move(dir);
      await this.page.waitForTimeout(delayMs);
    }
  }

  /**
   * Verify initial frogger state
   */
  async verifyInitialState(): Promise<void> {
    await super.verifyInitialState();

    const state = await this.getFroggerState();
    expect(state).not.toBeNull();
    expect(state?.homesFilled).toBe(0);
  }
}
