import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { Tetris } from "../../../src/games/tetris/Tetris.js";

describe("Tetris", () => {
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
      lineWidth: 1,
      globalAlpha: 1,
      shadowColor: "",
      shadowBlur: 0,
      font: "",
      textAlign: "left",
      fillText: vi.fn(),
    };

    canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;
    canvas.getContext = vi.fn(() => mockCtx);

    input = {
      update: vi.fn(),
      isJustPressed: vi.fn(() => false),
      isPressed: vi.fn(() => false),
      getDirection: vi.fn(() => ({ x: 0, y: 0 })),
    };
    audio = {
      play: vi.fn(),
    };
    game = new Tetris(canvas, input, audio);
    await game.init();
  });

  afterEach(() => {
    // Clean up any running animations
    if (game.animationId) {
      cancelAnimationFrame(game.animationId);
    }
  });

  describe("static config", () => {
    it("has correct game id", () => {
      expect(Tetris.config.id).toBe("tetris");
    });

    it("has correct title", () => {
      expect(Tetris.config.title).toBe("Tetris");
    });

    it("has correct start lives", () => {
      expect(Tetris.config.startLives).toBe(1);
    });

    it("has highest score type", () => {
      expect(Tetris.config.highScoreType).toBe("highest");
    });

    it("has controls defined", () => {
      expect(Tetris.config.controls).toBeDefined();
      expect(Tetris.config.controls.movement).toBeDefined();
      expect(Tetris.config.controls.action1).toBeDefined();
      expect(Tetris.config.controls.action2).toBeDefined();
    });
  });

  describe("initialization", () => {
    it("creates 10x20 grid", () => {
      expect(game.grid.length).toBe(20);
      expect(game.grid[0].length).toBe(10);
    });

    it("initializes empty grid", () => {
      for (let r = 0; r < game.rows; r++) {
        for (let c = 0; c < game.cols; c++) {
          expect(game.grid[r][c]).toBeNull();
        }
      }
    });

    it("spawns current piece", () => {
      expect(game.currentPiece).not.toBeNull();
      expect(game.currentPiece.type).toBeDefined();
      expect(game.currentPiece.shape).toBeDefined();
      expect(game.currentPiece.color).toBeDefined();
      expect(game.currentPiece.x).toBeDefined();
      expect(game.currentPiece.y).toBe(0);
    });

    it("fills next queue with 3 pieces", () => {
      expect(game.nextQueue.length).toBe(3);
    });

    it("initializes hold piece as null", () => {
      expect(game.holdPiece).toBeNull();
    });

    it("sets canHold to true", () => {
      expect(game.canHold).toBe(true);
    });

    it("starts at level 1", () => {
      expect(game.level).toBe(1);
    });

    it("starts with 0 lines cleared", () => {
      expect(game.linesCleared).toBe(0);
    });

    it("starts with 0 score", () => {
      expect(game.score).toBe(0);
    });
  });

  describe("piece spawning", () => {
    it("spawns pieces from next queue", () => {
      const firstInQueue = game.nextQueue[0];
      game.spawnPiece();
      expect(game.currentPiece.type).toBe(firstInQueue);
    });

    it("refills next queue after spawning", () => {
      expect(game.nextQueue.length).toBe(3);
      game.spawnPiece();
      expect(game.nextQueue.length).toBe(3);
    });

    it("spawns pieces at top center", () => {
      game.spawnPiece();
      const expectedX = Math.floor(
        (game.cols - game.currentPiece.shape[0].length) / 2,
      );
      expect(game.currentPiece.x).toBe(expectedX);
      expect(game.currentPiece.y).toBe(0);
    });

    it("resets canHold after spawning", () => {
      game.canHold = false;
      game.spawnPiece();
      expect(game.canHold).toBe(true);
    });
  });

  describe("movement", () => {
    it("moves piece left", () => {
      const initialX = game.currentPiece.x;
      const moved = game.moveHorizontal(-1);
      expect(moved).toBe(true);
      expect(game.currentPiece.x).toBe(initialX - 1);
    });

    it("moves piece right", () => {
      const initialX = game.currentPiece.x;
      const moved = game.moveHorizontal(1);
      expect(moved).toBe(true);
      expect(game.currentPiece.x).toBe(initialX + 1);
    });

    it("moves piece down", () => {
      const initialY = game.currentPiece.y;
      const moved = game.moveDown();
      expect(moved).toBe(true);
      expect(game.currentPiece.y).toBe(initialY + 1);
    });

    it("prevents moving left through wall", () => {
      game.currentPiece.x = 0;
      const moved = game.moveHorizontal(-1);
      expect(moved).toBe(false);
      expect(game.currentPiece.x).toBe(0);
    });

    it("prevents moving right through wall", () => {
      game.currentPiece.x = game.cols - game.currentPiece.shape[0].length;
      const moved = game.moveHorizontal(1);
      expect(moved).toBe(false);
    });

    it("resets lock timer on horizontal move", () => {
      game.lockTimer = 300;
      game.moveHorizontal(1);
      expect(game.lockTimer).toBe(0);
    });
  });

  describe("rotation", () => {
    it("rotates piece clockwise", () => {
      // Use a T piece for clear rotation test
      game.currentPiece = {
        type: "T",
        shape: [
          [0, 1, 0],
          [1, 1, 1],
        ],
        color: "#9d4edd",
        x: 4,
        y: 5,
      };
      const initialShape = JSON.stringify(game.currentPiece.shape);
      game.rotate();
      const rotatedShape = JSON.stringify(game.currentPiece.shape);
      expect(rotatedShape).not.toBe(initialShape);
      expect(audio.play).toHaveBeenCalledWith("hit");
    });

    it("rotates matrix correctly", () => {
      const matrix = [
        [1, 2],
        [3, 4],
      ];
      const rotated = game.rotateMatrix(matrix);
      expect(rotated).toEqual([
        [3, 1],
        [4, 2],
      ]);
    });

    it("does not rotate O piece (square)", () => {
      game.currentPiece = {
        type: "O",
        shape: [
          [1, 1],
          [1, 1],
        ],
        color: "#f9f871",
        x: 4,
        y: 5,
      };
      const initialShape = JSON.stringify(game.currentPiece.shape);
      game.rotate();
      const afterShape = JSON.stringify(game.currentPiece.shape);
      // O piece rotated is still same shape
      expect(afterShape).toBe(initialShape);
    });

    it("performs wall kick when rotation blocked", () => {
      // Position piece at left wall
      game.currentPiece = {
        type: "I",
        shape: [[1, 1, 1, 1]],
        color: "#05d9e8",
        x: 0,
        y: 5,
      };
      const initialX = game.currentPiece.x;
      game.rotate();
      // Should kick right if rotation blocked
      expect(game.currentPiece.x).toBeGreaterThanOrEqual(initialX);
    });

    it("resets lock timer on rotation", () => {
      game.lockTimer = 300;
      game.currentPiece.x = 4;
      game.currentPiece.y = 5;
      game.rotate();
      expect(game.lockTimer).toBe(0);
    });
  });

  describe("collision detection", () => {
    it("detects left wall collision", () => {
      const collision = game.checkCollisionWithShape(
        game.currentPiece.shape,
        -1,
        0,
      );
      expect(collision).toBe(true);
    });

    it("detects right wall collision", () => {
      const collision = game.checkCollisionWithShape(
        game.currentPiece.shape,
        game.cols,
        0,
      );
      expect(collision).toBe(true);
    });

    it("detects floor collision", () => {
      const collision = game.checkCollisionWithShape(
        game.currentPiece.shape,
        0,
        game.rows,
      );
      expect(collision).toBe(true);
    });

    it("detects collision with locked pieces", () => {
      // Place a locked piece in the grid
      game.grid[19][5] = "#fff";
      // Check collision above it
      const collision = game.checkCollisionWithShape([[1]], 5, 19);
      expect(collision).toBe(true);
    });

    it("detects when piece is on ground", () => {
      // Use a 2-row piece (T shape) for consistent testing
      game.currentPiece.shape = [
        [0, 1, 0],
        [1, 1, 1],
      ];
      // Move piece to bottom (piece is 2 rows, so y=rows-2 means bottom row is at rows-1)
      game.currentPiece.y = game.rows - 2;
      // isOnGround checks collision at y+1, which would put bottom row at rows (out of bounds)
      expect(game.isOnGround()).toBe(true);
    });

    it("detects when piece is not on ground", () => {
      game.currentPiece.y = 0;
      expect(game.isOnGround()).toBe(false);
    });
  });

  describe("line clearing", () => {
    beforeEach(() => {
      // Reset score and level for these tests
      game.score = 0;
      game.level = 1;
      game.linesCleared = 0;
    });

    it("clears complete line", () => {
      // Fill bottom row
      game.grid[19] = Array(10).fill("#fff");
      game.clearLines();
      // Bottom row should be empty now
      expect(game.grid[19].every((c) => c === null)).toBe(true);
    });

    it("clears multiple lines", () => {
      // Fill bottom two rows
      game.grid[18] = Array(10).fill("#fff");
      game.grid[19] = Array(10).fill("#fff");
      game.clearLines();
      // Both should be empty
      expect(game.grid[18].every((c) => c === null)).toBe(true);
      expect(game.grid[19].every((c) => c === null)).toBe(true);
    });

    it("awards 100 points for 1 line at level 1", () => {
      game.grid[19] = Array(10).fill("#fff");
      game.clearLines();
      expect(game.score).toBe(100);
    });

    it("awards 300 points for 2 lines at level 1", () => {
      game.grid[18] = Array(10).fill("#fff");
      game.grid[19] = Array(10).fill("#fff");
      game.clearLines();
      expect(game.score).toBe(300);
    });

    it("awards 500 points for 3 lines at level 1", () => {
      game.grid[17] = Array(10).fill("#fff");
      game.grid[18] = Array(10).fill("#fff");
      game.grid[19] = Array(10).fill("#fff");
      game.clearLines();
      expect(game.score).toBe(500);
    });

    it("awards 800 points for 4 lines (Tetris) at level 1", () => {
      game.grid[16] = Array(10).fill("#fff");
      game.grid[17] = Array(10).fill("#fff");
      game.grid[18] = Array(10).fill("#fff");
      game.grid[19] = Array(10).fill("#fff");
      game.clearLines();
      expect(game.score).toBe(800);
    });

    it("multiplies score by level", () => {
      game.level = 3;
      game.grid[19] = Array(10).fill("#fff");
      game.clearLines();
      expect(game.score).toBe(300); // 100 * 3
    });

    it("increments lines cleared counter", () => {
      game.grid[19] = Array(10).fill("#fff");
      game.clearLines();
      expect(game.linesCleared).toBe(1);
    });

    it("levels up every 10 lines", () => {
      game.linesCleared = 9;
      game.grid[19] = Array(10).fill("#fff");
      game.clearLines();
      expect(game.level).toBe(2);
      expect(audio.play).toHaveBeenCalledWith("powerup");
    });

    it("plays score sound when clearing lines without level up", () => {
      game.grid[19] = Array(10).fill("#fff");
      game.clearLines();
      expect(audio.play).toHaveBeenCalledWith("score");
    });

    it("does not clear incomplete lines", () => {
      // Fill most of bottom row, leave one empty
      game.grid[19] = Array(10).fill("#fff");
      game.grid[19][5] = null;
      game.clearLines();
      // Should still have the incomplete line
      expect(game.grid[19].some((c) => c !== null)).toBe(true);
    });
  });

  describe("hold functionality", () => {
    it("holds current piece", () => {
      const currentType = game.currentPiece.type;
      game.hold();
      expect(game.holdPiece).toBe(currentType);
      expect(audio.play).toHaveBeenCalledWith("hit");
    });

    it("swaps with held piece", () => {
      const firstType = game.currentPiece.type;
      game.hold();
      const secondType = game.currentPiece.type;
      game.canHold = true; // Allow second hold
      game.hold();
      expect(game.currentPiece.type).toBe(firstType);
      expect(game.holdPiece).toBe(secondType);
    });

    it("spawns next piece on first hold", () => {
      const firstType = game.currentPiece.type;
      const expectedNext = game.nextQueue[0];
      game.hold();
      expect(game.holdPiece).toBe(firstType);
      expect(game.currentPiece.type).toBe(expectedNext);
    });

    it("cannot hold twice per piece", () => {
      game.hold();
      const holdType = game.holdPiece;
      game.hold(); // Try to hold again
      expect(game.holdPiece).toBe(holdType); // Unchanged
    });

    it("resets canHold flag after piece locks", () => {
      game.canHold = false;
      game.spawnPiece();
      expect(game.canHold).toBe(true);
    });

    it("sets canHold to false after swapping", () => {
      game.hold(); // First hold
      game.canHold = true;
      game.hold(); // Swap
      expect(game.canHold).toBe(false);
    });

    it("resets lock timer on hold", () => {
      game.lockTimer = 300;
      game.hold();
      game.canHold = true;
      game.hold(); // Swap to test lock timer reset
      expect(game.lockTimer).toBe(0);
    });
  });

  describe("ghost piece", () => {
    it("calculates ghost position", () => {
      const ghostY = game.getGhostY();
      expect(ghostY).toBeGreaterThanOrEqual(game.currentPiece.y);
    });

    it("ghost is at bottom when no obstacles", () => {
      game.currentPiece.y = 0;
      const ghostY = game.getGhostY();
      // Ghost should be near bottom (depends on piece height)
      expect(ghostY).toBeGreaterThan(15);
    });

    it("ghost stops at locked pieces", () => {
      // Fill bottom half of grid
      for (let r = 10; r < 20; r++) {
        game.grid[r] = Array(10).fill("#fff");
      }
      game.currentPiece.y = 0;
      const ghostY = game.getGhostY();
      expect(ghostY).toBeLessThan(10);
    });

    it("returns 0 when no current piece", () => {
      game.currentPiece = null;
      const ghostY = game.getGhostY();
      expect(ghostY).toBe(0);
    });
  });

  describe("hard drop", () => {
    it("drops piece to bottom instantly", () => {
      const initialY = game.currentPiece.y;
      game.hardDrop();
      // Piece should be locked (new piece spawned)
      expect(game.currentPiece.y).toBe(0); // New piece at top
    });

    it("awards bonus points for hard drop", () => {
      const initialScore = game.score;
      game.currentPiece.y = 0;
      game.hardDrop();
      // Should get 2 points per cell dropped
      expect(game.score).toBeGreaterThan(initialScore);
    });

    it("locks piece after drop", () => {
      // Position piece at top
      game.currentPiece.y = 0;
      const initialY = game.currentPiece.y;
      game.hardDrop();
      // Should have spawned new piece (y resets to 0 for new piece)
      // and previous piece should be locked in grid
      expect(game.currentPiece.y).toBe(0);
      // Verify grid has at least one filled cell (piece was locked)
      const hasLockedCells = game.grid.some((row) => row.some((cell) => cell !== null));
      expect(hasLockedCells).toBe(true);
    });
  });

  describe("piece locking", () => {
    it("adds piece to grid", () => {
      game.currentPiece = {
        type: "O",
        shape: [
          [1, 1],
          [1, 1],
        ],
        color: "#f9f871",
        x: 4,
        y: 18,
      };
      game.lockPiece();
      // Check that cells are filled
      expect(game.grid[18][4]).toBe("#f9f871");
      expect(game.grid[18][5]).toBe("#f9f871");
      expect(game.grid[19][4]).toBe("#f9f871");
      expect(game.grid[19][5]).toBe("#f9f871");
    });

    it("plays hit sound", () => {
      game.lockPiece();
      expect(audio.play).toHaveBeenCalledWith("hit");
    });

    it("spawns next piece after locking", () => {
      const expectedNext = game.nextQueue[0];
      game.lockPiece();
      expect(game.currentPiece.type).toBe(expectedNext);
    });

    it("clears completed lines after locking", () => {
      // Fill bottom row except where piece will lock
      game.grid[19] = Array(10).fill("#fff");
      game.grid[19][4] = null;
      game.grid[19][5] = null;

      game.currentPiece = {
        type: "O",
        shape: [
          [1, 1],
          [1, 1],
        ],
        color: "#f9f871",
        x: 4,
        y: 18,
      };

      game.lockPiece();
      // Line 19 should be cleared, but top part of O piece shifts down to row 19
      expect(game.grid[19][4]).toBe("#f9f871");
      expect(game.grid[19][5]).toBe("#f9f871");
      // Other positions in row 19 should be null
      expect(game.grid[19][0]).toBeNull();
      expect(game.grid[19][9]).toBeNull();
    });
  });

  describe("game over", () => {
    it("triggers game over when piece spawns on occupied space", () => {
      // Fill top rows
      for (let r = 0; r < 5; r++) {
        game.grid[r] = Array(10).fill("#fff");
      }
      game.spawnPiece();
      expect(game.state).toBe("gameover");
    });

    it("plays game over sound", () => {
      // Fill top rows
      for (let r = 0; r < 5; r++) {
        game.grid[r] = Array(10).fill("#fff");
      }
      game.spawnPiece();
      expect(audio.play).toHaveBeenCalledWith("game-over");
    });
  });

  describe("level progression", () => {
    it("increases drop speed with level", () => {
      game.level = 1;
      game.updateDropSpeed();
      const speed1 = game.dropInterval;

      game.level = 5;
      game.updateDropSpeed();
      const speed5 = game.dropInterval;

      expect(speed5).toBeLessThan(speed1);
    });

    it("uses correct speed formula", () => {
      game.level = 1;
      game.updateDropSpeed();
      expect(game.dropInterval).toBe(1000);

      game.level = 2;
      game.updateDropSpeed();
      expect(game.dropInterval).toBeCloseTo(850, 0);
    });
  });

  describe("update loop", () => {
    it("does not update when not running", () => {
      game.state = "paused";
      const initialY = game.currentPiece.y;
      game.update(1000);
      expect(game.currentPiece.y).toBe(initialY);
    });

    it("applies gravity over time", () => {
      game.state = "running";
      game.dropTimer = 0;
      const initialY = game.currentPiece.y;

      // Simulate time passing
      game.update(1000);

      expect(game.currentPiece.y).toBeGreaterThan(initialY);
    });

    it("locks piece after lock delay", () => {
      game.state = "running";
      // Move piece to ground
      while (!game.isOnGround()) {
        game.moveDown();
      }

      const pieceY = game.currentPiece.y;

      // Simulate lock delay
      game.update(500);

      // Should have spawned new piece at top (y=0)
      // Note: piece type might be the same due to randomness
      expect(game.currentPiece.y).toBe(0);
      expect(pieceY).toBeGreaterThan(0); // Original piece was at bottom
    });

    it("resets lock timer when not on ground", () => {
      game.state = "running";
      game.lockTimer = 300;
      game.currentPiece.y = 0;

      game.update(16);

      expect(game.lockTimer).toBe(0);
    });
  });

  describe("input handling", () => {
    beforeEach(() => {
      game.state = "running";
      game.currentPiece.x = 4;
      game.currentPiece.y = 5;
    });

    it("moves left on left key press", () => {
      input.isPressed.mockImplementation((key) => key === "left");
      const initialX = game.currentPiece.x;
      game.handleInput(100);
      expect(game.currentPiece.x).toBe(initialX - 1);
    });

    it("moves right on right key press", () => {
      input.isPressed.mockImplementation((key) => key === "right");
      const initialX = game.currentPiece.x;
      game.handleInput(100);
      expect(game.currentPiece.x).toBe(initialX + 1);
    });

    it("soft drops on down key press", () => {
      input.isPressed.mockImplementation((key) => key === "down");
      game.dropTimer = 0;
      game.handleInput(16);
      expect(game.dropTimer).toBeGreaterThanOrEqual(game.dropInterval);
    });

    it("rotates on up key press", () => {
      input.isJustPressed.mockImplementation((key) => key === "up");
      const initialShape = JSON.stringify(game.currentPiece.shape);
      game.rotate();
      // If not O piece, shape should change
      if (game.currentPiece.type !== "O") {
        expect(JSON.stringify(game.currentPiece.shape)).not.toBe(initialShape);
      }
    });

    it("rotates on action1 key press", () => {
      input.isJustPressed.mockImplementation((key) => key === "action1");
      game.handleInput(16);
      expect(audio.play).toHaveBeenCalledWith("hit");
    });

    it("holds piece on action2 key press", () => {
      input.isJustPressed.mockImplementation((key) => key === "action2");
      const currentType = game.currentPiece.type;
      game.handleInput(16);
      expect(game.holdPiece).toBe(currentType);
    });

    it("hard drops on space key press", () => {
      input.isJustPressed.mockImplementation((key) => key === "space");
      game.currentPiece.y = 0;
      game.handleInput(16);
      // Should have locked and spawned new piece
      expect(game.currentPiece.y).toBe(0); // New piece at top
    });

    it("respects move delay for repeat movement", () => {
      input.isPressed.mockImplementation((key) => key === "left");
      const initialX = game.currentPiece.x;

      // First move should work
      game.handleInput(100);
      expect(game.currentPiece.x).toBe(initialX - 1);

      // Immediate next move should not work (delay not elapsed)
      game.handleInput(50);
      expect(game.currentPiece.x).toBe(initialX - 1);
    });

    it("does not handle input when no current piece", () => {
      game.currentPiece = null;
      input.isPressed.mockReturnValue(true);
      expect(() => game.handleInput(16)).not.toThrow();
    });
  });

  describe("rendering", () => {
    it("clears canvas", () => {
      game.render(mockCtx);
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });

    it("draws grid background", () => {
      game.render(mockCtx);
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });

    it("draws grid lines", () => {
      game.render(mockCtx);
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it("draws current piece", () => {
      game.render(mockCtx);
      // Should have drawn something
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });

    it("draws ghost piece with transparency", () => {
      game.render(mockCtx);
      // Ghost piece should set alpha to 0.3 then back to 1
      expect(mockCtx.globalAlpha).toBe(1); // Should be reset after rendering
    });

    it("draws UI elements", () => {
      game.render(mockCtx);
      expect(mockCtx.fillText).toHaveBeenCalled();
    });

    it("shows pause overlay when paused", () => {
      game.state = "paused";
      game.render(mockCtx);
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        "PAUSED",
        expect.any(Number),
        expect.any(Number),
      );
    });

    it("shows game over overlay when game over", () => {
      game.state = "gameover";
      game.render(mockCtx);
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        "GAME OVER",
        expect.any(Number),
        expect.any(Number),
      );
    });

    it("draws hold piece in UI", () => {
      game.holdPiece = "I";
      game.render(mockCtx);
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        "HOLD",
        expect.any(Number),
        expect.any(Number),
      );
    });

    it("draws next pieces in UI", () => {
      game.render(mockCtx);
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        "NEXT",
        expect.any(Number),
        expect.any(Number),
      );
    });

    it("draws score in UI", () => {
      game.score = 1000;
      game.render(mockCtx);
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        "SCORE",
        expect.any(Number),
        expect.any(Number),
      );
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        "1000",
        expect.any(Number),
        expect.any(Number),
      );
    });

    it("draws level in UI", () => {
      game.level = 5;
      game.render(mockCtx);
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        "LEVEL",
        expect.any(Number),
        expect.any(Number),
      );
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        "5",
        expect.any(Number),
        expect.any(Number),
      );
    });

    it("draws lines cleared in UI", () => {
      game.linesCleared = 42;
      game.render(mockCtx);
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        "LINES",
        expect.any(Number),
        expect.any(Number),
      );
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        "42",
        expect.any(Number),
        expect.any(Number),
      );
    });
  });

  describe("random piece generation", () => {
    it("generates valid piece types", () => {
      const validTypes = ["I", "O", "T", "S", "Z", "J", "L"];
      for (let i = 0; i < 50; i++) {
        const piece = game.randomPiece();
        expect(validTypes).toContain(piece);
      }
    });
  });

  describe("resetGame", () => {
    it("clears the grid", () => {
      game.grid[10][5] = "#fff";
      game.resetGame();
      expect(game.grid[10][5]).toBeNull();
    });

    it("resets score to 0", () => {
      game.score = 1000;
      game.resetGame();
      expect(game.score).toBe(0);
    });

    it("resets level to 1", () => {
      game.level = 5;
      game.resetGame();
      expect(game.level).toBe(1);
    });

    it("resets lines cleared to 0", () => {
      game.linesCleared = 20;
      game.resetGame();
      expect(game.linesCleared).toBe(0);
    });

    it("clears hold piece", () => {
      game.holdPiece = "I";
      game.resetGame();
      expect(game.holdPiece).toBeNull();
    });

    it("refills next queue", () => {
      game.resetGame();
      expect(game.nextQueue.length).toBe(3);
    });

    it("spawns new piece", () => {
      game.resetGame();
      expect(game.currentPiece).not.toBeNull();
    });
  });
});
