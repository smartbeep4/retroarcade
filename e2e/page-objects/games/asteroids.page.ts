import { Page, expect } from '@playwright/test'
import { GamePage } from '../game.page'
import { GameId } from '../arcade-shell.page'

/**
 * AsteroidsPage - Page object for the Asteroids game
 */
export class AsteroidsPage extends GamePage {
  readonly gameId: GameId = 'asteroids'

  constructor(page: Page) {
    super(page)
  }

  /**
   * Get Asteroids-specific game state
   */
  async getAsteroidsState(): Promise<any> {
    return await this.stateBridge.getGameById('asteroids')
  }

  /**
   * Get ship position
   */
  async getShipPosition(): Promise<{ x: number; y: number } | null> {
    const state = await this.getAsteroidsState()
    return state?.ship ? { x: state.ship.x, y: state.ship.y } : null
  }

  /**
   * Get ship rotation
   */
  async getShipRotation(): Promise<number> {
    const state = await this.getAsteroidsState()
    return state?.ship?.rotation ?? 0
  }

  /**
   * Get asteroid count
   */
  async getAsteroidCount(): Promise<number> {
    const state = await this.getAsteroidsState()
    return state?.asteroidCount ?? 0
  }

  /**
   * Get bullet count
   */
  async getBulletCount(): Promise<number> {
    const state = await this.getAsteroidsState()
    return state?.bullets?.length ?? 0
  }

  /**
   * Get current wave number
   */
  async getWave(): Promise<number> {
    const state = await this.getAsteroidsState()
    return state?.wave ?? 1
  }

  /**
   * Rotate left
   */
  async rotateLeft(): Promise<void> {
    await this.move('left')
  }

  /**
   * Rotate right
   */
  async rotateRight(): Promise<void> {
    await this.move('right')
  }

  /**
   * Thrust forward
   */
  async thrust(): Promise<void> {
    await this.move('up')
  }

  /**
   * Hold thrust for duration
   */
  async holdThrust(durationMs: number): Promise<void> {
    await this.holdMove('up', durationMs)
  }

  /**
   * Fire weapon
   */
  async fire(): Promise<void> {
    await this.action()
  }

  /**
   * Thrust and fire simultaneously
   */
  async thrustAndFire(): Promise<void> {
    await Promise.all([this.thrust(), this.fire()])
  }

  /**
   * Verify initial asteroids state
   */
  async verifyInitialState(): Promise<void> {
    await super.verifyInitialState()

    const state = await this.getAsteroidsState()
    expect(state).not.toBeNull()
    expect(state?.asteroidCount).toBeGreaterThan(0)
  }
}
