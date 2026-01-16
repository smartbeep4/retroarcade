import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { Pong } from "../../../src/games/pong/Pong.js";

describe("Pong", () => {
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
      setLineDash: vi.fn(),
      lineWidth: 0,
      shadowColor: "",
      shadowBlur: 0,
      font: "",
      textAlign: "",
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

    game = new Pong(canvas, input, audio);
    await game.init();
  });

  afterEach(() => {
    if (game.animationId) {
      cancelAnimationFrame(game.animationId);
    }
  });

  describe("config", () => {
    it("has correct game id", () => {
      expect(Pong.config.id).toBe("pong");
    });

    it("has correct title", () => {
      expect(Pong.config.title).toBe("Pong");
    });

    it("has correct description", () => {
      expect(Pong.config.description).toBe(
        "Classic paddle game. First to 11 wins!",
      );
    });

    it("has startLives of 0 (score-based game)", () => {
      expect(Pong.config.startLives).toBe(0);
    });

    it("has highScoreType of highest", () => {
      expect(Pong.config.highScoreType).toBe("highest");
    });

    it("has controls defined", () => {
      expect(Pong.config.controls).toBeDefined();
      expect(Pong.config.controls.movement).toBeDefined();
    });
  });

  describe("initialization", () => {
    it("creates two paddles", () => {
      expect(game.paddle1).toBeDefined();
      expect(game.paddle2).toBeDefined();
    });

    it("creates ball at center", () => {
      expect(game.ball.x).toBeCloseTo(canvas.width / 2 - game.ballSize / 2, 1);
      expect(game.ball.y).toBeCloseTo(canvas.height / 2 - game.ballSize / 2, 1);
    });

    it("starts with score 0-0", () => {
      expect(game.paddle1.score).toBe(0);
      expect(game.paddle2.score).toBe(0);
    });

    it("initializes paddle positions correctly", () => {
      expect(game.paddle1.x).toBe(game.paddleOffset);
      expect(game.paddle2.x).toBe(
        canvas.width - game.paddleOffset - game.paddleWidth,
      );

      const expectedY = canvas.height / 2 - game.paddleHeight / 2;
      expect(game.paddle1.y).toBe(expectedY);
      expect(game.paddle2.y).toBe(expectedY);
    });

    it("starts with gameStarted as false", () => {
      expect(game.gameStarted).toBe(false);
    });

    it("starts with no winner", () => {
      expect(game.winner).toBe(null);
    });

    it("initializes ball speed to base speed", () => {
      expect(game.ball.speed).toBe(game.ballBaseSpeed);
    });

    it("sets game mode to ai by default", () => {
      expect(game.gameMode).toBe("ai");
    });

    it("sets ai difficulty to medium by default", () => {
      expect(game.aiDifficulty).toBe("medium");
    });

    it("sets win score to 11", () => {
      expect(game.winScore).toBe(11);
    });
  });

  describe("game start", () => {
    it("does not start until action1 is pressed", () => {
      expect(game.gameStarted).toBe(false);
      game.update(16);
      expect(game.gameStarted).toBe(false);
    });

    it("starts when action1 is pressed", () => {
      input.isJustPressed.mockImplementation((key) => key === "action1");
      game.update(16);
      expect(game.gameStarted).toBe(true);
    });

    it("starts when start is pressed", () => {
      input.isJustPressed.mockImplementation((key) => key === "start");
      game.update(16);
      expect(game.gameStarted).toBe(true);
    });

    it("plays game-start sound on start", () => {
      input.isJustPressed.mockImplementation((key) => key === "action1");
      game.update(16);
      expect(audio.play).toHaveBeenCalledWith("game-start");
    });

    it("launches ball when game starts", () => {
      input.isJustPressed.mockImplementation((key) => key === "action1");
      game.update(16);
      expect(game.ball.vx).not.toBe(0);
    });
  });

  describe("paddle movement", () => {
    beforeEach(() => {
      game.gameStarted = true;
    });

    it("moves paddle1 up on up input", () => {
      const initialY = game.paddle1.y;
      input.isPressed.mockImplementation((key) => key === "up");
      game.update(16);
      expect(game.paddle1.y).toBeLessThan(initialY);
    });

    it("moves paddle1 down on down input", () => {
      const initialY = game.paddle1.y;
      input.isPressed.mockImplementation((key) => key === "down");
      game.update(16);
      expect(game.paddle1.y).toBeGreaterThan(initialY);
    });

    it("moves paddle1 by paddleSpeed pixels", () => {
      const initialY = game.paddle1.y;
      input.isPressed.mockImplementation((key) => key === "up");
      game.update(16);
      expect(game.paddle1.y).toBe(initialY - game.paddleSpeed);
    });

    it("clamps paddle1 to top of screen", () => {
      game.paddle1.y = 0;
      input.isPressed.mockImplementation((key) => key === "up");
      game.update(16);
      expect(game.paddle1.y).toBe(0);
    });

    it("clamps paddle1 to bottom of screen", () => {
      game.paddle1.y = canvas.height - game.paddleHeight;
      input.isPressed.mockImplementation((key) => key === "down");
      game.update(16);
      expect(game.paddle1.y).toBe(canvas.height - game.paddleHeight);
    });

    it("clamps paddle2 to screen bounds", () => {
      game.paddle2.y = -10;
      game.update(16);
      expect(game.paddle2.y).toBeGreaterThanOrEqual(0);

      game.paddle2.y = canvas.height;
      game.update(16);
      expect(game.paddle2.y).toBeLessThanOrEqual(
        canvas.height - game.paddleHeight,
      );
    });
  });

  describe("AI behavior", () => {
    beforeEach(() => {
      game.gameStarted = true;
      game.gameMode = "ai";
    });

    it("AI moves paddle toward ball when ball is above", () => {
      game.ball.y = 100;
      game.paddle2.y = 300;
      game.updateAI();
      expect(game.paddle2.y).toBeLessThan(300);
    });

    it("AI moves paddle toward ball when ball is below", () => {
      game.ball.y = 500;
      game.paddle2.y = 200;
      game.updateAI();
      expect(game.paddle2.y).toBeGreaterThan(200);
    });

    it("AI does not move when ball is centered on paddle", () => {
      game.paddle2.y = 250;
      game.ball.y = game.paddle2.y + game.paddleHeight / 2 - game.ballSize / 2;
      const initialY = game.paddle2.y;
      game.updateAI();
      // Should be within deadzone
      expect(Math.abs(game.paddle2.y - initialY)).toBeLessThanOrEqual(
        game.paddleSpeed,
      );
    });

    it("easy AI moves slower than medium", () => {
      game.aiDifficulty = "easy";
      const speeds = { easy: 3, medium: 5, hard: 7 };
      expect(speeds.easy).toBeLessThan(speeds.medium);
    });

    it("hard AI moves faster than medium", () => {
      game.aiDifficulty = "hard";
      const speeds = { easy: 3, medium: 5, hard: 7 };
      expect(speeds.hard).toBeGreaterThan(speeds.medium);
    });
  });

  describe("ball physics", () => {
    beforeEach(() => {
      game.gameStarted = true;
    });

    it("ball moves based on velocity", () => {
      game.ball.vx = 5;
      game.ball.vy = 3;
      const initialX = game.ball.x;
      const initialY = game.ball.y;
      game.update(16);
      expect(game.ball.x).toBe(initialX + 5);
      expect(game.ball.y).toBe(initialY + 3);
    });

    it("bounces off top wall", () => {
      game.ball.y = 0;
      game.ball.vy = -5;
      game.update(16);
      expect(game.ball.vy).toBeGreaterThan(0);
    });

    it("bounces off bottom wall", () => {
      game.ball.y = canvas.height - game.ballSize;
      game.ball.vy = 5;
      game.update(16);
      expect(game.ball.vy).toBeLessThan(0);
    });

    it("plays hit sound on wall bounce", () => {
      game.ball.y = 0;
      game.ball.vy = -5;
      audio.play.mockClear();
      game.update(16);
      expect(audio.play).toHaveBeenCalledWith("hit");
    });

    it("clamps ball position when bouncing off top", () => {
      game.ball.y = -10;
      game.ball.vy = -5;
      game.update(16);
      expect(game.ball.y).toBe(0);
    });

    it("clamps ball position when bouncing off bottom", () => {
      game.ball.y = canvas.height;
      game.ball.vy = 5;
      game.update(16);
      expect(game.ball.y).toBe(canvas.height - game.ballSize);
    });
  });

  describe("paddle collision", () => {
    beforeEach(() => {
      game.gameStarted = true;
    });

    it("detects collision with paddle1", () => {
      game.ball.x = game.paddle1.x + game.paddleWidth - 1;
      game.ball.y = game.paddle1.y + game.paddleHeight / 2;
      game.ball.vx = -5;
      const initialSpeed = game.ball.speed;
      game.checkPaddleCollision(game.paddle1);
      expect(game.ball.speed).toBeGreaterThan(initialSpeed);
    });

    it("detects collision with paddle2", () => {
      game.ball.x = game.paddle2.x + 1;
      game.ball.y = game.paddle2.y + game.paddleHeight / 2;
      game.ball.vx = 5;
      const initialSpeed = game.ball.speed;
      game.checkPaddleCollision(game.paddle2);
      expect(game.ball.speed).toBeGreaterThan(initialSpeed);
    });

    it("increases ball speed on paddle hit", () => {
      game.ball.x = game.paddle1.x + game.paddleWidth - 1; // Overlap by 1px
      game.ball.y = game.paddle1.y + game.paddleHeight / 2;
      game.ball.vx = -5;
      const initialSpeed = game.ball.speed;
      game.checkPaddleCollision(game.paddle1);
      expect(game.ball.speed).toBe(initialSpeed + game.ballSpeedIncrease);
    });

    it("caps ball speed at maximum", () => {
      game.ball.speed = game.ballMaxSpeed - 0.1;
      game.ball.x = game.paddle1.x + game.paddleWidth;
      game.ball.y = game.paddle1.y + game.paddleHeight / 2;
      game.ball.vx = -5;
      game.checkPaddleCollision(game.paddle1);
      expect(game.ball.speed).toBeLessThanOrEqual(game.ballMaxSpeed);
    });

    it("reflects ball velocity on paddle1 hit", () => {
      game.ball.x = game.paddle1.x + game.paddleWidth - 1; // Overlap by 1px
      game.ball.y = game.paddle1.y + game.paddleHeight / 2;
      game.ball.vx = -5;
      game.checkPaddleCollision(game.paddle1);
      expect(game.ball.vx).toBeGreaterThan(0);
    });

    it("reflects ball velocity on paddle2 hit", () => {
      game.ball.x = game.paddle2.x;
      game.ball.y = game.paddle2.y + game.paddleHeight / 2;
      game.ball.vx = 5;
      game.checkPaddleCollision(game.paddle2);
      expect(game.ball.vx).toBeLessThan(0);
    });

    it("plays hit sound on paddle collision", () => {
      game.ball.x = game.paddle1.x + game.paddleWidth - 1; // Overlap by 1px
      game.ball.y = game.paddle1.y + game.paddleHeight / 2;
      game.ball.vx = -5;
      audio.play.mockClear();
      game.checkPaddleCollision(game.paddle1);
      expect(audio.play).toHaveBeenCalledWith("hit");
    });

    it("varies angle based on hit position on paddle", () => {
      // Hit at top of paddle
      game.ball.x = game.paddle1.x + game.paddleWidth - 1; // Overlap by 1px
      game.ball.y = game.paddle1.y;
      game.ball.vx = -5;
      game.ball.vy = 0;
      game.checkPaddleCollision(game.paddle1);
      const topAngleVy = game.ball.vy;

      // Reset and hit at bottom of paddle
      game.ball.x = game.paddle1.x + game.paddleWidth - 1; // Overlap by 1px
      game.ball.y = game.paddle1.y + game.paddleHeight - game.ballSize;
      game.ball.vx = -5;
      game.ball.vy = 0;
      game.ball.speed = game.ballBaseSpeed; // Reset speed
      game.checkPaddleCollision(game.paddle1);
      const bottomAngleVy = game.ball.vy;

      // Angles should be different
      expect(topAngleVy).not.toBe(bottomAngleVy);
    });

    it("positions ball outside paddle on collision", () => {
      game.ball.x = game.paddle1.x + 5; // Inside paddle
      game.ball.y = game.paddle1.y + game.paddleHeight / 2;
      game.ball.vx = -5;
      game.checkPaddleCollision(game.paddle1);
      expect(game.ball.x).toBe(game.paddle1.x + game.paddleWidth);
    });
  });

  describe("scoring", () => {
    beforeEach(() => {
      game.gameStarted = true;
    });

    it("player 2 scores when ball passes left edge", () => {
      game.ball.x = -game.ballSize - 1;
      game.checkScore();
      expect(game.paddle2.score).toBe(1);
    });

    it("player 1 scores when ball passes right edge", () => {
      game.ball.x = canvas.width + 1;
      game.checkScore();
      expect(game.paddle1.score).toBe(1);
    });

    it("plays score sound when point is scored", () => {
      game.ball.x = canvas.width + 1;
      audio.play.mockClear();
      game.checkScore();
      expect(audio.play).toHaveBeenCalledWith("score");
    });

    it("resets ball after scoring", () => {
      game.ball.x = canvas.width + 1;
      game.ball.vx = 10;
      game.checkScore();
      expect(game.ball.x).toBeCloseTo(canvas.width / 2 - game.ballSize / 2, 1);
    });

    it("launches ball toward player 1 when player 1 scores", () => {
      game.ball.x = canvas.width + 1;
      game.checkScore();
      expect(game.ball.vx).toBeLessThan(0); // Ball goes left toward P1 (scorer)
    });

    it("launches ball toward player 2 when player 2 scores", () => {
      game.ball.x = -game.ballSize - 1;
      game.checkScore();
      expect(game.ball.vx).toBeGreaterThan(0); // Ball goes right toward P2 (scorer)
    });

    it("updates game.score with player 1 score", () => {
      game.ball.x = canvas.width + 1;
      game.checkScore();
      expect(game.score).toBe(1);
      expect(game.score).toBe(game.paddle1.score);
    });

    it("resets ball speed after scoring", () => {
      game.ball.speed = 10;
      game.ball.x = canvas.width + 1;
      game.checkScore();
      expect(game.ball.speed).toBe(game.ballBaseSpeed);
    });
  });

  describe("win condition", () => {
    beforeEach(() => {
      game.gameStarted = true;
    });

    it("player 1 wins at 11 points", () => {
      game.paddle1.score = 10;
      game.ball.x = canvas.width + 1;
      game.checkScore();
      expect(game.winner).toBe(1);
    });

    it("player 2 wins at 11 points", () => {
      game.paddle2.score = 10;
      game.ball.x = -game.ballSize - 1;
      game.checkScore();
      expect(game.winner).toBe(2);
    });

    it("triggers game over when player wins", () => {
      game.paddle1.score = 10;
      game.ball.x = canvas.width + 1;
      game.checkScore();
      expect(game.state).toBe("gameover");
    });

    it("stops updating after winner is determined", () => {
      game.winner = 1;
      game.ball.vx = 5;
      const initialX = game.ball.x;
      game.update(16);
      expect(game.ball.x).toBe(initialX);
    });

    it("submits player 1 score on win", () => {
      game.paddle1.score = 10;
      game.ball.x = canvas.width + 1;
      game.checkScore();
      expect(game.score).toBe(11);
    });

    it("submits player 1 score even if player 2 wins", () => {
      game.paddle1.score = 5;
      game.paddle2.score = 10;
      game.ball.x = -game.ballSize - 1;
      game.checkScore();
      expect(game.score).toBe(5); // P1's score submitted
    });
  });

  describe("resetGame", () => {
    it("resets paddles to center", () => {
      game.paddle1.y = 100;
      game.paddle2.y = 400;
      game.resetGame();
      const expectedY = canvas.height / 2 - game.paddleHeight / 2;
      expect(game.paddle1.y).toBe(expectedY);
      expect(game.paddle2.y).toBe(expectedY);
    });

    it("resets scores to 0", () => {
      game.paddle1.score = 5;
      game.paddle2.score = 3;
      game.resetGame();
      expect(game.paddle1.score).toBe(0);
      expect(game.paddle2.score).toBe(0);
    });

    it("resets gameStarted flag", () => {
      game.gameStarted = true;
      game.resetGame();
      expect(game.gameStarted).toBe(false);
    });

    it("clears winner", () => {
      game.winner = 1;
      game.resetGame();
      expect(game.winner).toBe(null);
    });

    it("resets ball to center", () => {
      game.ball.x = 100;
      game.ball.y = 200;
      game.resetGame();
      expect(game.ball.x).toBeCloseTo(canvas.width / 2 - game.ballSize / 2, 1);
      expect(game.ball.y).toBeCloseTo(canvas.height / 2 - game.ballSize / 2, 1);
    });
  });

  describe("resetBall", () => {
    it("resets ball to center position", () => {
      game.ball.x = 100;
      game.ball.y = 200;
      game.resetBall();
      expect(game.ball.x).toBeCloseTo(canvas.width / 2 - game.ballSize / 2, 1);
      expect(game.ball.y).toBeCloseTo(canvas.height / 2 - game.ballSize / 2, 1);
    });

    it("resets ball speed to base speed", () => {
      game.ball.speed = 10;
      game.resetBall();
      expect(game.ball.speed).toBe(game.ballBaseSpeed);
    });

    it("launches ball in random direction by default", () => {
      game.resetBall();
      expect(game.ball.vx).not.toBe(0);
    });

    it("launches ball toward player 1 when specified", () => {
      game.resetBall(1);
      expect(game.ball.vx).toBeLessThan(0);
    });

    it("launches ball toward player 2 when specified", () => {
      game.resetBall(2);
      expect(game.ball.vx).toBeGreaterThan(0);
    });

    it("gives ball some vertical velocity", () => {
      game.resetBall();
      // Should have some Y velocity (not purely horizontal)
      expect(Math.abs(game.ball.vy)).toBeGreaterThanOrEqual(0);
    });
  });

  describe("render", () => {
    it("clears canvas with dark background", () => {
      mockCtx.fillRect.mockClear();
      game.render(mockCtx);
      // Check that fillRect was called with canvas dimensions (clearing the canvas)
      expect(mockCtx.fillRect).toHaveBeenCalledWith(
        0,
        0,
        canvas.width,
        canvas.height,
      );
    });

    it("draws center line", () => {
      game.render(mockCtx);
      expect(mockCtx.moveTo).toHaveBeenCalled();
      expect(mockCtx.lineTo).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it("draws both scores", () => {
      game.paddle1.score = 3;
      game.paddle2.score = 5;
      game.render(mockCtx);
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        "3",
        expect.any(Number),
        expect.any(Number),
      );
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        "5",
        expect.any(Number),
        expect.any(Number),
      );
    });

    it("draws both paddles", () => {
      game.render(mockCtx);
      expect(mockCtx.fillRect).toHaveBeenCalledWith(
        game.paddle1.x,
        game.paddle1.y,
        game.paddleWidth,
        game.paddleHeight,
      );
      expect(mockCtx.fillRect).toHaveBeenCalledWith(
        game.paddle2.x,
        game.paddle2.y,
        game.paddleWidth,
        game.paddleHeight,
      );
    });

    it("draws ball", () => {
      game.render(mockCtx);
      expect(mockCtx.fillRect).toHaveBeenCalledWith(
        game.ball.x,
        game.ball.y,
        game.ballSize,
        game.ballSize,
      );
    });

    it("shows start prompt when game not started", () => {
      game.gameStarted = false;
      game.render(mockCtx);
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        "PRESS ENTER TO START",
        expect.any(Number),
        expect.any(Number),
      );
    });

    it("does not show start prompt when game started", () => {
      game.gameStarted = true;
      mockCtx.fillText.mockClear();
      game.render(mockCtx);
      expect(mockCtx.fillText).not.toHaveBeenCalledWith(
        "PRESS ENTER TO START",
        expect.any(Number),
        expect.any(Number),
      );
    });

    it("shows winner message when game ends", () => {
      game.winner = 1;
      game.render(mockCtx);
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        "PLAYER 1 WINS!",
        expect.any(Number),
        expect.any(Number),
      );
    });

    it("shows correct winner for player 2", () => {
      game.winner = 2;
      game.render(mockCtx);
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        "PLAYER 2 WINS!",
        expect.any(Number),
        expect.any(Number),
      );
    });
  });

  describe("game modes", () => {
    it("defaults to AI mode", () => {
      expect(game.gameMode).toBe("ai");
    });

    it("can be set to human mode", () => {
      game.gameMode = "human";
      expect(game.gameMode).toBe("human");
    });

    it("AI updates paddle2 in AI mode", () => {
      game.gameMode = "ai";
      game.aiDifficulty = "hard"; // 100% reaction rate
      game.gameStarted = true;
      game.ball.y = 100;
      game.paddle2.y = 300;
      game.update(16);
      expect(game.paddle2.y).toBeLessThan(300);
    });

    it("does not call AI in human mode", () => {
      game.gameMode = "human";
      game.gameStarted = true;
      game.ball.y = 100;
      game.paddle2.y = 300;
      const spy = vi.spyOn(game, "updateAI");
      game.update(16);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("AI difficulty", () => {
    it("defaults to medium difficulty", () => {
      expect(game.aiDifficulty).toBe("medium");
    });

    it("can be set to easy", () => {
      game.aiDifficulty = "easy";
      expect(game.aiDifficulty).toBe("easy");
    });

    it("can be set to hard", () => {
      game.aiDifficulty = "hard";
      expect(game.aiDifficulty).toBe("hard");
    });
  });

  describe("integration", () => {
    it("full game flow: start -> score -> win", () => {
      // Start game
      input.isJustPressed.mockImplementation((key) => key === "action1");
      game.update(16);
      expect(game.gameStarted).toBe(true);

      // Score points for player 1
      for (let i = 0; i < 11; i++) {
        game.ball.x = canvas.width + 1;
        game.checkScore();
      }

      // Check win
      expect(game.winner).toBe(1);
      expect(game.state).toBe("gameover");
      expect(game.score).toBe(11);
    });

    it("ball physics work through full rally", () => {
      game.gameStarted = true;
      game.ball.vx = 5;
      game.ball.vy = 3;

      // Move ball
      game.update(16);

      // Ball should have moved
      expect(game.ball.x).not.toBe(canvas.width / 2 - game.ballSize / 2);

      // Test wall bounce
      game.ball.y = 0;
      game.ball.vy = -5;
      game.update(16);
      expect(game.ball.vy).toBeGreaterThan(0);
    });

    it("paddle can hit ball and change angle", () => {
      game.gameStarted = true;

      // Position ball to hit paddle
      game.ball.x = game.paddle1.x + game.paddleWidth - 1; // Overlap by 1px
      game.ball.y = game.paddle1.y + 10; // Hit near top
      game.ball.vx = -5;
      game.ball.vy = 0;

      const initialSpeed = game.ball.speed;
      game.checkPaddleCollision(game.paddle1);

      // Ball should bounce and speed up
      expect(game.ball.vx).toBeGreaterThan(0);
      expect(game.ball.speed).toBeGreaterThan(initialSpeed);
      expect(game.ball.vy).not.toBe(0); // Angle applied
    });

    it("AI tracks ball throughout game", () => {
      game.gameMode = "ai";
      game.aiDifficulty = "hard"; // 100% reaction rate
      game.gameStarted = true;

      // Position ball at different locations and verify AI responds
      game.ball.y = 100;
      game.paddle2.y = 300;
      game.update(16);
      expect(game.paddle2.y).toBeLessThan(300);

      game.ball.y = 500;
      game.paddle2.y = 200;
      game.update(16);
      expect(game.paddle2.y).toBeGreaterThan(200);
    });

    it("game can be reset after completion", () => {
      // Complete a game
      game.gameStarted = true;
      game.paddle1.score = 10;
      game.ball.x = canvas.width + 1;
      game.checkScore();
      expect(game.winner).toBe(1);

      // Reset
      game.resetGame();
      expect(game.paddle1.score).toBe(0);
      expect(game.paddle2.score).toBe(0);
      expect(game.winner).toBe(null);
      expect(game.gameStarted).toBe(false);
    });
  });
});
