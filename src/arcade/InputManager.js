/**
 * InputManager - Unified input abstraction for keyboard, touch, and gamepad
 * Provides consistent interface for all game controls
 */

// Key constants
export const UP = 'up'
export const DOWN = 'down'
export const LEFT = 'left'
export const RIGHT = 'right'
export const ACTION_1 = 'action1'
export const ACTION_2 = 'action2'
export const PAUSE = 'pause'
export const START = 'start'

// Internal state
const state = {
  current: {}, // Keys pressed this frame
  previous: {}, // Keys pressed last frame
  direction: { x: 0, y: 0 },
  initialized: false,
}

// Keyboard state
const keysHeld = new Set()
const keyMap = {
  ArrowUp: UP,
  w: UP,
  W: UP,
  ArrowDown: DOWN,
  s: DOWN,
  S: DOWN,
  ArrowLeft: LEFT,
  a: LEFT,
  A: LEFT,
  ArrowRight: RIGHT,
  d: RIGHT,
  D: RIGHT,
  ' ': ACTION_1,
  Enter: ACTION_1,
  z: ACTION_1,
  Z: ACTION_1,
  Shift: ACTION_2,
  x: ACTION_2,
  X: ACTION_2,
  Escape: PAUSE,
  p: PAUSE,
  P: PAUSE,
}

// Touch state
const touchState = {
  position: null,
  swipeCallbacks: [],
  tapCallbacks: [],
  lastTapPosition: null,
  wasTapped: false,
}

// Mouse state
const mouseState = {
  position: null,
  isDown: false,
  wasClicked: false,
  canvas: null,
}

let swipeStart = null
const SWIPE_THRESHOLD = 50 // pixels

// Event handlers (stored to allow cleanup)
let keydownHandler = null
let keyupHandler = null
let touchHandlers = []
let mouseHandlers = []

/**
 * Initialize input system - sets up event listeners
 */
function init() {
  if (state.initialized) {
    return
  }

  initKeyboard()
  initTouch()
  initMouse()
  state.initialized = true
}

/**
 * Initialize keyboard event listeners
 */
function initKeyboard() {
  keydownHandler = (e) => {
    const mapped = keyMap[e.key]
    if (mapped) {
      keysHeld.add(e.key)
      e.preventDefault()
    }
  }

  keyupHandler = (e) => {
    keysHeld.delete(e.key)
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', keydownHandler)
    window.addEventListener('keyup', keyupHandler)
  }
}

/**
 * Initialize touch event listeners
 */
function initTouch() {
  if (typeof window === 'undefined' || !('ontouchstart' in window)) {
    return
  }

  // D-pad touch zones
  const dpad = document.getElementById('dpad')
  if (dpad) {
    const dpadTouchStart = handleDpadTouch.bind(null)
    const dpadTouchMove = handleDpadTouch.bind(null)
    const dpadTouchEnd = handleDpadEnd.bind(null)

    dpad.addEventListener('touchstart', dpadTouchStart)
    dpad.addEventListener('touchmove', dpadTouchMove)
    dpad.addEventListener('touchend', dpadTouchEnd)

    touchHandlers.push({
      element: dpad,
      event: 'touchstart',
      handler: dpadTouchStart,
    })
    touchHandlers.push({
      element: dpad,
      event: 'touchmove',
      handler: dpadTouchMove,
    })
    touchHandlers.push({
      element: dpad,
      event: 'touchend',
      handler: dpadTouchEnd,
    })
  }

  // Action buttons
  const btnA = document.getElementById('btn-action1')
  if (btnA) {
    const btnAHandler = () => {
      state.current[ACTION_1] = true
    }
    btnA.addEventListener('touchstart', btnAHandler)
    touchHandlers.push({
      element: btnA,
      event: 'touchstart',
      handler: btnAHandler,
    })
  }

  const btnB = document.getElementById('btn-action2')
  if (btnB) {
    const btnBHandler = () => {
      state.current[ACTION_2] = true
    }
    btnB.addEventListener('touchstart', btnBHandler)
    touchHandlers.push({
      element: btnB,
      event: 'touchstart',
      handler: btnBHandler,
    })
  }

  // Swipe detection on game canvas
  initSwipeDetection()
}

/**
 * Handle D-pad touch events
 */
function handleDpadTouch(e) {
  e.preventDefault()
  const touch = e.touches[0]
  if (!touch) return

  const rect = e.target.getBoundingClientRect()
  const x = touch.clientX - rect.left - rect.width / 2
  const y = touch.clientY - rect.top - rect.height / 2

  // Determine direction from center
  const threshold = rect.width * 0.2
  if (x < -threshold) state.current[LEFT] = true
  if (x > threshold) state.current[RIGHT] = true
  if (y < -threshold) state.current[UP] = true
  if (y > threshold) state.current[DOWN] = true
}

/**
 * Handle D-pad touch end
 */
function handleDpadEnd(e) {
  e.preventDefault()
  // Clear directional inputs on touch end
  state.current[UP] = false
  state.current[DOWN] = false
  state.current[LEFT] = false
  state.current[RIGHT] = false
}

/**
 * Initialize swipe detection on canvas
 */
function initSwipeDetection() {
  const canvas = document.getElementById('game-canvas')
  if (!canvas) return

  const touchStartHandler = (e) => {
    swipeStart = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    }
  }

  const touchEndHandler = (e) => {
    if (!swipeStart) return

    const end = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
      time: Date.now(),
    }

    const dx = end.x - swipeStart.x
    const dy = end.y - swipeStart.y
    const dt = end.time - swipeStart.time

    // Only register as swipe if completed within reasonable time
    if (dt < 500) {
      let direction = null
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
        direction = dx > 0 ? 'right' : 'left'
      } else if (Math.abs(dy) > SWIPE_THRESHOLD) {
        direction = dy > 0 ? 'down' : 'up'
      }

      if (direction) {
        touchState.swipeCallbacks.forEach((cb) => cb(direction))
      } else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
        // Register as tap if very small movement
        // Convert to canvas coordinates
        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height
        touchState.lastTapPosition = {
          x: (end.x - rect.left) * scaleX,
          y: (end.y - rect.top) * scaleY,
        }
        touchState.wasTapped = true
        touchState.tapCallbacks.forEach((cb) => cb({ x: end.x, y: end.y }))
      }
    }

    swipeStart = null
  }

  canvas.addEventListener('touchstart', touchStartHandler)
  canvas.addEventListener('touchend', touchEndHandler)

  touchHandlers.push({
    element: canvas,
    event: 'touchstart',
    handler: touchStartHandler,
  })
  touchHandlers.push({
    element: canvas,
    event: 'touchend',
    handler: touchEndHandler,
  })
}

/**
 * Initialize mouse event listeners for menu navigation
 */
function initMouse() {
  if (typeof window === 'undefined') {
    return
  }

  const canvas = document.getElementById('game-canvas')
  if (!canvas) return

  mouseState.canvas = canvas

  const mouseMoveHandler = (e) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    mouseState.position = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const mouseDownHandler = (e) => {
    if (e.button === 0) {
      mouseState.isDown = true
    }
  }

  const mouseUpHandler = (e) => {
    if (e.button === 0) {
      if (mouseState.isDown) {
        mouseState.wasClicked = true
      }
      mouseState.isDown = false
    }
  }

  const mouseLeaveHandler = () => {
    mouseState.position = null
    mouseState.isDown = false
  }

  canvas.addEventListener('mousemove', mouseMoveHandler)
  canvas.addEventListener('mousedown', mouseDownHandler)
  canvas.addEventListener('mouseup', mouseUpHandler)
  canvas.addEventListener('mouseleave', mouseLeaveHandler)

  mouseHandlers.push({ element: canvas, event: 'mousemove', handler: mouseMoveHandler })
  mouseHandlers.push({ element: canvas, event: 'mousedown', handler: mouseDownHandler })
  mouseHandlers.push({ element: canvas, event: 'mouseup', handler: mouseUpHandler })
  mouseHandlers.push({ element: canvas, event: 'mouseleave', handler: mouseLeaveHandler })
}

/**
 * Update input state - call at start of each frame
 */
function update() {
  // Copy current to previous
  state.previous = { ...state.current }

  // Clear current state
  state.current = {}

  // Poll all input sources
  pollKeyboard()
  pollTouch()
  pollGamepad()

  // Calculate direction vector
  calculateDirection()
}

/**
 * Poll keyboard state
 */
function pollKeyboard() {
  for (const key of keysHeld) {
    const mapped = keyMap[key]
    if (mapped) {
      state.current[mapped] = true
    }
  }
}

/**
 * Poll touch state
 */
function pollTouch() {
  // Touch state is managed by event handlers
  // and persists in state.current until cleared
}

/**
 * Poll gamepad state
 */
function pollGamepad() {
  if (typeof navigator === 'undefined' || !navigator.getGamepads) {
    return
  }

  const gamepads = navigator.getGamepads()
  const gp = gamepads[0]
  if (!gp) return

  // D-pad buttons (standard gamepad mapping)
  if (gp.buttons[12]?.pressed) state.current[UP] = true
  if (gp.buttons[13]?.pressed) state.current[DOWN] = true
  if (gp.buttons[14]?.pressed) state.current[LEFT] = true
  if (gp.buttons[15]?.pressed) state.current[RIGHT] = true

  // Face buttons
  if (gp.buttons[0]?.pressed) state.current[ACTION_1] = true
  if (gp.buttons[1]?.pressed) state.current[ACTION_2] = true
  if (gp.buttons[9]?.pressed) {
    state.current[PAUSE] = true
    state.current[START] = true
  }

  // Left analog stick
  const deadzone = 0.3
  if (gp.axes[0] < -deadzone) state.current[LEFT] = true
  if (gp.axes[0] > deadzone) state.current[RIGHT] = true
  if (gp.axes[1] < -deadzone) state.current[UP] = true
  if (gp.axes[1] > deadzone) state.current[DOWN] = true
}

/**
 * Calculate direction vector from current input state
 */
function calculateDirection() {
  state.direction = { x: 0, y: 0 }

  if (state.current[LEFT]) state.direction.x -= 1
  if (state.current[RIGHT]) state.direction.x += 1
  if (state.current[UP]) state.direction.y -= 1
  if (state.current[DOWN]) state.direction.y += 1
}

/**
 * Check if a key is currently pressed
 * @param {string} key - Key constant (UP, DOWN, LEFT, RIGHT, ACTION_1, etc.)
 * @returns {boolean}
 */
function isPressed(key) {
  return state.current[key] === true
}

/**
 * Check if a key was just pressed this frame (not held from previous frame)
 * @param {string} key - Key constant
 * @returns {boolean}
 */
function isJustPressed(key) {
  return state.current[key] === true && state.previous[key] !== true
}

/**
 * Check if a key was just released this frame
 * @param {string} key - Key constant
 * @returns {boolean}
 */
function isJustReleased(key) {
  return state.previous[key] === true && state.current[key] !== true
}

/**
 * Get directional input as discrete values
 * @returns {{x: number, y: number}} Direction vector with values -1, 0, or 1
 */
function getDirection() {
  return { ...state.direction }
}

/**
 * Get normalized direction vector for analog input
 * @returns {{x: number, y: number}} Normalized direction vector
 */
function getDirectionVector() {
  const { x, y } = state.direction
  const len = Math.sqrt(x * x + y * y)

  if (len === 0) {
    return { x: 0, y: 0 }
  }

  return { x: x / len, y: y / len }
}

/**
 * Get current touch position
 * @returns {{x: number, y: number}|null}
 */
function getTouchPosition() {
  return touchState.position ? { ...touchState.position } : null
}

/**
 * Get current mouse position (canvas coordinates)
 * @returns {{x: number, y: number}|null}
 */
function getMousePosition() {
  return mouseState.position ? { ...mouseState.position } : null
}

/**
 * Check if mouse was clicked this frame (clears on read)
 * @returns {boolean}
 */
function isMouseJustClicked() {
  if (mouseState.wasClicked) {
    mouseState.wasClicked = false
    return true
  }
  return false
}

/**
 * Check if mouse button is currently down
 * @returns {boolean}
 */
function isMouseDown() {
  return mouseState.isDown
}

/**
 * Check if screen was tapped this frame (clears on read)
 * @returns {{x: number, y: number}|null} Tap position in canvas coordinates or null
 */
function getTapPosition() {
  if (touchState.wasTapped) {
    touchState.wasTapped = false
    return touchState.lastTapPosition ? { ...touchState.lastTapPosition } : null
  }
  return null
}

/**
 * Register a swipe callback
 * @param {function} callback - Called with direction ('up', 'down', 'left', 'right')
 */
function onSwipe(callback) {
  touchState.swipeCallbacks.push(callback)
}

/**
 * Register a tap callback
 * @param {function} callback - Called with position {x, y}
 */
function onTap(callback) {
  touchState.tapCallbacks.push(callback)
}

/**
 * Check if a gamepad is connected
 * @returns {boolean}
 */
function isGamepadConnected() {
  if (typeof navigator === 'undefined' || !navigator.getGamepads) {
    return false
  }

  const gamepads = navigator.getGamepads()
  return Array.from(gamepads).some((gp) => gp !== null)
}

/**
 * Cleanup - remove event listeners
 */
function destroy() {
  if (typeof window !== 'undefined') {
    if (keydownHandler) {
      window.removeEventListener('keydown', keydownHandler)
    }
    if (keyupHandler) {
      window.removeEventListener('keyup', keyupHandler)
    }
  }

  // Remove touch handlers
  touchHandlers.forEach(({ element, event, handler }) => {
    element.removeEventListener(event, handler)
  })
  touchHandlers = []

  // Remove mouse handlers
  mouseHandlers.forEach(({ element, event, handler }) => {
    element.removeEventListener(event, handler)
  })
  mouseHandlers = []

  // Clear mouse state
  mouseState.position = null
  mouseState.isDown = false
  mouseState.wasClicked = false
  mouseState.canvas = null

  // Clear state
  keysHeld.clear()
  state.current = {}
  state.previous = {}
  state.direction = { x: 0, y: 0 }
  state.initialized = false

  touchState.swipeCallbacks = []
  touchState.tapCallbacks = []
  touchState.position = null
  touchState.lastTapPosition = null
  touchState.wasTapped = false
}

// Export as singleton
export const InputManager = {
  // Constants
  UP,
  DOWN,
  LEFT,
  RIGHT,
  ACTION_1,
  ACTION_2,
  PAUSE,
  START,

  // Methods
  init,
  update,
  isPressed,
  isJustPressed,
  isJustReleased,
  getDirection,
  getDirectionVector,
  getTouchPosition,
  getMousePosition,
  isMouseJustClicked,
  isMouseDown,
  getTapPosition,
  onSwipe,
  onTap,
  isGamepadConnected,
  pollGamepad,
  destroy,
}

// Auto-initialize on import (can be disabled by calling destroy first)
if (typeof window !== 'undefined') {
  init()
}
