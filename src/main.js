import { ArcadeShell } from './arcade/ArcadeShell.js'

// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas')

  if (!canvas) {
    // console.error('Canvas element #game-canvas not found')
    return
  }

  const arcade = new ArcadeShell(canvas)
  arcade.init()

  // Make arcade globally accessible for debugging
  if (typeof window !== 'undefined') {
    window.arcade = arcade
  }
})
