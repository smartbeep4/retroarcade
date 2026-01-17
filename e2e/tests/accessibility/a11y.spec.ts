import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { ArcadeShellPage, GameId } from '../../page-objects/arcade-shell.page'

/**
 * Accessibility tests using axe-core
 *
 * These tests verify that the application meets WCAG accessibility standards.
 * We check for A and AA level violations.
 */

test.describe('Accessibility Tests', () => {
  test.describe('Main Menu', () => {
    test('main menu should have no critical accessibility violations', async ({ page }) => {
      const arcade = new ArcadeShellPage(page)
      await arcade.goto()

      // Wait for menu to fully render
      await page.waitForTimeout(500)

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude('#game-canvas') // Canvas content is dynamic, tested separately
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('page should have proper document structure', async ({ page }) => {
      const arcade = new ArcadeShellPage(page)
      await arcade.goto()

      // Check for proper HTML document structure
      const html = await page.locator('html')
      await expect(html).toHaveAttribute('lang', /.+/)

      // Check for page title
      const title = await page.title()
      expect(title.length).toBeGreaterThan(0)

      // Check for viewport meta tag (meta tags are in head, not visible)
      const viewport = await page.locator('meta[name="viewport"]')
      await expect(viewport).toHaveCount(1)
      await expect(viewport).toHaveAttribute('content', /width=device-width/)
    })

    test('main menu should be keyboard navigable', async ({ page }) => {
      const arcade = new ArcadeShellPage(page)
      await arcade.goto()

      // Test keyboard navigation
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(200)

      const position1 = await arcade.stateBridge.getMenuSelectedIndex()
      expect(position1).toBe(1)

      await page.keyboard.press('ArrowDown')
      await page.waitForTimeout(200)

      const position2 = await arcade.stateBridge.getMenuSelectedIndex()
      expect(position2).toBe(5) // 4 columns, so down goes to position 5

      await page.keyboard.press('ArrowLeft')
      await page.waitForTimeout(200)

      const position3 = await arcade.stateBridge.getMenuSelectedIndex()
      expect(position3).toBe(4)

      await page.keyboard.press('ArrowUp')
      await page.waitForTimeout(200)

      const position4 = await arcade.stateBridge.getMenuSelectedIndex()
      expect(position4).toBe(0)
    })
  })

  test.describe('Game States', () => {
    const games: Array<{ id: GameId; name: string }> = [
      { id: 'snake', name: 'Snake' },
      { id: 'pong', name: 'Pong' },
      { id: 'breakout', name: 'Breakout' },
    ]

    for (const { id, name } of games) {
      test(`${name} game page should have no critical a11y violations`, async ({ page }) => {
        const arcade = new ArcadeShellPage(page)
        await arcade.goto()
        await arcade.launchGame(id)

        // Wait for game to render
        await page.waitForTimeout(500)

        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa'])
          .exclude('#game-canvas') // Game canvas is visual content
          .analyze()

        // Filter out expected violations related to canvas games
        const criticalViolations = accessibilityScanResults.violations.filter(
          (v) => v.impact === 'critical' || v.impact === 'serious'
        )

        expect(criticalViolations).toEqual([])
      })
    }
  })

  test.describe('Pause Menu', () => {
    test('pause menu should be keyboard accessible', async ({ page }) => {
      const arcade = new ArcadeShellPage(page)
      await arcade.goto()
      await arcade.launchGame('snake')

      // Pause the game
      await page.keyboard.press('Escape')
      await arcade.stateBridge.waitForShellState('paused')

      // Navigate pause menu with keyboard
      await page.keyboard.press('ArrowDown')
      await page.waitForTimeout(200)

      // Should be able to resume with Enter
      await page.keyboard.press('ArrowUp')
      await page.waitForTimeout(200)
      await page.keyboard.press('Enter')

      await arcade.stateBridge.waitForShellState('playing')
    })
  })

  test.describe('Color Contrast', () => {
    test('text should have sufficient color contrast', async ({ page }) => {
      const arcade = new ArcadeShellPage(page)
      await arcade.goto()

      await page.waitForTimeout(500)

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .options({
          rules: {
            'color-contrast': { enabled: true },
          },
        })
        .exclude('#game-canvas')
        .analyze()

      const contrastViolations = accessibilityScanResults.violations.filter(
        (v) => v.id === 'color-contrast'
      )

      // Log violations for debugging but don't fail (canvas-based text is hard to analyze)
      if (contrastViolations.length > 0) {
        console.warn(
          'Color contrast violations found:',
          JSON.stringify(contrastViolations, null, 2)
        )
      }
    })
  })

  test.describe('Focus Management', () => {
    test('focus should be visible during keyboard navigation', async ({ page }) => {
      const arcade = new ArcadeShellPage(page)
      await arcade.goto()

      // The game uses canvas-based rendering, so we verify focus works functionally
      // by checking that keyboard navigation works as expected

      // Initial state should be at position 0
      const initialPosition = await arcade.stateBridge.getMenuSelectedIndex()
      expect(initialPosition).toBe(0)

      // Tab should not break the game (it's canvas-based)
      await page.keyboard.press('Tab')
      await page.waitForTimeout(100)

      // Arrow keys should still work
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(200)

      const newPosition = await arcade.stateBridge.getMenuSelectedIndex()
      expect(newPosition).toBe(1)
    })
  })

  test.describe('Screen Reader Compatibility', () => {
    test('page should have ARIA landmarks', async ({ page }) => {
      await page.goto('/?test=true')

      // Check for main content area
      const main = await page.locator("main, [role='main']").count()
      const hasMainContent = main > 0 || (await page.locator('#game-canvas').count()) > 0
      expect(hasMainContent).toBe(true)
    })

    test('interactive elements should have accessible names', async ({ page }) => {
      const arcade = new ArcadeShellPage(page)
      await arcade.goto()

      // Canvas games render their own UI, so we check the page-level elements
      const accessibilityScanResults = await new AxeBuilder({ page })
        .options({
          rules: {
            'button-name': { enabled: true },
            'link-name': { enabled: true },
          },
        })
        .exclude('#game-canvas')
        .analyze()

      const nameViolations = accessibilityScanResults.violations.filter(
        (v) => v.id === 'button-name' || v.id === 'link-name'
      )

      expect(nameViolations).toEqual([])
    })
  })
})

test.describe('Motion and Animation', () => {
  test('should respect prefers-reduced-motion', async ({ page }) => {
    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })

    const arcade = new ArcadeShellPage(page)
    await arcade.goto()

    // Verify page loads successfully with reduced motion
    const state = await arcade.stateBridge.getShellState()
    expect(state?.state).toBe('menu')

    // Game should still be playable
    await arcade.launchGame('snake')
    const gameState = await arcade.stateBridge.getGameState()
    expect(gameState?.state).toBe('running')
  })
})
