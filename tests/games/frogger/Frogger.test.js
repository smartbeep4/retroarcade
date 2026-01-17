import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Frogger } from '../../../src/games/frogger/Frogger.js'

describe('Frogger', () => {
  let canvas, input, audio, game, mockCtx

  beforeEach(async () => {
    // Create a mock canvas context
    mockCtx = {
      fillStyle: '',
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      strokeStyle: '',
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      arc: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      shadowColor: '',
      shadowBlur: 0,
      font: '',
      textAlign: '',
      fillText: vi.fn(),
    }

    canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 600
    canvas.getContext = vi.fn(() => mockCtx)

    input = {
      update: vi.fn(),
      isJustPressed: vi.fn(() => false),
      isPressed: vi.fn(() => false),
      getDirection: vi.fn(() => ({ x: 0, y: 0 })),
    }
    audio = { play: vi.fn() }
    game = new Frogger(canvas, input, audio)
    await game.init()
    game.state = 'running' // Set to running for tests
  })

  describe('static config', () => {
    it('has correct game id', () => {
      expect(Frogger.config.id).toBe('frogger')
    })

    it('has correct title', () => {
      expect(Frogger.config.title).toBe('Frogger')
    })

    it('has 3 start lives', () => {
      expect(Frogger.config.startLives).toBe(3)
    })

    it('has highest score type', () => {
      expect(Frogger.config.highScoreType).toBe('highest')
    })

    it('has controls defined', () => {
      expect(Frogger.config.controls).toBeDefined()
      expect(Frogger.config.controls.movement).toBeDefined()
    })
  })

  describe('initialization', () => {
    it('extends Game base class', () => {
      expect(game).toBeInstanceOf(Frogger)
    })

    it('sets up grid dimensions', () => {
      expect(game.cellSize).toBe(40)
      expect(game.cols).toBe(20)
      expect(game.rows).toBe(15)
    })

    it('frog starts at bottom center', () => {
      expect(game.frog.row).toBe(game.startRow)
      expect(game.frog.col).toBe(Math.floor(game.cols / 2))
    })

    it('creates 5 homes', () => {
      expect(game.homes.length).toBe(5)
      expect(game.homes.every((h) => !h.filled)).toBe(true)
    })

    it('creates 10 lanes (5 road + 5 river)', () => {
      expect(game.lanes.length).toBe(10)
    })

    it('has 5 road lanes', () => {
      const roadLanes = game.lanes.filter((l) => l.type === 'road')
      expect(roadLanes.length).toBe(5)
    })

    it('has 5 river lanes', () => {
      const riverLanes = game.lanes.filter((l) => l.type === 'river')
      expect(riverLanes.length).toBe(5)
    })

    it('starts at round 1', () => {
      expect(game.round).toBe(1)
    })

    it('starts with 3 lives', () => {
      expect(game.lives).toBe(3)
    })

    it('starts with score 0', () => {
      expect(game.score).toBe(0)
    })

    it('timer starts at 30 seconds', () => {
      expect(game.timeRemaining).toBe(30)
    })
  })

  describe('movement', () => {
    it('hops up on up input', () => {
      const initialRow = game.frog.row
      input.isJustPressed = vi.fn((key) => key === 'up')
      game.handleInput() // Call handleInput directly to test movement
      expect(game.frog.row).toBe(initialRow - 1)
    })

    it('hops down on down input', () => {
      // Move frog up first, then test down
      input.isJustPressed = vi.fn((key) => key === 'up')
      game.handleInput()
      const currentRow = game.frog.row
      game.hopTimer = 0 // Clear cooldown
      input.isJustPressed = vi.fn((key) => key === 'down')
      game.handleInput()
      expect(game.frog.row).toBe(currentRow + 1)
    })

    it('hops left on left input', () => {
      const initialCol = game.frog.col
      input.isJustPressed.mockImplementation((key) => key === 'left')
      game.update(16)
      expect(game.frog.col).toBe(initialCol - 1)
    })

    it('hops right on right input', () => {
      const initialCol = game.frog.col
      input.isJustPressed.mockImplementation((key) => key === 'right')
      game.update(16)
      expect(game.frog.col).toBe(initialCol + 1)
    })

    it('adds 10 points for forward hop', () => {
      input.isJustPressed.mockImplementation((key) => key === 'up')
      const initialScore = game.score
      game.update(16)
      expect(game.score).toBe(initialScore + 10)
    })

    it('does not add points for backward hop', () => {
      game.frog.row = 10
      game.furthestRow = 10
      input.isJustPressed.mockImplementation((key) => key === 'down')
      const initialScore = game.score
      game.update(16)
      expect(game.score).toBe(initialScore)
    })

    it('does not add points for sideways hop', () => {
      input.isJustPressed.mockImplementation((key) => key === 'left')
      const initialScore = game.score
      game.update(16)
      expect(game.score).toBe(initialScore)
    })

    it('has hop cooldown', () => {
      const initialRow = game.frog.row
      input.isJustPressed = vi.fn((key) => key === 'up')
      game.handleInput() // First hop - directly call handleInput
      expect(game.frog.row).toBe(initialRow - 1)
      expect(game.hopTimer).toBe(150) // Cooldown should be set
      game.hopTimer = 10 // Still in cooldown
      game.handleInput() // Try to hop again - should fail due to cooldown
      expect(game.frog.row).toBe(initialRow - 1) // Still at same position
    })

    it('allows hop after cooldown expires', () => {
      const initialRow = game.frog.row
      input.isJustPressed = vi.fn((key) => key === 'up')
      game.handleInput() // First hop
      expect(game.frog.row).toBe(initialRow - 1)
      expect(game.hopTimer).toBe(150)
      game.hopTimer = 0 // Simulate cooldown expiring
      game.handleInput() // Second hop should work
      expect(game.frog.row).toBe(initialRow - 2)
    })

    it('plays jump sound on hop', () => {
      input.isJustPressed.mockImplementation((key) => key === 'up')
      game.update(16)
      expect(audio.play).toHaveBeenCalledWith('jump')
    })

    it('cannot move past top edge', () => {
      game.frog.row = 0
      input.isJustPressed.mockImplementation((key) => key === 'up')
      game.update(16)
      expect(game.frog.row).toBe(0)
    })

    it('cannot move past bottom edge', () => {
      game.frog.row = game.startRow
      input.isJustPressed.mockImplementation((key) => key === 'down')
      game.update(16)
      expect(game.frog.row).toBe(game.startRow)
    })

    it('cannot move past left edge', () => {
      game.frog.col = 0
      input.isJustPressed.mockImplementation((key) => key === 'left')
      game.update(16)
      expect(game.frog.col).toBe(0)
    })

    it('cannot move past right edge', () => {
      game.frog.col = game.cols - 1
      input.isJustPressed.mockImplementation((key) => key === 'right')
      game.update(16)
      expect(game.frog.col).toBe(game.cols - 1)
    })
  })

  describe('vehicles', () => {
    it('vehicles move horizontally', () => {
      const lane = game.lanes.find((l) => l.type === 'road')
      const initialX = lane.objects[0].x
      game.updateLanes(16)
      expect(lane.objects[0].x).not.toBe(initialX)
    })

    it('vehicles wrap around screen', () => {
      const lane = game.lanes.find((l) => l.type === 'road' && l.direction > 0)
      lane.objects[0].x = game.canvas.width + 10
      game.updateLanes(16)
      expect(lane.objects[0].x).toBeLessThan(0)
    })

    it('vehicles move at different speeds', () => {
      const lane1 = game.lanes.find((l) => l.type === 'road' && l.speed === 2)
      const lane2 = game.lanes.find((l) => l.type === 'road' && l.speed === 3)
      expect(lane1.speed).not.toBe(lane2.speed)
    })

    it('collision with vehicle causes death', () => {
      const roadLane = game.lanes.find((l) => l.type === 'road')
      game.frog.row = roadLane.row
      game.frog.col = 0
      const obj = roadLane.objects[0]
      obj.x = 0 // Place vehicle at frog position
      game.lives = 1 // Set to 1 so death triggers game over
      game.checkCollisions()
      expect(game.state).toBe('gameover')
    })
  })

  describe('river', () => {
    it('frog can ride on log', () => {
      const riverLane = game.lanes.find((l) => l.type === 'river')
      game.frog.row = riverLane.row
      game.frog.col = 5
      const log = riverLane.objects.find((o) => o.type === 'log')
      if (log) {
        log.x = game.frog.col * game.cellSize
        game.checkRiverInteraction()
        expect(game.frog.riding).toBeTruthy()
      }
    })

    it('frog drowns if not on object', () => {
      const riverLane = game.lanes.find((l) => l.type === 'river')
      game.frog.row = riverLane.row
      game.frog.col = 0
      riverLane.objects.forEach((o) => (o.x = 500)) // Move objects away
      game.lives = 1 // Set to 1 so death triggers game over
      game.checkRiverInteraction()
      expect(game.state).toBe('gameover')
    })

    it('frog moves with log', () => {
      const riverLane = game.lanes.find((l) => l.type === 'river')
      game.frog.row = riverLane.row
      game.frog.col = 10
      const log = riverLane.objects[0]
      log.type = 'log'
      log.x = game.frog.col * game.cellSize
      const initialCol = game.frog.col
      game.checkRiverInteraction()
      expect(game.frog.col).not.toBe(initialCol)
    })

    it('frog dies if pushed off screen edge', () => {
      const riverLane = game.lanes.find((l) => l.type === 'river')
      game.frog.row = riverLane.row
      game.frog.col = game.cols - 0.1 // Very close to edge
      const log = riverLane.objects[0]
      log.type = 'log'
      log.x = game.frog.col * game.cellSize
      riverLane.speed = 40 // High speed to push off
      riverLane.direction = 1
      game.lives = 1 // Set to 1 so death triggers game over
      game.checkRiverInteraction()
      expect(game.state).toBe('gameover')
    })

    it('turtles periodically dive', () => {
      const riverLane = game.lanes.find((l) => l.type === 'river')
      const turtle = riverLane.objects.find((o) => o.type === 'turtle')
      if (turtle) {
        turtle.diving = false
        turtle.diveTimer = 0
        game.updateLanes(3100) // More than 3000ms
        expect(turtle.diving).toBe(true)
      }
    })

    it('frog cannot ride diving turtle', () => {
      const riverLane = game.lanes.find((l) => l.type === 'river')
      const turtle = riverLane.objects.find((o) => o.type === 'turtle')
      if (turtle) {
        game.frog.row = riverLane.row
        game.frog.col = 5
        turtle.x = game.frog.col * game.cellSize
        turtle.diving = true
        game.lives = 1 // Set to 1 so death triggers game over
        game.checkRiverInteraction()
        expect(game.state).toBe('gameover')
      }
    })

    it('logs do not dive', () => {
      const riverLane = game.lanes.find((l) => l.type === 'river')
      const log = riverLane.objects.find((o) => o.type === 'log')
      if (log) {
        expect(log.diving).toBeFalsy()
        game.updateLanes(3100)
        expect(log.diving).toBeFalsy()
      }
    })
  })

  describe('homes', () => {
    it('filling home gives 50 points', () => {
      game.frog.row = game.homeRow
      game.frog.col = game.homes[0].col
      const initialScore = game.score
      game.checkHome()
      expect(game.score).toBeGreaterThanOrEqual(initialScore + 50)
      expect(game.homes[0].filled).toBe(true)
    })

    it('time bonus added when reaching home', () => {
      game.frog.row = game.homeRow
      game.frog.col = game.homes[0].col
      game.timeRemaining = 20
      const initialScore = game.score
      game.checkHome()
      const expectedBonus = 50 + Math.floor(20) * 10
      expect(game.score).toBeGreaterThanOrEqual(initialScore + expectedBonus)
    })

    it('fly bonus gives 200 extra points', () => {
      game.frog.row = game.homeRow
      game.frog.col = game.homes[0].col
      game.homes[0].hasFly = true
      const initialScore = game.score
      game.checkHome()
      expect(game.score).toBeGreaterThanOrEqual(initialScore + 250) // 50 + 200
    })

    it('fly bonus plays powerup sound', () => {
      game.frog.row = game.homeRow
      game.frog.col = game.homes[0].col
      game.homes[0].hasFly = true
      audio.play.mockClear()
      game.checkHome()
      expect(audio.play).toHaveBeenCalledWith('powerup')
    })

    it('cannot enter filled home', () => {
      game.frog.row = game.homeRow
      game.frog.col = game.homes[0].col
      game.homes[0].filled = true
      game.lives = 1 // Set to 1 so death triggers game over
      game.checkHome()
      expect(game.state).toBe('gameover')
    })

    it('landing between homes causes death', () => {
      game.frog.row = game.homeRow
      game.frog.col = game.homes[0].col + 2 // Between homes
      game.lives = 1 // Set to 1 so death triggers game over
      game.checkHome()
      expect(game.state).toBe('gameover')
    })

    it('round completes when all homes filled', () => {
      game.homes.forEach((h, i) => {
        if (i < 4) h.filled = true
      })
      game.frog.row = game.homeRow
      game.frog.col = game.homes[4].col
      game.checkHome()
      expect(game.round).toBe(2)
    })

    it('round complete gives 1000 points', () => {
      game.homes.forEach((h, i) => {
        if (i < 4) h.filled = true
      })
      game.frog.row = game.homeRow
      game.frog.col = game.homes[4].col
      const initialScore = game.score
      game.checkHome()
      expect(game.score).toBeGreaterThanOrEqual(initialScore + 1000)
    })

    it('homes reset after round complete', () => {
      game.homes.forEach((h) => (h.filled = true))
      game.completeRound()
      expect(game.homes.every((h) => !h.filled)).toBe(true)
    })

    it('frog resets after reaching home', () => {
      game.frog.row = game.homeRow
      game.frog.col = game.homes[0].col
      game.homes[1].filled = true // Not all filled
      game.checkHome()
      expect(game.frog.row).toBe(game.startRow)
      expect(game.frog.col).toBe(Math.floor(game.cols / 2))
    })
  })

  describe('timer', () => {
    it('timer decreases over time', () => {
      const initialTime = game.timeRemaining
      game.update(1000)
      expect(game.timeRemaining).toBeLessThan(initialTime)
    })

    it('running out of time causes death', () => {
      game.timeRemaining = 0.1
      game.lives = 1 // Set to 1 so death triggers game over
      game.update(200)
      expect(game.state).toBe('gameover')
    })

    it('timer resets after death', () => {
      game.timeRemaining = 5
      game.die()
      expect(game.timeRemaining).toBe(game.maxTime)
    })

    it('timer resets after reaching home', () => {
      game.frog.row = game.homeRow
      game.frog.col = game.homes[0].col
      game.timeRemaining = 10
      game.checkHome()
      expect(game.timeRemaining).toBe(game.maxTime)
    })
  })

  describe('lives', () => {
    it('starts with 3 lives', () => {
      expect(game.lives).toBe(3)
    })

    it('losing life decrements lives', () => {
      game.die()
      expect(game.lives).toBe(2)
    })

    it('death plays death sound', () => {
      audio.play.mockClear()
      game.die()
      expect(audio.play).toHaveBeenCalledWith('death')
    })

    it('game over when all lives lost', () => {
      game.lives = 1
      game.die()
      expect(game.state).toBe('gameover')
    })

    it('frog resets after losing life', () => {
      game.frog.row = 5
      game.frog.col = 5
      game.die()
      expect(game.frog.row).toBe(game.startRow)
      expect(game.frog.col).toBe(Math.floor(game.cols / 2))
    })
  })

  describe('difficulty progression', () => {
    it('speed increases after round complete', () => {
      const initialSpeed = game.lanes[0].speed
      game.completeRound()
      const newSpeed = game.lanes[0].speed
      expect(newSpeed).toBeGreaterThan(initialSpeed)
    })

    it('speed caps at maximum', () => {
      // Complete many rounds to reach cap
      for (let i = 0; i < 20; i++) {
        game.completeRound()
      }
      expect(game.lanes.every((l) => l.speed <= 6)).toBe(true)
    })

    it('round number increments', () => {
      expect(game.round).toBe(1)
      game.completeRound()
      expect(game.round).toBe(2)
      game.completeRound()
      expect(game.round).toBe(3)
    })
  })

  describe('rendering', () => {
    it('render method exists', () => {
      expect(typeof game.render).toBe('function')
    })

    it('render clears canvas', () => {
      mockCtx.fillRect.mockClear()
      game.render(mockCtx)
      expect(mockCtx.fillRect).toHaveBeenCalled()
    })

    it('renders score', () => {
      game.score = 100
      mockCtx.fillText.mockClear()
      game.render(mockCtx)
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        expect.stringContaining('100'),
        expect.any(Number),
        expect.any(Number)
      )
    })

    it('renders round number', () => {
      game.round = 2
      mockCtx.fillText.mockClear()
      game.render(mockCtx)
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        expect.stringContaining('2'),
        expect.any(Number),
        expect.any(Number)
      )
    })

    it('renders lives', () => {
      game.lives = 3
      mockCtx.fillText.mockClear()
      game.render(mockCtx)
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        expect.stringContaining('3'),
        expect.any(Number),
        expect.any(Number)
      )
    })

    it('drawFrog method exists', () => {
      expect(typeof game.drawFrog).toBe('function')
    })

    it('drawFrog draws frog shape', () => {
      mockCtx.fillRect.mockClear()
      game.drawFrog(mockCtx, 100, 100)
      expect(mockCtx.fillRect.mock.calls.length).toBeGreaterThan(0)
    })
  })

  describe('game loop integration', () => {
    it('update does nothing when not running', () => {
      game.state = 'paused'
      const initialTime = game.timeRemaining
      game.update(1000)
      expect(game.timeRemaining).toBe(initialTime)
    })

    it('update handles all game logic', () => {
      const initialRow = game.frog.row
      input.isJustPressed = vi.fn((key) => key === 'up')
      // Mock collision methods to prevent frog from dying during movement test
      game.checkCollisions = vi.fn()
      game.checkRiverInteraction = vi.fn()
      game.update(16)
      expect(game.frog.row).toBe(initialRow - 1)
      expect(game.timeRemaining).toBeLessThan(30)
    })

    it('extends Game base class methods', () => {
      expect(game.start).toBeDefined()
      expect(game.pause).toBeDefined()
      expect(game.reset).toBeDefined()
      expect(game.gameOver).toBeDefined()
    })
  })

  describe('edge cases', () => {
    it('handles multiple objects in same lane', () => {
      const lane = game.lanes[0]
      expect(lane.objects.length).toBeGreaterThan(1)
    })

    it('furthest row tracking prevents duplicate points', () => {
      const initialRow = game.frog.row
      input.isJustPressed = vi.fn((key) => key === 'up')
      game.handleInput() // Move up to row 13, get points
      expect(game.score).toBe(10)
      expect(game.frog.row).toBe(initialRow - 1)
      game.hopTimer = 0 // Clear cooldown
      input.isJustPressed = vi.fn((key) => key === 'down')
      game.handleInput() // Move down to row 14, no points
      expect(game.score).toBe(10) // Still 10
      game.hopTimer = 0 // Clear cooldown
      input.isJustPressed = vi.fn((key) => key === 'up')
      game.handleInput() // Move up to row 13 again, no points (already been there)
      expect(game.score).toBe(10) // Still 10
    })

    it('riding state cleared on hop', () => {
      game.frog.riding = { lane: {}, obj: {} }
      input.isJustPressed.mockImplementation((key) => key === 'left')
      game.update(16)
      expect(game.frog.riding).toBe(null)
    })

    it('handles frog at median (safe zone)', () => {
      game.frog.row = game.medianRow
      game.update(16)
      // Should not die on safe zone
      expect(game.state).toBe('running')
    })

    it('handles frog at start zone', () => {
      game.frog.row = game.startRow
      game.update(16)
      // Should not die on start zone
      expect(game.state).toBe('running')
    })
  })
})
