import { Page, expect } from '@playwright/test'
import { GamePage } from '../game.page'
import { GameId } from '../arcade-shell.page'

/**
 * RoguelikePage - Page object for the Roguelike/Dungeon game
 */
export class RoguelikePage extends GamePage {
  readonly gameId: GameId = 'roguelike'

  constructor(page: Page) {
    super(page)
  }

  /**
   * Get Roguelike-specific game state
   */
  async getRoguelikeState(): Promise<any> {
    return await this.stateBridge.getGameById('roguelike')
  }

  /**
   * Get player position
   */
  async getPlayerPosition(): Promise<{ x: number; y: number } | null> {
    const state = await this.getRoguelikeState()
    return state?.player ? { x: state.player.x, y: state.player.y } : null
  }

  /**
   * Get player health
   */
  async getHealth(): Promise<number> {
    const state = await this.getRoguelikeState()
    return state?.player?.hp ?? 0
  }

  /**
   * Get max health
   */
  async getMaxHealth(): Promise<number> {
    const state = await this.getRoguelikeState()
    return state?.player?.maxHp ?? 0
  }

  /**
   * Get current floor/level
   */
  async getFloor(): Promise<number> {
    const state = await this.getRoguelikeState()
    return state?.floor ?? 1
  }

  /**
   * Get enemy count
   */
  async getEnemyCount(): Promise<number> {
    const state = await this.getRoguelikeState()
    return state?.enemies?.length ?? 0
  }

  /**
   * Get item count
   */
  async getItemCount(): Promise<number> {
    const state = await this.getRoguelikeState()
    return state?.items?.length ?? 0
  }

  /**
   * Move player up
   */
  async moveUp(): Promise<void> {
    await this.move('up')
  }

  /**
   * Move player down
   */
  async moveDown(): Promise<void> {
    await this.move('down')
  }

  /**
   * Move player left
   */
  async moveLeft(): Promise<void> {
    await this.move('left')
  }

  /**
   * Move player right
   */
  async moveRight(): Promise<void> {
    await this.move('right')
  }

  /**
   * Wait after movement (turn-based game)
   */
  async waitTurn(): Promise<void> {
    await this.action()
  }

  /**
   * Move in a direction and wait for turn to process
   */
  async moveAndWait(direction: 'up' | 'down' | 'left' | 'right'): Promise<void> {
    await this.move(direction)
    await this.page.waitForTimeout(200)
  }

  /**
   * Verify initial roguelike state
   */
  async verifyInitialState(): Promise<void> {
    await super.verifyInitialState()

    const state = await this.getRoguelikeState()
    expect(state).not.toBeNull()
    expect(state?.player?.hp).toBeGreaterThan(0)
    expect(state?.floor).toBe(1)
  }
}
