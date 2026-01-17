// tests/arcade/CRTEffect.test.js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { CRTEffect } from '../../src/arcade/CRTEffect.js'

describe('CRTEffect', () => {
  let container
  let localStorageMock

  beforeEach(() => {
    // Create a fresh container for each test
    container = document.createElement('div')
    container.id = 'test-container'
    document.body.appendChild(container)

    // Mock localStorage
    localStorageMock = {
      store: {},
      getItem(key) {
        return this.store[key] || null
      },
      setItem(key, value) {
        this.store[key] = String(value)
      },
      removeItem(key) {
        delete this.store[key]
      },
      clear() {
        this.store = {}
      },
    }
    global.localStorage = localStorageMock

    // Clear localStorage before each test
    localStorageMock.clear()

    // Initialize CRTEffect
    CRTEffect.init(container)
  })

  afterEach(() => {
    // Clean up
    CRTEffect.destroy()
    if (container && container.parentNode) {
      container.remove()
    }
    container = null
  })

  describe('initialization', () => {
    it('initializes without errors', () => {
      expect(() => {
        const newContainer = document.createElement('div')
        document.body.appendChild(newContainer)
        CRTEffect.destroy()
        CRTEffect.init(newContainer)
        CRTEffect.destroy()
        newContainer.remove()
      }).not.toThrow()
    })

    it('throws error when initialized without container', () => {
      CRTEffect.destroy()
      expect(() => {
        CRTEffect.init(null)
      }).toThrow('CRTEffect.init requires a valid container element')
    })

    it('creates overlay elements', () => {
      const scanlines = container.querySelector('.crt-scanlines')
      const vignette = container.querySelector('.crt-vignette')
      const bloom = container.querySelector('.crt-bloom-overlay')

      expect(scanlines).toBeTruthy()
      expect(vignette).toBeTruthy()
      expect(bloom).toBeTruthy()
    })

    it('applies crt-enabled class to container', () => {
      expect(container.classList.contains('crt-enabled')).toBe(true)
    })
  })

  describe('enable/disable', () => {
    it('starts enabled by default', () => {
      expect(CRTEffect.isEnabled()).toBe(true)
    })

    it('can be disabled', () => {
      CRTEffect.disable()
      expect(CRTEffect.isEnabled()).toBe(false)
      expect(container.classList.contains('crt-enabled')).toBe(false)
    })

    it('can be enabled', () => {
      CRTEffect.disable()
      CRTEffect.enable()
      expect(CRTEffect.isEnabled()).toBe(true)
      expect(container.classList.contains('crt-enabled')).toBe(true)
    })

    it('toggle switches state from enabled to disabled', () => {
      expect(CRTEffect.isEnabled()).toBe(true)
      CRTEffect.toggle()
      expect(CRTEffect.isEnabled()).toBe(false)
    })

    it('toggle switches state from disabled to enabled', () => {
      CRTEffect.disable()
      expect(CRTEffect.isEnabled()).toBe(false)
      CRTEffect.toggle()
      expect(CRTEffect.isEnabled()).toBe(true)
    })

    it('hides overlay elements when disabled', () => {
      CRTEffect.disable()
      const scanlines = container.querySelector('.crt-scanlines')
      const vignette = container.querySelector('.crt-vignette')
      const bloom = container.querySelector('.crt-bloom-overlay')

      expect(scanlines.style.display).toBe('none')
      expect(vignette.style.display).toBe('none')
      expect(bloom.style.display).toBe('none')
    })

    it('shows overlay elements when enabled', () => {
      CRTEffect.disable()
      CRTEffect.enable()
      const scanlines = container.querySelector('.crt-scanlines')
      const vignette = container.querySelector('.crt-vignette')
      const bloom = container.querySelector('.crt-bloom-overlay')

      expect(scanlines.style.display).toBe('block')
      expect(vignette.style.display).toBe('block')
      expect(bloom.style.display).toBe('block')
    })
  })

  describe('intensity controls', () => {
    it('sets scanline intensity', () => {
      CRTEffect.setScanlineIntensity(0.7)
      const settings = CRTEffect.getSettings()
      expect(settings.scanlines).toBe(0.7)
    })

    it('sets curvature intensity', () => {
      CRTEffect.setCurvature(0.5)
      const settings = CRTEffect.getSettings()
      expect(settings.curvature).toBe(0.5)
    })

    it('sets bloom intensity', () => {
      CRTEffect.setBloom(0.3)
      const settings = CRTEffect.getSettings()
      expect(settings.bloom).toBe(0.3)
    })

    it('sets chromatic aberration intensity', () => {
      CRTEffect.setChromaticAberration(0.15)
      const settings = CRTEffect.getSettings()
      expect(settings.chromatic).toBe(0.15)
    })

    it('sets vignette intensity', () => {
      CRTEffect.setVignette(0.6)
      const settings = CRTEffect.getSettings()
      expect(settings.vignette).toBe(0.6)
    })

    it('clamps scanline values to valid range (upper bound)', () => {
      CRTEffect.setScanlineIntensity(1.5)
      expect(CRTEffect.getSettings().scanlines).toBe(1)
    })

    it('clamps scanline values to valid range (lower bound)', () => {
      CRTEffect.setScanlineIntensity(-0.5)
      expect(CRTEffect.getSettings().scanlines).toBe(0)
    })

    it('clamps curvature values to valid range', () => {
      CRTEffect.setCurvature(2.0)
      expect(CRTEffect.getSettings().curvature).toBe(1)
      CRTEffect.setCurvature(-1.0)
      expect(CRTEffect.getSettings().curvature).toBe(0)
    })

    it('clamps bloom values to valid range', () => {
      CRTEffect.setBloom(1.5)
      expect(CRTEffect.getSettings().bloom).toBe(1)
      CRTEffect.setBloom(-0.5)
      expect(CRTEffect.getSettings().bloom).toBe(0)
    })

    it('clamps chromatic values to valid range', () => {
      CRTEffect.setChromaticAberration(2.0)
      expect(CRTEffect.getSettings().chromatic).toBe(1)
      CRTEffect.setChromaticAberration(-1.0)
      expect(CRTEffect.getSettings().chromatic).toBe(0)
    })

    it('clamps vignette values to valid range', () => {
      CRTEffect.setVignette(1.5)
      expect(CRTEffect.getSettings().vignette).toBe(1)
      CRTEffect.setVignette(-0.5)
      expect(CRTEffect.getSettings().vignette).toBe(0)
    })

    it('updates CSS variables when setting intensities', () => {
      CRTEffect.setScanlineIntensity(0.8)
      const root = document.documentElement
      expect(root.style.getPropertyValue('--scanline-intensity')).toBe('0.8')
    })
  })

  describe('flicker effect', () => {
    it('enables flicker', () => {
      CRTEffect.setFlicker(true)
      expect(CRTEffect.getSettings().flicker).toBe(true)
      expect(container.classList.contains('crt-flicker')).toBe(true)
    })

    it('disables flicker', () => {
      CRTEffect.setFlicker(true)
      CRTEffect.setFlicker(false)
      expect(CRTEffect.getSettings().flicker).toBe(false)
      expect(container.classList.contains('crt-flicker')).toBe(false)
    })

    it('converts non-boolean values to boolean', () => {
      CRTEffect.setFlicker(1)
      expect(CRTEffect.getSettings().flicker).toBe(true)

      CRTEffect.setFlicker(0)
      expect(CRTEffect.getSettings().flicker).toBe(false)

      CRTEffect.setFlicker('true')
      expect(CRTEffect.getSettings().flicker).toBe(true)

      CRTEffect.setFlicker('')
      expect(CRTEffect.getSettings().flicker).toBe(false)
    })
  })

  describe('presets', () => {
    it('applies subtle preset', () => {
      CRTEffect.applyPreset('subtle')
      const settings = CRTEffect.getSettings()
      expect(settings.enabled).toBe(true)
      expect(settings.scanlines).toBe(0.3)
      expect(settings.curvature).toBe(0.2)
      expect(settings.bloom).toBe(0.1)
      expect(settings.chromatic).toBe(0.05)
      expect(settings.vignette).toBe(0.2)
      expect(settings.flicker).toBe(false)
    })

    it('applies classic preset', () => {
      CRTEffect.applyPreset('classic')
      const settings = CRTEffect.getSettings()
      expect(settings.enabled).toBe(true)
      expect(settings.scanlines).toBe(0.5)
      expect(settings.curvature).toBe(0.4)
      expect(settings.bloom).toBe(0.2)
      expect(settings.chromatic).toBe(0.1)
      expect(settings.vignette).toBe(0.4)
      expect(settings.flicker).toBe(false)
    })

    it('applies extreme preset', () => {
      CRTEffect.applyPreset('extreme')
      const settings = CRTEffect.getSettings()
      expect(settings.enabled).toBe(true)
      expect(settings.scanlines).toBe(0.8)
      expect(settings.curvature).toBe(0.6)
      expect(settings.bloom).toBe(0.4)
      expect(settings.chromatic).toBe(0.2)
      expect(settings.vignette).toBe(0.6)
      expect(settings.flicker).toBe(true)
    })

    it('applies off preset', () => {
      CRTEffect.applyPreset('off')
      expect(CRTEffect.isEnabled()).toBe(false)
    })

    it('ignores invalid preset names', () => {
      const beforeSettings = CRTEffect.getSettings()
      CRTEffect.applyPreset('invalid-preset')
      const afterSettings = CRTEffect.getSettings()
      expect(afterSettings).toEqual(beforeSettings)
    })
  })

  describe('persistence', () => {
    it('saves settings to localStorage when enabled', () => {
      CRTEffect.enable()
      const saved = JSON.parse(localStorageMock.getItem('retroarcade-crt'))
      expect(saved.enabled).toBe(true)
    })

    it('saves settings to localStorage when disabled', () => {
      CRTEffect.disable()
      const saved = JSON.parse(localStorageMock.getItem('retroarcade-crt'))
      expect(saved.enabled).toBe(false)
    })

    it('saves settings when scanline intensity changes', () => {
      CRTEffect.setScanlineIntensity(0.8)
      const saved = JSON.parse(localStorageMock.getItem('retroarcade-crt'))
      expect(saved.scanlines).toBe(0.8)
    })

    it('saves settings when applying presets', () => {
      CRTEffect.applyPreset('extreme')
      const saved = JSON.parse(localStorageMock.getItem('retroarcade-crt'))
      expect(saved.scanlines).toBe(0.8)
      expect(saved.flicker).toBe(true)
    })

    it('loads settings from localStorage on init', () => {
      // Save some custom settings
      localStorageMock.setItem(
        'retroarcade-crt',
        JSON.stringify({
          enabled: false,
          scanlines: 0.9,
          curvature: 0.7,
          bloom: 0.5,
          chromatic: 0.3,
          vignette: 0.8,
          flicker: true,
        })
      )

      // Create new container and re-init
      CRTEffect.destroy()
      const newContainer = document.createElement('div')
      document.body.appendChild(newContainer)
      CRTEffect.init(newContainer)

      const settings = CRTEffect.getSettings()
      expect(settings.enabled).toBe(false)
      expect(settings.scanlines).toBe(0.9)
      expect(settings.curvature).toBe(0.7)
      expect(settings.bloom).toBe(0.5)
      expect(settings.chromatic).toBe(0.3)
      expect(settings.vignette).toBe(0.8)
      expect(settings.flicker).toBe(true)

      // Clean up
      CRTEffect.destroy()
      newContainer.remove()
    })

    it('uses defaults when localStorage is empty', () => {
      // Destroy current instance first
      CRTEffect.destroy()
      // Clear localStorage completely
      localStorageMock.clear()

      // Create new container and init fresh
      const newContainer = document.createElement('div')
      document.body.appendChild(newContainer)
      CRTEffect.init(newContainer)

      const settings = CRTEffect.getSettings()
      expect(settings.enabled).toBe(true)
      expect(settings.scanlines).toBe(0.5)
      expect(settings.curvature).toBe(0.3)

      CRTEffect.destroy()
      newContainer.remove()
    })

    it('handles corrupted localStorage gracefully', () => {
      localStorageMock.setItem('retroarcade-crt', 'invalid-json-{{{[')

      // Should not throw
      expect(() => {
        CRTEffect.destroy()
        const newContainer = document.createElement('div')
        document.body.appendChild(newContainer)
        CRTEffect.init(newContainer)
        CRTEffect.destroy()
        newContainer.remove()
      }).not.toThrow()
    })

    it('handles localStorage quota exceeded gracefully', () => {
      const mockSetItem = vi.spyOn(localStorageMock, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

      // Should not throw
      expect(() => {
        CRTEffect.setScanlineIntensity(0.7)
      }).not.toThrow()

      mockSetItem.mockRestore()
    })
  })

  describe('getSettings', () => {
    it('returns current settings', () => {
      CRTEffect.setScanlineIntensity(0.7)
      CRTEffect.setBloom(0.3)
      CRTEffect.setFlicker(true)

      const settings = CRTEffect.getSettings()
      expect(settings.scanlines).toBe(0.7)
      expect(settings.bloom).toBe(0.3)
      expect(settings.flicker).toBe(true)
    })

    it('returns a copy of settings (not reference)', () => {
      const settings1 = CRTEffect.getSettings()
      settings1.scanlines = 0.999

      const settings2 = CRTEffect.getSettings()
      expect(settings2.scanlines).not.toBe(0.999)
    })
  })

  describe('destroy', () => {
    it('removes all overlay elements', () => {
      CRTEffect.destroy()
      expect(container.querySelector('.crt-scanlines')).toBeNull()
      expect(container.querySelector('.crt-vignette')).toBeNull()
      expect(container.querySelector('.crt-bloom-overlay')).toBeNull()
    })

    it('removes CSS classes from container', () => {
      container.classList.add('crt-enabled', 'crt-flicker')
      CRTEffect.destroy()
      expect(container.classList.contains('crt-enabled')).toBe(false)
      expect(container.classList.contains('crt-flicker')).toBe(false)
    })

    it('can be called multiple times safely', () => {
      expect(() => {
        CRTEffect.destroy()
        CRTEffect.destroy()
        CRTEffect.destroy()
      }).not.toThrow()
    })
  })

  describe('CSS variable updates', () => {
    it('updates all CSS variables when applying settings', () => {
      // Ensure CRT is enabled first (required for CSS variables to be applied)
      CRTEffect.enable()

      // Now set new values
      CRTEffect.setScanlineIntensity(0.7)
      CRTEffect.setCurvature(0.4)
      CRTEffect.setBloom(0.25)
      CRTEffect.setChromaticAberration(0.12)
      CRTEffect.setVignette(0.55)

      const root = document.documentElement
      expect(root.style.getPropertyValue('--scanline-intensity')).toBe('0.7')
      expect(root.style.getPropertyValue('--curvature-intensity')).toBe('0.4')
      expect(root.style.getPropertyValue('--bloom-intensity')).toBe('0.25')
      expect(root.style.getPropertyValue('--chromatic-intensity')).toBe('0.12')
      expect(root.style.getPropertyValue('--vignette-intensity')).toBe('0.55')
    })
  })

  describe('rendering integrity', () => {
    it('maintains container structure after toggle', () => {
      const initialChildCount = container.children.length
      CRTEffect.toggle()
      CRTEffect.toggle()
      expect(container.children.length).toBe(initialChildCount)
    })

    it('does not break when container is modified externally', () => {
      const externalDiv = document.createElement('div')
      externalDiv.className = 'external'
      container.appendChild(externalDiv)

      expect(() => {
        CRTEffect.toggle()
        CRTEffect.setScanlineIntensity(0.6)
      }).not.toThrow()

      expect(container.querySelector('.external')).toBeTruthy()
    })
  })

  describe('edge cases', () => {
    it('handles zero intensity values', () => {
      CRTEffect.setScanlineIntensity(0)
      CRTEffect.setCurvature(0)
      CRTEffect.setBloom(0)
      CRTEffect.setChromaticAberration(0)
      CRTEffect.setVignette(0)

      const settings = CRTEffect.getSettings()
      expect(settings.scanlines).toBe(0)
      expect(settings.curvature).toBe(0)
      expect(settings.bloom).toBe(0)
      expect(settings.chromatic).toBe(0)
      expect(settings.vignette).toBe(0)
    })

    it('handles maximum intensity values', () => {
      CRTEffect.setScanlineIntensity(1)
      CRTEffect.setCurvature(1)
      CRTEffect.setBloom(1)
      CRTEffect.setChromaticAberration(1)
      CRTEffect.setVignette(1)

      const settings = CRTEffect.getSettings()
      expect(settings.scanlines).toBe(1)
      expect(settings.curvature).toBe(1)
      expect(settings.bloom).toBe(1)
      expect(settings.chromatic).toBe(1)
      expect(settings.vignette).toBe(1)
    })
  })
})
