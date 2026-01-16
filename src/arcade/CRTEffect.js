// src/arcade/CRTEffect.js
// CRT Monitor Post-Processing Effects System

const STORAGE_KEY = 'retroarcade-crt'

const DEFAULT_SETTINGS = {
  enabled: true,
  scanlines: 0.5,
  curvature: 0.3,
  bloom: 0.2,
  chromatic: 0.1,
  vignette: 0.4,
  flicker: false,
}

let settings = { ...DEFAULT_SETTINGS }
let container = null
let elements = {}

/**
 * Initialize the CRT effect system with a target container
 * @param {HTMLElement} targetContainer - The DOM element to apply effects to
 */
function init(targetContainer) {
  if (!targetContainer) {
    throw new Error('CRTEffect.init requires a valid container element')
  }

  container = targetContainer
  loadSettings()
  createOverlays()
  applySettings()
}

/**
 * Create and append overlay elements to the container
 */
function createOverlays() {
  if (!container) {
    throw new Error('CRTEffect not initialized. Call init() first.')
  }

  // Create scanlines overlay
  elements.scanlines = document.createElement('div')
  elements.scanlines.className = 'crt-scanlines'

  // Create vignette overlay
  elements.vignette = document.createElement('div')
  elements.vignette.className = 'crt-vignette'

  // Create bloom overlay
  elements.bloom = document.createElement('div')
  elements.bloom.className = 'crt-bloom-overlay'

  // Append to container in correct stacking order
  container.appendChild(elements.bloom)
  container.appendChild(elements.scanlines)
  container.appendChild(elements.vignette)
}

/**
 * Apply current settings to the DOM and CSS variables
 */
function applySettings() {
  if (!container) return

  const root = document.documentElement

  if (settings.enabled) {
    container.classList.add('crt-enabled')

    // Apply intensities via CSS variables
    root.style.setProperty('--scanline-intensity', settings.scanlines)
    root.style.setProperty('--bloom-intensity', settings.bloom)
    root.style.setProperty('--vignette-intensity', settings.vignette)
    root.style.setProperty('--chromatic-intensity', settings.chromatic)
    root.style.setProperty('--curvature-intensity', settings.curvature)

    // Toggle flicker animation
    if (settings.flicker) {
      container.classList.add('crt-flicker')
    } else {
      container.classList.remove('crt-flicker')
    }

    // Show overlays
    Object.values(elements).forEach((el) => {
      if (el) el.style.display = 'block'
    })
  } else {
    container.classList.remove('crt-enabled', 'crt-flicker')
    Object.values(elements).forEach((el) => {
      if (el) el.style.display = 'none'
    })
  }
}

/**
 * Enable CRT effects
 */
function enable() {
  settings.enabled = true
  applySettings()
  saveSettings()
}

/**
 * Disable CRT effects
 */
function disable() {
  settings.enabled = false
  applySettings()
  saveSettings()
}

/**
 * Toggle CRT effects on/off
 */
function toggle() {
  if (settings.enabled) {
    disable()
  } else {
    enable()
  }
}

/**
 * Check if CRT effects are currently enabled
 * @returns {boolean} True if enabled
 */
function isEnabled() {
  return settings.enabled
}

/**
 * Set scanline intensity
 * @param {number} value - Intensity from 0.0 to 1.0
 */
function setScanlineIntensity(value) {
  settings.scanlines = Math.max(0, Math.min(1, value))
  applySettings()
  saveSettings()
}

/**
 * Set screen curvature intensity
 * @param {number} value - Intensity from 0.0 to 1.0
 */
function setCurvature(value) {
  settings.curvature = Math.max(0, Math.min(1, value))
  applySettings()
  saveSettings()
}

/**
 * Set bloom/glow intensity
 * @param {number} value - Intensity from 0.0 to 1.0
 */
function setBloom(value) {
  settings.bloom = Math.max(0, Math.min(1, value))
  applySettings()
  saveSettings()
}

/**
 * Set chromatic aberration intensity
 * @param {number} value - Intensity from 0.0 to 1.0
 */
function setChromaticAberration(value) {
  settings.chromatic = Math.max(0, Math.min(1, value))
  applySettings()
  saveSettings()
}

/**
 * Set vignette intensity
 * @param {number} value - Intensity from 0.0 to 1.0
 */
function setVignette(value) {
  settings.vignette = Math.max(0, Math.min(1, value))
  applySettings()
  saveSettings()
}

/**
 * Enable or disable flicker effect
 * @param {boolean} enabled - True to enable flicker
 */
function setFlicker(enabled) {
  settings.flicker = Boolean(enabled)
  applySettings()
  saveSettings()
}

// Preset configurations
const PRESETS = {
  off: { enabled: false },
  subtle: {
    enabled: true,
    scanlines: 0.3,
    curvature: 0.2,
    bloom: 0.1,
    chromatic: 0.05,
    vignette: 0.2,
    flicker: false,
  },
  classic: {
    enabled: true,
    scanlines: 0.5,
    curvature: 0.4,
    bloom: 0.2,
    chromatic: 0.1,
    vignette: 0.4,
    flicker: false,
  },
  extreme: {
    enabled: true,
    scanlines: 0.8,
    curvature: 0.6,
    bloom: 0.4,
    chromatic: 0.2,
    vignette: 0.6,
    flicker: true,
  },
}

/**
 * Apply a preset configuration
 * @param {string} presetName - Name of preset: 'off', 'subtle', 'classic', 'extreme'
 */
function applyPreset(presetName) {
  const preset = PRESETS[presetName]
  if (preset) {
    settings = { ...DEFAULT_SETTINGS, ...preset }
    applySettings()
    saveSettings()
  }
}

/**
 * Get current settings (returns a copy)
 * @returns {Object} Current settings object
 */
function getSettings() {
  return { ...settings }
}

/**
 * Save current settings to localStorage
 */
function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (e) {
    // localStorage unavailable or quota exceeded
    // console.warn('CRTEffect: Unable to save settings to localStorage', e)
  }
}

/**
 * Load settings from localStorage
 */
function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      settings = { ...DEFAULT_SETTINGS, ...parsed }
    } else {
      // Reset to defaults if no saved settings
      settings = { ...DEFAULT_SETTINGS }
    }
  } catch (e) {
    // Invalid JSON or localStorage unavailable - reset to defaults
    // console.warn("CRTEffect: Unable to load settings from localStorage", e);
    settings = { ...DEFAULT_SETTINGS }
  }
}

/**
 * Clean up and remove all CRT effect elements
 */
function destroy() {
  // Remove all overlay elements
  Object.values(elements).forEach((el) => {
    if (el && el.parentNode) {
      el.remove()
    }
  })

  // Clear CSS classes
  if (container) {
    container.classList.remove('crt-enabled', 'crt-flicker')
  }

  // Reset state
  elements = {}
  container = null
}

// Export public API
export const CRTEffect = {
  init,
  enable,
  disable,
  toggle,
  isEnabled,
  setScanlineIntensity,
  setCurvature,
  setBloom,
  setChromaticAberration,
  setVignette,
  setFlicker,
  applyPreset,
  getSettings,
  saveSettings,
  loadSettings,
  destroy,
}
