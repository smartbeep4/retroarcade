import { Page, expect } from "@playwright/test";

/**
 * Types for game state
 */
export interface ShellState {
  state: "menu" | "playing" | "paused" | "gameover" | "settings";
  currentGameId: string | null;
  isInitialized: boolean;
  previousState: string | null;
  menuSelectedIndex: number;
  pauseMenuSelectedIndex: number;
}

export interface GameState {
  id: string;
  state: "idle" | "running" | "paused" | "gameover";
  score: number;
  lives: number;
  level: number;
  canvasWidth: number;
  canvasHeight: number;
}

export interface SnakeState extends GameState {
  snake: Array<{ x: number; y: number }>;
  snakeLength: number;
  food: { x: number; y: number } | null;
  direction: { x: number; y: number } | null;
  nextDirection: { x: number; y: number } | null;
  gridSize: number;
  cellSize: number;
  moveInterval: number;
  foodEaten: number;
  wrapWalls: boolean;
}

export interface PongState extends GameState {
  paddle1: { x: number; y: number; score: number };
  paddle2: { x: number; y: number; score: number };
  ball: { x: number; y: number; vx: number; vy: number; speed: number };
  gameStarted: boolean;
  winner: number | null;
}

export interface BreakoutState extends GameState {
  paddle: { x: number; width: number };
  balls: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    attached: boolean;
  }>;
  bricks: Array<{ x: number; y: number; color: string; points: number }>;
  brickCount: number;
  powerups: Array<{ x: number; y: number; type: string }>;
}

export interface FlappyState extends GameState {
  bird: { y: number; vy: number; rotation: number };
  pipes: Array<{ x: number; gapY: number; scored: boolean }>;
  started: boolean;
  gravity: number;
  flapStrength: number;
}

export interface FroggerState extends GameState {
  frog: { col: number; row: number; riding: any };
  lanes: Array<{
    row: number;
    type: string;
    speed: number;
    direction: number;
    objects: any[];
  }>;
  homes: Array<{ col: number; filled: boolean; hasFly: boolean }>;
  homesFilled: number;
  timeRemaining: number;
  cellSize: number;
}

export interface TetrisState extends GameState {
  grid: Array<Array<string | null>>;
  currentPiece: {
    type: string;
    shape: number[][];
    color: string;
    x: number;
    y: number;
  } | null;
  nextQueue: string[];
  holdPiece: string | null;
  linesCleared: number;
}

export interface AsteroidsState extends GameState {
  ship: { x: number; y: number; vx: number; vy: number; rotation: number };
  asteroids: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: string;
  }>;
  asteroidCount: number;
  bullets: Array<{ x: number; y: number }>;
  ufo: { x: number; y: number } | null;
  wave: number;
}

export interface PacmanState extends GameState {
  pacman: {
    col: number;
    row: number;
    x: number;
    y: number;
    direction: { x: number; y: number };
  };
  ghosts: Array<{ name: string; x: number; y: number }>;
  dots: Array<{ col: number; row: number; eaten: boolean }>;
  totalDots: number;
  dotsEaten: number;
  powerPellets: Array<{ col: number; row: number; eaten: boolean }>;
  mode: string;
  modeTimer: number;
}

export interface RoguelikeState extends GameState {
  player: {
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
  };
  enemies: Array<{ x: number; y: number; type: string; hp: number }>;
  items: Array<{ x: number; y: number; type: string }>;
  map: number[][];
  floor: number;
  visible: boolean[][];
  explored: boolean[][];
}

/**
 * StateBridge - Utilities for accessing game state from Playwright tests
 */
export class StateBridge {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Check if TestBridge is available
   */
  async isTestBridgeEnabled(): Promise<boolean> {
    return await this.page.evaluate(() => {
      const testBridge = (window as any).__ARCADE_TEST__;
      return testBridge?.isEnabled() ?? false;
    });
  }

  /**
   * Get the current shell state
   */
  async getShellState(): Promise<ShellState | null> {
    return await this.page.evaluate(() => {
      const testBridge = (window as any).__ARCADE_TEST__;
      return testBridge?.getShellState() ?? null;
    });
  }

  /**
   * Get the current game state
   */
  async getGameState(): Promise<GameState | null> {
    return await this.page.evaluate(() => {
      const testBridge = (window as any).__ARCADE_TEST__;
      return testBridge?.getGameState() ?? null;
    });
  }

  /**
   * Get game-specific state by game ID
   */
  async getGameById<T extends GameState>(gameId: string): Promise<T | null> {
    return await this.page.evaluate((id) => {
      const testBridge = (window as any).__ARCADE_TEST__;
      return testBridge?.getGameById(id) ?? null;
    }, gameId);
  }

  /**
   * Wait for the shell to reach a specific state
   */
  async waitForShellState(
    targetState: ShellState["state"],
    timeout: number = 5000,
  ): Promise<void> {
    await expect(async () => {
      const state = await this.getShellState();
      expect(state?.state).toBe(targetState);
    }).toPass({ timeout });
  }

  /**
   * Wait for the game to reach a specific state
   */
  async waitForGameState(
    targetState: GameState["state"],
    timeout: number = 5000,
  ): Promise<void> {
    await expect(async () => {
      const state = await this.getGameState();
      expect(state?.state).toBe(targetState);
    }).toPass({ timeout });
  }

  /**
   * Wait for a game to be loaded
   */
  async waitForGameLoaded(
    gameId: string,
    timeout: number = 5000,
  ): Promise<void> {
    await expect(async () => {
      const shellState = await this.getShellState();
      expect(shellState?.currentGameId).toBe(gameId);
      const gameState = await this.getGameState();
      expect(gameState?.state).toBe("running");
    }).toPass({ timeout });
  }

  /**
   * Get the current score
   */
  async getScore(): Promise<number> {
    const state = await this.getGameState();
    return state?.score ?? 0;
  }

  /**
   * Get the current lives
   */
  async getLives(): Promise<number> {
    const state = await this.getGameState();
    return state?.lives ?? 0;
  }

  /**
   * Get the current level
   */
  async getLevel(): Promise<number> {
    const state = await this.getGameState();
    return state?.level ?? 0;
  }

  /**
   * Wait for score to change
   */
  async waitForScoreChange(
    initialScore: number,
    timeout: number = 5000,
  ): Promise<number> {
    let currentScore = initialScore;
    await expect(async () => {
      currentScore = await this.getScore();
      expect(currentScore).not.toBe(initialScore);
    }).toPass({ timeout });
    return currentScore;
  }

  /**
   * Wait for score to reach or exceed a value
   */
  async waitForScoreAtLeast(
    targetScore: number,
    timeout: number = 10000,
  ): Promise<void> {
    await expect(async () => {
      const score = await this.getScore();
      expect(score).toBeGreaterThanOrEqual(targetScore);
    }).toPass({ timeout });
  }

  /**
   * Wait for lives to decrease
   */
  async waitForLifeLost(
    initialLives: number,
    timeout: number = 5000,
  ): Promise<number> {
    let currentLives = initialLives;
    await expect(async () => {
      currentLives = await this.getLives();
      expect(currentLives).toBeLessThan(initialLives);
    }).toPass({ timeout });
    return currentLives;
  }

  /**
   * Check if game is over
   */
  async isGameOver(): Promise<boolean> {
    const state = await this.getGameState();
    return state?.state === "gameover";
  }

  /**
   * Check if game is running
   */
  async isGameRunning(): Promise<boolean> {
    const state = await this.getGameState();
    return state?.state === "running";
  }

  /**
   * Check if game is paused
   */
  async isGamePaused(): Promise<boolean> {
    const state = await this.getGameState();
    return state?.state === "paused";
  }

  /**
   * Wait for game over
   */
  async waitForGameOver(timeout: number = 30000): Promise<void> {
    await this.waitForGameState("gameover", timeout);
  }

  /**
   * Get Snake-specific state
   */
  async getSnakeState(): Promise<SnakeState | null> {
    return await this.getGameById<SnakeState>("snake");
  }

  /**
   * Get Pong-specific state
   */
  async getPongState(): Promise<PongState | null> {
    return await this.getGameById<PongState>("pong");
  }

  /**
   * Get Tetris-specific state
   */
  async getTetrisState(): Promise<TetrisState | null> {
    return await this.getGameById<TetrisState>("tetris");
  }

  /**
   * Get Breakout-specific state
   */
  async getBreakoutState(): Promise<BreakoutState | null> {
    return await this.getGameById<BreakoutState>("breakout");
  }

  /**
   * Get Flappy-specific state
   */
  async getFlappyState(): Promise<FlappyState | null> {
    return await this.getGameById<FlappyState>("flappy");
  }

  /**
   * Get Frogger-specific state
   */
  async getFroggerState(): Promise<FroggerState | null> {
    return await this.getGameById<FroggerState>("frogger");
  }

  /**
   * Get Asteroids-specific state
   */
  async getAsteroidsState(): Promise<AsteroidsState | null> {
    return await this.getGameById<AsteroidsState>("asteroids");
  }

  /**
   * Get Pac-Man-specific state
   */
  async getPacmanState(): Promise<PacmanState | null> {
    return await this.getGameById<PacmanState>("pacman");
  }

  /**
   * Get Roguelike-specific state
   */
  async getRoguelikeState(): Promise<RoguelikeState | null> {
    return await this.getGameById<RoguelikeState>("roguelike");
  }

  /**
   * Wait for arcade to be initialized
   */
  async waitForArcadeReady(timeout: number = 10000): Promise<void> {
    await expect(async () => {
      const state = await this.getShellState();
      expect(state?.isInitialized).toBe(true);
    }).toPass({ timeout });
  }

  /**
   * Get menu selection index
   */
  async getMenuSelectedIndex(): Promise<number> {
    const state = await this.getShellState();
    return state?.menuSelectedIndex ?? 0;
  }
}
