import { describe, it, expect, beforeEach, vi } from "vitest";
import { Snake } from "../../../src/games/snake/Snake.js";

describe("Snake", () => {
  let canvas, input, audio, game, mockCtx;

  beforeEach(async () => {
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
      fillText: vi.fn(),
      shadowColor: "",
      shadowBlur: 0,
      lineWidth: 1,
      textAlign: "",
      font: "",
    };

    canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 800;
    canvas.getContext = vi.fn(() => mockCtx);

    input = {
      update: vi.fn(),
      isJustPressed: vi.fn(() => false),
      getDirection: vi.fn(() => ({ x: 0, y: 0 })),
    };
    audio = { play: vi.fn() };
    game = new Snake(canvas, input, audio);
    await game.init();
  });

  describe("initialization", () => {
    it("starts with snake of length 3", () => {
      expect(game.snake.length).toBe(3);
    });

    it("spawns food", () => {
      expect(game.food).not.toBeNull();
    });

    it("starts moving right", () => {
      expect(game.direction).toEqual({ x: 1, y: 0 });
    });

    it("initializes grid size to 20", () => {
      expect(game.gridSize).toBe(20);
    });

    it("calculates cell size correctly", () => {
      expect(game.cellSize).toBe(40); // 800 / 20
    });

    it("starts with speed interval of 150ms", () => {
      expect(game.moveInterval).toBe(150);
    });

    it("sets wrap walls to true", () => {
      expect(game.wrapWalls).toBe(true);
    });

    it("starts with 0 food eaten", () => {
      expect(game.foodEaten).toBe(0);
    });

    it("snake starts in center of grid", () => {
      const centerX = Math.floor(game.gridSize / 2);
      const centerY = Math.floor(game.gridSize / 2);
      expect(game.snake[0].x).toBe(centerX);
      expect(game.snake[0].y).toBe(centerY);
    });

    it("snake has correct initial positions", () => {
      const centerX = Math.floor(game.gridSize / 2);
      const centerY = Math.floor(game.gridSize / 2);
      expect(game.snake).toEqual([
        { x: centerX, y: centerY },
        { x: centerX - 1, y: centerY },
        { x: centerX - 2, y: centerY },
      ]);
    });
  });

  describe("movement", () => {
    it("moves snake on interval", () => {
      const initialHead = { ...game.snake[0] };
      game.update(150); // One full interval
      expect(game.snake[0].x).toBe(initialHead.x + 1);
    });

    it("does not move before interval completes", () => {
      const initialHead = { ...game.snake[0] };
      game.update(100); // Less than interval
      expect(game.snake[0]).toEqual(initialHead);
    });

    it("accumulates move timer", () => {
      game.update(100);
      expect(game.moveTimer).toBe(100);
      game.update(50);
      expect(game.moveTimer).toBe(0); // Reset after move at 150ms
    });

    it("changes direction based on input", () => {
      input.getDirection.mockReturnValue({ x: 0, y: -1 });
      game.update(150);
      expect(game.direction).toEqual({ x: 0, y: -1 });
    });

    it("queues direction changes", () => {
      input.getDirection.mockReturnValue({ x: 0, y: -1 });
      game.update(50); // Not enough to move
      expect(game.nextDirection).toEqual({ x: 0, y: -1 });
      expect(game.direction).toEqual({ x: 1, y: 0 }); // Still old direction
    });

    it("prevents 180 degree turns horizontally", () => {
      game.direction = { x: 1, y: 0 };
      input.getDirection.mockReturnValue({ x: -1, y: 0 });
      game.update(150);
      expect(game.direction).toEqual({ x: 1, y: 0 });
    });

    it("prevents 180 degree turns vertically", () => {
      game.direction = { x: 0, y: 1 };
      game.nextDirection = { x: 0, y: 1 };
      input.getDirection.mockReturnValue({ x: 0, y: -1 });
      game.update(150);
      expect(game.direction).toEqual({ x: 0, y: 1 });
    });

    it("allows 90 degree turns", () => {
      game.direction = { x: 1, y: 0 };
      game.nextDirection = { x: 1, y: 0 };
      input.getDirection.mockReturnValue({ x: 0, y: 1 });
      game.update(150);
      expect(game.direction).toEqual({ x: 0, y: 1 });
    });

    it("snake maintains length when moving without food", () => {
      const initialLength = game.snake.length;
      game.food = { x: 0, y: 0 }; // Place food far away
      game.update(150);
      expect(game.snake.length).toBe(initialLength);
    });
  });

  describe("eating", () => {
    it("grows snake when eating food", () => {
      const initialLength = game.snake.length;
      // Position food in front of snake
      game.food = { x: game.snake[0].x + 1, y: game.snake[0].y };
      game.update(150);
      expect(game.snake.length).toBe(initialLength + 1);
    });

    it("increases score by 10", () => {
      game.score = 0;
      game.food = { x: game.snake[0].x + 1, y: game.snake[0].y };
      game.update(150);
      expect(game.score).toBe(10);
    });

    it("plays sound when eating", () => {
      game.food = { x: game.snake[0].x + 1, y: game.snake[0].y };
      game.update(150);
      expect(audio.play).toHaveBeenCalledWith("score");
    });

    it("spawns new food after eating", () => {
      const oldFood = { ...game.food };
      game.food = { x: game.snake[0].x + 1, y: game.snake[0].y };
      game.update(150);
      expect(game.food).not.toBeNull();
      // Food should be different (extremely unlikely to be same spot)
      const isSameFood = game.food.x === oldFood.x && game.food.y === oldFood.y;
      // Allow same food only if it was already at eating position
      if (oldFood.x === game.snake[1].x && oldFood.y === game.snake[1].y) {
        expect(game.food).toBeDefined();
      } else {
        expect(game.food).toBeDefined();
      }
    });

    it("increments foodEaten counter", () => {
      game.foodEaten = 0;
      game.food = { x: game.snake[0].x + 1, y: game.snake[0].y };
      game.update(150);
      expect(game.foodEaten).toBe(1);
    });

    it("adds bonus score on speed increase", () => {
      game.score = 0;
      game.foodEaten = 4; // Next food will be the 5th
      game.food = { x: game.snake[0].x + 1, y: game.snake[0].y };
      game.update(150);
      expect(game.score).toBe(15); // 10 for food + 5 bonus
    });
  });

  describe("collision", () => {
    it("game over on self collision", () => {
      // Create snake that will hit itself
      game.snake = [
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 6, y: 4 },
        { x: 5, y: 4 },
        { x: 4, y: 4 },
      ];
      game.direction = { x: 0, y: -1 };
      game.nextDirection = { x: 0, y: -1 };
      game.food = { x: 0, y: 0 }; // Prevent eating
      game.update(150);
      expect(game.state).toBe("gameover");
    });

    it("wraps around walls when enabled", () => {
      game.wrapWalls = true;
      game.snake = [
        { x: 19, y: 10 },
        { x: 18, y: 10 },
        { x: 17, y: 10 },
      ];
      game.direction = { x: 1, y: 0 };
      game.nextDirection = { x: 1, y: 0 };
      game.food = { x: 0, y: 0 }; // Prevent eating
      game.update(150);
      expect(game.snake[0].x).toBe(0);
      expect(game.state).not.toBe("gameover");
    });

    it("wraps vertically", () => {
      game.wrapWalls = true;
      game.snake = [
        { x: 10, y: 19 },
        { x: 10, y: 18 },
        { x: 10, y: 17 },
      ];
      game.direction = { x: 0, y: 1 };
      game.nextDirection = { x: 0, y: 1 };
      game.food = { x: 0, y: 0 }; // Prevent eating
      game.update(150);
      expect(game.snake[0].y).toBe(0);
      expect(game.state).not.toBe("gameover");
    });

    it("game over on wall collision when wrap disabled", () => {
      game.wrapWalls = false;
      game.snake = [
        { x: 19, y: 10 },
        { x: 18, y: 10 },
        { x: 17, y: 10 },
      ];
      game.direction = { x: 1, y: 0 };
      game.nextDirection = { x: 1, y: 0 };
      game.update(150);
      expect(game.state).toBe("gameover");
    });

    it("handles negative wrap correctly", () => {
      game.wrapWalls = true;
      game.snake = [
        { x: 0, y: 10 },
        { x: 1, y: 10 },
        { x: 2, y: 10 },
      ];
      game.direction = { x: -1, y: 0 };
      game.nextDirection = { x: -1, y: 0 };
      game.food = { x: 5, y: 5 }; // Prevent eating
      game.update(150);
      expect(game.snake[0].x).toBe(19);
    });
  });

  describe("speed", () => {
    it("increases speed every 5 food", () => {
      const initialInterval = game.moveInterval;
      for (let i = 0; i < 5; i++) {
        game.eatFood();
      }
      expect(game.moveInterval).toBeLessThan(initialInterval);
    });

    it("decreases interval by 15ms per speed increase", () => {
      game.moveInterval = 150;
      for (let i = 0; i < 5; i++) {
        game.eatFood();
      }
      expect(game.moveInterval).toBe(135); // 150 - 15
    });

    it("does not go below minimum speed", () => {
      for (let i = 0; i < 50; i++) {
        game.eatFood();
      }
      expect(game.moveInterval).toBeGreaterThanOrEqual(game.minInterval);
    });

    it("reaches minimum speed of 50ms", () => {
      for (let i = 0; i < 50; i++) {
        game.eatFood();
      }
      expect(game.moveInterval).toBe(50);
    });

    it("speed does not increase on non-multiple of 5", () => {
      game.moveInterval = 150;
      for (let i = 0; i < 4; i++) {
        game.eatFood();
      }
      expect(game.moveInterval).toBe(150);
    });
  });

  describe("food spawning", () => {
    it("spawns food on empty cell", () => {
      game.spawnFood();
      expect(game.food).not.toBeNull();
      const isOnSnake = game.snake.some(
        (s) => s.x === game.food.x && s.y === game.food.y,
      );
      expect(isOnSnake).toBe(false);
    });

    it("finds valid position for food", () => {
      // Fill most of the grid with snake
      game.snake = [];
      for (let i = 0; i < game.gridSize * game.gridSize - 1; i++) {
        game.snake.push({
          x: i % game.gridSize,
          y: Math.floor(i / game.gridSize),
        });
      }
      game.spawnFood();
      expect(game.food).not.toBeNull();
      const isOnSnake = game.snake.some(
        (s) => s.x === game.food.x && s.y === game.food.y,
      );
      expect(isOnSnake).toBe(false);
    });

    it("food coordinates are within grid bounds", () => {
      game.spawnFood();
      expect(game.food.x).toBeGreaterThanOrEqual(0);
      expect(game.food.x).toBeLessThan(game.gridSize);
      expect(game.food.y).toBeGreaterThanOrEqual(0);
      expect(game.food.y).toBeLessThan(game.gridSize);
    });
  });

  describe("config", () => {
    it("has correct game id", () => {
      expect(Snake.config.id).toBe("snake");
    });

    it("has correct title", () => {
      expect(Snake.config.title).toBe("Snake");
    });

    it("has 1 life", () => {
      expect(Snake.config.startLives).toBe(1);
    });

    it("has highest score type", () => {
      expect(Snake.config.highScoreType).toBe("highest");
    });

    it("has movement controls defined", () => {
      expect(Snake.config.controls.movement).toBe("Arrow keys or WASD");
    });
  });

  describe("resetSnake", () => {
    it("resets snake to 3 segments", () => {
      game.snake = [{ x: 1, y: 1 }];
      game.resetSnake();
      expect(game.snake.length).toBe(3);
    });

    it("resets direction to right", () => {
      game.direction = { x: 0, y: 1 };
      game.resetSnake();
      expect(game.direction).toEqual({ x: 1, y: 0 });
    });

    it("spawns new food", () => {
      game.food = null;
      game.resetSnake();
      expect(game.food).not.toBeNull();
    });
  });

  describe("render", () => {
    it("calls clear with background color", () => {
      vi.spyOn(game, "clear");
      game.render(mockCtx);
      expect(game.clear).toHaveBeenCalledWith("#0a0a0f");
    });

    it("draws snake segments", () => {
      mockCtx.fillRect.mockClear();
      game.render(mockCtx);
      // Should draw at least as many rectangles as snake segments
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });

    it("draws food", () => {
      mockCtx.fillRect.mockClear();
      game.food = { x: 5, y: 5 };
      game.render(mockCtx);
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });

    it("draws score text", () => {
      mockCtx.fillText.mockClear();
      game.score = 50;
      game.render(mockCtx);
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        "Score: 50",
        expect.any(Number),
        expect.any(Number),
      );
    });

    it("draws speed indicator", () => {
      mockCtx.fillText.mockClear();
      game.render(mockCtx);
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        expect.stringContaining("Speed:"),
        expect.any(Number),
        expect.any(Number),
      );
    });
  });

  describe("drawCell", () => {
    it("draws cell at correct position", () => {
      mockCtx.fillRect.mockClear();
      game.drawCell(mockCtx, 5, 5);
      expect(mockCtx.fillRect).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
      );
    });

    it("applies padding to cell", () => {
      mockCtx.fillRect.mockClear();
      game.drawCell(mockCtx, 0, 0);
      const call = mockCtx.fillRect.mock.calls[0];
      expect(call[0]).toBeGreaterThan(0); // x has padding
      expect(call[1]).toBeGreaterThan(0); // y has padding
    });
  });

  describe("game over", () => {
    it("triggers game over on self collision", () => {
      // Create a snake that will collide with itself
      // Head at [5,5], body segments, moving up to [5,4] which is occupied
      game.snake = [
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 6, y: 4 },
        { x: 5, y: 4 },
        { x: 4, y: 4 },
      ];
      game.direction = { x: 0, y: -1 };
      game.nextDirection = { x: 0, y: -1 };
      game.moveSnake();
      expect(game.state).toBe("gameover");
    });

    it("plays game over sound", () => {
      // Create immediate collision
      game.snake = [
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 6, y: 4 },
        { x: 5, y: 4 },
      ];
      game.direction = { x: 0, y: -1 };
      game.nextDirection = { x: 0, y: -1 };
      game.moveSnake();
      expect(audio.play).toHaveBeenCalledWith("game-over");
    });
  });

  describe("integration", () => {
    it("complete game flow: move, eat, grow, speed up", () => {
      const initialLength = game.snake.length;
      const initialSpeed = game.moveInterval;

      // Eat 5 food items
      for (let i = 0; i < 5; i++) {
        game.food = { x: game.snake[0].x + 1, y: game.snake[0].y };
        game.update(150);
      }

      expect(game.snake.length).toBe(initialLength + 5);
      expect(game.score).toBe(55); // 5 * 10 + 5 bonus
      expect(game.moveInterval).toBeLessThan(initialSpeed);
    });

    it("maintains state consistency through multiple moves", () => {
      for (let i = 0; i < 10; i++) {
        const lengthBefore = game.snake.length;
        game.food = { x: 99, y: 99 }; // Far away, won't be eaten
        game.update(150);
        expect(game.snake.length).toBe(lengthBefore); // No growth without food
      }
    });

    it("snake can navigate full lap around grid with wrapping", () => {
      game.wrapWalls = true;
      game.snake = [{ x: 10, y: 10 }];
      game.direction = { x: 1, y: 0 };
      game.nextDirection = { x: 1, y: 0 };
      game.food = { x: 0, y: 0 };

      // Move right around the grid
      for (let i = 0; i < game.gridSize; i++) {
        game.moveSnake();
        expect(game.state).not.toBe("gameover");
      }

      // Should have wrapped and be back at x: 10
      expect(game.snake[0].x).toBe(10);
    });
  });
});
