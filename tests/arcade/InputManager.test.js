import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { InputManager } from '../../src/arcade/InputManager.js'

describe('InputManager', () => {
  beforeEach(() => {
    // Clean up state before each test
    InputManager.destroy()
    InputManager.init()
  })

  afterEach(() => {
    // Clean up after each test
    InputManager.destroy()
  })

  describe('Constants', () => {
    it('exports key constants', () => {
      expect(InputManager.UP).toBe('up')
      expect(InputManager.DOWN).toBe('down')
      expect(InputManager.LEFT).toBe('left')
      expect(InputManager.RIGHT).toBe('right')
      expect(InputManager.ACTION_1).toBe('action1')
      expect(InputManager.ACTION_2).toBe('action2')
      expect(InputManager.PAUSE).toBe('pause')
      expect(InputManager.START).toBe('start')
    })
  })

  describe('isPressed', () => {
    it('returns false when no key pressed', () => {
      InputManager.update()
      expect(InputManager.isPressed(InputManager.UP)).toBe(false)
    })

    it('returns true when key is held', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
      InputManager.update()
      expect(InputManager.isPressed(InputManager.UP)).toBe(true)
    })

    it('returns true across multiple frames', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
      InputManager.update()
      expect(InputManager.isPressed(InputManager.UP)).toBe(true)

      InputManager.update()
      expect(InputManager.isPressed(InputManager.UP)).toBe(true)

      InputManager.update()
      expect(InputManager.isPressed(InputManager.UP)).toBe(true)
    })

    it('returns false after key is released', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
      InputManager.update()
      expect(InputManager.isPressed(InputManager.UP)).toBe(true)

      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' }))
      InputManager.update()
      expect(InputManager.isPressed(InputManager.UP)).toBe(false)
    })
  })

  describe('isJustPressed', () => {
    it('returns false when no key pressed', () => {
      InputManager.update()
      expect(InputManager.isJustPressed(InputManager.ACTION_1)).toBe(false)
    })

    it('returns true only on first frame of press', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
      InputManager.update()
      expect(InputManager.isJustPressed(InputManager.ACTION_1)).toBe(true)

      InputManager.update()
      expect(InputManager.isJustPressed(InputManager.ACTION_1)).toBe(false)
      expect(InputManager.isPressed(InputManager.ACTION_1)).toBe(true)
    })

    it('returns true again after release and re-press', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
      InputManager.update()
      expect(InputManager.isJustPressed(InputManager.ACTION_1)).toBe(true)

      InputManager.update()
      expect(InputManager.isJustPressed(InputManager.ACTION_1)).toBe(false)

      window.dispatchEvent(new KeyboardEvent('keyup', { key: ' ' }))
      InputManager.update()
      expect(InputManager.isJustPressed(InputManager.ACTION_1)).toBe(false)

      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
      InputManager.update()
      expect(InputManager.isJustPressed(InputManager.ACTION_1)).toBe(true)
    })
  })

  describe('isJustReleased', () => {
    it('returns false when key is not pressed', () => {
      InputManager.update()
      expect(InputManager.isJustReleased(InputManager.UP)).toBe(false)
    })

    it('returns true only on frame key is released', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
      InputManager.update()
      expect(InputManager.isJustReleased(InputManager.UP)).toBe(false)

      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' }))
      InputManager.update()
      expect(InputManager.isJustReleased(InputManager.UP)).toBe(true)

      InputManager.update()
      expect(InputManager.isJustReleased(InputManager.UP)).toBe(false)
    })
  })

  describe('getDirection', () => {
    it('returns zero vector when no direction pressed', () => {
      InputManager.update()
      const dir = InputManager.getDirection()
      expect(dir.x).toBe(0)
      expect(dir.y).toBe(0)
    })

    it('returns correct direction for up', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
      InputManager.update()

      const dir = InputManager.getDirection()
      expect(dir.x).toBe(0)
      expect(dir.y).toBe(-1)
    })

    it('returns correct direction for down', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
      InputManager.update()

      const dir = InputManager.getDirection()
      expect(dir.x).toBe(0)
      expect(dir.y).toBe(1)
    })

    it('returns correct direction for left', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
      InputManager.update()

      const dir = InputManager.getDirection()
      expect(dir.x).toBe(-1)
      expect(dir.y).toBe(0)
    })

    it('returns correct direction for right', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
      InputManager.update()

      const dir = InputManager.getDirection()
      expect(dir.x).toBe(1)
      expect(dir.y).toBe(0)
    })

    it('returns correct direction for diagonal input', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
      InputManager.update()

      const dir = InputManager.getDirection()
      expect(dir.x).toBe(-1)
      expect(dir.y).toBe(-1)
    })

    it('handles opposite directions correctly (cancel out)', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
      InputManager.update()

      const dir = InputManager.getDirection()
      expect(dir.x).toBe(0)
      expect(dir.y).toBe(0)
    })

    it('returns a copy of the direction object', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
      InputManager.update()

      const dir1 = InputManager.getDirection()
      const dir2 = InputManager.getDirection()

      expect(dir1).not.toBe(dir2)
      expect(dir1).toEqual(dir2)
    })
  })

  describe('getDirectionVector', () => {
    it('returns zero vector when no direction pressed', () => {
      InputManager.update()
      const vec = InputManager.getDirectionVector()
      expect(vec.x).toBe(0)
      expect(vec.y).toBe(0)
    })

    it('returns unit vector for single direction', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
      InputManager.update()

      const vec = InputManager.getDirectionVector()
      expect(vec.x).toBe(1)
      expect(vec.y).toBe(0)
    })

    it('returns normalized vector for diagonal input', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
      InputManager.update()

      const vec = InputManager.getDirectionVector()
      const expectedLen = Math.sqrt(2) / 2
      expect(vec.x).toBeCloseTo(expectedLen, 5)
      expect(vec.y).toBeCloseTo(-expectedLen, 5)

      // Verify it's normalized
      const len = Math.sqrt(vec.x * vec.x + vec.y * vec.y)
      expect(len).toBeCloseTo(1, 5)
    })
  })

  describe('Keyboard mappings - Arrow keys', () => {
    it('maps ArrowUp to up', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
      InputManager.update()
      expect(InputManager.isPressed(InputManager.UP)).toBe(true)
    })

    it('maps ArrowDown to down', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
      InputManager.update()
      expect(InputManager.isPressed(InputManager.DOWN)).toBe(true)
    })

    it('maps ArrowLeft to left', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
      InputManager.update()
      expect(InputManager.isPressed(InputManager.LEFT)).toBe(true)
    })

    it('maps ArrowRight to right', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
      InputManager.update()
      expect(InputManager.isPressed(InputManager.RIGHT)).toBe(true)
    })
  })

  describe('Keyboard mappings - WASD', () => {
    it('maps w to up', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }))
      InputManager.update()
      expect(InputManager.isPressed(InputManager.UP)).toBe(true)
    })

    it('maps W to up', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'W' }))
      InputManager.update()
      expect(InputManager.isPressed(InputManager.UP)).toBe(true)
    })

    it('maps s to down', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }))
      InputManager.update()
      expect(InputManager.isPressed(InputManager.DOWN)).toBe(true)
    })

    it('maps S to down', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'S' }))
      InputManager.update()
      expect(InputManager.isPressed(InputManager.DOWN)).toBe(true)
    })

    it('maps a to left', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
      InputManager.update()
      expect(InputManager.isPressed(InputManager.LEFT)).toBe(true)
    })

    it('maps A to left', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'A' }))
      InputManager.update()
      expect(InputManager.isPressed(InputManager.LEFT)).toBe(true)
    })

    it('maps d to right', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }))
      InputManager.update()
      expect(InputManager.isPressed(InputManager.RIGHT)).toBe(true)
    })

    it('maps D to right', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'D' }))
      InputManager.update()
      expect(InputManager.isPressed(InputManager.RIGHT)).toBe(true)
    })
  })

  describe('Keyboard mappings - Action keys', () => {
    it('maps Space to action1', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
      InputManager.update()
      expect(InputManager.isPressed(InputManager.ACTION_1)).toBe(true)
    })

    it('maps Enter to action1', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
      InputManager.update()
      expect(InputManager.isPressed(InputManager.ACTION_1)).toBe(true)
    })

    it('maps z to action1', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z' }))
      InputManager.update()
      expect(InputManager.isPressed(InputManager.ACTION_1)).toBe(true)
    })

    it('maps Z to action1', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Z' }))
      InputManager.update()
      expect(InputManager.isPressed(InputManager.ACTION_1)).toBe(true)
    })

    it('maps Shift to action2', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }))
      InputManager.update()
      expect(InputManager.isPressed(InputManager.ACTION_2)).toBe(true)
    })

    it('maps x to action2', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }))
      InputManager.update()
      expect(InputManager.isPressed(InputManager.ACTION_2)).toBe(true)
    })

    it('maps X to action2', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'X' }))
      InputManager.update()
      expect(InputManager.isPressed(InputManager.ACTION_2)).toBe(true)
    })

    it('maps Escape to pause', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      InputManager.update()
      expect(InputManager.isPressed(InputManager.PAUSE)).toBe(true)
    })

    it('maps p to pause', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }))
      InputManager.update()
      expect(InputManager.isPressed(InputManager.PAUSE)).toBe(true)
    })

    it('maps P to pause', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'P' }))
      InputManager.update()
      expect(InputManager.isPressed(InputManager.PAUSE)).toBe(true)
    })
  })

  describe('Multiple simultaneous keys', () => {
    it('handles multiple directional keys', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
      InputManager.update()

      expect(InputManager.isPressed(InputManager.UP)).toBe(true)
      expect(InputManager.isPressed(InputManager.RIGHT)).toBe(true)
    })

    it('handles direction + action keys', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
      InputManager.update()

      expect(InputManager.isPressed(InputManager.UP)).toBe(true)
      expect(InputManager.isPressed(InputManager.ACTION_1)).toBe(true)
    })

    it('handles all direction keys simultaneously', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }))
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }))
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }))
      InputManager.update()

      expect(InputManager.isPressed(InputManager.UP)).toBe(true)
      expect(InputManager.isPressed(InputManager.LEFT)).toBe(true)
      expect(InputManager.isPressed(InputManager.DOWN)).toBe(true)
      expect(InputManager.isPressed(InputManager.RIGHT)).toBe(true)

      const dir = InputManager.getDirection()
      expect(dir.x).toBe(0) // left + right cancel
      expect(dir.y).toBe(0) // up + down cancel
    })
  })

  describe('Touch input', () => {
    it('getTouchPosition returns null initially', () => {
      InputManager.update()
      expect(InputManager.getTouchPosition()).toBe(null)
    })

    it('registers swipe callbacks', () => {
      const callback = vi.fn()
      InputManager.onSwipe(callback)
      expect(callback).not.toHaveBeenCalled()
    })

    it('registers tap callbacks', () => {
      const callback = vi.fn()
      InputManager.onTap(callback)
      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('Gamepad', () => {
    it('isGamepadConnected returns false when no gamepad', () => {
      expect(InputManager.isGamepadConnected()).toBe(false)
    })

    it('handles missing navigator.getGamepads', () => {
      const originalGetGamepads = navigator.getGamepads
      delete navigator.getGamepads

      expect(InputManager.isGamepadConnected()).toBe(false)
      InputManager.update() // Should not crash

      navigator.getGamepads = originalGetGamepads
    })

    it('detects gamepad when connected', () => {
      const mockGamepad = {
        id: 'Test Gamepad',
        index: 0,
        connected: true,
        buttons: Array(16).fill({ pressed: false, value: 0 }),
        axes: [0, 0, 0, 0],
      }

      const originalGetGamepads = navigator.getGamepads
      navigator.getGamepads = vi.fn(() => [mockGamepad])

      expect(InputManager.isGamepadConnected()).toBe(true)

      navigator.getGamepads = originalGetGamepads
    })

    it('reads gamepad D-pad buttons', () => {
      const mockGamepad = {
        id: 'Test Gamepad',
        index: 0,
        connected: true,
        buttons: [
          { pressed: false, value: 0 }, // 0
          { pressed: false, value: 0 }, // 1
          { pressed: false, value: 0 }, // 2
          { pressed: false, value: 0 }, // 3
          { pressed: false, value: 0 }, // 4
          { pressed: false, value: 0 }, // 5
          { pressed: false, value: 0 }, // 6
          { pressed: false, value: 0 }, // 7
          { pressed: false, value: 0 }, // 8
          { pressed: false, value: 0 }, // 9
          { pressed: false, value: 0 }, // 10
          { pressed: false, value: 0 }, // 11
          { pressed: true, value: 1 }, // 12 - up
          { pressed: false, value: 0 }, // 13
          { pressed: false, value: 0 }, // 14
          { pressed: false, value: 0 }, // 15
        ],
        axes: [0, 0, 0, 0],
      }

      const originalGetGamepads = navigator.getGamepads
      navigator.getGamepads = vi.fn(() => [mockGamepad])

      InputManager.update()
      expect(InputManager.isPressed(InputManager.UP)).toBe(true)

      navigator.getGamepads = originalGetGamepads
    })

    it('reads gamepad face buttons', () => {
      const mockGamepad = {
        id: 'Test Gamepad',
        index: 0,
        connected: true,
        buttons: [
          { pressed: true, value: 1 }, // 0 - A button (action1)
          { pressed: false, value: 0 }, // 1
          { pressed: false, value: 0 }, // 2
          { pressed: false, value: 0 }, // 3
          { pressed: false, value: 0 }, // 4
          { pressed: false, value: 0 }, // 5
          { pressed: false, value: 0 }, // 6
          { pressed: false, value: 0 }, // 7
          { pressed: false, value: 0 }, // 8
          { pressed: false, value: 0 }, // 9
          { pressed: false, value: 0 }, // 10
          { pressed: false, value: 0 }, // 11
          { pressed: false, value: 0 }, // 12
          { pressed: false, value: 0 }, // 13
          { pressed: false, value: 0 }, // 14
          { pressed: false, value: 0 }, // 15
        ],
        axes: [0, 0, 0, 0],
      }

      const originalGetGamepads = navigator.getGamepads
      navigator.getGamepads = vi.fn(() => [mockGamepad])

      InputManager.update()
      expect(InputManager.isPressed(InputManager.ACTION_1)).toBe(true)

      navigator.getGamepads = originalGetGamepads
    })

    it('reads gamepad analog stick with deadzone', () => {
      const mockGamepad = {
        id: 'Test Gamepad',
        index: 0,
        connected: true,
        buttons: Array(16).fill({ pressed: false, value: 0 }),
        axes: [0.8, -0.5, 0, 0], // x > deadzone (right), y < -deadzone (up)
      }

      const originalGetGamepads = navigator.getGamepads
      navigator.getGamepads = vi.fn(() => [mockGamepad])

      InputManager.update()
      expect(InputManager.isPressed(InputManager.RIGHT)).toBe(true)
      expect(InputManager.isPressed(InputManager.UP)).toBe(true)

      navigator.getGamepads = originalGetGamepads
    })

    it('ignores gamepad analog stick within deadzone', () => {
      const mockGamepad = {
        id: 'Test Gamepad',
        index: 0,
        connected: true,
        buttons: Array(16).fill({ pressed: false, value: 0 }),
        axes: [0.2, -0.1, 0, 0], // within deadzone (0.3)
      }

      const originalGetGamepads = navigator.getGamepads
      navigator.getGamepads = vi.fn(() => [mockGamepad])

      InputManager.update()
      expect(InputManager.isPressed(InputManager.RIGHT)).toBe(false)
      expect(InputManager.isPressed(InputManager.UP)).toBe(false)
      expect(InputManager.isPressed(InputManager.LEFT)).toBe(false)
      expect(InputManager.isPressed(InputManager.DOWN)).toBe(false)

      navigator.getGamepads = originalGetGamepads
    })
  })

  describe('State reset', () => {
    it('resets state correctly between frames', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
      InputManager.update()
      expect(InputManager.isPressed(InputManager.UP)).toBe(true)

      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' }))
      InputManager.update()
      expect(InputManager.isPressed(InputManager.UP)).toBe(false)
    })

    it('update() clears previous frame state', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
      InputManager.update()
      expect(InputManager.isJustPressed(InputManager.ACTION_1)).toBe(true)

      InputManager.update()
      expect(InputManager.isJustPressed(InputManager.ACTION_1)).toBe(false)
    })
  })

  describe('Cleanup', () => {
    it('destroy removes event listeners', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
      InputManager.update()
      expect(InputManager.isPressed(InputManager.UP)).toBe(true)

      InputManager.destroy()

      // After destroy, new key events should not be registered
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
      InputManager.update()
      expect(InputManager.isPressed(InputManager.DOWN)).toBe(false)
    })

    it('destroy clears all state', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
      InputManager.update()
      expect(InputManager.isPressed(InputManager.UP)).toBe(true)

      InputManager.destroy()
      InputManager.update()
      expect(InputManager.isPressed(InputManager.UP)).toBe(false)
    })

    it('can re-initialize after destroy', () => {
      InputManager.destroy()
      InputManager.init()

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
      InputManager.update()
      expect(InputManager.isPressed(InputManager.UP)).toBe(true)
    })
  })

  describe('Edge cases', () => {
    it('handles rapid key press and release', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
      InputManager.update()
      expect(InputManager.isJustPressed(InputManager.ACTION_1)).toBe(true)

      window.dispatchEvent(new KeyboardEvent('keyup', { key: ' ' }))
      InputManager.update()
      expect(InputManager.isJustReleased(InputManager.ACTION_1)).toBe(true)

      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
      InputManager.update()
      expect(InputManager.isJustPressed(InputManager.ACTION_1)).toBe(true)
    })

    it('handles unmapped keys gracefully', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q' }))
      InputManager.update()

      // Should not crash and no inputs should be registered
      expect(InputManager.isPressed(InputManager.UP)).toBe(false)
      expect(InputManager.isPressed(InputManager.ACTION_1)).toBe(false)
    })

    it('returns independent copies of direction', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
      InputManager.update()

      const dir1 = InputManager.getDirection()
      dir1.x = 999
      dir1.y = 999

      const dir2 = InputManager.getDirection()
      expect(dir2.x).toBe(0)
      expect(dir2.y).toBe(-1)
    })
  })

  describe('Integration scenarios', () => {
    it('handles complex multi-frame input sequence', () => {
      // Frame 1: Press up
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
      InputManager.update()
      expect(InputManager.isJustPressed(InputManager.UP)).toBe(true)
      expect(InputManager.isPressed(InputManager.UP)).toBe(true)

      // Frame 2: Hold up, press action
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
      InputManager.update()
      expect(InputManager.isJustPressed(InputManager.UP)).toBe(false)
      expect(InputManager.isPressed(InputManager.UP)).toBe(true)
      expect(InputManager.isJustPressed(InputManager.ACTION_1)).toBe(true)

      // Frame 3: Hold both
      InputManager.update()
      expect(InputManager.isPressed(InputManager.UP)).toBe(true)
      expect(InputManager.isPressed(InputManager.ACTION_1)).toBe(true)
      expect(InputManager.isJustPressed(InputManager.UP)).toBe(false)
      expect(InputManager.isJustPressed(InputManager.ACTION_1)).toBe(false)

      // Frame 4: Release up
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' }))
      InputManager.update()
      expect(InputManager.isJustReleased(InputManager.UP)).toBe(true)
      expect(InputManager.isPressed(InputManager.UP)).toBe(false)
      expect(InputManager.isPressed(InputManager.ACTION_1)).toBe(true)

      // Frame 5: Release action
      window.dispatchEvent(new KeyboardEvent('keyup', { key: ' ' }))
      InputManager.update()
      expect(InputManager.isPressed(InputManager.UP)).toBe(false)
      expect(InputManager.isPressed(InputManager.ACTION_1)).toBe(false)
      expect(InputManager.isJustReleased(InputManager.ACTION_1)).toBe(true)
    })

    it('correctly handles WASD + Arrow key redundancy', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }))
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
      InputManager.update()

      // Both map to UP, should still only count as one input
      expect(InputManager.isPressed(InputManager.UP)).toBe(true)

      const dir = InputManager.getDirection()
      expect(dir.y).toBe(-1) // Not -2
    })
  })
})
