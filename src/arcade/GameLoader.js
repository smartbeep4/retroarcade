/**
 * GameLoader - Dynamically loads and manages game modules
 * Responsible for loading games, handling errors, and cleaning up resources
 */
export class GameLoader {
  constructor() {
    this.currentGame = null
    this.currentGameId = null
  }

  /**
   * Dynamically imports and instantiates a game module
   * @param {string} gameId - The game identifier (e.g., 'snake', 'pong')
   * @returns {Promise<Object>} The instantiated game object
   * @throws {Error} If the game module cannot be loaded
   */
  async loadGame(gameId) {
    if (!gameId || typeof gameId !== 'string') {
      throw new Error('Invalid game ID: must be a non-empty string')
    }

    // Unload any existing game first
    await this.unloadGame()

    try {
      // Dynamically import the game module
      // Games are organized as: src/games/{gameId}/index.js
      const gameModule = await import(`../games/${gameId}/index.js`)

      // Check if the module has a default export
      if (!gameModule.default) {
        throw new Error(`Game module '${gameId}' has no default export`)
      }

      const GameClass = gameModule.default

      // Verify it's a constructor function or class
      if (typeof GameClass !== 'function') {
        throw new Error(
          `Game module '${gameId}' default export is not a constructor`,
        )
      }

      // Store the game instance
      this.currentGameId = gameId

      // Return the game class (not instantiated yet - that's the caller's responsibility)
      // This allows the caller to pass in their own dependencies
      return GameClass
    } catch (error) {
      // Clear any partial state
      this.currentGame = null
      this.currentGameId = null

      // Handle different error types
      if (error.message.includes('Cannot find module')) {
        throw new Error(`Game '${gameId}' not found`)
      }

      if (error.message.includes('Failed to fetch')) {
        throw new Error(`Failed to load game '${gameId}': ${error.message}`)
      }

      // Re-throw with context
      throw new Error(`Failed to load game '${gameId}': ${error.message}`)
    }
  }

  /**
   * Unloads the current game and cleans up resources
   * @returns {Promise<void>}
   */
  async unloadGame() {
    if (this.currentGame) {
      try {
        // Call destroy if the game has one
        if (typeof this.currentGame.destroy === 'function') {
          this.currentGame.destroy()
        }

        // Call cleanup if the game has one
        if (typeof this.currentGame.cleanup === 'function') {
          this.currentGame.cleanup()
        }

        // Clear event listeners if the game has any
        if (typeof this.currentGame.removeEventListeners === 'function') {
          this.currentGame.removeEventListeners()
        }
      } catch (error) {
        // Log but don't throw - we want to ensure cleanup completes
        // console.warn('Error during game cleanup:', error)
      }
    }

    // Clear references
    this.currentGame = null
    this.currentGameId = null
  }

  /**
   * Sets the current game instance (used after instantiation)
   * @param {Object} gameInstance - The instantiated game object
   */
  setCurrentGame(gameInstance) {
    this.currentGame = gameInstance
  }

  /**
   * Gets the current game instance
   * @returns {Object|null} The current game or null
   */
  getCurrentGame() {
    return this.currentGame
  }

  /**
   * Gets the current game ID
   * @returns {string|null} The current game ID or null
   */
  getCurrentGameId() {
    return this.currentGameId
  }

  /**
   * Checks if a game is currently loaded
   * @returns {boolean} True if a game is loaded
   */
  hasGame() {
    return this.currentGame !== null
  }
}

// Export a singleton instance for convenience
export default new GameLoader()
