import { describe, it, expect, beforeEach, vi } from "vitest";
import { Asteroids } from "../../../src/games/asteroids/Asteroids.js";

describe("Asteroids", () => {
  let canvas, input, audio, game, mockCtx;

  beforeEach(async () => {
    // Create a mock canvas context
    mockCtx = {
      fillStyle: "",
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      strokeStyle: "",
      lineWidth: 0,
      shadowColor: "",
      shadowBlur: 0,
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      arc: vi.fn(),
      ellipse: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      fillText: vi.fn(),
      textAlign: "",
      font: "",
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
    game = new Asteroids(canvas, input, audio);
    await game.init();
  });

  describe("initialization", () => {
    it("ship starts at center", () => {
      expect(game.ship.x).toBeCloseTo(canvas.width / 2);
      expect(game.ship.y).toBeCloseTo(canvas.height / 2);
    });

    it("ship starts pointing up", () => {
      expect(game.ship.rotation).toBeCloseTo(-Math.PI / 2);
    });

    it("ship starts with zero velocity", () => {
      expect(game.ship.vx).toBe(0);
      expect(game.ship.vy).toBe(0);
    });

    it("spawns 4 asteroids in wave 1", () => {
      expect(game.asteroids.length).toBe(4);
    });

    it("all asteroids are large in wave 1", () => {
      game.asteroids.forEach((asteroid) => {
        expect(asteroid.size).toBe("large");
      });
    });

    it("starts with wave 1", () => {
      expect(game.wave).toBe(1);
    });

    it("starts with invincibility timer", () => {
      expect(game.invincibleTimer).toBeGreaterThan(0);
    });

    it("initializes empty bullet arrays", () => {
      expect(game.bullets).toEqual([]);
      expect(game.ufoBullets).toEqual([]);
    });

    it("no UFO at start", () => {
      expect(game.ufo).toBeNull();
    });
  });

  describe("ship controls", () => {
    it("rotates left", () => {
      const initialRotation = game.ship.rotation;
      input.isPressed.mockImplementation((key) => key === "left");
      game.handleInput();
      expect(game.ship.rotation).toBeLessThan(initialRotation);
    });

    it("rotates right", () => {
      const initialRotation = game.ship.rotation;
      input.isPressed.mockImplementation((key) => key === "right");
      game.handleInput();
      expect(game.ship.rotation).toBeGreaterThan(initialRotation);
    });

    it("thrusts forward in facing direction", () => {
      game.ship.rotation = 0; // Facing right
      game.ship.vx = 0;
      game.ship.vy = 0;
      input.isPressed.mockImplementation((key) => key === "up");
      game.handleInput();
      expect(game.ship.vx).toBeGreaterThan(0);
      expect(game.ship.vy).toBeCloseTo(0, 1);
    });

    it("thrust respects rotation", () => {
      game.ship.rotation = Math.PI / 2; // Facing down
      game.ship.vx = 0;
      game.ship.vy = 0;
      input.isPressed.mockImplementation((key) => key === "up");
      game.handleInput();
      expect(game.ship.vx).toBeCloseTo(0, 1);
      expect(game.ship.vy).toBeGreaterThan(0);
    });

    it("clamps speed to maxSpeed", () => {
      game.ship.vx = game.maxSpeed * 0.9;
      game.ship.vy = 0;
      input.isPressed.mockImplementation((key) => key === "up");
      // Thrust multiple times
      for (let i = 0; i < 10; i++) {
        game.handleInput();
      }
      const speed = Math.sqrt(
        game.ship.vx * game.ship.vx + game.ship.vy * game.ship.vy,
      );
      expect(speed).toBeLessThanOrEqual(game.maxSpeed + 0.01);
    });

    it("fires bullet on action1", () => {
      input.isJustPressed.mockImplementation((key) => key === "action1");
      game.handleInput();
      expect(game.bullets.length).toBe(1);
    });

    it("limits bullets to maxBullets", () => {
      game.bullets = [{}, {}, {}, {}];
      input.isJustPressed.mockImplementation((key) => key === "action1");
      game.handleInput();
      expect(game.bullets.length).toBe(4);
    });

    it("fires bullet in facing direction", () => {
      game.ship.rotation = 0; // Facing right
      game.ship.x = 400;
      game.ship.y = 300;
      input.isJustPressed.mockImplementation((key) => key === "action1");
      game.handleInput();
      expect(game.bullets[0].vx).toBeGreaterThan(0);
    });

    it("plays shoot sound when firing", () => {
      input.isJustPressed.mockImplementation((key) => key === "action1");
      game.handleInput();
      expect(audio.play).toHaveBeenCalledWith("shoot");
    });

    it("hyperspace teleports ship", () => {
      const originalX = game.ship.x;
      const originalY = game.ship.y;
      input.isJustPressed.mockImplementation((key) => key === "action2");
      game.handleInput();
      // Ship position should change (extremely unlikely to be same random position)
      const moved = game.ship.x !== originalX || game.ship.y !== originalY;
      expect(moved).toBe(true);
    });

    it("hyperspace resets velocity", () => {
      game.ship.vx = 5;
      game.ship.vy = 5;
      input.isJustPressed.mockImplementation((key) => key === "action2");
      game.handleInput();
      expect(game.ship.vx).toBe(0);
      expect(game.ship.vy).toBe(0);
    });

    it("hyperspace grants invincibility", () => {
      game.invincibleTimer = 0;
      input.isJustPressed.mockImplementation((key) => key === "action2");
      game.handleInput();
      expect(game.invincibleTimer).toBeGreaterThan(0);
    });

    it("hyperspace plays powerup sound", () => {
      input.isJustPressed.mockImplementation((key) => key === "action2");
      game.handleInput();
      expect(audio.play).toHaveBeenCalledWith("powerup");
    });
  });

  describe("physics", () => {
    it("ship applies friction", () => {
      game.ship.vx = 10;
      game.ship.vy = 10;
      game.updateShip();
      expect(game.ship.vx).toBeLessThan(10);
      expect(game.ship.vy).toBeLessThan(10);
    });

    it("ship moves based on velocity", () => {
      game.ship.x = 400;
      game.ship.y = 300;
      game.ship.vx = 5;
      game.ship.vy = 3;
      game.updateShip();
      expect(game.ship.x).toBeGreaterThan(400);
      expect(game.ship.y).toBeGreaterThan(300);
    });

    it("ship wraps around screen horizontally", () => {
      game.ship.x = canvas.width + 100;
      game.wrapPosition(game.ship);
      expect(game.ship.x).toBeLessThan(0);
    });

    it("ship wraps around screen vertically", () => {
      game.ship.y = canvas.height + 100;
      game.wrapPosition(game.ship);
      expect(game.ship.y).toBeLessThan(0);
    });

    it("asteroids move based on velocity", () => {
      const asteroid = game.asteroids[0];
      const initialX = asteroid.x;
      const initialY = asteroid.y;
      game.updateAsteroids();
      expect(asteroid.x).not.toBe(initialX);
      expect(asteroid.y).not.toBe(initialY);
    });

    it("asteroids rotate", () => {
      const asteroid = game.asteroids[0];
      const initialRotation = asteroid.rotation;
      game.updateAsteroids();
      expect(asteroid.rotation).not.toBe(initialRotation);
    });

    it("asteroids wrap around screen", () => {
      const asteroid = game.asteroids[0];
      asteroid.x = canvas.width + 100;
      game.updateAsteroids();
      expect(asteroid.x).toBeLessThan(canvas.width);
    });

    it("bullets move based on velocity", () => {
      game.bullets.push({ x: 100, y: 100, vx: 5, vy: 3, lifetime: 1000 });
      game.updateBullets(16);
      expect(game.bullets[0].x).toBeGreaterThan(100);
      expect(game.bullets[0].y).toBeGreaterThan(100);
    });

    it("bullets expire after lifetime", () => {
      game.bullets.push({ x: 100, y: 100, vx: 5, vy: 3, lifetime: 10 });
      game.updateBullets(20);
      expect(game.bullets.length).toBe(0);
    });

    it("bullets wrap around screen", () => {
      game.bullets.push({
        x: canvas.width + 100,
        y: 100,
        vx: 5,
        vy: 0,
        lifetime: 1000,
      });
      game.updateBullets(16);
      expect(game.bullets[0].x).toBeLessThan(canvas.width);
    });
  });

  describe("asteroids", () => {
    it("large asteroid has correct radius", () => {
      const large = game.asteroids.find((a) => a.size === "large");
      expect(large.radius).toBe(40);
    });

    it("large asteroid has correct points", () => {
      const large = game.asteroids.find((a) => a.size === "large");
      expect(large.points).toBe(20);
    });

    it("asteroids have random vertices", () => {
      const asteroid = game.asteroids[0];
      expect(asteroid.vertices.length).toBeGreaterThanOrEqual(8);
      expect(asteroid.vertices.length).toBeLessThanOrEqual(12);
    });

    it("large asteroid splits into 2 medium", () => {
      game.asteroids = [
        {
          x: 100,
          y: 100,
          size: "large",
          points: 20,
          vx: 0,
          vy: 0,
          radius: 40,
          vertices: [],
        },
      ];
      game.destroyAsteroid(0);
      expect(game.asteroids.length).toBe(2);
      expect(game.asteroids[0].size).toBe("medium");
      expect(game.asteroids[1].size).toBe("medium");
    });

    it("medium asteroid splits into 2 small", () => {
      game.asteroids = [
        {
          x: 100,
          y: 100,
          size: "medium",
          points: 50,
          vx: 0,
          vy: 0,
          radius: 20,
          vertices: [],
        },
      ];
      game.destroyAsteroid(0);
      expect(game.asteroids.length).toBe(2);
      expect(game.asteroids[0].size).toBe("small");
      expect(game.asteroids[1].size).toBe("small");
    });

    it("small asteroid destroyed completely", () => {
      game.asteroids = [
        {
          x: 100,
          y: 100,
          size: "small",
          points: 100,
          vx: 0,
          vy: 0,
          radius: 10,
          vertices: [],
        },
      ];
      game.destroyAsteroid(0);
      expect(game.asteroids.length).toBe(0);
    });

    it("destroying asteroid adds score", () => {
      const initialScore = game.score;
      game.asteroids = [
        {
          x: 100,
          y: 100,
          size: "large",
          points: 20,
          vx: 0,
          vy: 0,
          radius: 40,
          vertices: [],
        },
      ];
      game.destroyAsteroid(0);
      expect(game.score).toBe(initialScore + 20);
    });

    it("destroying asteroid plays explosion sound", () => {
      game.asteroids = [
        {
          x: 100,
          y: 100,
          size: "small",
          points: 100,
          vx: 0,
          vy: 0,
          radius: 10,
          vertices: [],
        },
      ];
      game.destroyAsteroid(0);
      expect(audio.play).toHaveBeenCalledWith("explosion");
    });

    it("spawned asteroids inherit position", () => {
      game.asteroids = [
        {
          x: 200,
          y: 300,
          size: "large",
          points: 20,
          vx: 0,
          vy: 0,
          radius: 40,
          vertices: [],
        },
      ];
      game.destroyAsteroid(0);
      expect(game.asteroids[0].x).toBe(200);
      expect(game.asteroids[0].y).toBe(300);
      expect(game.asteroids[1].x).toBe(200);
      expect(game.asteroids[1].y).toBe(300);
    });
  });

  describe("collisions", () => {
    it("bullet destroys asteroid on collision", () => {
      game.asteroids = [
        {
          x: 100,
          y: 100,
          size: "small",
          points: 100,
          vx: 0,
          vy: 0,
          radius: 10,
          vertices: [],
        },
      ];
      game.bullets = [{ x: 100, y: 100, vx: 0, vy: 0, lifetime: 1000 }];
      game.checkCollisions();
      expect(game.asteroids.length).toBe(0);
      expect(game.bullets.length).toBe(0);
    });

    it("bullet destroys UFO on collision", () => {
      game.ufo = { x: 100, y: 100, size: 25, points: 200 };
      game.bullets = [{ x: 100, y: 100, vx: 0, vy: 0, lifetime: 1000 }];
      const initialScore = game.score;
      game.checkCollisions();
      expect(game.ufo).toBeNull();
      expect(game.bullets.length).toBe(0);
      expect(game.score).toBe(initialScore + 200);
    });

    it("ship-asteroid collision triggers death", () => {
      game.invincibleTimer = 0;
      game.asteroids = [
        {
          x: 400,
          y: 300,
          size: "large",
          points: 20,
          vx: 0,
          vy: 0,
          radius: 40,
          vertices: [],
        },
      ];
      game.ship.x = 400;
      game.ship.y = 300;
      const initialLives = game.lives;
      game.checkCollisions();
      expect(game.lives).toBe(initialLives - 1);
    });

    it("invincibility prevents ship-asteroid collision", () => {
      game.invincibleTimer = 1000;
      game.asteroids = [
        {
          x: 400,
          y: 300,
          size: "large",
          points: 20,
          vx: 0,
          vy: 0,
          radius: 40,
          vertices: [],
        },
      ];
      game.ship.x = 400;
      game.ship.y = 300;
      const initialLives = game.lives;
      game.checkCollisions();
      expect(game.lives).toBe(initialLives);
    });

    it("ship-UFO collision triggers death", () => {
      game.invincibleTimer = 0;
      game.ufo = { x: 400, y: 300, size: 25, points: 200 };
      game.ship.x = 400;
      game.ship.y = 300;
      const initialLives = game.lives;
      game.checkCollisions();
      expect(game.lives).toBe(initialLives - 1);
    });

    it("ship-UFO bullet collision triggers death", () => {
      game.invincibleTimer = 0;
      game.ufoBullets = [{ x: 400, y: 300, vx: 0, vy: 0, lifetime: 1000 }];
      game.ship.x = 400;
      game.ship.y = 300;
      const initialLives = game.lives;
      game.checkCollisions();
      expect(game.lives).toBe(initialLives - 1);
    });

    it("collision detection uses distance", () => {
      const a = { x: 0, y: 0 };
      const b = { x: 3, y: 4 };
      expect(game.distance(a, b)).toBe(5);
    });
  });

  describe("waves", () => {
    it("advances wave when all asteroids destroyed", () => {
      game.asteroids = [];
      game.checkWaveComplete();
      expect(game.wave).toBe(2);
    });

    it("spawns new asteroids after wave complete", () => {
      game.asteroids = [];
      game.checkWaveComplete();
      expect(game.asteroids.length).toBeGreaterThan(0);
    });

    it("wave 2 spawns 5 asteroids", () => {
      game.wave = 2;
      game.asteroids = [];
      game.spawnWave();
      expect(game.asteroids.length).toBe(5);
    });

    it("wave 10 spawns 10 asteroids (max)", () => {
      game.wave = 10;
      game.asteroids = [];
      game.spawnWave();
      expect(game.asteroids.length).toBe(10);
    });

    it("wave progression plays powerup sound", () => {
      game.asteroids = [];
      game.checkWaveComplete();
      expect(audio.play).toHaveBeenCalledWith("powerup");
    });
  });

  describe("UFO", () => {
    it("UFO spawns after timer", () => {
      game.ufo = null;
      game.ufoTimer = 0;
      game.updateUFO(game.ufoSpawnInterval);
      expect(game.ufo).not.toBeNull();
    });

    it("UFO does not spawn if one already exists", () => {
      game.ufo = {
        x: 100,
        y: 100,
        vx: 2,
        vy: 0,
        size: 25,
        directionTimer: 1000,
        fireTimer: 1000,
      };
      game.ufoTimer = 0;
      game.updateUFO(game.ufoSpawnInterval);
      expect(game.ufo.x).not.toBe(100); // UFO moved but wasn't respawned
    });

    it("UFO moves horizontally", () => {
      game.spawnUFO();
      const initialX = game.ufo.x;
      game.updateUFO(16);
      expect(game.ufo.x).not.toBe(initialX);
    });

    it("UFO fires bullets", () => {
      game.spawnUFO();
      game.ufo.fireTimer = 0;
      game.updateUFO(16);
      expect(game.ufoBullets.length).toBeGreaterThan(0);
    });

    it("small UFO aims at player", () => {
      game.ufo = {
        x: 100,
        y: 100,
        isSmall: true,
        size: 15,
      };
      game.ship.x = 200;
      game.ship.y = 100;
      game.ufoFire();
      // Bullet should be aimed right (positive vx)
      expect(game.ufoBullets[0].vx).toBeGreaterThan(0);
    });

    it("large UFO fires randomly", () => {
      game.ufo = {
        x: 100,
        y: 100,
        isSmall: false,
        size: 25,
      };
      game.ufoFire();
      // Just check that bullet was created
      expect(game.ufoBullets.length).toBe(1);
    });

    it("UFO despawns when off screen", () => {
      game.ufo = {
        x: canvas.width + 100,
        y: 100,
        vx: 1,
        vy: 0,
        size: 25,
        directionTimer: 1000,
        fireTimer: 1000,
      };
      game.updateUFO(16);
      expect(game.ufo).toBeNull();
    });

    it("UFO changes direction periodically", () => {
      game.spawnUFO();
      const initialVy = game.ufo.vy;
      game.ufo.directionTimer = 0;
      game.updateUFO(16);
      // vy should change (may be same by chance, but directionTimer should reset)
      expect(game.ufo.directionTimer).toBeGreaterThan(0);
    });
  });

  describe("lives and game over", () => {
    it("die reduces lives", () => {
      game.invincibleTimer = 0;
      const initialLives = game.lives;
      game.die();
      expect(game.lives).toBe(initialLives - 1);
    });

    it("die resets ship position", () => {
      game.ship.x = 100;
      game.ship.y = 100;
      game.die();
      expect(game.ship.x).toBe(canvas.width / 2);
      expect(game.ship.y).toBe(canvas.height / 2);
    });

    it("die resets ship velocity", () => {
      game.ship.vx = 5;
      game.ship.vy = 5;
      game.die();
      expect(game.ship.vx).toBe(0);
      expect(game.ship.vy).toBe(0);
    });

    it("die grants invincibility", () => {
      game.invincibleTimer = 0;
      game.die();
      expect(game.invincibleTimer).toBeGreaterThan(0);
    });

    it("die plays death sound", () => {
      game.die();
      expect(audio.play).toHaveBeenCalledWith("death");
    });

    it("game over when out of lives", () => {
      game.lives = 1;
      game.die();
      expect(game.state).toBe("gameover");
    });
  });

  describe("config", () => {
    it("has correct game id", () => {
      expect(Asteroids.config.id).toBe("asteroids");
    });

    it("has correct title", () => {
      expect(Asteroids.config.title).toBe("Asteroids");
    });

    it("has correct start lives", () => {
      expect(Asteroids.config.startLives).toBe(3);
    });

    it("has correct high score type", () => {
      expect(Asteroids.config.highScoreType).toBe("highest");
    });

    it("has all required controls", () => {
      const controls = Asteroids.config.controls;
      expect(controls).toHaveProperty("movement");
      expect(controls).toHaveProperty("action1");
      expect(controls).toHaveProperty("action2");
      expect(controls).toHaveProperty("pause");
    });
  });

  describe("render", () => {
    it("calls clear with background color", () => {
      const clearSpy = vi.spyOn(game, "clear");
      game.render(mockCtx);
      expect(clearSpy).toHaveBeenCalledWith("#0a0a0f");
    });

    it("draws all asteroids", () => {
      const drawAsteroidSpy = vi.spyOn(game, "drawAsteroid");
      game.render(mockCtx);
      expect(drawAsteroidSpy).toHaveBeenCalledTimes(game.asteroids.length);
    });

    it("draws ship", () => {
      const drawShipSpy = vi.spyOn(game, "drawShip");
      game.invincibleTimer = 0;
      game.render(mockCtx);
      expect(drawShipSpy).toHaveBeenCalled();
    });

    it("draws UFO when present", () => {
      const drawUFOSpy = vi.spyOn(game, "drawUFO");
      game.ufo = { x: 100, y: 100, size: 25 };
      game.render(mockCtx);
      expect(drawUFOSpy).toHaveBeenCalled();
    });

    it("does not draw UFO when absent", () => {
      const drawUFOSpy = vi.spyOn(game, "drawUFO");
      game.ufo = null;
      game.render(mockCtx);
      expect(drawUFOSpy).not.toHaveBeenCalled();
    });
  });

  describe("integration", () => {
    it("full game cycle: shoot asteroid, score increases", () => {
      game.asteroids = [
        {
          x: 100,
          y: 100,
          size: "small",
          points: 100,
          vx: 0,
          vy: 0,
          radius: 10,
          vertices: [],
        },
      ];
      game.bullets = [{ x: 100, y: 100, vx: 0, vy: 0, lifetime: 1000 }];
      const initialScore = game.score;
      game.checkCollisions();
      expect(game.score).toBe(initialScore + 100);
    });

    it("invincibility timer decreases over time", () => {
      game.invincibleTimer = 1000;
      game.update(100);
      expect(game.invincibleTimer).toBeLessThan(1000);
    });

    it("update calls all subsystems", () => {
      const handleInputSpy = vi.spyOn(game, "handleInput");
      const updateShipSpy = vi.spyOn(game, "updateShip");
      const updateBulletsSpy = vi.spyOn(game, "updateBullets");
      const updateAsteroidsSpy = vi.spyOn(game, "updateAsteroids");
      const updateUFOSpy = vi.spyOn(game, "updateUFO");
      const checkCollisionsSpy = vi.spyOn(game, "checkCollisions");
      const checkWaveCompleteSpy = vi.spyOn(game, "checkWaveComplete");

      game.update(16);

      expect(handleInputSpy).toHaveBeenCalled();
      expect(updateShipSpy).toHaveBeenCalled();
      expect(updateBulletsSpy).toHaveBeenCalled();
      expect(updateAsteroidsSpy).toHaveBeenCalled();
      expect(updateUFOSpy).toHaveBeenCalled();
      expect(checkCollisionsSpy).toHaveBeenCalled();
      expect(checkWaveCompleteSpy).toHaveBeenCalled();
    });

    it("complete wave progression: destroy all, new wave spawns", () => {
      // Start with one small asteroid
      game.asteroids = [
        {
          x: 100,
          y: 100,
          size: "small",
          points: 100,
          vx: 0,
          vy: 0,
          radius: 10,
          vertices: [],
        },
      ];
      expect(game.wave).toBe(1);

      // Destroy the last asteroid
      game.destroyAsteroid(0);
      expect(game.asteroids.length).toBe(0); // All destroyed

      // Check wave complete triggers new wave
      game.checkWaveComplete();
      expect(game.wave).toBe(2);
      expect(game.asteroids.length).toBe(5); // Wave 2 has 5 asteroids
    });
  });
});
