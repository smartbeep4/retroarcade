// src/arcade/HighScoreManager.js

const STORAGE_KEY = 'retroarcade-scores'
const MAX_SCORES_PER_GAME = 10
const NAME_LENGTH = 3

const DEFAULT_DATA = {
  scores: {},
  stats: {
    playTime: {},
    gamesPlayed: {},
  },
  version: 1,
}

let data = { ...DEFAULT_DATA }

function init() {
  load()
}

// ============ Score Management ============

function getScores(gameId, limit = MAX_SCORES_PER_GAME) {
  const scores = data.scores[gameId] || []
  return scores.slice(0, limit)
}

function addScore(gameId, entry) {
  // Validate entry
  if (!entry || typeof entry.score !== 'number') {
    // console.warn('Invalid score entry')
    return false
  }

  // Normalize name
  const name = (entry.name !== undefined && entry.name !== null ? entry.name : 'AAA')
    .toUpperCase()
    .slice(0, NAME_LENGTH)
    .padEnd(NAME_LENGTH, ' ')

  const newEntry = {
    name,
    score: Math.floor(entry.score),
    date: entry.date || Date.now(),
  }

  // Initialize game scores if needed
  if (!data.scores[gameId]) {
    data.scores[gameId] = []
  }

  // Insert in sorted position
  const scores = data.scores[gameId]
  let inserted = false

  for (let i = 0; i < scores.length; i++) {
    if (newEntry.score > scores[i].score) {
      scores.splice(i, 0, newEntry)
      inserted = true
      break
    }
  }

  if (!inserted && scores.length < MAX_SCORES_PER_GAME) {
    scores.push(newEntry)
  }

  // Trim to max
  data.scores[gameId] = scores.slice(0, MAX_SCORES_PER_GAME)

  save()
  return true
}

function clearScores(gameId) {
  if (gameId) {
    delete data.scores[gameId]
  } else {
    data.scores = {}
  }
  save()
}

function isHighScore(gameId, score) {
  const scores = data.scores[gameId] || []

  // If less than max scores, any score qualifies
  if (scores.length < MAX_SCORES_PER_GAME) {
    return true
  }

  // Check if score beats the lowest
  const lowest = scores[scores.length - 1]
  return score > lowest.score
}

// ============ Statistics ============

function getTotalPlayTime() {
  const playTime = data.stats.playTime || {}
  return Object.values(playTime).reduce((sum, t) => sum + t, 0)
}

function addPlayTime(gameId, seconds) {
  if (!data.stats.playTime[gameId]) {
    data.stats.playTime[gameId] = 0
  }
  data.stats.playTime[gameId] += seconds
  save()
}

function getGamesPlayed() {
  const gamesPlayed = data.stats.gamesPlayed || {}
  return Object.values(gamesPlayed).reduce((sum, g) => sum + g, 0)
}

function incrementGamesPlayed(gameId) {
  if (!data.stats.gamesPlayed[gameId]) {
    data.stats.gamesPlayed[gameId] = 0
  }
  data.stats.gamesPlayed[gameId]++
  save()
}

// ============ Export/Import ============

function exportData() {
  return JSON.stringify(data, null, 2)
}

function importData(jsonString) {
  try {
    const imported = JSON.parse(jsonString)

    // Validate structure
    if (!imported.scores || !imported.stats) {
      throw new Error('Invalid data structure')
    }

    // Merge or replace (replace for simplicity)
    data = {
      ...DEFAULT_DATA,
      ...imported,
    }

    save()
    return true
  } catch (e) {
    // console.error("Failed to import data:", e);
    return false
  }
}

function reset() {
  data = { ...DEFAULT_DATA }
  save()
}

// ============ Persistence ============

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    // Handle quota exceeded
    if (e.name === 'QuotaExceededError') {
      // console.warn("localStorage quota exceeded, clearing old data");
      // Try to clear oldest scores and retry
      trimOldestScores()
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      } catch (e2) {
        // console.error("Failed to save even after trimming");
      }
    }
  }
}

function load() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      data = {
        ...DEFAULT_DATA,
        ...parsed,
        stats: {
          ...DEFAULT_DATA.stats,
          ...(parsed.stats || {}),
        },
      }
    }
  } catch (e) {
    // console.warn("Failed to load scores, using defaults");
    data = { ...DEFAULT_DATA }
  }
}

function trimOldestScores() {
  // Remove oldest scores from each game until under quota
  for (const gameId of Object.keys(data.scores)) {
    if (data.scores[gameId].length > 5) {
      data.scores[gameId] = data.scores[gameId].slice(0, 5)
    }
  }
}

export const HighScoreManager = {
  init,
  getScores,
  addScore,
  clearScores,
  isHighScore,
  getTotalPlayTime,
  addPlayTime,
  getGamesPlayed,
  incrementGamesPlayed,
  export: exportData,
  import: importData,
  reset,
  save,
  load,
}
