import { Page, Locator, expect } from "@playwright/test";
import { StateBridge } from "../helpers/state-bridge";
import { KeyboardController } from "../helpers/keyboard-controller";
import { CanvasInspector } from "../helpers/canvas-inspector";

/**
 * Game IDs for navigation
 */
export type GameId =
  | "snake"
  | "pong"
  | "breakout"
  | "flappy"
  | "space-invaders"
  | "frogger"
  | "tetris"
  | "asteroids"
  | "pacman"
  | "roguelike";

/**
 * Menu position mapping for each game
 */
const GAME_MENU_POSITIONS: Record<GameId, number> = {
  snake: 0,
  pong: 1,
  breakout: 2,
  flappy: 3,
  "space-invaders": 4,
  frogger: 5,
  tetris: 6,
  asteroids: 7,
  pacman: 8,
  roguelike: 9,
};

/**
 * ArcadeShellPage - Page object for the main arcade interface
 */
export class ArcadeShellPage {
  readonly page: Page;
  readonly canvas: Locator;
  readonly stateBridge: StateBridge;
  readonly keyboard: KeyboardController;
  readonly canvasInspector: CanvasInspector;

  constructor(page: Page) {
    this.page = page;
    this.canvas = page.locator("#game-canvas");
    this.stateBridge = new StateBridge(page);
    this.keyboard = new KeyboardController(page);
    this.canvasInspector = new CanvasInspector(page);
  }

  /**
   * Navigate to the arcade with test mode enabled
   */
  async goto(options?: { seed?: number }): Promise<void> {
    const url = options?.seed
      ? `/?test=true&seed=${options.seed}`
      : "/?test=true";
    await this.page.goto(url);
    await this.waitForReady();
  }

  /**
   * Wait for the arcade to be fully initialized
   */
  async waitForReady(): Promise<void> {
    await this.canvas.waitFor({ state: "visible" });
    await this.stateBridge.waitForArcadeReady();
    await this.stateBridge.waitForShellState("menu");
  }

  /**
   * Check if we're on the main menu
   */
  async isOnMenu(): Promise<boolean> {
    const state = await this.stateBridge.getShellState();
    return state?.state === "menu";
  }

  /**
   * Navigate to a specific game by its menu position
   * Uses absolute navigation from position 0 for reliability
   */
  async navigateToGame(gameId: GameId): Promise<void> {
    const targetPosition = GAME_MENU_POSITIONS[gameId];

    // First, ensure we're at position 0 (snake) for consistent navigation
    await this.resetMenuToStart();

    // Calculate navigation from position 0
    const columns = 4;
    const targetRow = Math.floor(targetPosition / columns);
    const targetCol = targetPosition % columns;

    // Navigate vertically first
    for (let i = 0; i < targetRow; i++) {
      await this.keyboard.menuDown();
      await this.page.waitForTimeout(120);
    }

    // Then navigate horizontally
    for (let i = 0; i < targetCol; i++) {
      await this.keyboard.menuRight();
      await this.page.waitForTimeout(120);
    }

    // Wait for navigation to settle
    await this.page.waitForTimeout(100);

    // Verify we reached the correct position
    const finalPosition = await this.stateBridge.getMenuSelectedIndex();
    if (finalPosition !== targetPosition) {
      // Use direct setter as a reliable fallback
      await this.stateBridge.setMenuSelectedIndex(targetPosition);
      await this.page.waitForTimeout(50);
    }
  }

  /**
   * Reset menu selection to position 0 (snake)
   * Navigates to top-left corner to ensure consistent starting position
   */
  private async resetMenuToStart(): Promise<void> {
    // Wait for menu to be fully stable
    await this.page.waitForTimeout(150);

    const currentPosition = await this.stateBridge.getMenuSelectedIndex();

    // If already at 0, nothing to do
    if (currentPosition === 0) {
      return;
    }

    const columns = 4;
    const currentRow = Math.floor(currentPosition / columns);
    const currentCol = currentPosition % columns;

    // Navigate up to row 0
    for (let i = 0; i < currentRow; i++) {
      await this.keyboard.menuUp();
      await this.page.waitForTimeout(120);
    }

    // Navigate left to column 0
    for (let i = 0; i < currentCol; i++) {
      await this.keyboard.menuLeft();
      await this.page.waitForTimeout(120);
    }

    // Wait and verify
    await this.page.waitForTimeout(100);
  }

  /**
   * Direct navigation helper when initial navigation fails
   */
  private async navigateToGameDirect(targetPosition: number, currentPosition: number): Promise<void> {
    const columns = 4;
    const currentRow = Math.floor(currentPosition / columns);
    const currentCol = currentPosition % columns;
    const targetRow = Math.floor(targetPosition / columns);
    const targetCol = targetPosition % columns;

    // Navigate vertically
    const rowDiff = targetRow - currentRow;
    for (let i = 0; i < Math.abs(rowDiff); i++) {
      if (rowDiff > 0) {
        await this.keyboard.menuDown();
      } else {
        await this.keyboard.menuUp();
      }
      await this.page.waitForTimeout(150);
    }

    // Navigate horizontally
    const colDiff = targetCol - currentCol;
    for (let i = 0; i < Math.abs(colDiff); i++) {
      if (colDiff > 0) {
        await this.keyboard.menuRight();
      } else {
        await this.keyboard.menuLeft();
      }
      await this.page.waitForTimeout(150);
    }
  }

  /**
   * Launch a game from the menu
   */
  async launchGame(gameId: GameId): Promise<void> {
    await this.navigateToGame(gameId);
    // Wait a moment for navigation to fully settle
    await this.page.waitForTimeout(100);
    await this.keyboard.menuConfirm();
    await this.stateBridge.waitForGameLoaded(gameId);
  }

  /**
   * Open the settings menu
   */
  async openSettings(): Promise<void> {
    // Settings is accessed from pause menu
    throw new Error("Settings can only be accessed from pause menu");
  }

  /**
   * Pause the current game
   */
  async pauseGame(): Promise<void> {
    await this.keyboard.pause();
    await this.stateBridge.waitForShellState("paused");
  }

  /**
   * Resume the current game
   */
  async resumeGame(): Promise<void> {
    await this.keyboard.menuConfirm(); // Resume is selected by default
    await this.stateBridge.waitForShellState("playing");
  }

  /**
   * Navigate pause menu to option by index
   */
  async navigatePauseMenu(optionIndex: number): Promise<void> {
    // Options: RESUME (0), RESTART (1), SETTINGS (2), QUIT (3)
    // Wait for pause menu to be ready
    await this.page.waitForTimeout(100);
    for (let i = 0; i < optionIndex; i++) {
      await this.keyboard.menuDown();
      await this.page.waitForTimeout(150);
    }
  }

  /**
   * Restart the current game from pause menu
   */
  async restartGame(): Promise<void> {
    await this.navigatePauseMenu(1);
    await this.keyboard.menuConfirm();
    await this.stateBridge.waitForShellState("playing");
  }

  /**
   * Quit to main menu from pause menu
   */
  async quitToMenu(): Promise<void> {
    await this.navigatePauseMenu(3);
    await this.keyboard.menuConfirm();
    await this.stateBridge.waitForShellState("menu");
  }

  /**
   * Take a screenshot of the canvas
   */
  async screenshot(): Promise<Buffer> {
    return await this.canvasInspector.screenshot();
  }

  /**
   * Check if the canvas is rendering
   */
  async isRendering(): Promise<boolean> {
    return await this.canvasInspector.isRendering();
  }

  /**
   * Get the current shell state
   */
  async getState(): Promise<string | undefined> {
    const state = await this.stateBridge.getShellState();
    return state?.state;
  }

  /**
   * Get the current game ID
   */
  async getCurrentGameId(): Promise<string | null> {
    const state = await this.stateBridge.getShellState();
    return state?.currentGameId ?? null;
  }

  /**
   * Wait for game over state
   */
  async waitForGameOver(): Promise<void> {
    await this.stateBridge.waitForGameOver();
  }

  /**
   * Dismiss game over screen and return to menu
   */
  async dismissGameOver(): Promise<void> {
    await this.keyboard.menuConfirm();
    await this.stateBridge.waitForShellState("menu");
  }
}
