import { Page } from '@playwright/test'

/**
 * KeyboardController - Utilities for simulating keyboard input in games
 *
 * Note: This controller dispatches events directly on window because the
 * game's InputManager listens on window, not on a focused element.
 */
export class KeyboardController {
  private page: Page
  private heldKeys: Set<string> = new Set()

  constructor(page: Page) {
    this.page = page
  }

  /**
   * Map special key names to their actual key values
   * The 'key' property should be the actual character/key, not the code
   */
  private static readonly keyNameToKeyValue: Record<string, string> = {
    Space: ' ',
    Enter: 'Enter',
    Escape: 'Escape',
    ArrowUp: 'ArrowUp',
    ArrowDown: 'ArrowDown',
    ArrowLeft: 'ArrowLeft',
    ArrowRight: 'ArrowRight',
    Shift: 'Shift',
  }

  /**
   * Dispatch a keyboard event on the window object
   */
  private async dispatchKeyEvent(type: 'keydown' | 'keyup', key: string): Promise<void> {
    await this.page.evaluate(
      ([eventType, eventKey, keyNameMap]) => {
        // Convert key name to actual key value (e.g., "Space" -> " ")
        const actualKey = (keyNameMap as Record<string, string>)[eventKey] || eventKey
        const event = new KeyboardEvent(eventType, {
          key: actualKey,
          code: eventKey,
          bubbles: true,
          cancelable: true,
        })
        window.dispatchEvent(event)
      },
      [type, key, KeyboardController.keyNameToKeyValue]
    )
  }

  /**
   * Press and release a key
   */
  async press(key: string): Promise<void> {
    await this.dispatchKeyEvent('keydown', key)
    // Wait long enough for at least one frame to process the key
    await this.page.waitForTimeout(80)
    await this.dispatchKeyEvent('keyup', key)
  }

  /**
   * Press and hold a key
   */
  async hold(key: string): Promise<void> {
    if (!this.heldKeys.has(key)) {
      await this.dispatchKeyEvent('keydown', key)
      this.heldKeys.add(key)
    }
  }

  /**
   * Release a held key
   */
  async release(key: string): Promise<void> {
    if (this.heldKeys.has(key)) {
      await this.dispatchKeyEvent('keyup', key)
      this.heldKeys.delete(key)
    }
  }

  /**
   * Release all held keys
   */
  async releaseAll(): Promise<void> {
    for (const key of this.heldKeys) {
      await this.page.keyboard.up(key)
    }
    this.heldKeys.clear()
  }

  /**
   * Press a key for a specific duration
   */
  async holdFor(key: string, durationMs: number): Promise<void> {
    await this.hold(key)
    await this.page.waitForTimeout(durationMs)
    await this.release(key)
  }

  /**
   * Press a sequence of keys with delays between them
   */
  async sequence(keys: Array<{ key: string; duration?: number; delay?: number }>): Promise<void> {
    for (const { key, duration = 0, delay = 0 } of keys) {
      if (delay > 0) {
        await this.page.waitForTimeout(delay)
      }
      if (duration > 0) {
        await this.holdFor(key, duration)
      } else {
        await this.press(key)
      }
    }
  }

  /**
   * Tap a direction key (Arrow keys)
   */
  async tapDirection(direction: 'up' | 'down' | 'left' | 'right'): Promise<void> {
    const keyMap = {
      up: 'ArrowUp',
      down: 'ArrowDown',
      left: 'ArrowLeft',
      right: 'ArrowRight',
    }
    await this.press(keyMap[direction])
  }

  /**
   * Hold a direction key for a duration
   */
  async holdDirection(
    direction: 'up' | 'down' | 'left' | 'right',
    durationMs: number
  ): Promise<void> {
    const keyMap = {
      up: 'ArrowUp',
      down: 'ArrowDown',
      left: 'ArrowLeft',
      right: 'ArrowRight',
    }
    await this.holdFor(keyMap[direction], durationMs)
  }

  /**
   * Press the action key (Space)
   */
  async action(): Promise<void> {
    await this.press('Space')
  }

  /**
   * Press the start/confirm key (Enter)
   */
  async start(): Promise<void> {
    await this.press('Enter')
  }

  /**
   * Press the pause key (Escape)
   */
  async pause(): Promise<void> {
    await this.press('Escape')
  }

  /**
   * Navigate menu: move selection up
   */
  async menuUp(): Promise<void> {
    await this.press('ArrowUp')
  }

  /**
   * Navigate menu: move selection down
   */
  async menuDown(): Promise<void> {
    await this.press('ArrowDown')
  }

  /**
   * Navigate menu: move selection left
   */
  async menuLeft(): Promise<void> {
    await this.press('ArrowLeft')
  }

  /**
   * Navigate menu: move selection right
   */
  async menuRight(): Promise<void> {
    await this.press('ArrowRight')
  }

  /**
   * Confirm menu selection
   */
  async menuConfirm(): Promise<void> {
    await this.press('Enter')
  }

  /**
   * Type text (for name entry, etc.)
   */
  async type(text: string): Promise<void> {
    await this.page.keyboard.type(text)
  }

  /**
   * Wait for a number of game frames (at 60 FPS)
   */
  async waitFrames(frames: number): Promise<void> {
    const msPerFrame = 1000 / 60
    await this.page.waitForTimeout(frames * msPerFrame)
  }

  /**
   * Simulate rapid key tapping
   */
  async rapidTap(key: string, count: number, intervalMs: number = 50): Promise<void> {
    for (let i = 0; i < count; i++) {
      await this.press(key)
      if (i < count - 1) {
        await this.page.waitForTimeout(intervalMs)
      }
    }
  }

  /**
   * Simulate WASD movement
   */
  async wasd(direction: 'up' | 'down' | 'left' | 'right'): Promise<void> {
    const keyMap = {
      up: 'w',
      down: 's',
      left: 'a',
      right: 'd',
    }
    await this.press(keyMap[direction])
  }
}
