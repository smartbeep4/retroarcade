import { test, expect } from '@playwright/test'
import { TetrisPage } from '../../../page-objects/games/tetris.page'

test.describe('Tetris Functional Tests', () => {
  let tetris: TetrisPage

  test.beforeEach(async ({ page }) => {
    tetris = new TetrisPage(page)
    await tetris.launch()
  })

  test.describe('Initial State', () => {
    test('should have current piece', async () => {
      const pieceType = await tetris.getCurrentPieceType()
      expect(pieceType).not.toBeNull()
    })

    test('should have next piece preview', async () => {
      const nextPiece = await tetris.getNextPieceType()
      expect(nextPiece).not.toBeNull()
    })

    test('should start with 0 lines cleared', async () => {
      const lines = await tetris.getLinesCleared()
      expect(lines).toBe(0)
    })

    test('should start with score 0', async () => {
      const score = await tetris.getScore()
      expect(score).toBe(0)
    })
  })

  test.describe('Piece Movement', () => {
    test('should move piece left', async () => {
      const initialPos = await tetris.getPiecePosition()

      // Hold left to move piece
      await tetris.keyboard.holdFor('ArrowLeft', 300)
      await tetris.page.waitForTimeout(100)

      const newPos = await tetris.getPiecePosition()
      expect(newPos?.x).toBeLessThan(initialPos!.x)
    })

    test('should move piece right', async () => {
      const initialPos = await tetris.getPiecePosition()

      // Hold right to move piece
      await tetris.keyboard.holdFor('ArrowRight', 300)
      await tetris.page.waitForTimeout(100)

      const newPos = await tetris.getPiecePosition()
      expect(newPos?.x).toBeGreaterThan(initialPos!.x)
    })

    test('should soft drop piece', async () => {
      const initialPos = await tetris.getPiecePosition()

      // Hold down to soft drop
      await tetris.keyboard.holdFor('ArrowDown', 300)
      await tetris.page.waitForTimeout(100)

      const newPos = await tetris.getPiecePosition()
      expect(newPos?.y).toBeGreaterThan(initialPos!.y)
    })
  })

  test.describe('Rotation', () => {
    test('should rotate piece', async () => {
      // Just verify rotation doesn't crash and game continues
      await tetris.rotate()
      await tetris.waitFrames(5)

      const isRunning = await tetris.isRunning()
      expect(isRunning).toBe(true)
    })
  })

  test.describe('Game Controls', () => {
    test('should pause and resume', async () => {
      await tetris.pause()
      expect(await tetris.isPaused()).toBe(true)

      await tetris.resume()
      expect(await tetris.isRunning()).toBe(true)
    })
  })
})
