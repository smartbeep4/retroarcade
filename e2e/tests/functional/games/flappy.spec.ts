import { test, expect } from '@playwright/test'
import { FlappyPage } from '../../../page-objects/games/flappy.page'

test.describe('Flappy Bird Functional Tests', () => {
  let flappy: FlappyPage

  test.beforeEach(async ({ page }) => {
    flappy = new FlappyPage(page)
    await flappy.launch()
  })

  test.describe('Initial State', () => {
    test('should have bird at starting position', async () => {
      const birdY = await flappy.getBirdY()
      expect(birdY).toBeGreaterThan(0)
    })

    test('should start with score 0', async () => {
      const score = await flappy.getScore()
      expect(score).toBe(0)
    })
  })

  test.describe('Flapping Mechanics', () => {
    test('should flap (jump) when action key pressed', async () => {
      const initialY = await flappy.getBirdY()

      await flappy.keyboard.press(' ')
      await flappy.page.waitForTimeout(200)

      const newY = await flappy.getBirdY()
      // Bird should have moved up (lower y value) after flap
      expect(newY).toBeLessThan(initialY)
    })

    test('should apply gravity over time', async () => {
      await flappy.keyboard.press(' ')
      await flappy.page.waitForTimeout(100)
      const yAfterFlap = await flappy.getBirdY()

      // Wait for gravity to take effect
      await flappy.page.waitForTimeout(500)

      const yAfterGravity = await flappy.getBirdY()
      // Bird should have fallen (higher y value)
      expect(yAfterGravity).toBeGreaterThan(yAfterFlap)
    })

    test('should allow multiple flaps', async () => {
      await flappy.flapMultiple(3, 200)

      // Game should still be running
      const isRunning = await flappy.isRunning()
      expect(isRunning).toBe(true)
    })
  })

  test.describe('Game Controls', () => {
    test('should pause and resume', async () => {
      await flappy.flap() // Start the game
      await flappy.waitFrames(10)

      await flappy.pause()
      expect(await flappy.isPaused()).toBe(true)

      await flappy.resume()
      expect(await flappy.isRunning()).toBe(true)
    })
  })
})
