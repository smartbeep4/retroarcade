/**
 * TouchControls - Dynamic mobile touch control system
 * Creates and manages on-screen touch controls for mobile devices
 */

// Mobile control configurations for each game
const GAME_CONTROLS = {
  snake: {
    dpad: true,
    action1: false,
    action2: false,
    swipeEnabled: true,
    description: 'Swipe or use D-pad to move',
  },
  pong: {
    dpad: 'vertical', // Only up/down
    action1: true, // Start/launch ball
    action2: false,
    swipeEnabled: false,
    action1Label: 'GO',
    description: 'Move paddle, tap to start',
  },
  breakout: {
    dpad: 'horizontal', // Only left/right
    action1: true, // Launch ball
    action2: false,
    swipeEnabled: false,
    action1Label: 'GO',
    description: 'Move paddle, tap to launch',
  },
  flappy: {
    dpad: false,
    action1: true,
    action2: false,
    swipeEnabled: false,
    action1Label: 'FLAP',
    fullScreenTap: true, // Tap anywhere to flap
    description: 'Tap anywhere to flap',
  },
  'space-invaders': {
    dpad: 'horizontal',
    action1: true,
    action2: false,
    swipeEnabled: false,
    action1Label: 'FIRE',
    description: 'Move and fire',
  },
  frogger: {
    dpad: true,
    action1: false,
    action2: false,
    swipeEnabled: true,
    description: 'Swipe or use D-pad to move',
  },
  tetris: {
    dpad: true,
    action1: true,
    action2: true,
    swipeEnabled: false,
    action1Label: 'ROT',
    action2Label: 'HOLD',
    description: 'Move, rotate, hold piece',
  },
  asteroids: {
    dpad: true,
    action1: true,
    action2: true,
    swipeEnabled: false,
    action1Label: 'FIRE',
    action2Label: 'WARP',
    description: 'Rotate, thrust, fire',
  },
  pacman: {
    dpad: true,
    action1: false,
    action2: false,
    swipeEnabled: true,
    description: 'Swipe or use D-pad to move',
  },
  roguelike: {
    dpad: true,
    action1: true,
    action2: true,
    swipeEnabled: false,
    action1Label: 'ACT',
    action2Label: 'INV',
    description: 'Move, interact, inventory',
  },
}

// Default configuration for unknown games
const DEFAULT_CONFIG = {
  dpad: true,
  action1: true,
  action2: true,
  swipeEnabled: false,
  description: 'Touch controls',
}

class TouchControlsManager {
  constructor() {
    this.container = null
    this.pauseButton = null
    this.toggleButton = null
    this.elements = {}
    this.isVisible = false
    this.currentConfig = null
    this.inputManager = null
    this.touchState = {
      dpad: { up: false, down: false, left: false, right: false },
      action1: false,
      action2: false,
    }
    this.swipeCallbacks = []
    this.fullScreenTapEnabled = false
    this.controlsEnabled = false // Controls are off by default
  }

  /**
   * Initialize touch controls system
   * @param {HTMLElement} parentContainer - Container to add controls to
   * @param {Object} inputManager - InputManager instance
   */
  init(parentContainer, inputManager) {
    this.inputManager = inputManager
    this.container = document.getElementById('touch-controls')

    if (!this.container) {
      this.container = document.createElement('div')
      this.container.id = 'touch-controls'
      parentContainer.appendChild(this.container)
    }

    // Create pause button (always present)
    this.createPauseButton(parentContainer)

    // Create toggle button for showing/hiding controls
    this.createToggleButton(parentContainer)

    // Check if touch device
    this.isTouchDevice = this.detectTouchDevice()
  }

  /**
   * Detect if the device supports touch
   */
  detectTouchDevice() {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches
    )
  }

  /**
   * Create the pause button
   */
  createPauseButton(parent) {
    this.pauseButton = document.createElement('button')
    this.pauseButton.id = 'touch-pause'
    this.pauseButton.className = 'touch-pause'
    this.pauseButton.textContent = '| |'
    this.pauseButton.setAttribute('aria-label', 'Pause game')

    this.pauseButton.addEventListener('touchstart', (e) => {
      e.preventDefault()
      this.triggerPause()
    })

    parent.appendChild(this.pauseButton)
  }

  /**
   * Create the toggle button for showing/hiding controls
   */
  createToggleButton(parent) {
    this.toggleButton = document.createElement('button')
    this.toggleButton.id = 'touch-toggle'
    this.toggleButton.className = 'touch-toggle'
    this.toggleButton.textContent = '🎮'
    this.toggleButton.setAttribute('aria-label', 'Toggle touch controls')

    this.toggleButton.addEventListener('touchstart', (e) => {
      e.preventDefault()
      this.toggleControls()
    })

    this.toggleButton.addEventListener('click', (e) => {
      e.preventDefault()
      this.toggleControls()
    })

    parent.appendChild(this.toggleButton)
  }

  /**
   * Toggle controls visibility
   */
  toggleControls() {
    this.controlsEnabled = !this.controlsEnabled
    if (this.controlsEnabled) {
      this.show()
    } else {
      this.hide()
    }
    // Update toggle button appearance
    if (this.toggleButton) {
      this.toggleButton.classList.toggle('controls-on', this.controlsEnabled)
    }
  }

  /**
   * Configure controls for a specific game
   * @param {string} gameId - Game identifier
   */
  configureForGame(gameId) {
    const config = GAME_CONTROLS[gameId] || DEFAULT_CONFIG
    this.currentConfig = config
    this.fullScreenTapEnabled = config.fullScreenTap || false

    // Clear existing controls
    this.clearControls()

    // Build new controls based on config
    this.buildControls(config)

    // Show toggle button (controls are off by default)
    if (this.toggleButton) {
      this.toggleButton.classList.add('active')
    }

    // Only show controls if user has previously enabled them
    if (this.controlsEnabled) {
      this.show()
    }
  }

  /**
   * Clear all control elements
   */
  clearControls() {
    this.container.innerHTML = ''
    this.elements = {}
    this.removeFullScreenTapHandler()
  }

  /**
   * Build control elements based on configuration
   */
  buildControls(config) {
    // Create D-pad if needed
    if (config.dpad) {
      this.createDpad(config.dpad)
    }

    // Create action buttons container
    if (config.action1 || config.action2) {
      this.createActionButtons(config)
    }

    // Set up full-screen tap if enabled
    if (config.fullScreenTap) {
      this.setupFullScreenTap()
    }

    // Create hint text
    if (config.description) {
      this.createHint(config.description)
    }
  }

  /**
   * Create D-pad control
   * @param {boolean|string} type - true for full dpad, 'horizontal' or 'vertical' for partial
   */
  createDpad(type) {
    const dpad = document.createElement('div')
    dpad.className = 'touch-dpad'
    dpad.id = 'dpad'

    const directions = []
    if (type === true || type === 'vertical') {
      directions.push({ dir: 'up', label: '\u25B2', row: 1, col: 2 })
      directions.push({ dir: 'down', label: '\u25BC', row: 3, col: 2 })
    }
    if (type === true || type === 'horizontal') {
      directions.push({ dir: 'left', label: '\u25C0', row: 2, col: 1 })
      directions.push({ dir: 'right', label: '\u25B6', row: 2, col: 3 })
    }

    for (const { dir, label, row, col } of directions) {
      const btn = document.createElement('button')
      btn.className = `touch-btn touch-${dir}`
      btn.textContent = label
      btn.style.gridRow = row
      btn.style.gridColumn = col
      btn.setAttribute('data-direction', dir)
      btn.setAttribute('aria-label', `${dir} button`)

      // Touch events
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault()
        this.handleDpadPress(dir, true)
        btn.classList.add('active')
      })

      btn.addEventListener('touchend', (e) => {
        e.preventDefault()
        this.handleDpadPress(dir, false)
        btn.classList.remove('active')
      })

      btn.addEventListener('touchcancel', (e) => {
        e.preventDefault()
        this.handleDpadPress(dir, false)
        btn.classList.remove('active')
      })

      dpad.appendChild(btn)
      this.elements[`dpad-${dir}`] = btn
    }

    this.container.appendChild(dpad)
    this.elements.dpad = dpad
  }

  /**
   * Create action buttons
   */
  createActionButtons(config) {
    const actionsContainer = document.createElement('div')
    actionsContainer.className = 'touch-actions'

    if (config.action2) {
      const btn2 = this.createActionButton('btn-action2', config.action2Label || 'B', 'action2')
      actionsContainer.appendChild(btn2)
      this.elements.action2 = btn2
    }

    if (config.action1) {
      const btn1 = this.createActionButton('btn-action1', config.action1Label || 'A', 'action1')
      actionsContainer.appendChild(btn1)
      this.elements.action1 = btn1
    }

    this.container.appendChild(actionsContainer)
  }

  /**
   * Create a single action button
   */
  createActionButton(id, label, action) {
    const btn = document.createElement('button')
    btn.className = 'touch-action-btn'
    btn.id = id
    btn.textContent = label
    btn.setAttribute('aria-label', `${label} action button`)

    btn.addEventListener('touchstart', (e) => {
      e.preventDefault()
      this.handleActionPress(action, true)
      btn.classList.add('active')
    })

    btn.addEventListener('touchend', (e) => {
      e.preventDefault()
      this.handleActionPress(action, false)
      btn.classList.remove('active')
    })

    btn.addEventListener('touchcancel', (e) => {
      e.preventDefault()
      this.handleActionPress(action, false)
      btn.classList.remove('active')
    })

    return btn
  }

  /**
   * Create hint text
   */
  createHint(text) {
    const hint = document.createElement('div')
    hint.className = 'touch-hint'
    hint.textContent = text
    this.container.appendChild(hint)
  }

  /**
   * Set up full-screen tap detection
   */
  setupFullScreenTap() {
    const canvas = document.getElementById('game-canvas')
    if (!canvas) return

    this.fullScreenTapHandler = (e) => {
      e.preventDefault()
      this.handleActionPress('action1', true)
      // Auto-release after short delay
      setTimeout(() => {
        this.handleActionPress('action1', false)
      }, 100)
    }

    canvas.addEventListener('touchstart', this.fullScreenTapHandler)
  }

  /**
   * Remove full-screen tap handler
   */
  removeFullScreenTapHandler() {
    if (this.fullScreenTapHandler) {
      const canvas = document.getElementById('game-canvas')
      if (canvas) {
        canvas.removeEventListener('touchstart', this.fullScreenTapHandler)
      }
      this.fullScreenTapHandler = null
    }
  }

  /**
   * Handle D-pad button press/release
   */
  handleDpadPress(direction, pressed) {
    this.touchState.dpad[direction] = pressed

    // Update input manager state directly
    if (this.inputManager && this.inputManager._setTouchInput) {
      this.inputManager._setTouchInput(direction, pressed)
    }
  }

  /**
   * Handle action button press/release
   */
  handleActionPress(action, pressed) {
    this.touchState[action] = pressed

    // Update input manager state directly
    if (this.inputManager && this.inputManager._setTouchInput) {
      this.inputManager._setTouchInput(action, pressed)
    }
  }

  /**
   * Trigger pause action
   */
  triggerPause() {
    if (this.inputManager && this.inputManager._setTouchInput) {
      this.inputManager._setTouchInput('pause', true)
      setTimeout(() => {
        this.inputManager._setTouchInput('pause', false)
      }, 100)
    }
  }

  /**
   * Show touch controls
   */
  show() {
    this.isVisible = true
    this.container.classList.add('active')
    if (this.pauseButton) {
      this.pauseButton.classList.add('active')
    }
  }

  /**
   * Hide touch controls
   */
  hide() {
    this.isVisible = false
    this.container.classList.remove('active')
    if (this.pauseButton) {
      this.pauseButton.classList.remove('active')
    }
    // Update toggle button to show controls are off
    if (this.toggleButton) {
      this.toggleButton.classList.remove('controls-on')
    }
  }

  /**
   * Hide all controls including toggle button (for menu)
   */
  hideAll() {
    this.hide()
    this.controlsEnabled = false
    if (this.toggleButton) {
      this.toggleButton.classList.remove('active')
    }
  }

  /**
   * Get current touch state
   */
  getTouchState() {
    return { ...this.touchState }
  }

  /**
   * Check if controls are currently visible
   */
  isActive() {
    return this.isVisible && this.isTouchDevice
  }

  /**
   * Get mobile control config for a game
   */
  static getGameConfig(gameId) {
    return GAME_CONTROLS[gameId] || DEFAULT_CONFIG
  }

  /**
   * Destroy touch controls
   */
  destroy() {
    this.clearControls()
    this.hide()
    if (this.pauseButton && this.pauseButton.parentNode) {
      this.pauseButton.parentNode.removeChild(this.pauseButton)
    }
  }
}

// Export singleton instance
export const TouchControls = new TouchControlsManager()
