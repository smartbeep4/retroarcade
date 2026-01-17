import { Page, expect } from "@playwright/test";
import { GamePage } from "../game.page";
import { GameId } from "../arcade-shell.page";

/**
 * SpaceInvadersPage - Page object for the Space Invaders game
 */
export class SpaceInvadersPage extends GamePage {
  readonly gameId: GameId = "space-invaders";

  constructor(page: Page) {
    super(page);
  }

  /**
   * Get Space Invaders-specific game state
   */
  async getInvadersState(): Promise<any> {
    return await this.stateBridge.getGameById("space-invaders");
  }

  /**
   * Get player position
   */
  async getPlayerX(): Promise<number> {
    const state = await this.getInvadersState();
    return state?.player?.x ?? 0;
  }

  /**
   * Get remaining alien count
   */
  async getAlienCount(): Promise<number> {
    const state = await this.getInvadersState();
    return state?.alienCount ?? 0;
  }

  /**
   * Get bullet count
   */
  async getBulletCount(): Promise<number> {
    const state = await this.getInvadersState();
    return state?.bullets?.length ?? 0;
  }

  /**
   * Move player left
   */
  async movePlayerLeft(): Promise<void> {
    await this.move("left");
  }

  /**
   * Move player right
   */
  async movePlayerRight(): Promise<void> {
    await this.move("right");
  }

  /**
   * Hold move left
   */
  async holdMoveLeft(durationMs: number): Promise<void> {
    await this.holdMove("left", durationMs);
  }

  /**
   * Hold move right
   */
  async holdMoveRight(durationMs: number): Promise<void> {
    await this.holdMove("right", durationMs);
  }

  /**
   * Fire weapon
   */
  async fire(): Promise<void> {
    await this.action();
  }

  /**
   * Rapid fire
   */
  async rapidFire(count: number, delayMs: number = 100): Promise<void> {
    for (let i = 0; i < count; i++) {
      await this.fire();
      if (i < count - 1) {
        await this.page.waitForTimeout(delayMs);
      }
    }
  }

  /**
   * Move and shoot
   */
  async moveAndShoot(direction: "left" | "right"): Promise<void> {
    await this.move(direction);
    await this.fire();
  }

  /**
   * Verify initial space invaders state
   */
  async verifyInitialState(): Promise<void> {
    await super.verifyInitialState();

    const state = await this.getInvadersState();
    expect(state).not.toBeNull();
    expect(state?.alienCount).toBeGreaterThan(0);
  }
}
