import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SpaceInvaders } from '../../../src/games/space-invaders/SpaceInvaders.js'

describe('SpaceInvaders', () => {
  let canvas, input, audio, game, mockCtx

  beforeEach(async () => {
    canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 600

    // Mock canvas context
    mockCtx = {
      fillStyle: '',
      strokeStyle: '',
      shadowColor: '',
      shadowBlur: 0,
      lineWidth: 1,
      font: '',
      textAlign: '',
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      ellipse: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn(),
      strokeText: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
    }

    // Mock getContext to return our mock context
    canvas.getContext = vi.fn(() => mockCtx)

    input = {
      update: vi.fn(),
      isJustPressed: vi.fn(() => false),
      isPressed: vi.fn(() => false),
      getDirection: vi.fn(() => ({ x: 0, y: 0 })),
    }
    audio = { play: vi.fn() }
    game = new SpaceInvaders(canvas, input, audio)
    await game.init()
  })

  describe('initialization', () => {
    it('creates 55 aliens (11x5)', () => {
      expect(game.aliens.length).toBe(55)
    })

    it('creates 4 shields with blocks', () => {
      expect(game.shields.length).toBeGreaterThan(0)
      // 4 shields * ~18 blocks each (6x4 grid with some corners removed)
      expect(game.shields.length).toBeGreaterThan(60)
    })

    it('starts with 3 lives', () => {
      expect(game.lives).toBe(3)
    })

    it('starts at wave 1', () => {
      expect(game.wave).toBe(1)
    })

    it('initializes all aliens as alive', () => {
      expect(game.aliens.every((a) => a.alive)).toBe(true)
    })

    it('sets player at bottom center', () => {
      expect(game.player.x).toBeGreaterThan(0)
      expect(game.playerY).toBe(canvas.height - 60)
    })

    it('has correct alien types and points', () => {
      // Row 0: Type A (30 points)
      expect(game.aliens[0].type).toBe('A')
      expect(game.aliens[0].points).toBe(30)

      // Row 1-2: Type B (20 points)
      expect(game.aliens[11].type).toBe('B')
      expect(game.aliens[11].points).toBe(20)

      // Row 3-4: Type C (10 points)
      expect(game.aliens[33].type).toBe('C')
      expect(game.aliens[33].points).toBe(10)
    })
  })

  describe('player', () => {
    it('moves left with input', () => {
      const initialX = game.player.x
      input.getDirection.mockReturnValue({ x: -1, y: 0 })
      game.update(16)
      expect(game.player.x).toBeLessThan(initialX)
    })

    it('moves right with input', () => {
      const initialX = game.player.x
      input.getDirection.mockReturnValue({ x: 1, y: 0 })
      game.update(16)
      expect(game.player.x).toBeGreaterThan(initialX)
    })

    it('cannot move past left edge', () => {
      game.player.x = 0
      input.getDirection.mockReturnValue({ x: -1, y: 0 })
      game.update(16)
      expect(game.player.x).toBe(0)
    })

    it('cannot move past right edge', () => {
      game.player.x = canvas.width - game.playerWidth
      input.getDirection.mockReturnValue({ x: 1, y: 0 })
      game.update(16)
      expect(game.player.x).toBe(canvas.width - game.playerWidth)
    })

    it('fires bullet on action1', () => {
      input.isJustPressed.mockImplementation((key) => key === 'action1')
      game.update(16)
      expect(game.playerBullet).not.toBeNull()
      expect(audio.play).toHaveBeenCalledWith('shoot')
    })

    it('fires bullet on up', () => {
      input.isJustPressed.mockImplementation((key) => key === 'up')
      game.update(16)
      expect(game.playerBullet).not.toBeNull()
    })

    it('only one bullet at a time', () => {
      game.playerBullet = { x: 100, y: 100 }
      input.isJustPressed.mockImplementation((key) => key === 'action1')
      game.updatePlayer()
      // Should still be same bullet position
      expect(game.playerBullet.x).toBe(100)
      expect(game.playerBullet.y).toBe(100)
    })

    it('centers bullet on player', () => {
      game.player.x = 200
      input.isJustPressed.mockImplementation((key) => key === 'action1')
      game.updatePlayer()
      const expectedX = 200 + game.playerWidth / 2 - game.bulletWidth / 2
      expect(game.playerBullet.x).toBe(expectedX)
    })
  })

  describe('player bullet', () => {
    it('moves upward', () => {
      game.playerBullet = { x: 100, y: 200 }
      const initialY = game.playerBullet.y
      game.updatePlayerBullet()
      expect(game.playerBullet.y).toBeLessThan(initialY)
    })

    it('is removed when off screen', () => {
      game.playerBullet = { x: 100, y: -20 }
      game.updatePlayerBullet()
      expect(game.playerBullet).toBeNull()
    })

    it('destroys alien on hit', () => {
      const alien = game.aliens[0]
      game.playerBullet = { x: alien.x + 10, y: alien.y + 10 }
      const initialScore = game.score
      game.updatePlayerBullet()
      expect(alien.alive).toBe(false)
      expect(game.score).toBe(initialScore + alien.points)
      expect(game.playerBullet).toBeNull()
      expect(audio.play).toHaveBeenCalledWith('explosion')
    })

    it('destroys shield block on hit', () => {
      const initialCount = game.shields.length
      const shield = game.shields[0]
      game.playerBullet = { x: shield.x + 1, y: shield.y + 1 }
      game.updatePlayerBullet()
      expect(game.shields.length).toBe(initialCount - 1)
    })

    it('destroys UFO on hit', () => {
      game.ufo = { x: 100, y: 30, points: 100 }
      game.playerBullet = { x: 110, y: 35 }
      const initialScore = game.score
      game.updatePlayerBullet()
      expect(game.ufo).toBeNull()
      expect(game.score).toBe(initialScore + 100)
      expect(game.playerBullet).toBeNull()
    })
  })

  describe('aliens', () => {
    it('move sideways after interval', () => {
      const initialX = game.aliens[0].x
      game.alienMoveTimer = game.alienMoveInterval
      game.updateAliens(16)
      expect(game.aliens[0].x).not.toBe(initialX)
    })

    it('do not move before interval', () => {
      const initialX = game.aliens[0].x
      game.alienMoveTimer = 0
      game.updateAliens(16)
      expect(game.aliens[0].x).toBe(initialX)
    })

    it('drop and reverse at right edge', () => {
      // Position aliens at right edge
      game.aliens.forEach((a) => (a.x = canvas.width - game.alienWidth - 5))
      const initialY = game.aliens[0].y
      game.alienDirection = 1
      game.alienMoveTimer = game.alienMoveInterval
      game.updateAliens(16)
      expect(game.aliens[0].y).toBeGreaterThan(initialY)
      expect(game.alienDirection).toBe(-1)
    })

    it('drop and reverse at left edge', () => {
      // Position aliens at left edge
      game.aliens.forEach((a) => (a.x = 5))
      const initialY = game.aliens[0].y
      game.alienDirection = -1
      game.alienMoveTimer = game.alienMoveInterval
      game.updateAliens(16)
      expect(game.aliens[0].y).toBeGreaterThan(initialY)
      expect(game.alienDirection).toBe(1)
    })

    it('game over when aliens reach player', () => {
      // Position aliens near player
      game.aliens.forEach((a) => (a.y = game.playerY - game.alienHeight - 5))
      game.aliens.forEach((a) => (a.x = 5))
      game.alienDirection = -1
      game.alienMoveTimer = game.alienMoveInterval
      game.state = 'running'
      game.updateAliens(16)
      expect(game.state).toBe('gameover')
    })

    it('can fire bullets', () => {
      game.alienMoveTimer = game.alienMoveInterval
      // Mock random to ensure firing
      const mathRandom = Math.random
      Math.random = () => 0.1
      game.updateAliens(16)
      Math.random = mathRandom
      expect(game.alienBullets.length).toBeGreaterThan(0)
    })

    it('speed up as aliens are destroyed', () => {
      const initialInterval = game.alienMoveInterval
      // Kill half the aliens
      for (let i = 0; i < 27; i++) {
        game.aliens[i].alive = false
      }
      game.updateAlienSpeed()
      expect(game.alienMoveInterval).toBeLessThan(initialInterval)
    })
  })

  describe('alien bullets', () => {
    it('move downward', () => {
      game.alienBullets.push({ x: 100, y: 100 })
      game.updateAlienBullets()
      expect(game.alienBullets[0].y).toBeGreaterThan(100)
    })

    it('are removed when off screen', () => {
      game.alienBullets.push({ x: 100, y: canvas.height + 10 })
      game.updateAlienBullets()
      expect(game.alienBullets.length).toBe(0)
    })

    it('hit player and lose life', () => {
      const bullet = {
        x: game.player.x + 10,
        y: game.playerY + 10,
      }
      game.alienBullets.push(bullet)
      const initialLives = game.lives
      game.state = 'running'
      game.updateAlienBullets()
      expect(game.lives).toBe(initialLives - 1)
      expect(audio.play).toHaveBeenCalledWith('death')
    })

    it('game over when last life lost', () => {
      game.lives = 1
      game.state = 'running'
      const bullet = {
        x: game.player.x + 10,
        y: game.playerY + 10,
      }
      game.alienBullets.push(bullet)
      game.updateAlienBullets()
      expect(game.lives).toBe(0)
      expect(game.state).toBe('gameover')
    })

    it('destroy shield blocks', () => {
      const initialCount = game.shields.length
      const shield = game.shields[0]
      game.alienBullets.push({ x: shield.x + 1, y: shield.y + 1 })
      game.updateAlienBullets()
      expect(game.shields.length).toBe(initialCount - 1)
      expect(game.alienBullets.length).toBe(0)
    })
  })

  describe('shields', () => {
    it('are created on wave 1', () => {
      expect(game.shields.length).toBeGreaterThan(0)
    })

    it('persist across waves', () => {
      const shieldCount = game.shields.length
      // Remove some shields
      game.shields = game.shields.slice(0, shieldCount - 10)
      game.wave = 2
      game.resetWave()
      // Should still have reduced count
      expect(game.shields.length).toBe(shieldCount - 10)
    })

    it('have correct shape (corners removed)', () => {
      // Shield blocks are created with corners removed
      // Total should be less than 4 * (6 * 4) = 96 due to removed corners
      expect(game.shields.length).toBeLessThan(96)
      expect(game.shields.length).toBeGreaterThan(60)

      // Verify all shield blocks have proper dimensions
      game.shields.forEach((shield) => {
        expect(shield.width).toBe(10)
        expect(shield.height).toBe(10)
        expect(shield.x).toBeGreaterThanOrEqual(0)
        expect(shield.y).toBe(game.shieldY + Math.floor((shield.y - game.shieldY) / 10) * 10)
      })
    })
  })

  describe('UFO', () => {
    it('spawns after interval', () => {
      game.ufoTimer = game.ufoSpawnInterval + 100
      game.updateUFO(16)
      expect(game.ufo).not.toBeNull()
    })

    it('does not spawn before interval', () => {
      game.ufoTimer = game.ufoSpawnInterval - 100
      game.updateUFO(16)
      expect(game.ufo).toBeNull()
    })

    it('moves horizontally', () => {
      game.ufo = { x: 100, y: 30, direction: 1, points: 100 }
      const initialX = game.ufo.x
      game.updateUFO(16)
      expect(game.ufo.x).not.toBe(initialX)
    })

    it('is removed when off screen', () => {
      game.ufo = { x: -100, y: 30, direction: -1, points: 100 }
      game.updateUFO(16)
      expect(game.ufo).toBeNull()
    })

    it('has random point values', () => {
      const points = new Set()
      for (let i = 0; i < 20; i++) {
        game.ufoTimer = game.ufoSpawnInterval
        game.updateUFO(16)
        if (game.ufo) {
          points.add(game.ufo.points)
          game.ufo = null
        }
      }
      // Should have multiple different point values
      expect(points.size).toBeGreaterThan(1)
    })
  })

  describe('wave progression', () => {
    it('advances wave when all aliens destroyed', () => {
      game.aliens.forEach((a) => (a.alive = false))
      game.checkWaveComplete()
      expect(game.wave).toBe(2)
      expect(audio.play).toHaveBeenCalledWith('powerup')
    })

    it('creates new aliens on new wave', () => {
      game.aliens.forEach((a) => (a.alive = false))
      game.checkWaveComplete()
      expect(game.aliens.every((a) => a.alive)).toBe(true)
    })

    it('increases difficulty each wave', () => {
      const wave1Interval = game.alienMoveInterval
      game.aliens.forEach((a) => (a.alive = false))
      game.checkWaveComplete()
      const wave2Interval = game.alienMoveInterval
      expect(wave2Interval).toBeLessThan(wave1Interval)
    })

    it('aliens start lower each wave', () => {
      const wave1Y = game.aliens[0].y
      game.aliens.forEach((a) => (a.alive = false))
      game.checkWaveComplete()
      const wave2Y = game.aliens[0].y
      expect(wave2Y).toBeGreaterThan(wave1Y)
    })

    it('game over after wave 5', () => {
      game.wave = 5
      game.state = 'running'
      game.aliens.forEach((a) => (a.alive = false))
      game.checkWaveComplete()
      expect(game.wave).toBe(6)
      expect(game.state).toBe('gameover')
    })

    it('awards bonus points on victory', () => {
      game.wave = 5
      game.state = 'running'
      const initialScore = game.score
      game.aliens.forEach((a) => (a.alive = false))
      game.checkWaveComplete()
      expect(game.score).toBeGreaterThan(initialScore)
    })
  })

  describe('collision detection', () => {
    it('detects bullet hitting rect', () => {
      const bullet = { x: 100, y: 100 }
      const rect = { x: 95, y: 95 }
      const hit = game.bulletHitsRect(bullet, 15, rect, 40, 30)
      expect(hit).toBe(true)
    })

    it('detects no collision when apart', () => {
      const bullet = { x: 100, y: 100 }
      const rect = { x: 200, y: 200 }
      const hit = game.bulletHitsRect(bullet, 15, rect, 40, 30)
      expect(hit).toBe(false)
    })

    it('handles custom Y position', () => {
      const bullet = { x: 100, y: 100 }
      const rect = { x: 95 }
      const hit = game.bulletHitsRect(bullet, 15, rect, 40, 30, 95)
      expect(hit).toBe(true)
    })
  })

  describe('config', () => {
    it('has correct game id', () => {
      expect(SpaceInvaders.config.id).toBe('space-invaders')
    })

    it('has correct title', () => {
      expect(SpaceInvaders.config.title).toBe('Space Invaders')
    })

    it('has correct start lives', () => {
      expect(SpaceInvaders.config.startLives).toBe(3)
    })

    it('has highest score type', () => {
      expect(SpaceInvaders.config.highScoreType).toBe('highest')
    })

    it('has controls defined', () => {
      expect(SpaceInvaders.config.controls).toBeDefined()
      expect(SpaceInvaders.config.controls.movement).toBeDefined()
      expect(SpaceInvaders.config.controls.action1).toBeDefined()
    })
  })

  describe('rendering', () => {
    beforeEach(() => {
      // Reset mocks before each test
      vi.clearAllMocks()
    })

    it('renders without errors', () => {
      expect(() => game.render(mockCtx)).not.toThrow()
    })

    it('clears canvas', () => {
      game.render(mockCtx)
      expect(mockCtx.fillRect).toHaveBeenCalled()
    })

    it('renders player', () => {
      game.render(mockCtx)
      expect(mockCtx.fill).toHaveBeenCalled()
    })

    it('renders HUD with score and lives', () => {
      game.render(mockCtx)
      expect(mockCtx.fillText).toHaveBeenCalled()
      // Should show score, wave, and lives
      expect(mockCtx.fillText.mock.calls.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('integration', () => {
    it('complete game flow: shoot alien, gain points', () => {
      const initialScore = game.score
      const alien = game.aliens[0]

      // Fire bullet
      input.isJustPressed.mockImplementation((key) => key === 'action1')
      game.update(16)
      expect(game.playerBullet).not.toBeNull()

      // Position bullet to hit alien
      game.playerBullet.x = alien.x + 10
      game.playerBullet.y = alien.y + 10
      game.updatePlayerBullet()

      expect(alien.alive).toBe(false)
      expect(game.score).toBeGreaterThan(initialScore)
    })

    it('complete wave cycle', () => {
      // Start at wave 1
      expect(game.wave).toBe(1)

      // Destroy all aliens
      game.aliens.forEach((a) => (a.alive = false))
      game.checkWaveComplete()

      // Should be at wave 2 with new aliens
      expect(game.wave).toBe(2)
      expect(game.aliens.every((a) => a.alive)).toBe(true)
    })

    it('lose all lives leads to game over', () => {
      game.lives = 1
      game.state = 'running'

      // Alien bullet hits player
      const bullet = {
        x: game.player.x + 10,
        y: game.playerY + 10,
      }
      game.alienBullets.push(bullet)
      game.updateAlienBullets()

      expect(game.state).toBe('gameover')
      expect(game.lives).toBe(0)
    })
  })
})
