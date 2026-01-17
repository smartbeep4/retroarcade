import { Page, expect } from "@playwright/test";
import { GamePage } from "../game.page";
import { GameId } from "../arcade-shell.page";
import { SnakeState } from "../../helpers/state-bridge";

/**
 * SnakePage - Page object for the Snake game
 */
export class SnakePage extends GamePage {
  readonly gameId: GameId = "snake";

  // Snake colors
  readonly SNAKE_HEAD_COLOR = "#39ff14";
  readonly SNAKE_BODY_COLOR = "#2eb82e";
  readonly FOOD_COLOR = "#ff2a6d";

  constructor(page: Page) {
    super(page);
  }

  /**
   * Get Snake-specific game state
   */
  async getSnakeState(): Promise<SnakeState | null> {
    return await this.stateBridge.getSnakeState();
  }

  /**
   * Get the current snake length
   */
  async getSnakeLength(): Promise<number> {
    const state = await this.getSnakeState();
    return state?.snakeLength ?? 0;
  }

  /**
   * Get the snake's current direction
   */
  async getDirection(): Promise<{ x: number; y: number } | null> {
    const state = await this.getSnakeState();
    return state?.direction ?? null;
  }

  /**
   * Get the food position
   */
  async getFoodPosition(): Promise<{ x: number; y: number } | null> {
    const state = await this.getSnakeState();
    return state?.food ?? null;
  }

  /**
   * Get the snake head position
   */
  async getHeadPosition(): Promise<{ x: number; y: number } | null> {
    const state = await this.getSnakeState();
    return state?.snake?.[0] ?? null;
  }

  /**
   * Get the number of food eaten
   */
  async getFoodEaten(): Promise<number> {
    const state = await this.getSnakeState();
    return state?.foodEaten ?? 0;
  }

  /**
   * Get the current move interval (speed)
   */
  async getMoveInterval(): Promise<number> {
    const state = await this.getSnakeState();
    return state?.moveInterval ?? 150;
  }

  /**
   * Move up
   */
  async moveUp(): Promise<void> {
    await this.move("up");
  }

  /**
   * Move down
   */
  async moveDown(): Promise<void> {
    await this.move("down");
  }

  /**
   * Move left
   */
  async moveLeft(): Promise<void> {
    await this.move("left");
  }

  /**
   * Move right
   */
  async moveRight(): Promise<void> {
    await this.move("right");
  }

  /**
   * Wait for the snake to move (one move interval)
   */
  async waitForMove(): Promise<void> {
    const interval = await this.getMoveInterval();
    await this.page.waitForTimeout(interval + 50);
  }

  /**
   * Wait for multiple snake moves
   */
  async waitForMoves(count: number): Promise<void> {
    const interval = await this.getMoveInterval();
    await this.page.waitForTimeout((interval + 20) * count);
  }

  /**
   * Verify the initial snake state
   */
  async verifyInitialState(): Promise<void> {
    await super.verifyInitialState();

    const state = await this.getSnakeState();
    expect(state).not.toBeNull();

    // Snake should start with 3 segments
    expect(state?.snakeLength).toBe(3);

    // Snake should start moving right
    expect(state?.direction).toEqual({ x: 1, y: 0 });

    // Food should exist
    expect(state?.food).not.toBeNull();

    // No food eaten yet
    expect(state?.foodEaten).toBe(0);

    // Initial score should be 0
    expect(state?.score).toBe(0);
  }

  /**
   * Verify that direction changes are valid (not 180 degree turns)
   */
  async verifyDirectionChange(
    newDirection: "up" | "down" | "left" | "right",
  ): Promise<boolean> {
    const currentDir = await this.getDirection();
    if (!currentDir) return false;

    const directionMap = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
    };

    const newDir = directionMap[newDirection];

    // Check if it's a 180 degree turn (would be blocked)
    const is180Turn =
      currentDir.x + newDir.x === 0 && currentDir.y + newDir.y === 0;
    return !is180Turn;
  }

  /**
   * Try to make an invalid 180 degree turn and verify it doesn't work
   */
  async attemptInvalidTurn(): Promise<void> {
    const currentDir = await this.getDirection();
    if (!currentDir) return;

    // Try to go the opposite direction
    if (currentDir.x === 1) {
      await this.moveLeft();
    } else if (currentDir.x === -1) {
      await this.moveRight();
    } else if (currentDir.y === 1) {
      await this.moveUp();
    } else if (currentDir.y === -1) {
      await this.moveDown();
    }

    await this.waitForMove();

    // Direction should not have changed to opposite
    const newDir = await this.getDirection();
    expect(newDir).toEqual(currentDir);
  }

  /**
   * Force self-collision for testing game over
   */
  async forceSelfCollision(): Promise<void> {
    // Need to grow the snake first, then turn into itself
    // This requires careful movement that depends on the initial state

    // Move right for a bit, then down, then left, then up into itself
    await this.waitForMoves(3);
    await this.moveDown();
    await this.waitForMoves(2);
    await this.moveLeft();
    await this.waitForMoves(2);
    await this.moveUp();
    // This should cause collision with the snake body
    await this.waitForMoves(3);
  }

  /**
   * Check if snake head color is visible on canvas
   */
  async hasSnakeHeadOnCanvas(): Promise<boolean> {
    const dims = await this.canvas.getCanvasDimensions();
    return await this.canvas.hasColorInRegion(
      this.SNAKE_HEAD_COLOR,
      0,
      0,
      dims.width,
      dims.height,
    );
  }

  /**
   * Check if food color is visible on canvas
   */
  async hasFoodOnCanvas(): Promise<boolean> {
    const dims = await this.canvas.getCanvasDimensions();
    return await this.canvas.hasColorInRegion(
      this.FOOD_COLOR,
      0,
      0,
      dims.width,
      dims.height,
    );
  }
}
