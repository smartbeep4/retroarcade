import { test, expect } from '@playwright/test'
import { FroggerPage } from '../../../page-objects/games/frogger.page'

test.describe('Frogger Functional Tests', () => {
  let frogger: FroggerPage

  test.beforeEach(async ({ page }) => {
    frogger = new FroggerPage(page)
    await frogger.launch()
  })

  test.describe('Initial State', () => {
    test('should have frog at starting position', async () => {
      const frog = await frogger.getFrogPosition()
      expect(frog).not.toBeNull()
    })

    test('should start with 0 homes filled', async () => {
      const homes = await frogger.getHomesFilled()
      expect(homes).toBe(0)
    })

    test('should start with score 0', async () => {
      const score = await frogger.getScore()
      expect(score).toBe(0)
    })
  })

  test.describe('Movement', () => {
    test('should hop up', async () => {
      const initialPos = await frogger.getFrogPosition()

      await frogger.keyboard.press('ArrowUp')
      await frogger.page.waitForTimeout(250)

      const newPos = await frogger.getFrogPosition()
      // Up means lower row number
      expect(newPos?.row).toBeLessThan(initialPos!.row)
    })

    test('should hop down', async () => {
      // First hop up, then down
      await frogger.keyboard.press('ArrowUp')
      await frogger.page.waitForTimeout(250)

      const posAfterUp = await frogger.getFrogPosition()

      await frogger.keyboard.press('ArrowDown')
      await frogger.page.waitForTimeout(250)

      const newPos = await frogger.getFrogPosition()
      // Down means higher row number
      expect(newPos?.row).toBeGreaterThan(posAfterUp!.row)
    })

    test('should hop left', async () => {
      const initialPos = await frogger.getFrogPosition()

      await frogger.keyboard.press('ArrowLeft')
      await frogger.page.waitForTimeout(250)

      const newPos = await frogger.getFrogPosition()
      // Left means lower col number
      expect(newPos?.col).toBeLessThan(initialPos!.col)
    })

    test('should hop right', async () => {
      const initialPos = await frogger.getFrogPosition()

      await frogger.keyboard.press('ArrowRight')
      await frogger.page.waitForTimeout(250)

      const newPos = await frogger.getFrogPosition()
      // Right means higher col number
      expect(newPos?.col).toBeGreaterThan(initialPos!.col)
    })
  })

  test.describe('Game Controls', () => {
    test('should pause and resume', async () => {
      await frogger.pause()
      expect(await frogger.isPaused()).toBe(true)

      await frogger.resume()
      expect(await frogger.isRunning()).toBe(true)
    })
  })
})
