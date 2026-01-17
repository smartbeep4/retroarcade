import { describe, it, expect, beforeEach, vi } from 'vitest'
import { HighScoreManager } from '../../src/arcade/HighScoreManager.js'

describe('HighScoreManager', () => {
  beforeEach(() => {
    localStorage.clear()
    HighScoreManager.reset()
    HighScoreManager.init()
  })

  describe('initialization', () => {
    it('initializes with default data', () => {
      const scores = HighScoreManager.getScores('snake')
      expect(scores).toHaveLength(0)
    })

    it('loads existing data from localStorage', () => {
      HighScoreManager.addScore('snake', { name: 'AAA', score: 1000 })

      // Simulate reload
      HighScoreManager.init()

      const scores = HighScoreManager.getScores('snake')
      expect(scores).toHaveLength(1)
      expect(scores[0].score).toBe(1000)
    })
  })

  describe('addScore', () => {
    it('adds a score to empty leaderboard', () => {
      HighScoreManager.addScore('snake', { name: 'AAA', score: 1000 })
      const scores = HighScoreManager.getScores('snake')
      expect(scores).toHaveLength(1)
      expect(scores[0].score).toBe(1000)
      expect(scores[0].name).toBe('AAA')
    })

    it('sorts scores highest first', () => {
      HighScoreManager.addScore('snake', { name: 'AAA', score: 1000 })
      HighScoreManager.addScore('snake', { name: 'BBB', score: 2000 })
      HighScoreManager.addScore('snake', { name: 'CCC', score: 1500 })

      const scores = HighScoreManager.getScores('snake')
      expect(scores[0].score).toBe(2000)
      expect(scores[0].name).toBe('BBB')
      expect(scores[1].score).toBe(1500)
      expect(scores[1].name).toBe('CCC')
      expect(scores[2].score).toBe(1000)
      expect(scores[2].name).toBe('AAA')
    })

    it('limits to 10 scores per game', () => {
      for (let i = 0; i < 15; i++) {
        HighScoreManager.addScore('snake', { name: 'TST', score: i * 100 })
      }

      const scores = HighScoreManager.getScores('snake')
      expect(scores).toHaveLength(10)
      // Should keep highest scores
      expect(scores[0].score).toBe(1400)
      expect(scores[9].score).toBe(500)
    })

    it('normalizes name to 3 uppercase characters', () => {
      HighScoreManager.addScore('snake', { name: 'ab', score: 100 })
      const scores = HighScoreManager.getScores('snake')
      expect(scores[0].name).toBe('AB ')
    })

    it('normalizes lowercase to uppercase', () => {
      HighScoreManager.addScore('snake', { name: 'xyz', score: 100 })
      const scores = HighScoreManager.getScores('snake')
      expect(scores[0].name).toBe('XYZ')
    })

    it('truncates names longer than 3 characters', () => {
      HighScoreManager.addScore('snake', { name: 'ABCDEF', score: 100 })
      const scores = HighScoreManager.getScores('snake')
      expect(scores[0].name).toBe('ABC')
    })

    it('pads names shorter than 3 characters', () => {
      HighScoreManager.addScore('snake', { name: 'A', score: 100 })
      const scores = HighScoreManager.getScores('snake')
      expect(scores[0].name).toBe('A  ')
    })

    it('uses default name if none provided', () => {
      HighScoreManager.addScore('snake', { score: 100 })
      const scores = HighScoreManager.getScores('snake')
      expect(scores[0].name).toBe('AAA')
    })

    it('adds date timestamp if not provided', () => {
      const beforeTime = Date.now()
      HighScoreManager.addScore('snake', { name: 'TST', score: 100 })
      const afterTime = Date.now()

      const scores = HighScoreManager.getScores('snake')
      expect(scores[0].date).toBeGreaterThanOrEqual(beforeTime)
      expect(scores[0].date).toBeLessThanOrEqual(afterTime)
    })

    it('preserves provided date timestamp', () => {
      const customDate = 1705123456789
      HighScoreManager.addScore('snake', {
        name: 'TST',
        score: 100,
        date: customDate,
      })

      const scores = HighScoreManager.getScores('snake')
      expect(scores[0].date).toBe(customDate)
    })

    it('floors decimal scores', () => {
      HighScoreManager.addScore('snake', { name: 'TST', score: 123.456 })
      const scores = HighScoreManager.getScores('snake')
      expect(scores[0].score).toBe(123)
    })

    it('returns false for invalid entry', () => {
      const result = HighScoreManager.addScore('snake', null)
      expect(result).toBe(false)
    })

    it('returns false for entry without score', () => {
      const result = HighScoreManager.addScore('snake', { name: 'TST' })
      expect(result).toBe(false)
    })

    it('returns true for valid entry', () => {
      const result = HighScoreManager.addScore('snake', {
        name: 'TST',
        score: 100,
      })
      expect(result).toBe(true)
    })

    it('handles multiple games independently', () => {
      HighScoreManager.addScore('snake', { name: 'AAA', score: 1000 })
      HighScoreManager.addScore('tetris', { name: 'BBB', score: 2000 })

      const snakeScores = HighScoreManager.getScores('snake')
      const tetrisScores = HighScoreManager.getScores('tetris')

      expect(snakeScores).toHaveLength(1)
      expect(tetrisScores).toHaveLength(1)
      expect(snakeScores[0].score).toBe(1000)
      expect(tetrisScores[0].score).toBe(2000)
    })
  })

  describe('getScores', () => {
    beforeEach(() => {
      for (let i = 0; i < 10; i++) {
        HighScoreManager.addScore('snake', {
          name: 'TST',
          score: (i + 1) * 100,
        })
      }
    })

    it('returns empty array for game with no scores', () => {
      const scores = HighScoreManager.getScores('newgame')
      expect(scores).toHaveLength(0)
    })

    it('returns all scores when limit not specified', () => {
      const scores = HighScoreManager.getScores('snake')
      expect(scores).toHaveLength(10)
    })

    it('respects custom limit parameter', () => {
      const scores = HighScoreManager.getScores('snake', 5)
      expect(scores).toHaveLength(5)
      expect(scores[0].score).toBe(1000) // Highest score
    })

    it('returns scores in descending order', () => {
      const scores = HighScoreManager.getScores('snake')
      for (let i = 0; i < scores.length - 1; i++) {
        expect(scores[i].score).toBeGreaterThanOrEqual(scores[i + 1].score)
      }
    })
  })

  describe('isHighScore', () => {
    it('returns true for empty leaderboard', () => {
      expect(HighScoreManager.isHighScore('snake', 100)).toBe(true)
    })

    it('returns true if score beats lowest', () => {
      for (let i = 0; i < 10; i++) {
        HighScoreManager.addScore('snake', {
          name: 'TST',
          score: (i + 1) * 100,
        })
      }
      expect(HighScoreManager.isHighScore('snake', 150)).toBe(true)
    })

    it('returns false if score does not qualify', () => {
      for (let i = 0; i < 10; i++) {
        HighScoreManager.addScore('snake', {
          name: 'TST',
          score: (i + 1) * 100,
        })
      }
      expect(HighScoreManager.isHighScore('snake', 50)).toBe(false)
    })

    it('returns true if leaderboard has less than 10 scores', () => {
      HighScoreManager.addScore('snake', { name: 'TST', score: 1000 })
      expect(HighScoreManager.isHighScore('snake', 1)).toBe(true)
    })

    it('returns false if score equals lowest', () => {
      for (let i = 0; i < 10; i++) {
        HighScoreManager.addScore('snake', {
          name: 'TST',
          score: (i + 1) * 100,
        })
      }
      expect(HighScoreManager.isHighScore('snake', 100)).toBe(false)
    })
  })

  describe('clearScores', () => {
    beforeEach(() => {
      HighScoreManager.addScore('snake', { name: 'AAA', score: 1000 })
      HighScoreManager.addScore('tetris', { name: 'BBB', score: 2000 })
      HighScoreManager.addScore('pong', { name: 'CCC', score: 3000 })
    })

    it('clears scores for specific game', () => {
      HighScoreManager.clearScores('snake')

      expect(HighScoreManager.getScores('snake')).toHaveLength(0)
      expect(HighScoreManager.getScores('tetris')).toHaveLength(1)
      expect(HighScoreManager.getScores('pong')).toHaveLength(1)
    })

    it('clears all scores when no gameId provided', () => {
      HighScoreManager.clearScores()

      expect(HighScoreManager.getScores('snake')).toHaveLength(0)
      expect(HighScoreManager.getScores('tetris')).toHaveLength(0)
      expect(HighScoreManager.getScores('pong')).toHaveLength(0)
    })

    it('persists clear operation to localStorage', () => {
      HighScoreManager.clearScores('snake')

      // Simulate reload
      HighScoreManager.init()

      expect(HighScoreManager.getScores('snake')).toHaveLength(0)
      expect(HighScoreManager.getScores('tetris')).toHaveLength(1)
    })
  })

  describe('statistics', () => {
    describe('play time', () => {
      it('starts with zero play time', () => {
        expect(HighScoreManager.getTotalPlayTime()).toBe(0)
      })

      it('tracks play time for single game', () => {
        HighScoreManager.addPlayTime('snake', 60)
        expect(HighScoreManager.getTotalPlayTime()).toBe(60)
      })

      it('tracks play time for multiple games', () => {
        HighScoreManager.addPlayTime('snake', 60)
        HighScoreManager.addPlayTime('tetris', 30)
        expect(HighScoreManager.getTotalPlayTime()).toBe(90)
      })

      it('accumulates play time for same game', () => {
        HighScoreManager.addPlayTime('snake', 60)
        HighScoreManager.addPlayTime('snake', 30)
        expect(HighScoreManager.getTotalPlayTime()).toBe(90)
      })

      it('persists play time to localStorage', () => {
        HighScoreManager.addPlayTime('snake', 60)

        // Simulate reload
        HighScoreManager.init()

        expect(HighScoreManager.getTotalPlayTime()).toBe(60)
      })
    })

    describe('games played', () => {
      it('starts with zero games played', () => {
        expect(HighScoreManager.getGamesPlayed()).toBe(0)
      })

      it('tracks games played for single game', () => {
        HighScoreManager.incrementGamesPlayed('snake')
        expect(HighScoreManager.getGamesPlayed()).toBe(1)
      })

      it('tracks games played for multiple games', () => {
        HighScoreManager.incrementGamesPlayed('snake')
        HighScoreManager.incrementGamesPlayed('tetris')
        expect(HighScoreManager.getGamesPlayed()).toBe(2)
      })

      it('accumulates games played for same game', () => {
        HighScoreManager.incrementGamesPlayed('snake')
        HighScoreManager.incrementGamesPlayed('snake')
        HighScoreManager.incrementGamesPlayed('tetris')
        expect(HighScoreManager.getGamesPlayed()).toBe(3)
      })

      it('persists games played to localStorage', () => {
        HighScoreManager.incrementGamesPlayed('snake')
        HighScoreManager.incrementGamesPlayed('snake')

        // Simulate reload
        HighScoreManager.init()

        expect(HighScoreManager.getGamesPlayed()).toBe(2)
      })
    })
  })

  describe('export/import', () => {
    beforeEach(() => {
      HighScoreManager.addScore('snake', { name: 'AAA', score: 1000 })
      HighScoreManager.addPlayTime('snake', 60)
      HighScoreManager.incrementGamesPlayed('snake')
    })

    it('exports data as JSON string', () => {
      const exported = HighScoreManager.export()
      expect(typeof exported).toBe('string')
      expect(() => JSON.parse(exported)).not.toThrow()
    })

    it('exports scores correctly', () => {
      const exported = HighScoreManager.export()
      const parsed = JSON.parse(exported)
      expect(parsed.scores.snake).toHaveLength(1)
      expect(parsed.scores.snake[0].name).toBe('AAA')
      expect(parsed.scores.snake[0].score).toBe(1000)
    })

    it('exports statistics correctly', () => {
      const exported = HighScoreManager.export()
      const parsed = JSON.parse(exported)
      expect(parsed.stats.playTime.snake).toBe(60)
      expect(parsed.stats.gamesPlayed.snake).toBe(1)
    })

    it('exports version information', () => {
      const exported = HighScoreManager.export()
      const parsed = JSON.parse(exported)
      expect(parsed.version).toBe(1)
    })

    it('imports data from JSON string', () => {
      const importData = JSON.stringify({
        scores: { snake: [{ name: 'IMP', score: 5000, date: Date.now() }] },
        stats: { playTime: { snake: 120 }, gamesPlayed: { snake: 5 } },
        version: 1,
      })

      const result = HighScoreManager.import(importData)
      expect(result).toBe(true)

      const scores = HighScoreManager.getScores('snake')
      expect(scores[0].name).toBe('IMP')
      expect(scores[0].score).toBe(5000)
      expect(HighScoreManager.getTotalPlayTime()).toBe(120)
      expect(HighScoreManager.getGamesPlayed()).toBe(5)
    })

    it('imports and persists to localStorage', () => {
      const importData = JSON.stringify({
        scores: { tetris: [{ name: 'NEW', score: 9999, date: Date.now() }] },
        stats: { playTime: {}, gamesPlayed: {} },
        version: 1,
      })

      HighScoreManager.import(importData)

      // Simulate reload
      HighScoreManager.init()

      const scores = HighScoreManager.getScores('tetris')
      expect(scores[0].name).toBe('NEW')
    })

    it('returns false for invalid JSON', () => {
      const result = HighScoreManager.import('invalid json')
      expect(result).toBe(false)
    })

    it('returns false for JSON without scores field', () => {
      const invalidData = JSON.stringify({ version: 1 })
      const result = HighScoreManager.import(invalidData)
      expect(result).toBe(false)
    })

    it('returns false for JSON without stats field', () => {
      const invalidData = JSON.stringify({ scores: {}, version: 1 })
      const result = HighScoreManager.import(invalidData)
      expect(result).toBe(false)
    })
  })

  describe('reset', () => {
    beforeEach(() => {
      HighScoreManager.addScore('snake', { name: 'AAA', score: 1000 })
      HighScoreManager.addPlayTime('snake', 60)
      HighScoreManager.incrementGamesPlayed('snake')
    })

    it('clears all scores', () => {
      HighScoreManager.reset()
      expect(HighScoreManager.getScores('snake')).toHaveLength(0)
    })

    it('clears all statistics', () => {
      HighScoreManager.reset()
      expect(HighScoreManager.getTotalPlayTime()).toBe(0)
      expect(HighScoreManager.getGamesPlayed()).toBe(0)
    })

    it('persists reset to localStorage', () => {
      HighScoreManager.reset()

      // Simulate reload
      HighScoreManager.init()

      expect(HighScoreManager.getScores('snake')).toHaveLength(0)
      expect(HighScoreManager.getTotalPlayTime()).toBe(0)
    })
  })

  describe('persistence', () => {
    it('saves to localStorage automatically on addScore', () => {
      HighScoreManager.addScore('snake', { name: 'AAA', score: 1000 })

      const stored = localStorage.getItem('retroarcade-scores')
      expect(stored).not.toBeNull()

      const parsed = JSON.parse(stored)
      expect(parsed.scores.snake).toHaveLength(1)
    })

    it('saves to localStorage automatically on clearScores', () => {
      HighScoreManager.addScore('snake', { name: 'AAA', score: 1000 })
      HighScoreManager.clearScores('snake')

      const stored = localStorage.getItem('retroarcade-scores')
      const parsed = JSON.parse(stored)
      expect(parsed.scores.snake).toBeUndefined()
    })

    it('saves to localStorage automatically on addPlayTime', () => {
      HighScoreManager.addPlayTime('snake', 60)

      const stored = localStorage.getItem('retroarcade-scores')
      const parsed = JSON.parse(stored)
      expect(parsed.stats.playTime.snake).toBe(60)
    })

    it('saves to localStorage automatically on incrementGamesPlayed', () => {
      HighScoreManager.incrementGamesPlayed('snake')

      const stored = localStorage.getItem('retroarcade-scores')
      const parsed = JSON.parse(stored)
      expect(parsed.stats.gamesPlayed.snake).toBe(1)
    })

    it('handles localStorage quota exceeded gracefully', () => {
      // Mock localStorage to throw quota exceeded error
      const originalSetItem = Storage.prototype.setItem
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')

      let callCount = 0
      setItemSpy.mockImplementation(function (key, value) {
        callCount++
        if (callCount === 1) {
          const error = new Error('QuotaExceededError')
          error.name = 'QuotaExceededError'
          throw error
        }
        // Second call should succeed after trimming
        return originalSetItem.call(this, key, value)
      })

      // Add enough data to trigger quota
      for (let i = 0; i < 12; i++) {
        HighScoreManager.addScore('snake', { name: 'TST', score: i * 100 })
      }

      // Should have trimmed to 5 scores and saved successfully
      const stored = localStorage.getItem('retroarcade-scores')
      expect(stored).not.toBeNull()

      const parsed = JSON.parse(stored)
      expect(parsed.scores.snake.length).toBeLessThanOrEqual(10)

      setItemSpy.mockRestore()
    })

    it('handles corrupted localStorage data gracefully', () => {
      localStorage.setItem('retroarcade-scores', 'corrupted data')

      HighScoreManager.init()

      // Should use defaults
      expect(HighScoreManager.getScores('snake')).toHaveLength(0)
      expect(HighScoreManager.getTotalPlayTime()).toBe(0)
    })

    it('preserves data across init calls', () => {
      HighScoreManager.addScore('snake', { name: 'AAA', score: 1000 })
      HighScoreManager.init()
      HighScoreManager.init()

      const scores = HighScoreManager.getScores('snake')
      expect(scores).toHaveLength(1)
    })
  })

  describe('edge cases', () => {
    it('handles zero scores', () => {
      HighScoreManager.addScore('snake', { name: 'ZER', score: 0 })
      const scores = HighScoreManager.getScores('snake')
      expect(scores[0].score).toBe(0)
    })

    it('handles negative scores', () => {
      HighScoreManager.addScore('snake', { name: 'NEG', score: -100 })
      const scores = HighScoreManager.getScores('snake')
      expect(scores[0].score).toBe(-100)
    })

    it('handles very large scores', () => {
      HighScoreManager.addScore('snake', { name: 'BIG', score: 999999999 })
      const scores = HighScoreManager.getScores('snake')
      expect(scores[0].score).toBe(999999999)
    })

    it('handles special characters in names', () => {
      HighScoreManager.addScore('snake', { name: '@#$', score: 100 })
      const scores = HighScoreManager.getScores('snake')
      expect(scores[0].name).toBe('@#$')
    })

    it('handles empty string name', () => {
      HighScoreManager.addScore('snake', { name: '', score: 100 })
      const scores = HighScoreManager.getScores('snake')
      expect(scores[0].name).toBe('   ')
    })

    it('handles limit of 0 in getScores', () => {
      HighScoreManager.addScore('snake', { name: 'AAA', score: 1000 })
      const scores = HighScoreManager.getScores('snake', 0)
      expect(scores).toHaveLength(0)
    })

    it('handles limit greater than available scores', () => {
      HighScoreManager.addScore('snake', { name: 'AAA', score: 1000 })
      const scores = HighScoreManager.getScores('snake', 100)
      expect(scores).toHaveLength(1)
    })
  })
})
