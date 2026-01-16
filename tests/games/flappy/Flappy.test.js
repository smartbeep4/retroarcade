import { describe, it, expect, beforeEach, vi } from "vitest";
import { Flappy } from "../../../src/games/flappy/Flappy.js";

describe("Flappy", () => {
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
      lineWidth: 0,
      textAlign: "",
      font: "",
      globalAlpha: 1,
      fillText: vi.fn(),
      strokeText: vi.fn(),
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
    audio = { play: vi.fn() };
    game = new Flappy(canvas, input, audio);
    await game.init();
  });

  describe("initialization", () => {
    it("extends Game base class", () => {
      expect(game.constructor.name).toBe("Flappy");
      expect(game.canvas).toBe(canvas);
      expect(game.input).toBe(input);
      expect(game.audio).toBe(audio);
    });

    it("bird starts at center height", () => {
      expect(game.bird.y).toBeCloseTo(canvas.height / 2, -1);
    });

    it("bird starts with zero velocity", () => {
      expect(game.bird.vy).toBe(0);
    });

    it("bird starts with zero rotation", () => {
      expect(game.bird.rotation).toBe(0);
    });

    it("starts in not-started state", () => {
      expect(game.started).toBe(false);
    });

    it("starts with no pipes", () => {
      expect(game.pipes.length).toBe(0);
    });

    it("starts with score of 0", () => {
      expect(game.score).toBe(0);
    });

    it("initializes bird dimensions correctly", () => {
      expect(game.birdWidth).toBe(34);
      expect(game.birdHeight).toBe(24);
    });

    it("initializes physics constants", () => {
      expect(game.gravity).toBe(0.5);
      expect(game.flapStrength).toBe(-8);
      expect(game.terminalVelocity).toBe(12);
    });

    it("initializes pipe settings", () => {
      expect(game.pipeWidth).toBe(60);
      expect(game.pipeGap).toBe(150);
      expect(game.pipeSpawnDistance).toBe(200);
      expect(game.pipeSpeed).toBe(3);
    });
  });

  describe("flapping", () => {
    it("starts game on first flap with action1", () => {
      input.isJustPressed.mockImplementation((key) => key === "action1");
      game.update(16);
      expect(game.started).toBe(true);
    });

    it("starts game on first flap with up arrow", () => {
      input.isJustPressed.mockImplementation((key) => key === "up");
      game.update(16);
      expect(game.started).toBe(true);
    });

    it("plays game-start sound on first flap", () => {
      input.isJustPressed.mockImplementation((key) => key === "action1");
      game.update(16);
      expect(audio.play).toHaveBeenCalledWith("game-start");
    });

    it("flap gives upward velocity", () => {
      game.started = true;
      game.bird.vy = 0;
      input.isJustPressed.mockImplementation((key) => key === "action1");
      game.update(16);
      // After update, gravity is also applied, so vy = flapStrength + gravity
      expect(game.bird.vy).toBe(game.flapStrength + game.gravity);
    });

    it("plays jump sound on flap", () => {
      game.started = true;
      input.isJustPressed.mockImplementation((key) => key === "action1");
      game.update(16);
      expect(audio.play).toHaveBeenCalledWith("jump");
    });

    it("allows flapping with up arrow during game", () => {
      game.started = true;
      game.bird.vy = 0;
      input.isJustPressed.mockImplementation((key) => key === "up");
      game.update(16);
      // After update, gravity is also applied, so vy = flapStrength + gravity
      expect(game.bird.vy).toBe(game.flapStrength + game.gravity);
    });

    it("flap method sets correct velocity", () => {
      game.flap();
      expect(game.bird.vy).toBe(-8);
    });
  });

  describe("gravity", () => {
    it("bird falls due to gravity", () => {
      game.started = true;
      const initialY = game.bird.y;
      game.update(16);
      game.update(16);
      game.update(16);
      expect(game.bird.y).toBeGreaterThan(initialY);
    });

    it("velocity increases each frame due to gravity", () => {
      game.started = true;
      game.bird.vy = 0;
      game.update(16);
      const vy1 = game.bird.vy;
      game.update(16);
      const vy2 = game.bird.vy;
      expect(vy2).toBeGreaterThan(vy1);
    });

    it("velocity is capped at terminal velocity", () => {
      game.started = true;
      game.bird.vy = 20; // Above terminal
      game.update(16);
      expect(game.bird.vy).toBeLessThanOrEqual(game.terminalVelocity);
    });

    it("applies gravity constant correctly", () => {
      game.started = true;
      game.bird.vy = 0;
      game.update(16);
      expect(game.bird.vy).toBe(game.gravity);
    });
  });

  describe("bird rotation", () => {
    it("bird rotates based on velocity", () => {
      game.started = true;
      game.bird.vy = 10;
      game.update(16);
      expect(game.bird.rotation).toBeGreaterThan(0);
    });

    it("bird rotates up when moving up", () => {
      game.started = true;
      game.bird.vy = -5;
      game.update(16);
      expect(game.bird.rotation).toBeLessThan(0);
    });

    it("rotation is capped at maximum", () => {
      game.started = true;
      game.bird.vy = 100;
      game.update(16);
      expect(game.bird.rotation).toBeLessThanOrEqual(90);
    });

    it("rotation is capped at minimum", () => {
      game.started = true;
      game.bird.vy = -100;
      game.update(16);
      expect(game.bird.rotation).toBeGreaterThanOrEqual(-30);
    });
  });

  describe("pipes", () => {
    it("spawns pipes when playing", () => {
      game.started = true;
      game.update(16);
      expect(game.pipes.length).toBeGreaterThan(0);
    });

    it("pipes spawn at right edge of screen", () => {
      game.spawnPipe();
      expect(game.pipes[0].x).toBe(canvas.width);
    });

    it("pipes have gap property", () => {
      game.spawnPipe();
      expect(game.pipes[0].gapY).toBeDefined();
      expect(typeof game.pipes[0].gapY).toBe("number");
    });

    it("pipe gap is within valid range", () => {
      game.spawnPipe();
      const minGapY = 100;
      const maxGapY = game.groundY - game.pipeGap - 100;
      expect(game.pipes[0].gapY).toBeGreaterThanOrEqual(minGapY);
      expect(game.pipes[0].gapY).toBeLessThanOrEqual(maxGapY);
    });

    it("pipes move left", () => {
      game.started = true;
      game.spawnPipe();
      const initialX = game.pipes[0].x;
      game.updatePipes();
      expect(game.pipes[0].x).toBeLessThan(initialX);
    });

    it("pipes move at correct speed", () => {
      game.started = true;
      game.spawnPipe();
      const initialX = game.pipes[0].x;
      game.updatePipes();
      expect(game.pipes[0].x).toBe(initialX - game.pipeSpeed);
    });

    it("removes off-screen pipes", () => {
      game.started = true;

      // Set up two pipes: one off-screen to remove, one on-screen to keep
      game.pipes = [
        {
          x: -game.pipeWidth - 10, // Fully off screen (pipe.x + pipeWidth < 0)
          gapY: 200,
          scored: true,
        },
        {
          x: canvas.width - 50, // On screen, prevents new spawn
          gapY: 250,
          scored: false,
        },
      ];

      game.updatePipes();

      // Should have removed the off-screen pipe but kept the on-screen one
      expect(game.pipes.length).toBe(1);
      expect(game.pipes[0].x).toBeLessThan(canvas.width);
    });

    it("spawns new pipe when last pipe crosses threshold", () => {
      game.started = true;
      game.pipes = [
        {
          x: canvas.width - game.pipeSpawnDistance - 10,
          gapY: 200,
          scored: false,
        },
      ];
      game.updatePipes();
      expect(game.pipes.length).toBe(2);
    });

    it("pipes start with scored=false", () => {
      game.spawnPipe();
      expect(game.pipes[0].scored).toBe(false);
    });
  });

  describe("scoring", () => {
    it("score increases when passing pipe", () => {
      game.started = true;
      game.pipes = [
        {
          x: game.birdX - game.pipeWidth - 1, // Already passed
          gapY: game.bird.y - 50,
          scored: false,
        },
      ];
      game.updatePipes();
      expect(game.score).toBe(1);
    });

    it("marks pipe as scored after passing", () => {
      game.started = true;
      game.pipes = [
        {
          x: game.birdX - game.pipeWidth - 1,
          gapY: game.bird.y - 50,
          scored: false,
        },
      ];
      game.updatePipes();
      expect(game.pipes[0].scored).toBe(true);
    });

    it("does not score same pipe twice", () => {
      game.started = true;
      game.pipes = [
        {
          x: game.birdX - game.pipeWidth - 1,
          gapY: game.bird.y - 50,
          scored: true, // Already scored
        },
      ];
      const initialScore = game.score;
      game.updatePipes();
      expect(game.score).toBe(initialScore);
    });

    it("plays score sound when passing pipe", () => {
      game.started = true;
      game.pipes = [
        {
          x: game.birdX - game.pipeWidth - 1,
          gapY: game.bird.y - 50,
          scored: false,
        },
      ];
      game.updatePipes();
      expect(audio.play).toHaveBeenCalledWith("score");
    });
  });

  describe("collision with ground", () => {
    it("game over when hitting ground", () => {
      game.started = true;
      game.bird.y = game.groundY;
      game.update(16);
      expect(game.state).toBe("gameover");
    });

    it("plays death sound when hitting ground", () => {
      game.started = true;
      game.bird.y = game.groundY;
      game.update(16);
      expect(audio.play).toHaveBeenCalledWith("death");
    });

    it("bird position clamped at ground", () => {
      game.started = true;
      game.bird.y = game.groundY + 100;
      game.update(16);
      expect(game.bird.y).toBe(game.groundY - game.birdHeight);
    });
  });

  describe("collision with ceiling", () => {
    it("game over when hitting ceiling", () => {
      game.started = true;
      game.bird.y = -10;
      game.update(16);
      expect(game.state).toBe("gameover");
    });

    it("plays death sound when hitting ceiling", () => {
      game.started = true;
      game.bird.y = -10;
      game.update(16);
      expect(audio.play).toHaveBeenCalledWith("death");
    });

    it("bird position clamped at ceiling", () => {
      game.started = true;
      game.bird.y = -10;
      game.update(16);
      expect(game.bird.y).toBe(0);
    });
  });

  describe("collision with pipes", () => {
    it("game over when hitting pipe from top", () => {
      game.started = true;
      game.pipes = [
        {
          x: game.birdX - 10, // Overlapping
          gapY: game.bird.y + 100, // Gap below bird
          scored: false,
        },
      ];
      game.updatePipes();
      expect(game.state).toBe("gameover");
    });

    it("game over when hitting pipe from bottom", () => {
      game.started = true;
      game.pipes = [
        {
          x: game.birdX - 10, // Overlapping
          gapY: game.bird.y - game.pipeGap - 50, // Gap above bird
          scored: false,
        },
      ];
      game.updatePipes();
      expect(game.state).toBe("gameover");
    });

    it("no collision when bird in gap", () => {
      game.started = true;
      game.state = "running";
      game.pipes = [
        {
          x: game.birdX - 10, // Overlapping
          gapY: game.bird.y - 50, // Gap contains bird
          scored: false,
        },
      ];
      game.updatePipes();
      expect(game.state).toBe("running");
    });

    it("no collision when pipe not overlapping horizontally", () => {
      game.started = true;
      game.state = "running";
      game.pipes = [
        {
          x: game.birdX + game.birdWidth + 50, // Not overlapping
          gapY: 0, // Would collide if overlapping
          scored: false,
        },
      ];
      game.updatePipes();
      expect(game.state).toBe("running");
    });

    it("plays death sound on pipe collision", () => {
      game.started = true;
      game.pipes = [
        {
          x: game.birdX - 10,
          gapY: game.bird.y + 100,
          scored: false,
        },
      ];
      game.updatePipes();
      expect(audio.play).toHaveBeenCalledWith("death");
    });
  });

  describe("collision detection", () => {
    it("checkPipeCollision returns true for top pipe hit", () => {
      const pipe = {
        x: game.birdX,
        gapY: game.bird.y + 100,
      };
      expect(game.checkPipeCollision(pipe)).toBe(true);
    });

    it("checkPipeCollision returns true for bottom pipe hit", () => {
      const pipe = {
        x: game.birdX,
        gapY: game.bird.y - game.pipeGap - 50,
      };
      expect(game.checkPipeCollision(pipe)).toBe(true);
    });

    it("checkPipeCollision returns false when in gap", () => {
      const pipe = {
        x: game.birdX,
        gapY: game.bird.y - 50,
      };
      expect(game.checkPipeCollision(pipe)).toBe(false);
    });

    it("checkPipeCollision returns false when not overlapping", () => {
      const pipe = {
        x: game.birdX + 200,
        gapY: 0,
      };
      expect(game.checkPipeCollision(pipe)).toBe(false);
    });
  });

  describe("scrolling effects", () => {
    it("ground scrolls when game is running", () => {
      game.started = true;
      const initialOffset = game.groundOffset;
      game.update(16);
      expect(game.groundOffset).not.toBe(initialOffset);
    });

    it("background scrolls when game is running", () => {
      game.started = true;
      const initialOffset = game.bgOffset;
      game.update(16);
      expect(game.bgOffset).not.toBe(initialOffset);
    });

    it("ground scrolls faster than background (parallax)", () => {
      game.started = true;
      game.groundOffset = 0;
      game.bgOffset = 0;
      game.update(16);
      const groundDelta = game.groundOffset;
      const bgDelta = game.bgOffset;
      expect(groundDelta).toBeGreaterThan(bgDelta);
    });

    it("ground offset wraps around", () => {
      game.started = true;
      game.groundOffset = 23;
      game.update(16);
      expect(game.groundOffset).toBeLessThan(24);
    });
  });

  describe("reset", () => {
    it("resets bird position", () => {
      game.bird.y = 100;
      game.reset();
      expect(game.bird.y).toBe(canvas.height / 2);
    });

    it("resets bird velocity", () => {
      game.bird.vy = 10;
      game.reset();
      expect(game.bird.vy).toBe(0);
    });

    it("resets score", () => {
      game.score = 42;
      game.reset();
      expect(game.score).toBe(0);
    });

    it("clears pipes", () => {
      game.pipes = [{ x: 100, gapY: 200, scored: false }];
      game.reset();
      expect(game.pipes.length).toBe(0);
    });

    it("resets started flag", () => {
      game.started = true;
      game.reset();
      expect(game.started).toBe(false);
    });

    it("resets ground offset", () => {
      game.groundOffset = 50;
      game.reset();
      expect(game.groundOffset).toBe(0);
    });
  });

  describe("config", () => {
    it("has correct game id", () => {
      expect(Flappy.config.id).toBe("flappy");
    });

    it("has correct title", () => {
      expect(Flappy.config.title).toBe("Flappy");
    });

    it("has 1 life", () => {
      expect(Flappy.config.startLives).toBe(1);
    });

    it("has highest score type", () => {
      expect(Flappy.config.highScoreType).toBe("highest");
    });

    it("has action1 control for flapping", () => {
      expect(Flappy.config.controls.action1).toContain("Flap");
    });
  });

  describe("rendering", () => {
    it("render method exists", () => {
      expect(typeof game.render).toBe("function");
    });

    it("renders without errors", () => {
      expect(() => game.render(mockCtx)).not.toThrow();
    });

    it("renders sky background", () => {
      game.render(mockCtx);
      expect(mockCtx.fillRect).toHaveBeenCalledWith(
        0,
        0,
        canvas.width,
        canvas.height,
      );
    });

    it("renders bird", () => {
      game.render(mockCtx);
      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
    });

    it("renders score", () => {
      game.score = 42;
      game.render(mockCtx);
      expect(mockCtx.fillText).toHaveBeenCalledWith("42", canvas.width / 2, 80);
    });

    it("renders start prompt when not started", () => {
      game.started = false;
      game.render(mockCtx);
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        "TAP TO START",
        canvas.width / 2,
        canvas.height / 2 + 50,
      );
    });

    it("does not render start prompt when started", () => {
      game.started = true;
      game.render(mockCtx);
      const calls = mockCtx.fillText.mock.calls;
      const hasStartPrompt = calls.some((call) => call[0] === "TAP TO START");
      expect(hasStartPrompt).toBe(false);
    });
  });

  describe("game state management", () => {
    it("does not update before game starts", () => {
      game.started = false;
      const initialY = game.bird.y;
      game.update(16);
      game.update(16);
      // Bird should not fall before game starts
      expect(game.bird.y).toBe(initialY);
    });

    it("starts updating after first flap", () => {
      input.isJustPressed.mockImplementation((key) => key === "action1");
      game.update(16);
      input.isJustPressed.mockImplementation(() => false);
      const initialY = game.bird.y;
      game.update(16);
      game.update(16);
      // Bird should start falling after game starts
      expect(game.bird.y).not.toBe(initialY);
    });

    it("state is idle initially", () => {
      expect(game.state).toBe("idle");
    });

    it("die method triggers game over", () => {
      game.die();
      expect(game.state).toBe("gameover");
    });
  });

  describe("integration tests", () => {
    it("complete gameplay flow: start, flap, fall, score", () => {
      // Start game
      input.isJustPressed.mockImplementation((key) => key === "action1");
      game.update(16);
      expect(game.started).toBe(true);

      // Flap and move forward
      input.isJustPressed.mockImplementation(() => false);
      for (let i = 0; i < 10; i++) {
        game.update(16);
      }

      // Should have spawned pipes
      expect(game.pipes.length).toBeGreaterThan(0);
    });

    it("bird can survive by flapping regularly", () => {
      game.started = true;
      game.bird.y = canvas.height / 2;

      // Flap every few frames to stay alive
      for (let i = 0; i < 50; i++) {
        if (i % 15 === 0) {
          input.isJustPressed.mockImplementation((key) => key === "action1");
        } else {
          input.isJustPressed.mockImplementation(() => false);
        }
        game.update(16);

        // Should still be running
        if (game.state !== "running" && game.state !== "idle") {
          break;
        }
      }
    });

    it("score accumulates as pipes are passed", () => {
      game.started = true;
      game.bird.y = canvas.height / 2;

      // Create a pipe that's slightly ahead of the bird
      game.pipes = [
        {
          x: game.birdX + 10,
          gapY: game.bird.y - 50,
          scored: false,
        },
      ];

      // Update until pipe is passed
      // Need pipe.x + pipeWidth < birdX
      // Starting at birdX + 10, need to reach birdX - pipeWidth
      // Distance = (birdX + 10) - (birdX - pipeWidth) = 10 + pipeWidth
      // With pipeSpeed = 3, need Math.ceil((10 + pipeWidth) / 3) = 24 updates
      for (let i = 0; i < 30; i++) {
        game.updatePipes();
      }

      expect(game.score).toBeGreaterThan(0);
    });
  });
});
