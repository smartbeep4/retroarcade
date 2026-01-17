// AudioManager - Web Audio API-based sound system with pooling
// Handles sound effects, music, volume controls, and persistence

// Sound registry with paths and default settings
const SOUNDS = {
  // UI sounds
  'menu-select': { src: '/assets/sounds/menu-select.wav', volume: 0.5 },
  'menu-confirm': { src: '/assets/sounds/menu-confirm.wav', volume: 0.6 },
  'menu-back': { src: '/assets/sounds/menu-back.wav', volume: 0.4 },

  // Common game sounds
  'game-start': { src: '/assets/sounds/game-start.wav', volume: 0.7 },
  'game-over': { src: '/assets/sounds/game-over.wav', volume: 0.8 },
  score: { src: '/assets/sounds/score.wav', volume: 0.5 },
  hit: { src: '/assets/sounds/hit.wav', volume: 0.6 },
  explosion: { src: '/assets/sounds/explosion.wav', volume: 0.7 },
  powerup: { src: '/assets/sounds/powerup.wav', volume: 0.6 },
  jump: { src: '/assets/sounds/jump.wav', volume: 0.5 },
  shoot: { src: '/assets/sounds/shoot.wav', volume: 0.4 },
  death: { src: '/assets/sounds/death.wav', volume: 0.7 },

  // Music
  'music-menu': {
    src: '/assets/sounds/music-menu.mp3',
    volume: 0.3,
    isMusic: true,
  },
  'music-game': {
    src: '/assets/sounds/music-game.mp3',
    volume: 0.3,
    isMusic: true,
  },
}

// Storage key for localStorage
const STORAGE_KEY = 'retroarcade-audio'

// Module state
let audioContext = null
let masterGain = null
let sfxGain = null
let musicGain = null
let isUnlocked = false

// Sound buffers and pools
const bufferCache = new Map()
const soundPools = new Map()

// Music state
let currentMusic = null
let currentMusicId = null
let isPaused = false

// Volume settings
let volumes = {
  master: 1.0,
  sfx: 1.0,
  music: 0.5,
  muted: false,
}

/**
 * Initialize AudioManager - must be called before use
 * Creates AudioContext and gain nodes, loads saved settings
 */
function init() {
  if (audioContext) return // Already initialized

  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()

    // Create gain nodes for volume control hierarchy
    masterGain = audioContext.createGain()
    sfxGain = audioContext.createGain()
    musicGain = audioContext.createGain()

    // Route: sfx/music -> master -> destination
    sfxGain.connect(masterGain)
    musicGain.connect(masterGain)
    masterGain.connect(audioContext.destination)

    // Load saved volume settings
    loadSettings()

    // Apply loaded volumes
    applyVolumes()

    // Try to unlock immediately
    unlock()

    // Set up unlock listeners for user gestures
    setupUnlockListeners()
  } catch (e) {
    console.warn("Web Audio API not supported:", e);
  }
}

/**
 * Set up event listeners to unlock AudioContext on user gesture
 */
function setupUnlockListeners() {
  const events = ['click', 'touchstart', 'keydown']
  const unlockHandler = () => {
    unlock()
    events.forEach((e) => document.removeEventListener(e, unlockHandler))
  }
  events.forEach((e) =>
    document.addEventListener(e, unlockHandler, { once: true }),
  )
}

/**
 * Try to unlock AudioContext (resume if suspended)
 * Required due to browser autoplay restrictions
 */
function unlock() {
  if (isUnlocked || !audioContext) return

  // AudioContext starts suspended, needs user gesture to resume
  if (audioContext.state === 'suspended') {
    audioContext
      .resume()
      .then(() => {
        isUnlocked = true
      })
      .catch(() => {
        // Failed to unlock - will try again on next user gesture
      })
  } else {
    isUnlocked = true
  }
}

/**
 * Check if AudioManager is ready to play sounds
 * @returns {boolean} True if AudioContext is unlocked and running
 */
function isReady() {
  return isUnlocked && audioContext?.state === 'running'
}

/**
 * Load a sound file and cache the decoded audio buffer
 * @param {string} soundId - ID of the sound to load
 * @returns {Promise<AudioBuffer|null>} Decoded audio buffer or null on error
 */
async function loadSound(soundId) {
  if (bufferCache.has(soundId)) {
    return bufferCache.get(soundId)
  }

  const config = SOUNDS[soundId]
  if (!config) {
    console.warn(`Unknown sound: ${soundId}`);
    return null
  }

  try {
    const response = await fetch(config.src)
    const arrayBuffer = await response.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    bufferCache.set(soundId, audioBuffer)
    return audioBuffer
  } catch (e) {
    console.warn(`Failed to load sound: ${soundId}`, e);
    return null
  }
}

/**
 * Play a sound effect with optional parameters
 * @param {string} soundId - ID of the sound to play
 * @param {object} options - Optional parameters (volume, loop, playbackRate)
 * @returns {AudioBufferSourceNode|undefined} Source node for manual control
 */
function play(soundId, options = {}) {
  if (!isReady()) {
    unlock()
    return
  }

  const config = SOUNDS[soundId]
  if (!config) {
    console.warn(`Unknown sound: ${soundId}`);
    return
  }

  loadSound(soundId)
    .then((buffer) => {
      if (!buffer) return

      const source = audioContext.createBufferSource()
      source.buffer = buffer

      // Create gain node for this instance
      const gainNode = audioContext.createGain()
      const volume = options.volume ?? config.volume ?? 1
      gainNode.gain.value = volume

      // Connect to appropriate channel
      const targetGain = config.isMusic ? musicGain : sfxGain
      source.connect(gainNode)
      gainNode.connect(targetGain)

      // Playback options
      if (options.loop || config.loop) source.loop = true
      if (options.playbackRate)
        source.playbackRate.value = options.playbackRate

      source.start(0)

      // Return source for manual control if needed
      return source
    })
    .catch((e) => {
      console.warn(`Error playing sound ${soundId}:`, e);
    })
}

/**
 * Play a sound effect without options (convenience method)
 * @param {string} soundId - ID of the sound to play
 */
function playOneShot(soundId) {
  play(soundId)
}

/**
 * Play a music track
 * @param {string} trackId - ID of the music track
 * @param {boolean} loop - Whether to loop the track (default: true)
 */
function playMusic(trackId, loop = true) {
  // Stop existing music
  stopMusic()

  const config = SOUNDS[trackId]
  if (!config || !config.isMusic) {
    console.warn(`Unknown music track: ${trackId}`);
    return
  }

  if (!isReady()) {
    unlock()
    return
  }

  loadSound(trackId)
    .then((buffer) => {
      if (!buffer || !isReady()) return

      currentMusic = audioContext.createBufferSource()
      currentMusic.buffer = buffer
      currentMusic.loop = loop

      const gainNode = audioContext.createGain()
      gainNode.gain.value = config.volume

      currentMusic.connect(gainNode)
      gainNode.connect(musicGain)

      currentMusic.start(0)
      currentMusicId = trackId
      isPaused = false
    })
    .catch((e) => {
      console.warn(`Error playing music ${trackId}:`, e);
    })
}

/**
 * Stop the currently playing music
 */
function stopMusic() {
  if (currentMusic) {
    try {
      currentMusic.stop()
    } catch (e) {
      // Already stopped
    }
    currentMusic = null
    currentMusicId = null
    isPaused = false
  }
}

/**
 * Pause the currently playing music
 */
function pauseMusic() {
  if (currentMusic && !isPaused && audioContext) {
    const trackId = currentMusicId
    stopMusic()
    isPaused = true
    currentMusicId = trackId // Preserve track ID for resume
  }
}

/**
 * Resume paused music
 */
function resumeMusic() {
  if (isPaused && currentMusicId) {
    const trackId = currentMusicId
    isPaused = false
    playMusic(trackId)
  }
}

/**
 * Set the current music track without playing it
 * @param {string} trackId - ID of the music track
 */
function setMusicTrack(trackId) {
  const config = SOUNDS[trackId]
  if (!config || !config.isMusic) {
    console.warn(`Unknown music track: ${trackId}`);
    return
  }

  stopMusic()
  currentMusicId = trackId

  // Preload the track
  if (isReady()) {
    loadSound(trackId)
  }
}

/**
 * Set master volume (affects all audio)
 * @param {number} value - Volume level (0.0 to 1.0)
 */
function setMasterVolume(value) {
  volumes.master = Math.max(0, Math.min(1, value))
  if (masterGain) {
    masterGain.gain.value = volumes.muted ? 0 : volumes.master
  }
  saveSettings()
}

/**
 * Get master volume
 * @returns {number} Current master volume (0.0 to 1.0)
 */
function getMasterVolume() {
  return volumes.master
}

/**
 * Set SFX volume
 * @param {number} value - Volume level (0.0 to 1.0)
 */
function setSFXVolume(value) {
  volumes.sfx = Math.max(0, Math.min(1, value))
  if (sfxGain) {
    sfxGain.gain.value = volumes.sfx
  }
  saveSettings()
}

/**
 * Get SFX volume
 * @returns {number} Current SFX volume (0.0 to 1.0)
 */
function getSFXVolume() {
  return volumes.sfx
}

/**
 * Set music volume
 * @param {number} value - Volume level (0.0 to 1.0)
 */
function setMusicVolume(value) {
  volumes.music = Math.max(0, Math.min(1, value))
  if (musicGain) {
    musicGain.gain.value = volumes.music
  }
  saveSettings()
}

/**
 * Get music volume
 * @returns {number} Current music volume (0.0 to 1.0)
 */
function getMusicVolume() {
  return volumes.music
}

/**
 * Mute all audio
 */
function mute() {
  volumes.muted = true
  if (masterGain) masterGain.gain.value = 0
  saveSettings()
}

/**
 * Unmute all audio
 */
function unmute() {
  volumes.muted = false
  if (masterGain) masterGain.gain.value = volumes.master
  saveSettings()
}

/**
 * Toggle mute state
 */
function toggleMute() {
  if (volumes.muted) {
    unmute()
  } else {
    mute()
  }
}

/**
 * Check if audio is muted
 * @returns {boolean} True if muted
 */
function isMuted() {
  return volumes.muted
}

/**
 * Save volume settings to localStorage
 */
function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(volumes))
  } catch (e) {
    // localStorage not available
  }
}

/**
 * Load volume settings from localStorage
 */
function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      volumes = { ...volumes, ...parsed }
    }
  } catch (e) {
    // Invalid or unavailable
  }
}

/**
 * Apply current volume settings to gain nodes
 */
function applyVolumes() {
  if (masterGain) masterGain.gain.value = volumes.muted ? 0 : volumes.master
  if (sfxGain) sfxGain.gain.value = volumes.sfx
  if (musicGain) musicGain.gain.value = volumes.music
}

/**
 * Clean up AudioManager resources
 */
function destroy() {
  stopMusic()

  if (audioContext) {
    audioContext.close()
    audioContext = null
  }

  masterGain = null
  sfxGain = null
  musicGain = null
  isUnlocked = false
  bufferCache.clear()
  soundPools.clear()

  // Reset volumes to defaults
  volumes = {
    master: 1.0,
    sfx: 1.0,
    music: 0.5,
    muted: false,
  }
}

// Export AudioManager API
export const AudioManager = {
  // Initialize
  init,

  // Sound effects
  play,
  playOneShot,

  // Music
  playMusic,
  stopMusic,
  pauseMusic,
  resumeMusic,
  setMusicTrack,

  // Volume controls (0.0 to 1.0)
  setMasterVolume,
  getMasterVolume,
  setSFXVolume,
  getSFXVolume,
  setMusicVolume,
  getMusicVolume,

  // Mute
  mute,
  unmute,
  toggleMute,
  isMuted,

  // State
  isReady,
  unlock,

  // Cleanup
  destroy,
}
