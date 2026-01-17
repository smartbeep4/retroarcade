// src/arcade/ArcadeShell.js
import { InputManager } from './InputManager.js'
import { AudioManager } from './AudioManager.js'
import { CRTEffect } from './CRTEffect.js'
import { HighScoreManager } from './HighScoreManager.js'
import GameLoader from './GameLoader.js'
import { TouchControls } from './TouchControls.js'

/**
 * NameEntry - Helper class for entering 3-letter high score names
 */
class NameEntry {
  constructor(onComplete) {
    this.onComplete = onComplete
    this.name = ['A', 'A', 'A']
    this.position = 0
  }

  handleInput(action) {
    if (action === 'up') {
      const charCode = this.name[this.position].charCodeAt(0)
      this.name[this.position] = String.fromCharCode(
        charCode === 90 ? 65 : charCode + 1,
      )
    } else if (action === 'down') {
      const charCode = this.name[this.position].charCodeAt(0)
      this.name[this.position] = String.fromCharCode(
        charCode === 65 ? 90 : charCode - 1,
      )
    } else if (action === 'right') {
      this.position = Math.min(2, this.position + 1)
    } else if (action === 'left') {
      this.position = Math.max(0, this.position - 1)
    } else if (action === 'action1') {
      this.onComplete(this.name.join(''))
    }
  }

  render(ctx, x, y) {
    ctx.font = '24px "Press Start 2P"'

    for (let i = 0; i < 3; i++) {
      const isSelected = i === this.position
      ctx.fillStyle = isSelected ? '#f9f871' : '#05d9e8'

      if (isSelected) {
        ctx.shadowColor = '#f9f871'
        ctx.shadowBlur = 10
      }

      ctx.fillText(this.name[i], x + i * 40, y)
      ctx.shadowBlur = 0

      // Draw cursor
      if (isSelected) {
        ctx.fillStyle = '#f9f871'
        ctx.fillRect(x + i * 40, y + 5, 30, 2)
      }
    }
  }
}

/**
 * MainMenu - Main game selection screen
 */
class MainMenu {
  constructor(shell) {
    this.shell = shell
    this.selectedIndex = 0
    this.games = [
      'snake',
      'pong',
      'breakout',
      'flappy',
      'space-invaders',
      'frogger',
      'tetris',
      'asteroids',
      'pacman',
      'roguelike',
    ]
    this.columns = 4
    this.tileSize = 100
    this.gap = 20
  }

  /**
   * Get the tile layout parameters
   */
  getTileLayout(canvasWidth) {
    const startX = (canvasWidth - this.columns * (this.tileSize + this.gap) + this.gap) / 2
    const startY = 120
    return { startX, startY, tileSize: this.tileSize, gap: this.gap }
  }

  /**
   * Get the tile index at a given position, or -1 if none
   */
  getTileAtPosition(x, y, canvasWidth) {
    const { startX, startY, tileSize, gap } = this.getTileLayout(canvasWidth)

    // Check if position is within the tile grid bounds
    if (x < startX || y < startY) return -1

    const col = Math.floor((x - startX) / (tileSize + gap))
    const row = Math.floor((y - startY) / (tileSize + gap))

    // Check column and row bounds
    if (col < 0 || col >= this.columns || row < 0) return -1

    // Check if within a tile (not in the gap)
    const tileX = startX + col * (tileSize + gap)
    const tileY = startY + row * (tileSize + gap)
    if (x > tileX + tileSize || y > tileY + tileSize) return -1

    const index = row * this.columns + col
    if (index >= this.games.length) return -1

    return index
  }

  handleInput() {
    const input = this.shell.input
    const canvasWidth = this.shell.canvas.width

    // Handle mouse hover - select tile on hover
    const mousePos = input.getMousePosition()
    if (mousePos) {
      const hoverIndex = this.getTileAtPosition(mousePos.x, mousePos.y, canvasWidth)
      if (hoverIndex !== -1 && hoverIndex !== this.selectedIndex) {
        this.selectedIndex = hoverIndex
        this.shell.audio.play('menu-select')
      }
    }

    // Handle mouse click - enter game
    if (input.isMouseJustClicked()) {
      if (mousePos) {
        const clickIndex = this.getTileAtPosition(mousePos.x, mousePos.y, canvasWidth)
        if (clickIndex !== -1) {
          this.shell.audio.play('menu-confirm')
          this.shell.loadGame(this.games[clickIndex])
          return
        }
      }
    }

    // Handle touch tap - select and enter game
    const tapPos = input.getTapPosition()
    if (tapPos) {
      const tapIndex = this.getTileAtPosition(tapPos.x, tapPos.y, canvasWidth)
      if (tapIndex !== -1) {
        this.selectedIndex = tapIndex
        this.shell.audio.play('menu-confirm')
        this.shell.loadGame(this.games[tapIndex])
        return
      }
    }

    // Keyboard controls
    if (input.isJustPressed('left')) {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1)
      this.shell.audio.play('menu-select')
    }
    if (input.isJustPressed('right')) {
      this.selectedIndex = Math.min(
        this.games.length - 1,
        this.selectedIndex + 1,
      )
      this.shell.audio.play('menu-select')
    }
    if (input.isJustPressed('up')) {
      this.selectedIndex = Math.max(0, this.selectedIndex - this.columns)
      this.shell.audio.play('menu-select')
    }
    if (input.isJustPressed('down')) {
      this.selectedIndex = Math.min(
        this.games.length - 1,
        this.selectedIndex + this.columns,
      )
      this.shell.audio.play('menu-select')
    }
    if (input.isJustPressed('action1') || input.isJustPressed('start')) {
      this.shell.audio.play('menu-confirm')
      this.shell.loadGame(this.games[this.selectedIndex])
    }
  }

  render(ctx) {
    const { width, height } = ctx.canvas
    const { startX, startY, tileSize, gap } = this.getTileLayout(width)

    // Background
    ctx.fillStyle = '#0a0a0f'
    ctx.fillRect(0, 0, width, height)

    // Title
    ctx.font = '24px "Press Start 2P"'
    ctx.fillStyle = '#05d9e8'
    ctx.textAlign = 'center'
    ctx.shadowColor = '#05d9e8'
    ctx.shadowBlur = 20
    ctx.fillText('RETRO ARCADE', width / 2, 60)
    ctx.shadowBlur = 0

    // Game tiles
    for (let i = 0; i < this.games.length; i++) {
      const col = i % this.columns
      const row = Math.floor(i / this.columns)
      const x = startX + col * (tileSize + gap)
      const y = startY + row * (tileSize + gap)

      const isSelected = i === this.selectedIndex

      // Tile background
      ctx.fillStyle = isSelected ? '#1a1a3e' : '#1a1a2e'
      ctx.strokeStyle = isSelected ? '#05d9e8' : '#333'
      ctx.lineWidth = isSelected ? 3 : 1

      if (isSelected) {
        ctx.shadowColor = '#05d9e8'
        ctx.shadowBlur = 15
      }

      ctx.fillRect(x, y, tileSize, tileSize)
      ctx.strokeRect(x, y, tileSize, tileSize)
      ctx.shadowBlur = 0

      // Game title
      ctx.font = '10px "Press Start 2P"'
      ctx.fillStyle = isSelected ? '#05d9e8' : '#fff'
      ctx.textAlign = 'center'
      ctx.fillText(
        this.getGameTitle(this.games[i]),
        x + tileSize / 2,
        y + tileSize - 15,
      )
    }

    // Footer
    ctx.font = '12px "Press Start 2P"'
    ctx.fillStyle = '#7f8c8d'
    ctx.textAlign = 'center'
    ctx.fillText('CLICK OR PRESS ENTER TO START', width / 2, height - 40)
  }

  getGameTitle(gameId) {
    const titles = {
      snake: 'SNAKE',
      pong: 'PONG',
      breakout: 'BREAKOUT',
      flappy: 'FLAPPY',
      'space-invaders': 'INVADERS',
      frogger: 'FROGGER',
      tetris: 'TETRIS',
      asteroids: 'ASTEROIDS',
      pacman: 'PAC-MAN',
      roguelike: 'DUNGEON',
    }
    return titles[gameId] || gameId.toUpperCase()
  }
}

/**
 * HUD - In-game heads-up display
 */
class HUD {
  constructor(shell) {
    this.shell = shell
  }

  render(ctx, game) {
    const { width } = ctx.canvas

    // HUD background bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(0, 0, width, 40)

    ctx.font = '12px "Press Start 2P"'
    ctx.textAlign = 'left'

    // Score
    ctx.fillStyle = '#fff'
    ctx.fillText(`SCORE: ${game.score}`, 20, 28)

    // High score
    const gameConfig = game.constructor.config || { id: 'unknown' }
    const highScores = HighScoreManager.getScores(gameConfig.id, 1)
    const highScore = highScores[0]?.score || 0
    ctx.fillStyle = '#f9f871'
    ctx.fillText(`HIGH: ${highScore}`, 200, 28)

    // Lives
    if (game.lives !== undefined) {
      ctx.fillStyle = '#ff2a6d'
      ctx.textAlign = 'right'
      let livesDisplay = ''
      for (let i = 0; i < game.lives; i++) {
        livesDisplay += '♥ '
      }
      ctx.fillText(livesDisplay.trim(), width - 20, 28)
    }

    // Level (if applicable)
    if (game.level > 1) {
      ctx.fillStyle = '#05d9e8'
      ctx.textAlign = 'center'
      ctx.fillText(`LEVEL ${game.level}`, width / 2, 28)
    }
  }
}

/**
 * PauseMenu - Pause menu overlay
 */
class PauseMenu {
  constructor(shell) {
    this.shell = shell
    this.options = ['RESUME', 'RESTART', 'SETTINGS', 'QUIT']
    this.selectedIndex = 0
  }

  handleInput() {
    const input = this.shell.input

    if (input.isJustPressed('up')) {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1)
      this.shell.audio.play('menu-select')
    }
    if (input.isJustPressed('down')) {
      this.selectedIndex = Math.min(
        this.options.length - 1,
        this.selectedIndex + 1,
      )
      this.shell.audio.play('menu-select')
    }
    if (input.isJustPressed('action1') || input.isJustPressed('start')) {
      this.shell.audio.play('menu-confirm')
      this.selectOption()
    }
    if (input.isJustPressed('pause')) {
      // Resume on ESC
      this.shell.resumeGame()
    }
  }

  selectOption() {
    switch (this.options[this.selectedIndex]) {
      case 'RESUME':
        this.shell.resumeGame()
        break
      case 'RESTART':
        this.shell.restartGame()
        break
      case 'SETTINGS':
        this.shell.showSettings()
        break
      case 'QUIT':
        this.shell.quitToMenu()
        break
    }
  }

  render(ctx) {
    const { width, height } = ctx.canvas

    // Dim background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.fillRect(0, 0, width, height)

    // Panel
    const panelWidth = 300
    const panelHeight = 250
    const panelX = (width - panelWidth) / 2
    const panelY = (height - panelHeight) / 2

    ctx.fillStyle = '#1a1a2e'
    ctx.strokeStyle = '#05d9e8'
    ctx.lineWidth = 3
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight)
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight)

    // Title
    ctx.font = '20px "Press Start 2P"'
    ctx.fillStyle = '#05d9e8'
    ctx.textAlign = 'center'
    ctx.fillText('PAUSED', width / 2, panelY + 50)

    // Options
    ctx.font = '14px "Press Start 2P"'
    const optionStartY = panelY + 100
    const optionGap = 35

    for (let i = 0; i < this.options.length; i++) {
      const isSelected = i === this.selectedIndex
      ctx.fillStyle = isSelected ? '#f9f871' : '#fff'

      if (isSelected) {
        ctx.fillText(
          '▶ ' + this.options[i],
          width / 2,
          optionStartY + i * optionGap,
        )
      } else {
        ctx.fillText(this.options[i], width / 2, optionStartY + i * optionGap)
      }
    }
  }
}

/**
 * GameOverScreen - Game over and high score entry
 */
class GameOverScreen {
  constructor(shell) {
    this.shell = shell
    this.score = 0
    this.isHighScore = false
    this.nameEntry = null
  }

  show(gameId, score) {
    this.score = score
    this.isHighScore = HighScoreManager.isHighScore(gameId, score)

    if (this.isHighScore) {
      this.nameEntry = new NameEntry((name) => {
        HighScoreManager.addScore(gameId, { name, score })
        this.nameEntry = null
      })
    }
  }

  handleInput() {
    const input = this.shell.input

    if (this.nameEntry) {
      // Name entry mode
      if (input.isJustPressed('up')) this.nameEntry.handleInput('up')
      if (input.isJustPressed('down')) this.nameEntry.handleInput('down')
      if (input.isJustPressed('left')) this.nameEntry.handleInput('left')
      if (input.isJustPressed('right')) this.nameEntry.handleInput('right')
      if (input.isJustPressed('action1')) {
        this.shell.audio.play('menu-confirm')
        this.nameEntry.handleInput('action1')
      }
    } else {
      // Normal game over
      if (input.isJustPressed('action1') || input.isJustPressed('start')) {
        this.shell.audio.play('menu-confirm')
        this.shell.showMainMenu()
      }
    }
  }

  render(ctx) {
    const { width, height } = ctx.canvas

    // Dim background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
    ctx.fillRect(0, 0, width, height)

    // Title
    ctx.font = '32px "Press Start 2P"'
    ctx.fillStyle = '#ff2a6d'
    ctx.textAlign = 'center'
    ctx.shadowColor = '#ff2a6d'
    ctx.shadowBlur = 20
    ctx.fillText('GAME OVER', width / 2, height / 2 - 80)
    ctx.shadowBlur = 0

    // Score
    ctx.font = '16px "Press Start 2P"'
    ctx.fillStyle = '#fff'
    ctx.fillText(`SCORE: ${this.score}`, width / 2, height / 2 - 20)

    if (this.isHighScore) {
      ctx.fillStyle = '#f9f871'
      ctx.fillText('★ NEW HIGH SCORE! ★', width / 2, height / 2 + 20)

      if (this.nameEntry) {
        ctx.fillStyle = '#05d9e8'
        ctx.fillText('ENTER YOUR NAME:', width / 2, height / 2 + 60)
        this.nameEntry.render(ctx, width / 2 - 40, height / 2 + 100)
      }
    } else {
      ctx.font = '12px "Press Start 2P"'
      ctx.fillStyle = '#7f8c8d'
      ctx.fillText('PRESS ENTER TO CONTINUE', width / 2, height / 2 + 80)
    }
  }
}

/**
 * SettingsScreen - Volume and CRT settings
 */
class SettingsScreen {
  constructor(shell) {
    this.shell = shell
    this.options = [
      {
        label: 'MASTER VOLUME',
        type: 'slider',
        get: () => AudioManager.getMasterVolume(),
        set: (v) => AudioManager.setMasterVolume(v),
      },
      {
        label: 'SFX VOLUME',
        type: 'slider',
        get: () => AudioManager.getSFXVolume(),
        set: (v) => AudioManager.setSFXVolume(v),
      },
      {
        label: 'MUSIC VOLUME',
        type: 'slider',
        get: () => AudioManager.getMusicVolume(),
        set: (v) => AudioManager.setMusicVolume(v),
      },
      {
        label: 'CRT EFFECT',
        type: 'toggle',
        get: () => CRTEffect.isEnabled(),
        set: (v) => (v ? CRTEffect.enable() : CRTEffect.disable()),
      },
      {
        label: 'SCANLINES',
        type: 'slider',
        get: () => CRTEffect.getSettings().scanlines,
        set: (v) => CRTEffect.setScanlineIntensity(v),
      },
      {
        label: 'BACK',
        type: 'button',
        action: () => this.shell.goBack(),
      },
    ]
    this.selectedIndex = 0
  }

  handleInput() {
    const input = this.shell.input

    if (input.isJustPressed('up')) {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1)
      this.shell.audio.play('menu-select')
    }
    if (input.isJustPressed('down')) {
      this.selectedIndex = Math.min(
        this.options.length - 1,
        this.selectedIndex + 1,
      )
      this.shell.audio.play('menu-select')
    }

    const option = this.options[this.selectedIndex]

    if (option.type === 'slider') {
      if (input.isJustPressed('left')) {
        option.set(Math.max(0, option.get() - 0.1))
        this.shell.audio.play('menu-select')
      }
      if (input.isJustPressed('right')) {
        option.set(Math.min(1, option.get() + 0.1))
        this.shell.audio.play('menu-select')
      }
    } else if (option.type === 'toggle') {
      if (
        input.isJustPressed('action1') ||
        input.isJustPressed('left') ||
        input.isJustPressed('right')
      ) {
        option.set(!option.get())
        this.shell.audio.play('menu-confirm')
      }
    } else if (option.type === 'button') {
      if (input.isJustPressed('action1')) {
        this.shell.audio.play('menu-confirm')
        option.action()
      }
    }

    if (input.isJustPressed('pause')) {
      this.shell.goBack()
    }
  }

  render(ctx) {
    const { width, height } = ctx.canvas

    ctx.fillStyle = '#0a0a0f'
    ctx.fillRect(0, 0, width, height)

    ctx.font = '20px "Press Start 2P"'
    ctx.fillStyle = '#05d9e8'
    ctx.textAlign = 'center'
    ctx.fillText('SETTINGS', width / 2, 60)

    const startY = 140
    const gap = 50

    ctx.font = '12px "Press Start 2P"'

    for (let i = 0; i < this.options.length; i++) {
      const option = this.options[i]
      const y = startY + i * gap
      const isSelected = i === this.selectedIndex

      ctx.fillStyle = isSelected ? '#f9f871' : '#fff'
      ctx.textAlign = 'left'
      ctx.fillText(option.label, 100, y)

      if (option.type === 'slider') {
        this.renderSlider(ctx, 400, y - 10, 200, 20, option.get(), isSelected)
      } else if (option.type === 'toggle') {
        ctx.textAlign = 'center'
        ctx.fillStyle = option.get() ? '#39ff14' : '#ff2a6d'
        ctx.fillText(option.get() ? 'ON' : 'OFF', 500, y)
      }
    }
  }

  renderSlider(ctx, x, y, width, height, value, isSelected) {
    // Background
    ctx.fillStyle = '#333'
    ctx.fillRect(x, y, width, height)

    // Fill
    ctx.fillStyle = isSelected ? '#05d9e8' : '#666'
    ctx.fillRect(x, y, width * value, height)

    // Border
    ctx.strokeStyle = isSelected ? '#05d9e8' : '#666'
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, width, height)
  }
}

/**
 * ArcadeShell - Main arcade interface
 */
export class ArcadeShell {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.input = InputManager
    this.audio = AudioManager

    this.state = 'menu' // menu, playing, paused, gameover, settings
    this.previousState = null
    this.currentGame = null
    this.currentGameId = null

    // Sub-screens
    this.mainMenu = new MainMenu(this)
    this.hud = new HUD(this)
    this.pauseMenu = new PauseMenu(this)
    this.gameOverScreen = new GameOverScreen(this)
    this.settingsScreen = new SettingsScreen(this)

    // Animation
    this.animationId = null
    this.isInitialized = false
  }

  async init() {
    // Set canvas size
    this.canvas.width = 800
    this.canvas.height = 600

    // Configure context for pixel-perfect rendering
    this.ctx.imageSmoothingEnabled = false

    // Initialize systems
    this.input.init()
    this.audio.init()

    // Initialize CRT effect if parent element exists
    if (this.canvas.parentElement) {
      CRTEffect.init(this.canvas.parentElement)
    }

    // Initialize touch controls for mobile devices
    if (this.canvas.parentElement) {
      TouchControls.init(this.canvas.parentElement, this.input)
    }

    HighScoreManager.init()

    this.isInitialized = true

    // Start shell loop
    this.loop()
  }

  loop() {
    this.input.update()
    this.update()
    this.render()
    this.animationId = requestAnimationFrame(() => this.loop())
  }

  update() {
    switch (this.state) {
      case 'menu':
        this.mainMenu.handleInput()
        break
      case 'playing':
        // Check for pause in game loop
        if (this.input.isJustPressed('pause')) {
          this.pauseGame()
        }
        // Game handles its own input
        break
      case 'paused':
        this.pauseMenu.handleInput()
        break
      case 'gameover':
        this.gameOverScreen.handleInput()
        break
      case 'settings':
        this.settingsScreen.handleInput()
        break
    }
  }

  render() {
    // Clear canvas
    this.ctx.fillStyle = '#0a0a0f'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    switch (this.state) {
      case 'menu':
        this.mainMenu.render(this.ctx)
        break
      case 'playing':
        // Game renders itself, we just add HUD
        if (this.currentGame) {
          this.hud.render(this.ctx, this.currentGame)
        }
        break
      case 'paused':
        // Show game in background with pause overlay
        this.pauseMenu.render(this.ctx)
        break
      case 'gameover':
        this.gameOverScreen.render(this.ctx)
        break
      case 'settings':
        this.settingsScreen.render(this.ctx)
        break
    }
  }

  async loadGame(gameId) {
    try {
      const GameClass = await GameLoader.loadGame(gameId)
      this.currentGame = new GameClass(this.canvas, this.input, this.audio)
      this.currentGameId = gameId

      // Set game instance in loader
      GameLoader.setCurrentGame(this.currentGame)

      // Configure touch controls for this game
      TouchControls.configureForGame(gameId)

      this.currentGame.onGameOver((score) => {
        this.handleGameOver(score)
      })

      await this.currentGame.init()
      this.currentGame.start()
      this.state = 'playing'
      this.audio.play('game-start')
    } catch (e) {
      // console.error('Failed to load game:', e)
      this.showMainMenu()
    }
  }

  handleGameOver(score) {
    this.state = 'gameover'
    this.gameOverScreen.show(this.currentGameId, score)
    HighScoreManager.incrementGamesPlayed(this.currentGameId)
  }

  pauseGame() {
    if (this.currentGame && this.state === 'playing') {
      this.currentGame.pause()
      this.state = 'paused'
      this.pauseMenu.selectedIndex = 0
    }
  }

  resumeGame() {
    if (this.currentGame && this.state === 'paused') {
      this.currentGame.resume()
      this.state = 'playing'
    }
  }

  restartGame() {
    if (this.currentGame) {
      this.currentGame.reset()
      this.currentGame.init().then(() => {
        this.currentGame.start()
        this.state = 'playing'
      })
    }
  }

  quitToMenu() {
    this.unloadGame()
    this.showMainMenu()
  }

  showMainMenu() {
    this.unloadGame()
    this.state = 'menu'
    this.mainMenu.selectedIndex = 0 // Reset menu selection for clean state
  }

  showSettings() {
    this.previousState = this.state
    this.state = 'settings'
  }

  goBack() {
    if (this.previousState) {
      this.state = this.previousState
      this.previousState = null
    } else {
      this.state = 'menu'
    }
  }

  unloadGame() {
    if (this.currentGame) {
      this.currentGame.destroy()
      this.currentGame = null
      this.currentGameId = null
    }
    // Hide touch controls when returning to menu
    TouchControls.hide()
    GameLoader.unloadGame()
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    this.unloadGame()
    this.isInitialized = false
  }

  getCurrentGame() {
    return this.currentGame
  }

  getState() {
    return this.state
  }
}
