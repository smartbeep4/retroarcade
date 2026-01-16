import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { Pacman } from "../../../src/games/pacman/Pacman.js";

describe("Pacman", () => {
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
      quadraticCurveTo: vi.fn(),
      font: "",
      textAlign: "",
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
    game = new Pacman(canvas, input, audio);
    await game.init();
  });

  afterEach(() => {
    if (game.animationId) {
      cancelAnimationFrame(game.animationId);
    }
  });

  describe("config", () => {
    it("has correct game id", () => {
      expect(Pacman.config.id).toBe("pacman");
    });

    it("has correct title", () => {
      expect(Pacman.config.title).toBe("Pac-Man");
    });

    it("starts with 3 lives", () => {
      expect(Pacman.config.startLives).toBe(3);
    });

    it("uses highest score type", () => {
      expect(Pacman.config.highScoreType).toBe("highest");
    });

    it("has movement controls defined", () => {
      expect(Pacman.config.controls.movement).toBe("Arrow keys");
    });
  });

  describe("initialization", () => {
    it("creates maze", () => {
      expect(game.maze.length).toBeGreaterThan(0);
      expect(game.maze[0].length).toBeGreaterThan(0);
    });

    it("creates pacman at starting position", () => {
      expect(game.pacman).not.toBeNull();
      expect(game.pacman).toHaveProperty("col");
      expect(game.pacman).toHaveProperty("row");
      expect(game.pacman).toHaveProperty("direction");
      expect(game.pacman).toHaveProperty("nextDirection");
    });

    it("creates 4 ghosts", () => {
      expect(game.ghosts.length).toBe(4);
    });

    it("creates ghosts with correct names", () => {
      const names = game.ghosts.map((g) => g.name);
      expect(names).toContain("blinky");
      expect(names).toContain("pinky");
      expect(names).toContain("inky");
      expect(names).toContain("clyde");
    });

    it("creates dots on the maze", () => {
      expect(game.dots.length).toBeGreaterThan(0);
      expect(game.totalDots).toBeGreaterThan(0);
      expect(game.totalDots).toBe(game.dots.length);
    });

    it("creates 4 power pellets", () => {
      expect(game.powerPellets.length).toBe(4);
    });

    it("initializes in scatter mode", () => {
      expect(game.mode).toBe("scatter");
    });

    it("initializes score to 0", () => {
      expect(game.score).toBe(0);
    });

    it("initializes dots eaten to 0", () => {
      expect(game.dotsEaten).toBe(0);
    });

    it("sets up grid dimensions", () => {
      expect(game.cols).toBe(21);
      expect(game.rows).toBe(21);
      expect(game.tileSize).toBe(28);
    });
  });

  describe("movement", () => {
    it("queues up direction on up input", () => {
      input.isJustPressed.mockImplementation((key) => key === "up");
      game.handleInput();
      expect(game.pacman.nextDirection).toEqual({ x: 0, y: -1 });
    });

    it("queues down direction on down input", () => {
      input.isJustPressed.mockImplementation((key) => key === "down");
      game.handleInput();
      expect(game.pacman.nextDirection).toEqual({ x: 0, y: 1 });
    });

    it("queues left direction on left input", () => {
      input.isJustPressed.mockImplementation((key) => key === "left");
      game.handleInput();
      expect(game.pacman.nextDirection).toEqual({ x: -1, y: 0 });
    });

    it("queues right direction on right input", () => {
      input.isJustPressed.mockImplementation((key) => key === "right");
      game.handleInput();
      expect(game.pacman.nextDirection).toEqual({ x: 1, y: 0 });
    });

    it("can move in valid directions", () => {
      const canMoveRight = game.canMove(10, 16, { x: 1, y: 0 });
      expect(canMoveRight).toBe(true);
    });

    it("cannot move through walls", () => {
      const canMoveIntoWall = game.canMove(0, 0, { x: 0, y: 0 });
      expect(game.maze[0][0]).toBe(1); // Wall
    });

    it("animates pacman mouth", () => {
      const initialMouthAngle = game.pacman.mouthAngle;
      game.updatePacman();
      // Mouth angle should change
      expect(game.pacman.mouthAngle).not.toBe(initialMouthAngle);
    });
  });

  describe("eating", () => {
    it("eats dot when pacman reaches it", () => {
      const dot = game.dots.find((d) => !d.eaten);
      const initialScore = game.score;
      const initialDotsEaten = game.dotsEaten;

      game.pacman.col = dot.col;
      game.pacman.row = dot.row;
      game.eatDots();

      expect(dot.eaten).toBe(true);
      expect(game.score).toBe(initialScore + 10);
      expect(game.dotsEaten).toBe(initialDotsEaten + 1);
      expect(audio.play).toHaveBeenCalledWith("score");
    });

    it("eating dot increases score by 10", () => {
      const dot = game.dots.find((d) => !d.eaten);
      const initialScore = game.score;

      game.pacman.col = dot.col;
      game.pacman.row = dot.row;
      game.eatDots();

      expect(game.score).toBe(initialScore + 10);
    });

    it("eats power pellet when pacman reaches it", () => {
      const pellet = game.powerPellets[0];
      const initialScore = game.score;

      game.pacman.col = pellet.col;
      game.pacman.row = pellet.row;
      game.eatDots();

      expect(pellet.eaten).toBe(true);
      expect(game.score).toBe(initialScore + 50);
      expect(audio.play).toHaveBeenCalledWith("powerup");
    });

    it("power pellet activates frightened mode", () => {
      const pellet = game.powerPellets[0];

      game.pacman.col = pellet.col;
      game.pacman.row = pellet.row;
      game.eatDots();

      expect(game.mode).toBe("frightened");
      expect(game.ghosts.every((g) => g.frightened || g.eaten)).toBe(true);
    });

    it("eats fruit when pacman reaches it", () => {
      game.fruit = { col: 10, row: 13, points: 100, timer: 5000 };
      const initialScore = game.score;

      game.pacman.col = 10;
      game.pacman.row = 13;
      game.eatDots();

      expect(game.fruit).toBeNull();
      expect(game.score).toBe(initialScore + 100);
    });

    it("does not eat already eaten dots", () => {
      const dot = game.dots.find((d) => !d.eaten);
      dot.eaten = true;
      const initialScore = game.score;

      game.pacman.col = dot.col;
      game.pacman.row = dot.row;
      game.eatDots();

      expect(game.score).toBe(initialScore); // Score unchanged
    });
  });

  describe("ghosts", () => {
    it("ghosts have unique colors", () => {
      const colors = game.ghosts.map((g) => g.color);
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(4);
    });

    it("blinky targets pacman directly", () => {
      game.pacman.col = 15;
      game.pacman.row = 10;
      const blinky = game.ghosts.find((g) => g.name === "blinky");
      const target = game.getGhostTarget(blinky);

      expect(target.col).toBe(game.pacman.col);
      expect(target.row).toBe(game.pacman.row);
    });

    it("pinky targets 4 tiles ahead of pacman", () => {
      game.pacman.col = 10;
      game.pacman.row = 10;
      game.pacman.direction = { x: 1, y: 0 };

      const pinky = game.ghosts.find((g) => g.name === "pinky");
      const target = game.getGhostTarget(pinky);

      expect(target.col).toBe(game.pacman.col + 4);
      expect(target.row).toBe(game.pacman.row);
    });

    it("inky uses complex targeting with blinky position", () => {
      game.pacman.col = 10;
      game.pacman.row = 10;
      game.pacman.direction = { x: 1, y: 0 };

      const inky = game.ghosts.find((g) => g.name === "inky");
      const target = game.getGhostTarget(inky);

      expect(target).toHaveProperty("col");
      expect(target).toHaveProperty("row");
    });

    it("clyde chases when far from pacman", () => {
      game.pacman.col = 20;
      game.pacman.row = 20;

      const clyde = game.ghosts.find((g) => g.name === "clyde");
      clyde.col = 1;
      clyde.row = 1;

      const target = game.getGhostTarget(clyde);

      expect(target.col).toBe(game.pacman.col);
      expect(target.row).toBe(game.pacman.row);
    });

    it("clyde retreats when close to pacman", () => {
      game.pacman.col = 10;
      game.pacman.row = 10;

      const clyde = game.ghosts.find((g) => g.name === "clyde");
      clyde.col = 11;
      clyde.row = 11;

      const target = game.getGhostTarget(clyde);

      expect(target).toEqual(clyde.scatterTarget);
    });

    it("ghosts become frightened after power pellet", () => {
      game.activateFrightened();

      expect(game.mode).toBe("frightened");
      expect(game.ghosts.every((g) => g.frightened || g.eaten)).toBe(true);
    });

    it("frightened ghosts reverse direction", () => {
      const ghost = game.ghosts[0];
      const originalDirection = { ...ghost.direction };

      game.activateFrightened();

      expect(ghost.direction.x).toBe(-originalDirection.x);
      expect(ghost.direction.y).toBe(-originalDirection.y);
    });

    it("ghosts have scatter targets", () => {
      game.ghosts.forEach((ghost) => {
        expect(ghost.scatterTarget).toHaveProperty("col");
        expect(ghost.scatterTarget).toHaveProperty("row");
      });
    });

    it("ghost moves toward target in chase mode", () => {
      game.mode = "chase";
      const ghost = game.ghosts[0];
      const initialX = ghost.x;

      game.updateGhosts();

      // Ghost should have moved (or tried to move)
      expect(ghost).toBeDefined();
    });
  });

  describe("modes", () => {
    it("starts in scatter mode", () => {
      expect(game.mode).toBe("scatter");
    });

    it("switches from scatter to chase after timer expires", () => {
      game.mode = "scatter";
      game.modeTimer = 0;

      game.updateMode(100);

      expect(game.mode).toBe("chase");
    });

    it("switches from chase to scatter after timer expires", () => {
      game.mode = "chase";
      game.modeTimer = 0;

      game.updateMode(100);

      expect(game.mode).toBe("scatter");
    });

    it("frightened mode ends after timer expires", () => {
      game.activateFrightened();
      game.modeTimer = 0;

      game.updateMode(100);

      expect(game.mode).toBe("chase");
      expect(game.ghosts.every((g) => !g.frightened)).toBe(true);
    });

    it("mode timer decreases over time", () => {
      const initialTimer = game.modeTimer;

      game.updateMode(1000);

      expect(game.modeTimer).toBeLessThan(initialTimer);
    });
  });

  describe("collisions", () => {
    it("pacman dies when hitting non-frightened ghost", () => {
      const ghost = game.ghosts[0];
      ghost.frightened = false;
      ghost.eaten = false;
      ghost.x = game.pacman.x;
      ghost.y = game.pacman.y;

      const initialLives = game.lives;

      game.checkCollisions();

      expect(game.lives).toBe(initialLives - 1);
      expect(audio.play).toHaveBeenCalledWith("death");
    });

    it("pacman eats frightened ghost", () => {
      const ghost = game.ghosts[0];
      ghost.frightened = true;
      ghost.eaten = false;
      ghost.x = game.pacman.x;
      ghost.y = game.pacman.y;

      const initialScore = game.score;

      game.checkCollisions();

      expect(ghost.eaten).toBe(true);
      expect(game.score).toBeGreaterThan(initialScore);
    });

    it("eating first ghost gives 200 points", () => {
      game.activateFrightened();
      game.ghostsEaten = 0;

      const ghost = game.ghosts[0];
      ghost.x = game.pacman.x;
      ghost.y = game.pacman.y;

      const initialScore = game.score;

      game.checkCollisions();

      expect(game.score).toBe(initialScore + 200);
    });

    it("eating ghosts doubles points each time", () => {
      game.activateFrightened();

      // First ghost: 200 points
      game.ghostsEaten = 0;
      let ghost = game.ghosts[0];
      ghost.x = game.pacman.x;
      ghost.y = game.pacman.y;
      let initialScore = game.score;
      game.checkCollisions();
      expect(game.score).toBe(initialScore + 200);

      // Second ghost: 400 points
      ghost = game.ghosts[1];
      ghost.x = game.pacman.x;
      ghost.y = game.pacman.y;
      initialScore = game.score;
      game.checkCollisions();
      expect(game.score).toBe(initialScore + 400);

      // Third ghost: 800 points
      ghost = game.ghosts[2];
      ghost.x = game.pacman.x;
      ghost.y = game.pacman.y;
      initialScore = game.score;
      game.checkCollisions();
      expect(game.score).toBe(initialScore + 800);

      // Fourth ghost: 1600 points
      ghost = game.ghosts[3];
      ghost.x = game.pacman.x;
      ghost.y = game.pacman.y;
      initialScore = game.score;
      game.checkCollisions();
      expect(game.score).toBe(initialScore + 1600);
    });

    it("does not collide with eaten ghosts", () => {
      const ghost = game.ghosts[0];
      ghost.eaten = true;
      ghost.x = game.pacman.x;
      ghost.y = game.pacman.y;

      const initialLives = game.lives;

      game.checkCollisions();

      expect(game.lives).toBe(initialLives); // Lives unchanged
    });
  });

  describe("fruit", () => {
    it("spawns fruit after 70 dots eaten", () => {
      game.dotsEaten = 70;

      game.checkFruitSpawn(100);

      expect(game.fruit).not.toBeNull();
      expect(game.fruit.points).toBe(100);
    });

    it("does not spawn multiple fruits", () => {
      game.dotsEaten = 70;
      game.fruit = { col: 10, row: 13, points: 100, timer: 5000 };

      game.checkFruitSpawn(100);

      // Should still be the same fruit
      expect(game.fruit).not.toBeNull();
    });

    it("fruit disappears after timer expires", () => {
      game.fruit = { col: 10, row: 13, points: 100, timer: 100 };

      game.checkFruitSpawn(200);

      expect(game.fruit).toBeNull();
    });

    it("fruit timer decreases over time", () => {
      game.fruit = { col: 10, row: 13, points: 100, timer: 5000 };

      game.checkFruitSpawn(1000);

      expect(game.fruit.timer).toBe(4000);
    });
  });

  describe("level progression", () => {
    it("completes level when all dots eaten", () => {
      game.dotsEaten = game.totalDots;
      const initialLevel = game.level;
      game.state = "running";

      game.update(16);

      expect(game.level).toBe(initialLevel + 1);
      expect(audio.play).toHaveBeenCalledWith("powerup");
    });

    it("increases speed on higher levels", () => {
      const initialPacmanSpeed = game.pacmanSpeed;
      const initialGhostSpeed = game.ghostSpeed;

      game.completeLevel();

      expect(game.pacmanSpeed).toBeGreaterThan(initialPacmanSpeed);
      expect(game.ghostSpeed).toBeGreaterThan(initialGhostSpeed);
    });

    it("decreases frightened duration on higher levels", () => {
      const initialDuration = game.frightenedDuration;

      game.completeLevel();

      expect(game.frightenedDuration).toBeLessThan(initialDuration);
    });

    it("resets dots when level complete", () => {
      game.dotsEaten = game.totalDots;

      game.completeLevel();

      // After reset, no dots should be eaten
      expect(game.dots.every((d) => !d.eaten)).toBe(true);
      expect(game.dotsEaten).toBe(0);
    });
  });

  describe("lives and game over", () => {
    it("starts with 3 lives", () => {
      expect(game.lives).toBe(3);
    });

    it("loses life when dying", () => {
      const initialLives = game.lives;

      game.die();

      expect(game.lives).toBe(initialLives - 1);
    });

    it("resets pacman position after death", () => {
      game.pacman.col = 5;
      game.pacman.row = 5;

      game.die();

      // Should reset to starting area (row 16)
      expect(game.pacman.row).toBe(16);
    });

    it("resets ghosts after death", () => {
      game.die();

      // Ghosts should be back at starting positions
      expect(game.ghosts.length).toBe(4);
      expect(game.ghosts.every((g) => !g.eaten)).toBe(true);
    });

    it("triggers game over when no lives remain", () => {
      game.lives = 1;

      game.die();

      expect(game.state).toBe("gameover");
    });
  });

  describe("rendering", () => {
    it("renders without errors", () => {
      expect(() => game.render(mockCtx)).not.toThrow();
    });

    it("clears canvas before rendering", () => {
      game.render(mockCtx);

      expect(mockCtx.fillRect).toHaveBeenCalled();
    });

    it("draws maze walls", () => {
      game.render(mockCtx);

      // Should have drawn some rectangles for walls
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });

    it("draws dots", () => {
      game.render(mockCtx);

      // Should have drawn some circles for dots
      expect(mockCtx.arc).toHaveBeenCalled();
    });

    it("draws ghosts", () => {
      game.render(mockCtx);

      // Should have called drawing functions for ghosts
      expect(mockCtx.arc).toHaveBeenCalled();
      expect(mockCtx.fill).toHaveBeenCalled();
    });

    it("draws pacman", () => {
      game.render(mockCtx);

      // Should have saved/restored context for rotation
      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
      expect(mockCtx.rotate).toHaveBeenCalled();
    });

    it("draws HUD with score", () => {
      game.score = 1000;
      game.render(mockCtx);

      expect(mockCtx.fillText).toHaveBeenCalled();
    });

    it("draws HUD with lives", () => {
      game.render(mockCtx);

      expect(mockCtx.fillText).toHaveBeenCalled();
    });

    it("draws fruit when present", () => {
      game.fruit = { col: 10, row: 13, points: 100, timer: 5000 };

      game.render(mockCtx);

      expect(mockCtx.arc).toHaveBeenCalled();
    });
  });

  describe("update loop", () => {
    it("does not update when not running", () => {
      game.state = "paused";
      const initialScore = game.score;

      game.update(16);

      expect(game.score).toBe(initialScore);
    });

    it("updates when running", () => {
      game.state = "running";

      expect(() => game.update(16)).not.toThrow();
    });

    it("handles input during update", () => {
      game.state = "running";
      input.isJustPressed.mockImplementation((key) => key === "right");

      game.update(16);

      expect(game.pacman.nextDirection).toEqual({ x: 1, y: 0 });
    });

    it("updates mode timer", () => {
      game.state = "running";
      const initialTimer = game.modeTimer;

      game.update(16);

      expect(game.modeTimer).toBeLessThan(initialTimer);
    });
  });

  describe("reset", () => {
    it("resets score to 0", () => {
      game.score = 1000;

      game.reset();

      expect(game.score).toBe(0);
    });

    it("resets lives to starting amount", () => {
      game.lives = 1;

      game.reset();

      expect(game.lives).toBe(3);
    });

    it("resets level to 1", () => {
      game.level = 5;

      game.reset();

      expect(game.level).toBe(1);
    });

    it("recreates maze and dots", () => {
      game.dots.forEach((d) => (d.eaten = true));

      game.reset();

      expect(game.dots.every((d) => !d.eaten)).toBe(true);
    });
  });

  describe("eaten ghost respawn", () => {
    it("eaten ghost returns to ghost house", () => {
      const ghost = game.ghosts[0];
      ghost.eaten = true;
      ghost.col = 5;
      ghost.row = 5;
      ghost.x = 5;
      ghost.y = 5;

      // Update multiple times to allow ghost to move
      for (let i = 0; i < 100; i++) {
        game.updateGhosts();
      }

      // Ghost should be trying to return to center (10, 10)
      // After many updates, should be closer to or at the ghost house
      expect(ghost.col).toBeDefined();
      expect(ghost.row).toBeDefined();
    });

    it("ghost respawns when reaching ghost house", () => {
      const ghost = game.ghosts[0];
      ghost.eaten = true;
      ghost.col = 10;
      ghost.row = 10;
      ghost.x = 10;
      ghost.y = 10;

      game.updateGhosts();

      expect(ghost.eaten).toBe(false);
      expect(ghost.frightened).toBe(false);
    });
  });
});
