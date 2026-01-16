import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { Game } from "../../src/games/Game.js";

// Concrete implementation for testing
class TestGame extends Game {
  static get config() {
    return {
      id: "test-game",
      title: "Test Game",
      description: "For testing",
      startLives: 3,
      highScoreType: "highest",
      controls: {
        movement: "Arrow keys",
        action1: "Space",
        action2: "Shift",
        pause: "Escape",
      },
    };
  }

  update(deltaTime) {
    // Test implementation - just store the deltaTime for verification
    this.lastUpdateDelta = deltaTime;
  }

  render(ctx) {
    // Test implementation - just mark that render was called
    this.renderCalled = true;
    this.lastRenderCtx = ctx;
  }
}

describe("Game base class", () => {
  let canvas, input, audio, game, mockCtx;

  beforeEach(() => {
    // Create a mock canvas context
    mockCtx = {
      fillStyle: "",
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      strokeStyle: "",
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      arc: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
    };

    canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;
    canvas.getContext = vi.fn(() => mockCtx);

    input = {
      update: vi.fn(),
      isJustPressed: vi.fn(() => false),
      getDirection: vi.fn(() => ({ x: 0, y: 0 })),
    };
    audio = {
      play: vi.fn(),
    };
    game = new TestGame(canvas, input, audio);
  });

  afterEach(() => {
    // Clean up any running animations
    if (game.animationId) {
      cancelAnimationFrame(game.animationId);
    }
  });

  describe("constructor", () => {
    it("accepts canvas, inputManager, and audioManager", () => {
      expect(game.canvas).toBe(canvas);
      expect(game.input).toBe(input);
      expect(game.audio).toBe(audio);
    });

    it("sets up canvas context", () => {
      expect(game.ctx).toBe(mockCtx);
    });

    it("initializes state to idle", () => {
      expect(game.state).toBe("idle");
    });

    it("initializes score to 0", () => {
      expect(game.score).toBe(0);
    });

    it("initializes lives to 3", () => {
      expect(game.lives).toBe(3);
    });

    it("initializes level to 1", () => {
      expect(game.level).toBe(1);
    });

    it("initializes timing properties", () => {
      expect(game.lastTime).toBe(0);
      expect(game.accumulator).toBe(0);
      expect(game.fixedTimeStep).toBe(1000 / 60);
    });

    it("initializes callback to null", () => {
      expect(game.onGameOverCallback).toBe(null);
    });

    it("initializes animationId to null", () => {
      expect(game.animationId).toBe(null);
    });
  });

  describe("lifecycle", () => {
    it("starts in idle state", () => {
      expect(game.state).toBe("idle");
    });

    it("init resets state", async () => {
      game.score = 100;
      game.lives = 1;
      game.level = 5;
      await game.init();
      expect(game.score).toBe(0);
      expect(game.lives).toBe(3);
      expect(game.level).toBe(1);
      expect(game.state).toBe("idle");
    });

    it("start changes state to running", () => {
      game.start();
      expect(game.state).toBe("running");
    });

    it("start does nothing if already running", () => {
      game.start();
      const firstAnimationId = game.animationId;
      game.start();
      expect(game.animationId).toBe(firstAnimationId);
    });

    it("pause changes state to paused when running", () => {
      game.start();
      game.pause();
      expect(game.state).toBe("paused");
    });

    it("pause cancels animation frame", () => {
      game.start();
      game.pause();
      expect(game.animationId).toBe(null);
    });

    it("pause does nothing if not running", () => {
      game.state = "idle";
      game.pause();
      expect(game.state).toBe("idle");
    });

    it("resume changes state back to running", () => {
      game.start();
      game.pause();
      game.resume();
      expect(game.state).toBe("running");
    });

    it("resume does nothing if not paused", () => {
      game.state = "idle";
      game.resume();
      expect(game.state).toBe("idle");
    });

    it("reset returns to initial state", () => {
      game.score = 500;
      game.lives = 1;
      game.level = 10;
      game.state = "running";
      game.reset();
      expect(game.state).toBe("idle");
      expect(game.score).toBe(0);
      expect(game.lives).toBe(3);
      expect(game.level).toBe(1);
    });

    it("reset uses config startLives if available", () => {
      game.reset();
      expect(game.lives).toBe(TestGame.config.startLives);
    });

    it("reset cancels animation frame", () => {
      game.start();
      expect(game.animationId).not.toBe(null);
      game.reset();
      expect(game.animationId).toBe(null);
    });

    it("destroy pauses the game", () => {
      game.start();
      game.destroy();
      expect(game.state).toBe("paused");
    });

    it("destroy clears callback", () => {
      game.onGameOver(() => {});
      expect(game.onGameOverCallback).not.toBe(null);
      game.destroy();
      expect(game.onGameOverCallback).toBe(null);
    });
  });

  describe("abstract methods", () => {
    it("base Game class throws error on update", () => {
      const baseGame = new Game(canvas, input, audio);
      expect(() => baseGame.update(16)).toThrow(
        "update() must be implemented by subclass",
      );
    });

    it("base Game class throws error on render", () => {
      const baseGame = new Game(canvas, input, audio);
      expect(() => baseGame.render(game.ctx)).toThrow(
        "render() must be implemented by subclass",
      );
    });

    it("TestGame implements update", () => {
      expect(() => game.update(16)).not.toThrow();
    });

    it("TestGame implements render", () => {
      expect(() => game.render(game.ctx)).not.toThrow();
    });
  });

  describe("scoring", () => {
    it("addScore increases score", () => {
      game.addScore(100);
      expect(game.score).toBe(100);
    });

    it("addScore accumulates multiple additions", () => {
      game.addScore(100);
      game.addScore(50);
      game.addScore(25);
      expect(game.score).toBe(175);
    });

    it("addScore plays sound", () => {
      game.addScore(100);
      expect(audio.play).toHaveBeenCalledWith("score");
    });
  });

  describe("lives", () => {
    it("loseLife decrements lives", () => {
      game.lives = 3;
      game.loseLife();
      expect(game.lives).toBe(2);
    });

    it("loseLife returns true when lives remain", () => {
      game.lives = 3;
      const result = game.loseLife();
      expect(result).toBe(true);
    });

    it("loseLife plays death sound", () => {
      game.lives = 3;
      game.loseLife();
      expect(audio.play).toHaveBeenCalledWith("death");
    });

    it("loseLife triggers game over at 0 lives", () => {
      game.lives = 1;
      const result = game.loseLife();
      expect(result).toBe(false);
      expect(game.state).toBe("gameover");
    });

    it("loseLife returns false on game over", () => {
      game.lives = 1;
      const result = game.loseLife();
      expect(result).toBe(false);
    });
  });

  describe("level progression", () => {
    it("nextLevel increments level", () => {
      expect(game.level).toBe(1);
      game.nextLevel();
      expect(game.level).toBe(2);
    });

    it("nextLevel plays powerup sound", () => {
      game.nextLevel();
      expect(audio.play).toHaveBeenCalledWith("powerup");
    });
  });

  describe("game over", () => {
    it("gameOver changes state", () => {
      game.gameOver();
      expect(game.state).toBe("gameover");
    });

    it("gameOver uses current score by default", () => {
      game.score = 500;
      game.gameOver();
      expect(game.score).toBe(500);
    });

    it("gameOver accepts custom final score", () => {
      game.score = 500;
      game.gameOver(1000);
      expect(game.score).toBe(1000);
    });

    it("gameOver calls callback with score", () => {
      const callback = vi.fn();
      game.onGameOver(callback);
      game.score = 500;
      game.gameOver();
      expect(callback).toHaveBeenCalledWith(500);
    });

    it("gameOver calls callback with custom score", () => {
      const callback = vi.fn();
      game.onGameOver(callback);
      game.gameOver(1000);
      expect(callback).toHaveBeenCalledWith(1000);
    });

    it("gameOver plays game-over sound", () => {
      game.gameOver();
      expect(audio.play).toHaveBeenCalledWith("game-over");
    });

    it("gameOver cancels animation frame", () => {
      game.start();
      expect(game.animationId).not.toBe(null);
      game.gameOver();
      expect(game.animationId).toBe(null);
    });

    it("gameOver works without callback", () => {
      expect(() => game.gameOver()).not.toThrow();
    });
  });

  describe("onGameOver callback", () => {
    it("sets callback function", () => {
      const callback = vi.fn();
      game.onGameOver(callback);
      expect(game.onGameOverCallback).toBe(callback);
    });

    it("callback is called on game over", () => {
      const callback = vi.fn();
      game.onGameOver(callback);
      game.gameOver();
      expect(callback).toHaveBeenCalled();
    });
  });

  describe("helper methods", () => {
    it("clear fills canvas with default color", () => {
      mockCtx.fillRect.mockClear();
      game.clear();
      expect(game.ctx.fillStyle).toBe("#0a0a0f");
      expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
    });

    it("clear accepts custom color", () => {
      game.clear("#ff0000");
      expect(game.ctx.fillStyle).toBe("#ff0000");
    });

    it("dimensions returns canvas size", () => {
      const dims = game.dimensions;
      expect(dims.width).toBe(800);
      expect(dims.height).toBe(600);
    });
  });

  describe("static config", () => {
    it("base Game returns default config", () => {
      const config = Game.config;
      expect(config.id).toBe("base-game");
      expect(config.title).toBe("Base Game");
      expect(config.highScoreType).toBe("highest");
    });

    it("TestGame returns custom config", () => {
      const config = TestGame.config;
      expect(config.id).toBe("test-game");
      expect(config.title).toBe("Test Game");
      expect(config.description).toBe("For testing");
    });

    it("config is accessible statically", () => {
      expect(TestGame.config.id).toBe("test-game");
    });

    it("config has all required fields", () => {
      const config = TestGame.config;
      expect(config).toHaveProperty("id");
      expect(config).toHaveProperty("title");
      expect(config).toHaveProperty("description");
      expect(config).toHaveProperty("startLives");
      expect(config).toHaveProperty("highScoreType");
      expect(config).toHaveProperty("controls");
    });

    it("controls has all required keys", () => {
      const controls = TestGame.config.controls;
      expect(controls).toHaveProperty("movement");
      expect(controls).toHaveProperty("action1");
      expect(controls).toHaveProperty("action2");
      expect(controls).toHaveProperty("pause");
    });
  });

  describe("game loop", () => {
    it("gameLoop calls input.update", () => {
      game.state = "running";
      game.gameLoop(performance.now());
      expect(input.update).toHaveBeenCalled();
    });

    it("gameLoop checks for pause input", () => {
      game.state = "running";
      game.gameLoop(performance.now());
      expect(input.isJustPressed).toHaveBeenCalledWith("pause");
    });

    it("gameLoop pauses when pause is pressed", () => {
      input.isJustPressed = vi.fn((key) => key === "pause");
      game.state = "running";
      game.gameLoop(performance.now());
      expect(game.state).toBe("paused");
    });

    it("gameLoop does nothing when not running", () => {
      game.state = "idle";
      game.gameLoop(performance.now());
      expect(input.update).not.toHaveBeenCalled();
    });

    it("gameLoop calls render", () => {
      game.state = "running";
      game.renderCalled = false;
      game.gameLoop(performance.now());
      expect(game.renderCalled).toBe(true);
    });

    it("gameLoop passes ctx to render", () => {
      game.state = "running";
      game.gameLoop(performance.now());
      expect(game.lastRenderCtx).toBe(game.ctx);
    });

    it("gameLoop schedules next frame", () => {
      game.state = "running";
      game.animationId = null;
      game.gameLoop(performance.now());
      expect(game.animationId).not.toBe(null);
    });
  });

  describe("integration", () => {
    it("full lifecycle: start -> pause -> resume -> reset", () => {
      expect(game.state).toBe("idle");

      game.start();
      expect(game.state).toBe("running");

      game.pause();
      expect(game.state).toBe("paused");

      game.resume();
      expect(game.state).toBe("running");

      game.reset();
      expect(game.state).toBe("idle");
    });

    it("score and lives work together", () => {
      game.addScore(100);
      expect(game.score).toBe(100);

      game.loseLife();
      expect(game.lives).toBe(2);
      expect(game.score).toBe(100); // score preserved

      game.addScore(50);
      expect(game.score).toBe(150);
    });

    it("game over triggered by losing all lives", () => {
      const callback = vi.fn();
      game.onGameOver(callback);

      game.lives = 2;
      game.loseLife(); // 1 life left
      expect(game.state).not.toBe("gameover");
      expect(callback).not.toHaveBeenCalled();

      game.loseLife(); // 0 lives, game over
      expect(game.state).toBe("gameover");
      expect(callback).toHaveBeenCalled();
    });

    it("game can be reset after game over", () => {
      game.score = 500;
      game.lives = 0;
      game.gameOver();
      expect(game.state).toBe("gameover");

      game.reset();
      expect(game.state).toBe("idle");
      expect(game.score).toBe(0);
      expect(game.lives).toBe(3);
    });

    it("destroy cleans up properly", () => {
      const callback = vi.fn();
      game.onGameOver(callback);
      game.start();

      game.destroy();
      expect(game.state).toBe("paused");
      expect(game.onGameOverCallback).toBe(null);
    });
  });
});
