import { Page, expect } from "@playwright/test";
import { GamePage } from "../game.page";
import { GameId } from "../arcade-shell.page";

/**
 * PacmanPage - Page object for the Pac-Man game
 */
export class PacmanPage extends GamePage {
  readonly gameId: GameId = "pacman";

  constructor(page: Page) {
    super(page);
  }

  /**
   * Get Pac-Man-specific game state
   */
  async getPacmanState(): Promise<any> {
    return await this.stateBridge.getGameById("pacman");
  }

  /**
   * Get Pac-Man position
   */
  async getPacmanPosition(): Promise<{ x: number; y: number } | null> {
    const state = await this.getPacmanState();
    return state?.pacman ? { x: state.pacman.x, y: state.pacman.y } : null;
  }

  /**
   * Get ghost positions
   */
  async getGhostPositions(): Promise<Array<{ x: number; y: number }>> {
    const state = await this.getPacmanState();
    return state?.ghosts?.map((g: any) => ({ x: g.x, y: g.y })) ?? [];
  }

  /**
   * Get remaining dots (totalDots - dotsEaten)
   */
  async getDotsRemaining(): Promise<number> {
    const state = await this.getPacmanState();
    return (state?.totalDots ?? 0) - (state?.dotsEaten ?? 0);
  }

  /**
   * Check if powered up (mode is "frightened")
   */
  async isPoweredUp(): Promise<boolean> {
    const state = await this.getPacmanState();
    return state?.mode === "frightened";
  }

  /**
   * Get current ghost mode
   */
  async getGhostMode(): Promise<string> {
    const state = await this.getPacmanState();
    return state?.mode ?? "chase";
  }

  /**
   * Move Pac-Man up
   */
  async moveUp(): Promise<void> {
    await this.move("up");
  }

  /**
   * Move Pac-Man down
   */
  async moveDown(): Promise<void> {
    await this.move("down");
  }

  /**
   * Move Pac-Man left
   */
  async moveLeft(): Promise<void> {
    await this.move("left");
  }

  /**
   * Move Pac-Man right
   */
  async moveRight(): Promise<void> {
    await this.move("right");
  }

  /**
   * Hold direction to keep moving
   */
  async holdDirection(
    direction: "up" | "down" | "left" | "right",
    durationMs: number,
  ): Promise<void> {
    await this.holdMove(direction, durationMs);
  }

  /**
   * Verify initial pacman state
   */
  async verifyInitialState(): Promise<void> {
    await super.verifyInitialState();

    const state = await this.getPacmanState();
    expect(state).not.toBeNull();
    expect(state?.totalDots).toBeGreaterThan(0);
    expect(state?.mode).not.toBe("frightened");
  }
}
