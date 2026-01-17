/**
 * Breakout Game Test Suite
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Breakout } from '../../../src/games/breakout/Breakout.js'

describe('Breakout', () => {
  let canvas, input, audio, game, mockCtx

  beforeEach(async () => {
    // Create mock canvas context
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

    // Create mock canvas
    canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 600
    canvas.getContext = vi.fn(() => mockCtx)

    // Mock input manager
    input = {
      update: vi.fn(),
      isJustPressed: vi.fn(() => false),
      isPressed: vi.fn(() => false),
      getDirection: vi.fn(() => ({ x: 0, y: 0 })),
    }

    // Mock audio manager
    audio = {
      play: vi.fn(),
    }

    // Create and initialize game
    game = new Breakout(canvas, input, audio)
    await game.init()
  })

  describe('initialization', () => {
    it('creates bricks', () => {
      expect(game.bricks.length).toBeGreaterThan(0)
    })

    it('creates correct brick grid for level 1', () => {
      // Level 1 should have full grid: 8 rows × 14 columns = 112 bricks
      expect(game.bricks.length).toBe(112)
    })

    it('creates paddle', () => {
      expect(game.paddle).toBeDefined()
      expect(game.paddle.width).toBe(100)
    })

    it('creates ball attached to paddle', () => {
      expect(game.balls.length).toBe(1)
      expect(game.balls[0].attached).toBe(true)
    })

    it('starts with 3 lives', () => {
      expect(game.lives).toBe(3)
    })

    it('starts at level 1', () => {
      expect(game.level).toBe(1)
    })

    it('starts with score 0', () => {
      expect(game.score).toBe(0)
    })
  })

  describe('static config', () => {
    it('has correct game id', () => {
      expect(Breakout.config.id).toBe('breakout')
    })

    it('has correct title', () => {
      expect(Breakout.config.title).toBe('Breakout')
    })

    it('starts with 3 lives', () => {
      expect(Breakout.config.startLives).toBe(3)
    })

    it('has highest score type', () => {
      expect(Breakout.config.highScoreType).toBe('highest')
    })
  })

  describe('paddle movement', () => {
    it('moves right with positive direction', () => {
      const initialX = game.paddle.x
      input.getDirection.mockReturnValue({ x: 1, y: 0 })
      game.update(16)
      expect(game.paddle.x).toBeGreaterThan(initialX)
    })

    it('moves left with negative direction', () => {
      game.paddle.x = 400
      input.getDirection.mockReturnValue({ x: -1, y: 0 })
      game.update(16)
      expect(game.paddle.x).toBeLessThan(400)
    })

    it('cannot move past left edge', () => {
      game.paddle.x = 0
      input.getDirection.mockReturnValue({ x: -1, y: 0 })
      game.update(16)
      expect(game.paddle.x).toBe(0)
    })

    it('cannot move past right edge', () => {
      game.paddle.x = canvas.width
      input.getDirection.mockReturnValue({ x: 1, y: 0 })
      game.update(16)
      expect(game.paddle.x).toBeLessThanOrEqual(canvas.width - game.paddle.width)
    })
  })

  describe('ball launching', () => {
    it('launches on action1 input', () => {
      input.isJustPressed.mockImplementation((key) => key === 'action1')
      game.update(16)
      expect(game.balls[0].attached).toBe(false)
      expect(game.balls[0].vy).toBeLessThan(0)
    })

    it('launches on start input', () => {
      input.isJustPressed.mockImplementation((key) => key === 'start')
      game.update(16)
      expect(game.balls[0].attached).toBe(false)
      expect(game.balls[0].vy).toBeLessThan(0)
    })

    it('plays sound on launch', () => {
      input.isJustPressed.mockImplementation((key) => key === 'action1')
      game.update(16)
      expect(audio.play).toHaveBeenCalledWith('game-start')
    })

    it('attached ball follows paddle', () => {
      const initialPaddleX = game.paddle.x
      input.getDirection.mockReturnValue({ x: 1, y: 0 })
      game.update(16)
      const newPaddleX = game.paddle.x
      expect(newPaddleX).not.toBe(initialPaddleX)
      expect(game.balls[0].x).toBe(newPaddleX + game.paddle.width / 2)
    })
  })

  describe('ball physics', () => {
    beforeEach(() => {
      // Launch the ball
      game.balls[0].attached = false
      game.balls[0].vx = 3
      game.balls[0].vy = -5
    })

    it('bounces off left wall', () => {
      game.balls[0].x = 5
      game.balls[0].vx = -5
      game.balls[0].vy = -3
      game.updateBall(game.balls[0])
      expect(game.balls[0].vx).toBeGreaterThan(0)
    })

    it('bounces off right wall', () => {
      game.balls[0].x = canvas.width - 5
      game.balls[0].vx = 5
      game.balls[0].vy = -3
      game.updateBall(game.balls[0])
      expect(game.balls[0].vx).toBeLessThan(0)
    })

    it('bounces off top wall', () => {
      game.balls[0].y = 5
      game.balls[0].vx = 3
      game.balls[0].vy = -5
      game.updateBall(game.balls[0])
      expect(game.balls[0].vy).toBeGreaterThan(0)
    })

    it('plays sound on wall collision', () => {
      game.balls[0].x = 5
      game.balls[0].vx = -5
      audio.play.mockClear()
      game.updateBall(game.balls[0])
      expect(audio.play).toHaveBeenCalledWith('hit')
    })

    it('returns false when ball falls off bottom', () => {
      game.balls[0].y = canvas.height + 10
      const result = game.updateBall(game.balls[0])
      expect(result).toBe(false)
    })

    it('bounces off paddle', () => {
      game.balls[0].x = game.paddle.x + game.paddle.width / 2
      game.balls[0].y = game.paddleY - 5
      game.balls[0].vx = 0
      game.balls[0].vy = 5
      game.updateBall(game.balls[0])
      expect(game.balls[0].vy).toBeLessThan(0)
    })

    it('paddle bounce angle varies by hit position', () => {
      // Hit left side of paddle
      game.balls[0].x = game.paddle.x + 10
      game.balls[0].y = game.paddleY - 5
      game.balls[0].vx = 0
      game.balls[0].vy = 5
      game.updateBall(game.balls[0])
      const leftVx = game.balls[0].vx

      // Reset and hit right side
      game.balls[0].x = game.paddle.x + game.paddle.width - 10
      game.balls[0].y = game.paddleY - 5
      game.balls[0].vx = 0
      game.balls[0].vy = 5
      game.updateBall(game.balls[0])
      const rightVx = game.balls[0].vx

      // Left side should produce negative vx, right side positive
      expect(leftVx).toBeLessThan(0)
      expect(rightVx).toBeGreaterThan(0)
    })
  })

  describe('brick collision', () => {
    beforeEach(() => {
      game.balls[0].attached = false
    })

    it('removes brick on collision', () => {
      const initialCount = game.bricks.length
      const brick = game.bricks[0]
      game.balls[0].x = brick.x + brick.width / 2
      game.balls[0].y = brick.y + brick.height + 5
      game.balls[0].vx = 0
      game.balls[0].vy = -5
      game.updateBall(game.balls[0])
      expect(game.bricks.length).toBeLessThan(initialCount)
    })

    it('adds score on brick destruction', () => {
      const initialScore = game.score
      const brick = game.bricks[0]
      game.balls[0].x = brick.x + brick.width / 2
      game.balls[0].y = brick.y + brick.height + 5
      game.balls[0].vx = 0
      game.balls[0].vy = -5
      game.updateBall(game.balls[0])
      expect(game.score).toBeGreaterThan(initialScore)
    })

    it('adds correct points for brick type', () => {
      // Find a brick in the bottom row to avoid hitting multiple bricks
      const bottomBricks = game.bricks.filter(
        (b) => b.y === Math.max(...game.bricks.map((brick) => brick.y))
      )
      const brick = bottomBricks[0]
      const expectedPoints = brick.points
      const initialScore = game.score

      game.balls[0].x = brick.x + brick.width / 2
      game.balls[0].y = brick.y + brick.height + game.ballRadius + 2
      game.balls[0].vx = 0
      game.balls[0].vy = -3 // Slow speed to avoid multiple collisions
      game.updateBall(game.balls[0])
      expect(game.score - initialScore).toBe(expectedPoints)
    })

    it('plays sound on brick collision', () => {
      const brick = game.bricks[0]
      game.balls[0].x = brick.x + brick.width / 2
      game.balls[0].y = brick.y + brick.height + 5
      game.balls[0].vx = 0
      game.balls[0].vy = -5
      audio.play.mockClear()
      game.updateBall(game.balls[0])
      expect(audio.play).toHaveBeenCalledWith('hit')
    })

    it('ball bounces after hitting brick', () => {
      // Find a brick in the bottom row to avoid hitting multiple bricks
      const bottomBricks = game.bricks.filter(
        (b) => b.y === Math.max(...game.bricks.map((brick) => brick.y))
      )
      const brick = bottomBricks[0]

      game.balls[0].x = brick.x + brick.width / 2
      game.balls[0].y = brick.y + brick.height + game.ballRadius + 2
      game.balls[0].vx = 0
      game.balls[0].vy = -3 // Slow speed to avoid double collision
      game.updateBall(game.balls[0])
      // Ball should reverse vertical direction (negative becomes positive)
      expect(game.balls[0].vy).toBeGreaterThan(0)
    })
  })

  describe('powerups', () => {
    it('spawns powerup with 20% chance', () => {
      // Use Math.random mock to ensure powerup spawns
      const originalRandom = Math.random
      Math.random = vi.fn(() => 0.1) // Less than 0.2

      const brick = game.bricks[0]
      game.balls[0].attached = false
      game.balls[0].x = brick.x + brick.width / 2
      game.balls[0].y = brick.y + brick.height + 5
      game.balls[0].vy = -5
      game.updateBall(game.balls[0])

      expect(game.powerups.length).toBeGreaterThan(0)
      Math.random = originalRandom
    })

    it('powerup falls down', () => {
      game.powerups.push({
        x: 100,
        y: 100,
        vy: 2,
        type: 'expand',
        label: 'E',
        color: '#39ff14',
      })
      const initialY = game.powerups[0].y
      game.updatePowerups()
      expect(game.powerups[0].y).toBeGreaterThan(initialY)
    })

    it('powerup removed when off screen', () => {
      game.powerups.push({
        x: 100,
        y: canvas.height + 10,
        vy: 2,
        type: 'expand',
        label: 'E',
        color: '#39ff14',
      })
      game.updatePowerups()
      expect(game.powerups.length).toBe(0)
    })

    it('expand increases paddle width', () => {
      const initialWidth = game.paddle.width
      game.applyPowerup('expand')
      expect(game.paddle.width).toBeGreaterThan(initialWidth)
    })

    it('expand caps at max width', () => {
      game.paddle.width = game.maxPaddleWidth
      game.applyPowerup('expand')
      expect(game.paddle.width).toBe(game.maxPaddleWidth)
    })

    it('shrink decreases paddle width', () => {
      const initialWidth = game.paddle.width
      game.applyPowerup('shrink')
      expect(game.paddle.width).toBeLessThan(initialWidth)
    })

    it('shrink caps at min width', () => {
      game.paddle.width = game.minPaddleWidth
      game.applyPowerup('shrink')
      expect(game.paddle.width).toBe(game.minPaddleWidth)
    })

    it('multiball adds second ball', () => {
      game.balls[0].attached = false
      game.balls[0].vx = 3
      game.balls[0].vy = -5
      game.applyPowerup('multiball')
      expect(game.balls.length).toBe(2)
    })

    it('multiball caps at 2 balls', () => {
      game.balls[0].attached = false
      game.balls.push({ x: 100, y: 100, vx: 3, vy: -5, attached: false })
      game.applyPowerup('multiball')
      expect(game.balls.length).toBe(2)
    })

    it('slow reduces ball speed', () => {
      game.balls[0].attached = false
      game.balls[0].vx = 4
      game.balls[0].vy = -5
      const initialSpeed = Math.sqrt(game.balls[0].vx ** 2 + game.balls[0].vy ** 2)
      game.applyPowerup('slow')
      const newSpeed = Math.sqrt(game.balls[0].vx ** 2 + game.balls[0].vy ** 2)
      expect(newSpeed).toBeLessThan(initialSpeed)
      expect(newSpeed).toBeCloseTo(initialSpeed * 0.7, 1)
    })

    it('fast increases ball speed', () => {
      game.balls[0].attached = false
      game.balls[0].vx = 4
      game.balls[0].vy = -5
      const initialSpeed = Math.sqrt(game.balls[0].vx ** 2 + game.balls[0].vy ** 2)
      game.applyPowerup('fast')
      const newSpeed = Math.sqrt(game.balls[0].vx ** 2 + game.balls[0].vy ** 2)
      expect(newSpeed).toBeGreaterThan(initialSpeed)
      expect(newSpeed).toBeCloseTo(initialSpeed * 1.3, 1)
    })

    it('life adds extra life', () => {
      const initialLives = game.lives
      game.applyPowerup('life')
      expect(game.lives).toBe(initialLives + 1)
    })

    it('powerup caught by paddle triggers effect', () => {
      game.powerups.push({
        x: game.paddle.x + game.paddle.width / 2,
        y: game.paddleY,
        vy: 2,
        type: 'expand',
        label: 'E',
        color: '#39ff14',
      })
      const initialWidth = game.paddle.width
      game.updatePowerups()
      expect(game.paddle.width).toBeGreaterThan(initialWidth)
      expect(game.powerups.length).toBe(0)
    })

    it('plays sound when powerup collected', () => {
      game.powerups.push({
        x: game.paddle.x + game.paddle.width / 2,
        y: game.paddleY,
        vy: 2,
        type: 'expand',
        label: 'E',
        color: '#39ff14',
      })
      audio.play.mockClear()
      game.updatePowerups()
      expect(audio.play).toHaveBeenCalledWith('powerup')
    })
  })

  describe('lives system', () => {
    it('loses life when all balls fall', () => {
      const initialLives = game.lives
      game.balls[0].attached = false
      game.balls[0].y = canvas.height + 10
      game.update(16)
      expect(game.lives).toBe(initialLives - 1)
    })

    it('resets ball after losing life', () => {
      game.balls[0].attached = false
      game.balls[0].y = canvas.height + 10
      game.update(16)
      expect(game.balls.length).toBe(1)
      expect(game.balls[0].attached).toBe(true)
    })

    it('plays death sound when losing life', () => {
      game.balls[0].attached = false
      game.balls[0].y = canvas.height + 10
      audio.play.mockClear()
      game.update(16)
      expect(audio.play).toHaveBeenCalledWith('death')
    })

    it('game over when no lives left', () => {
      game.lives = 1
      game.balls[0].attached = false
      game.balls[0].y = canvas.height + 10
      game.update(16)
      expect(game.state).toBe('gameover')
    })

    it('plays game over sound', () => {
      game.lives = 1
      game.balls[0].attached = false
      game.balls[0].y = canvas.height + 10
      audio.play.mockClear()
      game.update(16)
      expect(audio.play).toHaveBeenCalledWith('game-over')
    })
  })

  describe('level progression', () => {
    it('advances level when all bricks cleared', () => {
      game.bricks = []
      game.update(16)
      expect(game.level).toBe(2)
    })

    it('resets level after advancing', () => {
      game.bricks = []
      game.update(16)
      expect(game.bricks.length).toBeGreaterThan(0)
      expect(game.balls[0].attached).toBe(true)
    })

    it('increases ball speed with level', () => {
      const level1Speed = game.ballSpeed
      game.bricks = []
      game.update(16)
      const level2Speed = game.ballSpeed
      expect(level2Speed).toBeGreaterThan(level1Speed)
    })

    it('level 2 has checkerboard pattern', () => {
      game.level = 2
      game.generateBricks()
      // Level 2 should have fewer bricks than level 1
      expect(game.bricks.length).toBeLessThan(112)
      expect(game.bricks.length).toBeGreaterThan(0)
    })

    it('level 3 has different pattern', () => {
      game.level = 3
      game.generateBricks()
      expect(game.bricks.length).toBeLessThan(112)
      expect(game.bricks.length).toBeGreaterThan(0)
    })

    it('level 4 has different pattern', () => {
      game.level = 4
      game.generateBricks()
      expect(game.bricks.length).toBeGreaterThan(0)
    })

    it('level 5+ has random pattern', () => {
      game.level = 5
      game.generateBricks()
      expect(game.bricks.length).toBeGreaterThan(0)
      // Random pattern, should be less than full grid
      expect(game.bricks.length).toBeLessThan(112)
    })

    it('game ends after level 5', () => {
      game.level = 5
      game.bricks = []
      game.update(16)
      expect(game.level).toBe(6)
      expect(game.state).toBe('gameover')
    })

    it('plays powerup sound on level advance', () => {
      game.bricks = []
      audio.play.mockClear()
      game.update(16)
      expect(audio.play).toHaveBeenCalledWith('powerup')
    })
  })

  describe('rendering', () => {
    it('renders without errors', () => {
      const ctx = canvas.getContext('2d')
      expect(() => game.render(ctx)).not.toThrow()
    })

    it('clears canvas with background color', () => {
      const ctx = canvas.getContext('2d')
      const clearSpy = vi.spyOn(game, 'clear')
      game.render(ctx)
      expect(clearSpy).toHaveBeenCalledWith('#0a0a0f')
    })
  })

  describe('ball brick collision detection', () => {
    it('detects collision when ball touches brick', () => {
      const brick = {
        x: 100,
        y: 100,
        width: 55,
        height: 20,
      }
      const ball = {
        x: 100,
        y: 100,
        vx: 3,
        vy: -5,
      }
      const result = game.ballBrickCollision(ball, brick)
      expect(result).toBe(true)
    })

    it('no collision when ball far from brick', () => {
      const brick = {
        x: 100,
        y: 100,
        width: 55,
        height: 20,
      }
      const ball = {
        x: 300,
        y: 300,
        vx: 3,
        vy: -5,
      }
      const result = game.ballBrickCollision(ball, brick)
      expect(result).toBe(false)
    })

    it('reverses vx on horizontal collision', () => {
      const brick = {
        x: 100,
        y: 100,
        width: 55,
        height: 20,
      }
      const ball = {
        x: 95,
        y: 110,
        vx: 5,
        vy: 0,
      }
      game.ballBrickCollision(ball, brick)
      expect(ball.vx).toBe(-5)
    })

    it('reverses vy on vertical collision', () => {
      const brick = {
        x: 100,
        y: 100,
        width: 55,
        height: 20,
      }
      const ball = {
        x: 127,
        y: 95,
        vx: 0,
        vy: 5,
      }
      game.ballBrickCollision(ball, brick)
      expect(ball.vy).toBe(-5)
    })
  })
})
