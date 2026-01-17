import { test, expect } from '@playwright/test'
import { ArcadeShellPage, GameId } from '../../page-objects/arcade-shell.page'
import {
  SnakePage,
  PongPage,
  BreakoutPage,
  FlappyPage,
  SpaceInvadersPage,
  FroggerPage,
  TetrisPage,
  AsteroidsPage,
  PacmanPage,
  RoguelikePage,
} from '../../page-objects/games'

/**
 * All game IDs with their display names for test descriptions
 */
const GAMES: Array<{ id: GameId; name: string }> = [
  { id: 'snake', name: 'Snake' },
  { id: 'pong', name: 'Pong' },
  { id: 'breakout', name: 'Breakout' },
  { id: 'flappy', name: 'Flappy Bird' },
  { id: 'space-invaders', name: 'Space Invaders' },
  { id: 'frogger', name: 'Frogger' },
  { id: 'tetris', name: 'Tetris' },
  { id: 'asteroids', name: 'Asteroids' },
  { id: 'pacman', name: 'Pac-Man' },
  { id: 'roguelike', name: 'Roguelike' },
]

test.describe('Game Launch Smoke Tests', () => {
  for (const { id, name } of GAMES) {
    test(`${name} should launch successfully`, async ({ page }) => {
      const arcade = new ArcadeShellPage(page)
      await arcade.goto()

      // Launch the game
      await arcade.launchGame(id)

      // Verify game is running
      const shellState = await arcade.stateBridge.getShellState()
      expect(shellState?.state).toBe('playing')
      expect(shellState?.currentGameId).toBe(id)

      // Verify game state is running
      const gameState = await arcade.stateBridge.getGameState()
      expect(gameState?.state).toBe('running')
      expect(gameState?.id).toBe(id)

      // Verify canvas is rendering
      const isRendering = await arcade.isRendering()
      expect(isRendering).toBe(true)
    })

    test(`${name} should pause and resume`, async ({ page }) => {
      const arcade = new ArcadeShellPage(page)
      await arcade.goto()
      await arcade.launchGame(id)

      // Pause the game
      await arcade.pauseGame()

      // Verify paused state
      const pausedState = await arcade.stateBridge.getShellState()
      expect(pausedState?.state).toBe('paused')

      // Resume the game
      await arcade.resumeGame()

      // Verify running state
      const runningState = await arcade.stateBridge.getShellState()
      expect(runningState?.state).toBe('playing')
    })

    test(`${name} should quit to menu`, async ({ page }) => {
      const arcade = new ArcadeShellPage(page)
      await arcade.goto()
      await arcade.launchGame(id)

      // Quit to menu
      await arcade.pauseGame()
      await arcade.quitToMenu()

      // Verify back on menu
      const menuState = await arcade.stateBridge.getShellState()
      expect(menuState?.state).toBe('menu')
      expect(menuState?.currentGameId).toBeNull()
    })
  }
})

test.describe('Game-Specific Initial State Smoke Tests', () => {
  test('Snake should have correct initial state', async ({ page }) => {
    const snake = new SnakePage(page)
    await snake.launch()

    // Verify basic game state
    const state = await snake.getGameState()
    expect(state).not.toBeNull()
    expect(state?.state).toBe('running')
    expect(state?.score).toBe(0)

    // Verify snake-specific state
    const snakeState = await snake.getSnakeState()
    expect(snakeState?.snakeLength).toBe(3)
    expect(snakeState?.direction).toEqual({ x: 1, y: 0 })
  })

  test('Pong should have correct initial state', async ({ page }) => {
    const pong = new PongPage(page)
    await pong.launch()

    const state = await pong.getGameState()
    expect(state).not.toBeNull()
    expect(state?.state).toBe('running')
    expect(state?.score).toBe(0)
  })

  test('Breakout should have correct initial state', async ({ page }) => {
    const breakout = new BreakoutPage(page)
    await breakout.launch()

    const state = await breakout.getGameState()
    expect(state).not.toBeNull()
    expect(state?.state).toBe('running')
    expect(state?.score).toBe(0)
  })

  test('Flappy should have correct initial state', async ({ page }) => {
    const flappy = new FlappyPage(page)
    await flappy.launch()

    const state = await flappy.getGameState()
    expect(state).not.toBeNull()
    expect(state?.state).toBe('running')
    expect(state?.score).toBe(0)
  })

  test('Space Invaders should have correct initial state', async ({ page }) => {
    const invaders = new SpaceInvadersPage(page)
    await invaders.launch()

    const state = await invaders.getGameState()
    expect(state).not.toBeNull()
    expect(state?.state).toBe('running')
    expect(state?.score).toBe(0)
  })

  test('Frogger should have correct initial state', async ({ page }) => {
    const frogger = new FroggerPage(page)
    await frogger.launch()

    const state = await frogger.getGameState()
    expect(state).not.toBeNull()
    expect(state?.state).toBe('running')
    expect(state?.score).toBe(0)
  })

  test('Tetris should have correct initial state', async ({ page }) => {
    const tetris = new TetrisPage(page)
    await tetris.launch()

    const state = await tetris.getGameState()
    expect(state).not.toBeNull()
    expect(state?.state).toBe('running')
    expect(state?.score).toBe(0)
  })

  test('Asteroids should have correct initial state', async ({ page }) => {
    const asteroids = new AsteroidsPage(page)
    await asteroids.launch()

    const state = await asteroids.getGameState()
    expect(state).not.toBeNull()
    expect(state?.state).toBe('running')
    expect(state?.score).toBe(0)
  })

  test('Pac-Man should have correct initial state', async ({ page }) => {
    const pacman = new PacmanPage(page)
    await pacman.launch()

    const state = await pacman.getGameState()
    expect(state).not.toBeNull()
    expect(state?.state).toBe('running')
    expect(state?.score).toBe(0)
  })

  test('Roguelike should have correct initial state', async ({ page }) => {
    const roguelike = new RoguelikePage(page)
    await roguelike.launch()

    const state = await roguelike.getGameState()
    expect(state).not.toBeNull()
    expect(state?.state).toBe('running')
    expect(state?.score).toBe(0)
  })
})
