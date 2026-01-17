/**
 * TestBridge - Exposes game internals for E2E testing
 *
 * This module only activates when ?test=true is in the URL.
 * It provides access to game state for Playwright tests to make assertions.
 */

class TestBridgeClass {
  constructor() {
    this.enabled = false
    this.shell = null
    this.game = null
    this.randomSeed = null
  }

  /**
   * Initialize the test bridge if test mode is enabled
   */
  init() {
    // Only activate with ?test=true query param
    const params = new URLSearchParams(window.location.search)
    this.enabled = params.get('test') === 'true'

    if (!this.enabled) {
      return
    }

    // Set up deterministic random seed if provided
    const seed = params.get('seed')
    if (seed) {
      this.randomSeed = parseInt(seed, 10)
      this.overrideRandom()
    }

    // Expose the test bridge on window
    window.__ARCADE_TEST__ = {
      // Shell state
      getShellState: () => this.getShellState(),
      getShell: () => this.shell,

      // Game state
      getGameState: () => this.getGameState(),
      getGame: () => this.game,
      getGameById: (gameId) => this.getGameById(gameId),

      // Canvas helpers
      getPixelColor: (x, y) => this.getPixelColor(x, y),
      getPixelColorNormalized: (x, y) => this.getPixelColorNormalized(x, y),
      getCanvasImageData: () => this.getCanvasImageData(),
      findColorInRegion: (color, x, y, width, height) =>
        this.findColorInRegion(color, x, y, width, height),

      // Game-specific getters (set by games)
      gameGetters: {},

      // Utility
      isEnabled: () => this.enabled,
      waitForState: (state, timeout) => this.waitForState(state, timeout),
      waitForGameState: (state, timeout) =>
        this.waitForGameState(state, timeout),
    }
  }

  /**
   * Register the arcade shell reference
   */
  registerShell(shell) {
    if (!this.enabled) return
    this.shell = shell
  }

  /**
   * Register the current game reference
   */
  registerGame(game) {
    if (!this.enabled) return
    this.game = game
  }

  /**
   * Unregister the current game
   */
  unregisterGame() {
    if (!this.enabled) return
    this.game = null
  }

  /**
   * Register a game-specific getter function
   */
  registerGameGetter(name, getter) {
    if (!this.enabled) return
    window.__ARCADE_TEST__.gameGetters[name] = getter
  }

  /**
   * Get the current shell state
   */
  getShellState() {
    if (!this.shell) return null

    return {
      state: this.shell.state,
      currentGameId: this.shell.currentGameId,
      isInitialized: this.shell.isInitialized,
      previousState: this.shell.previousState,
      menuSelectedIndex: this.shell.mainMenu?.selectedIndex,
      pauseMenuSelectedIndex: this.shell.pauseMenu?.selectedIndex,
    }
  }

  /**
   * Get the current game state
   */
  getGameState() {
    if (!this.game) return null

    const config = this.game.constructor.config || {}

    return {
      id: config.id,
      state: this.game.state,
      score: this.game.score,
      lives: this.game.lives,
      level: this.game.level,
      canvasWidth: this.game.canvas?.width,
      canvasHeight: this.game.canvas?.height,
    }
  }

  /**
   * Get game-specific state by game ID
   */
  getGameById(gameId) {
    if (!this.game) return null

    const config = this.game.constructor.config || {}
    if (config.id !== gameId) return null

    return this.getGameSpecificState(gameId)
  }

  /**
   * Get game-specific state based on game type
   */
  getGameSpecificState(gameId) {
    if (!this.game) return null

    const baseState = this.getGameState()

    switch (gameId) {
      case 'snake':
        return {
          ...baseState,
          snake: this.game.snake ? [...this.game.snake] : [],
          snakeLength: this.game.snake?.length || 0,
          food: this.game.food ? { ...this.game.food } : null,
          direction: this.game.direction ? { ...this.game.direction } : null,
          nextDirection: this.game.nextDirection
            ? { ...this.game.nextDirection }
            : null,
          gridSize: this.game.gridSize,
          cellSize: this.game.cellSize,
          moveInterval: this.game.moveInterval,
          foodEaten: this.game.foodEaten,
          wrapWalls: this.game.wrapWalls,
        }

      case 'pong':
        return {
          ...baseState,
          paddle1: this.game.paddle1 ? { ...this.game.paddle1 } : null,
          paddle2: this.game.paddle2 ? { ...this.game.paddle2 } : null,
          ball: this.game.ball ? { ...this.game.ball } : null,
          gameStarted: this.game.gameStarted,
          winner: this.game.winner,
        }

      case 'breakout':
        return {
          ...baseState,
          paddle: this.game.paddle ? { ...this.game.paddle } : null,
          balls: this.game.balls ? [...this.game.balls] : [],
          bricks: this.game.bricks ? [...this.game.bricks] : [],
          brickCount: this.game.bricks?.length || 0,
          powerups: this.game.powerups ? [...this.game.powerups] : [],
        }

      case 'flappy':
        return {
          ...baseState,
          bird: this.game.bird ? { ...this.game.bird } : null,
          pipes: this.game.pipes ? [...this.game.pipes] : [],
          started: this.game.started,
          gravity: this.game.gravity,
          flapStrength: this.game.flapStrength,
        }

      case 'space-invaders':
        return {
          ...baseState,
          player: this.game.player ? { ...this.game.player } : null,
          aliens: this.game.aliens ? [...this.game.aliens] : [],
          alienCount: this.game.aliens?.filter((a) => a.alive).length || 0,
          bullets: this.game.bullets ? [...this.game.bullets] : [],
          shields: this.game.shields ? [...this.game.shields] : [],
          ufo: this.game.ufo ? { ...this.game.ufo } : null,
          alienDirection: this.game.alienDirection,
        }

      case 'frogger':
        return {
          ...baseState,
          frog: this.game.frog ? { ...this.game.frog } : null,
          lanes: this.game.lanes ? [...this.game.lanes] : [],
          homes: this.game.homes ? [...this.game.homes] : [],
          homesFilled: this.game.homes?.filter((h) => h.filled).length || 0,
          timeRemaining: this.game.timeRemaining,
          cellSize: this.game.cellSize,
        }

      case 'tetris':
        return {
          ...baseState,
          grid: this.game.grid ? this.game.grid.map((row) => [...row]) : [],
          currentPiece: this.game.currentPiece
            ? { ...this.game.currentPiece }
            : null,
          nextQueue: this.game.nextQueue ? [...this.game.nextQueue] : [],
          holdPiece: this.game.holdPiece,
          linesCleared: this.game.linesCleared,
        }

      case 'asteroids':
        return {
          ...baseState,
          ship: this.game.ship ? { ...this.game.ship } : null,
          asteroids: this.game.asteroids ? [...this.game.asteroids] : [],
          asteroidCount: this.game.asteroids?.length || 0,
          bullets: this.game.bullets ? [...this.game.bullets] : [],
          ufo: this.game.ufo ? { ...this.game.ufo } : null,
          wave: this.game.wave,
        }

      case 'pacman':
        return {
          ...baseState,
          pacman: this.game.pacman ? { ...this.game.pacman } : null,
          ghosts: this.game.ghosts ? [...this.game.ghosts] : [],
          dots: this.game.dots ? [...this.game.dots] : [],
          totalDots: this.game.totalDots,
          dotsEaten: this.game.dotsEaten,
          powerPellets: this.game.powerPellets
            ? [...this.game.powerPellets]
            : [],
          mode: this.game.mode,
          modeTimer: this.game.modeTimer,
        }

      case 'roguelike':
        return {
          ...baseState,
          player: this.game.player ? { ...this.game.player } : null,
          enemies: this.game.enemies ? [...this.game.enemies] : [],
          items: this.game.items ? [...this.game.items] : [],
          map: this.game.map ? this.game.map.map((row) => [...row]) : [],
          floor: this.game.floor,
          visible: this.game.visible,
          explored: this.game.explored,
        }

      default:
        return baseState
    }
  }

  /**
   * Get pixel color at canvas coordinates
   */
  getPixelColor(x, y) {
    if (!this.shell?.canvas) return null

    const ctx = this.shell.canvas.getContext('2d')
    const imageData = ctx.getImageData(x, y, 1, 1)
    const [r, g, b, a] = imageData.data

    return { r, g, b, a }
  }

  /**
   * Get pixel color as normalized hex string
   */
  getPixelColorNormalized(x, y) {
    const color = this.getPixelColor(x, y)
    if (!color) return null

    const toHex = (n) => n.toString(16).padStart(2, '0')
    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`
  }

  /**
   * Get the full canvas image data
   */
  getCanvasImageData() {
    if (!this.shell?.canvas) return null

    const ctx = this.shell.canvas.getContext('2d')
    return ctx.getImageData(
      0,
      0,
      this.shell.canvas.width,
      this.shell.canvas.height,
    )
  }

  /**
   * Find occurrences of a color in a region
   */
  findColorInRegion(targetColor, x, y, width, height) {
    if (!this.shell?.canvas) return []

    const ctx = this.shell.canvas.getContext('2d')
    const imageData = ctx.getImageData(x, y, width, height)
    const matches = []

    // Parse target color
    let tr, tg, tb
    if (typeof targetColor === 'string') {
      const hex = targetColor.replace('#', '')
      tr = parseInt(hex.substr(0, 2), 16)
      tg = parseInt(hex.substr(2, 2), 16)
      tb = parseInt(hex.substr(4, 2), 16)
    } else {
      tr = targetColor.r
      tg = targetColor.g
      tb = targetColor.b
    }

    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const i = (py * width + px) * 4
        const r = imageData.data[i]
        const g = imageData.data[i + 1]
        const b = imageData.data[i + 2]

        // Allow small tolerance for anti-aliasing
        const tolerance = 10
        if (
          Math.abs(r - tr) <= tolerance &&
          Math.abs(g - tg) <= tolerance &&
          Math.abs(b - tb) <= tolerance
        ) {
          matches.push({ x: x + px, y: y + py })
        }
      }
    }

    return matches
  }

  /**
   * Wait for shell state to reach a specific value
   */
  waitForState(targetState, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now()

      const check = () => {
        if (this.shell?.state === targetState) {
          resolve(true)
          return
        }

        if (Date.now() - startTime > timeout) {
          reject(
            new Error(
              `Timeout waiting for state '${targetState}'. Current: '${this.shell?.state}'`,
            ),
          )
          return
        }

        requestAnimationFrame(check)
      }

      check()
    })
  }

  /**
   * Wait for game state to reach a specific value
   */
  waitForGameState(targetState, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now()

      const check = () => {
        if (this.game?.state === targetState) {
          resolve(true)
          return
        }

        if (Date.now() - startTime > timeout) {
          reject(
            new Error(
              `Timeout waiting for game state '${targetState}'. Current: '${this.game?.state}'`,
            ),
          )
          return
        }

        requestAnimationFrame(check)
      }

      check()
    })
  }

  /**
   * Override Math.random with a seeded PRNG for deterministic tests
   */
  overrideRandom() {
    if (this.randomSeed === null) return

    let seed = this.randomSeed

    const seededRandom = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      return seed / 0x7fffffff
    }

    Math.random = seededRandom
  }
}

// Export singleton
export const TestBridge = new TestBridgeClass()
