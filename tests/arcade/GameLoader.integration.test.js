import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { GameLoader } from '../../src/arcade/GameLoader.js'

// Helper to create mock canvas with context
function createMockCanvas() {
  const mockCanvas = document.createElement('canvas')
  mockCanvas.width = 800
  mockCanvas.height = 600
  const mockCtx = {
    fillStyle: '',
    fillRect: () => {},
    strokeStyle: '',
    strokeRect: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    clearRect: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    rotate: () => {},
    scale: () => {},
    font: '',
    textAlign: '',
    fillText: () => {},
    shadowColor: '',
    shadowBlur: 0,
  }
  mockCanvas.getContext = () => mockCtx
  return mockCanvas
}

describe('GameLoader - Integration Tests', () => {
  let gameLoader

  beforeEach(() => {
    gameLoader = new GameLoader()
  })

  afterEach(async () => {
    await gameLoader.unloadGame()
  })

  describe('real game loading', () => {
    it('successfully loads snake game module', async () => {
      const GameClass = await gameLoader.loadGame('snake')

      expect(GameClass).toBeDefined()
      expect(typeof GameClass).toBe('function')
      expect(gameLoader.getCurrentGameId()).toBe('snake')
    })

    it('can instantiate loaded game class', async () => {
      const GameClass = await gameLoader.loadGame('snake')

      // Create mock dependencies
      const mockCanvas = createMockCanvas()
      const mockInput = { update: () => {}, isJustPressed: () => false }
      const mockAudio = { play: () => {} }

      // Instantiate the game
      const gameInstance = new GameClass(mockCanvas, mockInput, mockAudio)
      gameLoader.setCurrentGame(gameInstance)

      expect(gameInstance).toBeDefined()
      expect(gameInstance.constructor.config.title).toBe('Snake')
      expect(gameInstance.score).toBe(0)
      expect(typeof gameInstance.init).toBe('function')
      expect(typeof gameInstance.start).toBe('function')
      expect(typeof gameInstance.destroy).toBe('function')
    })

    it('initializes and runs loaded game', async () => {
      const GameClass = await gameLoader.loadGame('snake')

      const mockCanvas = createMockCanvas()
      const mockInput = { update: () => {}, isJustPressed: () => false }
      const mockAudio = { play: () => {} }

      const gameInstance = new GameClass(mockCanvas, mockInput, mockAudio)
      gameLoader.setCurrentGame(gameInstance)

      await gameInstance.init()
      gameInstance.start()

      expect(gameInstance.state).toBe('running')
    })

    it('properly cleans up loaded game', async () => {
      const GameClass = await gameLoader.loadGame('snake')

      const mockCanvas = createMockCanvas()
      const mockInput = { update: () => {}, isJustPressed: () => false }
      const mockAudio = { play: () => {} }

      const gameInstance = new GameClass(mockCanvas, mockInput, mockAudio)
      gameLoader.setCurrentGame(gameInstance)

      await gameInstance.init()
      gameInstance.start()

      expect(gameInstance.state).toBe('running')

      await gameLoader.unloadGame()

      expect(gameLoader.getCurrentGame()).toBeNull()
      expect(gameLoader.getCurrentGameId()).toBeNull()
    })

    it('handles loading game that does not exist', async () => {
      await expect(gameLoader.loadGame('non-existent-game-xyz')).rejects.toThrow()

      expect(gameLoader.getCurrentGame()).toBeNull()
      expect(gameLoader.getCurrentGameId()).toBeNull()
    })

    it('loads multiple games sequentially', async () => {
      // Load first game
      const GameClass1 = await gameLoader.loadGame('snake')
      const mockCanvas = createMockCanvas()
      const mockInput = { update: () => {}, isJustPressed: () => false }
      const mockAudio = { play: () => {} }

      const game1 = new GameClass1(mockCanvas, mockInput, mockAudio)
      gameLoader.setCurrentGame(game1)

      expect(gameLoader.getCurrentGameId()).toBe('snake')
      expect(gameLoader.hasGame()).toBe(true)

      // Load second game (should unload first)
      const GameClass2 = await gameLoader.loadGame('snake') // Load same game again
      const game2 = new GameClass2(mockCanvas, mockInput, mockAudio)
      gameLoader.setCurrentGame(game2)

      expect(gameLoader.getCurrentGameId()).toBe('snake')
      expect(gameLoader.hasGame()).toBe(true)
      expect(game2).not.toBe(game1) // Should be different instance
    })
  })

  describe('error scenarios with real modules', () => {
    it('provides clear error for missing game', async () => {
      try {
        await gameLoader.loadGame('nonexistent-game-xyz') // Doesn't exist
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error.message).toContain('nonexistent-game-xyz')
        expect(
          error.message.toLowerCase().includes('not found') ||
            error.message.toLowerCase().includes('failed to load')
        ).toBe(true)
      }
    })

    it('maintains clean state after load failure', async () => {
      // Set up initial game
      const GameClass = await gameLoader.loadGame('snake')
      const mockCanvas = createMockCanvas()
      const mockInput = { update: () => {}, isJustPressed: () => false }
      const mockAudio = { play: () => {} }

      const game1 = new GameClass(mockCanvas, mockInput, mockAudio)
      gameLoader.setCurrentGame(game1)

      expect(gameLoader.hasGame()).toBe(true)

      // Try to load non-existent game
      try {
        await gameLoader.loadGame('invalid-game')
      } catch {
        // Expected to fail
      }

      // State should be cleared
      expect(gameLoader.getCurrentGame()).toBeNull()
      expect(gameLoader.getCurrentGameId()).toBeNull()
      expect(gameLoader.hasGame()).toBe(false)
    })
  })

  describe('complete game lifecycle', () => {
    it('handles full game lifecycle: load -> init -> start -> pause -> resume -> destroy', async () => {
      // Load
      const GameClass = await gameLoader.loadGame('snake')
      const mockCanvas = createMockCanvas()
      const mockInput = { update: () => {}, isJustPressed: () => false }
      const mockAudio = { play: () => {} }

      // Instantiate
      const game = new GameClass(mockCanvas, mockInput, mockAudio)
      gameLoader.setCurrentGame(game)

      expect(game.state).toBe('idle')

      // Init
      await game.init()
      expect(game.score).toBe(0)

      // Start
      game.start()
      expect(game.state).toBe('running')

      // Pause
      game.pause()
      expect(game.state).toBe('paused')

      // Resume
      game.resume()
      expect(game.state).toBe('running')

      // Destroy via unloadGame
      await gameLoader.unloadGame()
      expect(gameLoader.hasGame()).toBe(false)
    })
  })
})
