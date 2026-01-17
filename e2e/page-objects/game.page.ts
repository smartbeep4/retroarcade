import { Page, expect } from '@playwright/test'
import { StateBridge, GameState } from '../helpers/state-bridge'
import { KeyboardController } from '../helpers/keyboard-controller'
import { CanvasInspector } from '../helpers/canvas-inspector'
import { ArcadeShellPage, GameId } from './arcade-shell.page'

/**
 * GamePage - Base page object for all games
 */
export abstract class GamePage {
  readonly page: Page
  readonly shell: ArcadeShellPage
  readonly stateBridge: StateBridge
  readonly keyboard: KeyboardController
  readonly canvas: CanvasInspector
  abstract readonly gameId: GameId

  constructor(page: Page) {
    this.page = page
    this.shell = new ArcadeShellPage(page)
    this.stateBridge = new StateBridge(page)
    this.keyboard = new KeyboardController(page)
    this.canvas = new CanvasInspector(page)
  }

  /**
   * Launch this game from the main menu
   */
  async launch(): Promise<void> {
    await this.shell.goto()
    await this.shell.launchGame(this.gameId)
    await this.waitForGameRunning()
  }

  /**
   * Launch with a specific random seed for deterministic testing
   */
  async launchWithSeed(seed: number): Promise<void> {
    await this.shell.goto({ seed })
    await this.shell.launchGame(this.gameId)
    await this.waitForGameRunning()
  }

  /**
   * Wait for the game to be in running state
   */
  async waitForGameRunning(): Promise<void> {
    await this.stateBridge.waitForGameState('running')
  }

  /**
   * Get the current game state
   */
  async getGameState(): Promise<GameState | null> {
    return await this.stateBridge.getGameState()
  }

  /**
   * Get the current score
   */
  async getScore(): Promise<number> {
    return await this.stateBridge.getScore()
  }

  /**
   * Get the current lives
   */
  async getLives(): Promise<number> {
    return await this.stateBridge.getLives()
  }

  /**
   * Get the current level
   */
  async getLevel(): Promise<number> {
    return await this.stateBridge.getLevel()
  }

  /**
   * Check if the game is running
   */
  async isRunning(): Promise<boolean> {
    return await this.stateBridge.isGameRunning()
  }

  /**
   * Check if the game is over
   */
  async isGameOver(): Promise<boolean> {
    return await this.stateBridge.isGameOver()
  }

  /**
   * Check if the game is paused
   */
  async isPaused(): Promise<boolean> {
    return await this.stateBridge.isGamePaused()
  }

  /**
   * Pause the game
   */
  async pause(): Promise<void> {
    await this.shell.pauseGame()
  }

  /**
   * Resume the game
   */
  async resume(): Promise<void> {
    await this.shell.resumeGame()
  }

  /**
   * Restart the game
   */
  async restart(): Promise<void> {
    await this.pause()
    await this.shell.restartGame()
  }

  /**
   * Quit to main menu
   */
  async quit(): Promise<void> {
    await this.pause()
    await this.shell.quitToMenu()
  }

  /**
   * Wait for score to change
   */
  async waitForScoreChange(initialScore: number): Promise<number> {
    return await this.stateBridge.waitForScoreChange(initialScore)
  }

  /**
   * Wait for score to reach a certain value
   */
  async waitForScoreAtLeast(targetScore: number): Promise<void> {
    await this.stateBridge.waitForScoreAtLeast(targetScore)
  }

  /**
   * Wait for a life to be lost
   */
  async waitForLifeLost(initialLives: number): Promise<number> {
    return await this.stateBridge.waitForLifeLost(initialLives)
  }

  /**
   * Wait for game over
   */
  async waitForGameOver(): Promise<void> {
    await this.stateBridge.waitForGameOver()
  }

  /**
   * Take a screenshot
   */
  async screenshot(): Promise<Buffer> {
    return await this.canvas.screenshot()
  }

  /**
   * Check if canvas is rendering
   */
  async isRendering(): Promise<boolean> {
    return await this.canvas.isRendering()
  }

  /**
   * Wait for a number of game frames
   */
  async waitFrames(frames: number): Promise<void> {
    await this.keyboard.waitFrames(frames)
  }

  /**
   * Move in a direction (Arrow keys)
   */
  async move(direction: 'up' | 'down' | 'left' | 'right'): Promise<void> {
    await this.keyboard.tapDirection(direction)
  }

  /**
   * Hold a direction for a duration
   */
  async holdMove(direction: 'up' | 'down' | 'left' | 'right', durationMs: number): Promise<void> {
    await this.keyboard.holdDirection(direction, durationMs)
  }

  /**
   * Press the action button (Space)
   */
  async action(): Promise<void> {
    await this.keyboard.action()
  }

  /**
   * Verify initial game state is correct
   */
  async verifyInitialState(): Promise<void> {
    const state = await this.getGameState()
    expect(state).not.toBeNull()
    expect(state?.state).toBe('running')
    expect(state?.score).toBe(0)
  }
}
