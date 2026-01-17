import { Page, expect } from '@playwright/test'
import { GamePage } from '../game.page'
import { GameId } from '../arcade-shell.page'

/**
 * PongPage - Page object for the Pong game
 */
export class PongPage extends GamePage {
  readonly gameId: GameId = 'pong'

  constructor(page: Page) {
    super(page)
  }

  /**
   * Get Pong-specific game state
   */
  async getPongState(): Promise<any> {
    return await this.stateBridge.getPongState()
  }

  /**
   * Get player paddle (paddle1) position
   */
  async getPlayerPaddleY(): Promise<number> {
    const state = await this.getPongState()
    return state?.paddle1?.y ?? 0
  }

  /**
   * Get AI paddle (paddle2) position
   */
  async getAIPaddleY(): Promise<number> {
    const state = await this.getPongState()
    return state?.paddle2?.y ?? 0
  }

  /**
   * Get ball position
   */
  async getBallPosition(): Promise<{ x: number; y: number } | null> {
    const state = await this.getPongState()
    return state?.ball ? { x: state.ball.x, y: state.ball.y } : null
  }

  /**
   * Get player score
   */
  async getPlayerScore(): Promise<number> {
    const state = await this.getPongState()
    return state?.paddle1?.score ?? 0
  }

  /**
   * Get AI score
   */
  async getAIScore(): Promise<number> {
    const state = await this.getPongState()
    return state?.paddle2?.score ?? 0
  }

  /**
   * Move paddle up
   */
  async paddleUp(): Promise<void> {
    await this.move('up')
  }

  /**
   * Move paddle down
   */
  async paddleDown(): Promise<void> {
    await this.move('down')
  }

  /**
   * Hold paddle up for duration
   */
  async holdPaddleUp(durationMs: number): Promise<void> {
    await this.holdMove('up', durationMs)
  }

  /**
   * Hold paddle down for duration
   */
  async holdPaddleDown(durationMs: number): Promise<void> {
    await this.holdMove('down', durationMs)
  }

  /**
   * Verify initial pong state
   */
  async verifyInitialState(): Promise<void> {
    await super.verifyInitialState()

    const state = await this.getPongState()
    expect(state).not.toBeNull()
    expect(state?.paddle1?.score).toBe(0)
    expect(state?.paddle2?.score).toBe(0)
  }
}
