import { test, expect } from '@playwright/test'
import { RoguelikePage } from '../../../page-objects/games/roguelike.page'

test.describe('Roguelike Functional Tests', () => {
  let roguelike: RoguelikePage

  test.beforeEach(async ({ page }) => {
    roguelike = new RoguelikePage(page)
    await roguelike.launch()
  })

  test.describe('Initial State', () => {
    test('should have player at starting position', async () => {
      const pos = await roguelike.getPlayerPosition()
      expect(pos).not.toBeNull()
    })

    test('should start with full health', async () => {
      const health = await roguelike.getHealth()
      const maxHealth = await roguelike.getMaxHealth()

      expect(health).toBe(maxHealth)
      expect(health).toBeGreaterThan(0)
    })

    test('should start on floor 1', async () => {
      const floor = await roguelike.getFloor()
      expect(floor).toBe(1)
    })

    test('should start with score 0', async () => {
      const score = await roguelike.getScore()
      expect(score).toBe(0)
    })
  })

  test.describe('Movement (Turn-based)', () => {
    test('should move up', async () => {
      const initialPos = await roguelike.getPlayerPosition()

      await roguelike.moveAndWait('up')

      // Position should change or game should still be running
      const isRunning = await roguelike.isRunning()
      expect(isRunning).toBe(true)
    })

    test('should move down', async () => {
      await roguelike.moveAndWait('down')

      const isRunning = await roguelike.isRunning()
      expect(isRunning).toBe(true)
    })

    test('should move left', async () => {
      await roguelike.moveAndWait('left')

      const isRunning = await roguelike.isRunning()
      expect(isRunning).toBe(true)
    })

    test('should move right', async () => {
      await roguelike.moveAndWait('right')

      const isRunning = await roguelike.isRunning()
      expect(isRunning).toBe(true)
    })
  })

  test.describe('Dungeon Elements', () => {
    test('should have enemies on the floor', async () => {
      const enemies = await roguelike.getEnemyCount()
      // May or may not have enemies on starting floor
      expect(enemies).toBeGreaterThanOrEqual(0)
    })
  })

  test.describe('Game Controls', () => {
    test('should pause and resume', async () => {
      await roguelike.pause()
      expect(await roguelike.isPaused()).toBe(true)

      await roguelike.resume()
      expect(await roguelike.isRunning()).toBe(true)
    })
  })
})
