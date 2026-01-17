import { Page, expect } from '@playwright/test'
import { GamePage } from '../game.page'
import { GameId } from '../arcade-shell.page'
import { TetrisState } from '../../helpers/state-bridge'

/**
 * TetrisPage - Page object for the Tetris game
 */
export class TetrisPage extends GamePage {
  readonly gameId: GameId = 'tetris'

  constructor(page: Page) {
    super(page)
  }

  /**
   * Get Tetris-specific game state
   */
  async getTetrisState(): Promise<TetrisState | null> {
    return await this.stateBridge.getTetrisState()
  }

  /**
   * Get lines cleared count
   */
  async getLinesCleared(): Promise<number> {
    const state = await this.getTetrisState()
    return state?.linesCleared ?? 0
  }

  /**
   * Get current piece position
   */
  async getPiecePosition(): Promise<{ x: number; y: number } | null> {
    const state = await this.getTetrisState()
    if (!state?.currentPiece) return null
    return { x: state.currentPiece.x, y: state.currentPiece.y }
  }

  /**
   * Get current piece type
   */
  async getCurrentPieceType(): Promise<string | null> {
    const state = await this.getTetrisState()
    return state?.currentPiece?.type ?? null
  }

  /**
   * Get next piece type (first in queue)
   */
  async getNextPieceType(): Promise<string | null> {
    const state = await this.getTetrisState()
    return state?.nextQueue?.[0] ?? null
  }

  /**
   * Move piece left
   */
  async moveLeft(): Promise<void> {
    await this.move('left')
  }

  /**
   * Move piece right
   */
  async moveRight(): Promise<void> {
    await this.move('right')
  }

  /**
   * Rotate piece
   */
  async rotate(): Promise<void> {
    await this.move('up')
  }

  /**
   * Soft drop (move down faster)
   */
  async softDrop(): Promise<void> {
    await this.move('down')
  }

  /**
   * Hard drop (instantly drop piece)
   */
  async hardDrop(): Promise<void> {
    await this.action()
  }

  /**
   * Hold soft drop for duration
   */
  async holdSoftDrop(durationMs: number): Promise<void> {
    await this.holdMove('down', durationMs)
  }

  /**
   * Verify initial tetris state
   */
  async verifyInitialState(): Promise<void> {
    await super.verifyInitialState()

    const state = await this.getTetrisState()
    expect(state).not.toBeNull()
    expect(state?.linesCleared).toBe(0)
    expect(state?.currentPiece).not.toBeNull()
  }
}
