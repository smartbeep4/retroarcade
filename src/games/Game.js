import { TestBridge } from "../test/TestBridge.js";

/**
 * Base class for all arcade games.
 * All games must extend this class and implement required methods.
 */
export class Game {
  /**
   * @param {HTMLCanvasElement} canvas - The game canvas
   * @param {Object} inputManager - Input handling singleton
   * @param {Object} audioManager - Audio handling singleton
   */
  constructor(canvas, inputManager, audioManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.input = inputManager;
    this.audio = audioManager;

    // Game state
    this.state = "idle"; // idle, running, paused, gameover
    this.score = 0;
    this.lives = 3;
    this.level = 1;

    // Timing
    this.lastTime = 0;
    this.accumulator = 0;
    this.fixedTimeStep = 1000 / 60; // 60 FPS

    // Callbacks
    this.onGameOverCallback = null;

    // Animation frame ID for cleanup
    this.animationId = null;
  }

  // ============ LIFECYCLE METHODS ============

  /**
   * Initialize the game. Load assets, set up initial state.
   * Called once when game is first loaded.
   * @returns {Promise<void>}
   */
  async init() {
    // Override in subclass
    this.reset();
  }

  /**
   * Start the game loop.
   */
  start() {
    if (this.state === "running") return;

    // Register with TestBridge for E2E testing
    TestBridge.registerGame(this);

    this.state = "running";
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  /**
   * Pause the game.
   */
  pause() {
    if (this.state !== "running") return;

    this.state = "paused";
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Resume from pause.
   */
  resume() {
    if (this.state !== "paused") return;

    this.state = "running";
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  /**
   * Reset game to initial state.
   */
  reset() {
    this.state = "idle";
    this.score = 0;
    this.lives = this.constructor.config?.startLives || 3;
    this.level = 1;

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Clean up resources when game is unloaded.
   */
  destroy() {
    this.pause();
    this.onGameOverCallback = null;

    // Unregister from TestBridge
    TestBridge.unregisterGame();
  }

  // ============ GAME LOOP ============

  /**
   * Main game loop with fixed timestep.
   * @param {number} currentTime - Current timestamp
   */
  gameLoop(currentTime) {
    if (this.state !== "running") return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    this.accumulator += deltaTime;

    // Update input state
    this.input.update();

    // Check for pause
    if (this.input.isJustPressed("pause")) {
      this.pause();
      return;
    }

    // Fixed timestep updates
    while (this.accumulator >= this.fixedTimeStep) {
      this.update(this.fixedTimeStep);
      this.accumulator -= this.fixedTimeStep;
    }

    // Render
    this.render(this.ctx);

    // Continue loop
    this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
  }

  // ============ ABSTRACT METHODS (must override) ============

  /**
   * Update game logic.
   * @param {number} _deltaTime - Time since last update in ms
   */
  update(_deltaTime) {
    throw new Error("update() must be implemented by subclass");
  }

  /**
   * Render the game.
   * @param {CanvasRenderingContext2D} _ctx - Canvas context
   */
  render(_ctx) {
    throw new Error("render() must be implemented by subclass");
  }

  // ============ HELPER METHODS ============

  /**
   * Trigger game over state.
   * @param {number} finalScore - Final score
   */
  gameOver(finalScore = this.score) {
    this.state = "gameover";
    this.score = finalScore;

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    this.audio.play("game-over");

    if (this.onGameOverCallback) {
      this.onGameOverCallback(this.score);
    }
  }

  /**
   * Add to score.
   * @param {number} points - Points to add
   */
  addScore(points) {
    this.score += points;
    this.audio.play("score");
  }

  /**
   * Lose a life.
   * @returns {boolean} True if game continues, false if game over
   */
  loseLife() {
    this.lives--;
    this.audio.play("death");

    if (this.lives <= 0) {
      this.gameOver();
      return false;
    }
    return true;
  }

  /**
   * Advance to next level.
   */
  nextLevel() {
    this.level++;
    this.audio.play("powerup");
  }

  /**
   * Set callback for game over event.
   * @param {Function} callback - Called with final score
   */
  onGameOver(callback) {
    this.onGameOverCallback = callback;
  }

  /**
   * Clear the canvas.
   * @param {string} color - Background color
   */
  clear(color = "#0a0a0f") {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Get canvas dimensions.
   * @returns {{width: number, height: number}}
   */
  get dimensions() {
    return {
      width: this.canvas.width,
      height: this.canvas.height,
    };
  }

  // ============ STATIC CONFIG ============

  /**
   * Game configuration. Must be overridden by subclass.
   * @returns {Object} Game metadata
   */
  static get config() {
    return {
      id: "base-game",
      title: "Base Game",
      description: "Base game class - do not use directly",
      thumbnail: "/assets/sprites/default-thumb.png",
      startLives: 3,
      highScoreType: "highest", // 'highest', 'lowest', or 'time'
      controls: {
        movement: "Arrow keys or WASD",
        action1: "Space",
        action2: "Shift",
        pause: "Escape",
      },
    };
  }
}
