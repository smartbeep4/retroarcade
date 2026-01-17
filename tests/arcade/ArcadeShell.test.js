import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ArcadeShell } from "../../src/arcade/ArcadeShell.js";
import { InputManager } from "../../src/arcade/InputManager.js";
import { AudioManager } from "../../src/arcade/AudioManager.js";
import { CRTEffect } from "../../src/arcade/CRTEffect.js";
import { HighScoreManager } from "../../src/arcade/HighScoreManager.js";
import GameLoader from "../../src/arcade/GameLoader.js";

// Mock modules
vi.mock("../../src/arcade/InputManager.js", () => ({
  InputManager: {
    init: vi.fn(),
    update: vi.fn(),
    isJustPressed: vi.fn(() => false),
    isPressed: vi.fn(() => false),
    getMousePosition: vi.fn(() => null),
    isMouseJustClicked: vi.fn(() => false),
    isMouseDown: vi.fn(() => false),
    getTapPosition: vi.fn(() => null),
  },
}));

vi.mock("../../src/arcade/AudioManager.js", () => ({
  AudioManager: {
    init: vi.fn(),
    play: vi.fn(),
    playMusic: vi.fn(),
    stopMusic: vi.fn(),
    getMasterVolume: vi.fn(() => 1.0),
    setMasterVolume: vi.fn(),
    getSFXVolume: vi.fn(() => 1.0),
    setSFXVolume: vi.fn(),
    getMusicVolume: vi.fn(() => 0.5),
    setMusicVolume: vi.fn(),
  },
}));

vi.mock("../../src/arcade/CRTEffect.js", () => ({
  CRTEffect: {
    init: vi.fn(),
    isEnabled: vi.fn(() => true),
    enable: vi.fn(),
    disable: vi.fn(),
    getSettings: vi.fn(() => ({ scanlines: 0.5 })),
    setScanlineIntensity: vi.fn(),
  },
}));

vi.mock("../../src/arcade/HighScoreManager.js", () => ({
  HighScoreManager: {
    init: vi.fn(),
    getScores: vi.fn(() => []),
    addScore: vi.fn(),
    isHighScore: vi.fn(() => false),
    incrementGamesPlayed: vi.fn(),
  },
}));

vi.mock("../../src/arcade/GameLoader.js", () => ({
  default: {
    loadGame: vi.fn(),
    setCurrentGame: vi.fn(),
    unloadGame: vi.fn(),
  },
}));

vi.mock("../../src/arcade/TouchControls.js", () => ({
  TouchControls: {
    init: vi.fn(),
    configureForGame: vi.fn(),
    hide: vi.fn(),
  },
}));

describe("ArcadeShell", () => {
  let canvas;
  let shell;
  let mockContext;

  beforeEach(() => {
    // Create mock canvas
    canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;

    mockContext = {
      canvas: canvas,
      imageSmoothingEnabled: true,
      fillStyle: "",
      strokeStyle: "",
      font: "",
      textAlign: "",
      lineWidth: 1,
      shadowColor: "",
      shadowBlur: 0,
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      getContext: vi.fn(() => mockContext),
    };
    canvas.getContext = vi.fn(() => mockContext);

    // Reset all mocks
    vi.clearAllMocks();

    // Create shell instance
    shell = new ArcadeShell(canvas);
  });

  afterEach(() => {
    if (shell && shell.animationId) {
      cancelAnimationFrame(shell.animationId);
    }
  });

  describe("Construction", () => {
    it("should create an instance", () => {
      expect(shell).toBeDefined();
      expect(shell.canvas).toBe(canvas);
      expect(shell.ctx).toBe(mockContext);
    });

    it("should initialize with menu state", () => {
      expect(shell.getState()).toBe("menu");
    });

    it("should have all sub-screens initialized", () => {
      expect(shell.mainMenu).toBeDefined();
      expect(shell.hud).toBeDefined();
      expect(shell.pauseMenu).toBeDefined();
      expect(shell.gameOverScreen).toBeDefined();
      expect(shell.settingsScreen).toBeDefined();
    });

    it("should not be initialized before init() is called", () => {
      expect(shell.isInitialized).toBe(false);
    });
  });

  describe("Initialization", () => {
    it("should initialize properly", async () => {
      await shell.init();

      expect(shell.isInitialized).toBe(true);
      expect(canvas.width).toBe(800);
      expect(canvas.height).toBe(600);
      expect(mockContext.imageSmoothingEnabled).toBe(false);
    });

    it("should initialize all managers", async () => {
      await shell.init();

      expect(InputManager.init).toHaveBeenCalled();
      expect(AudioManager.init).toHaveBeenCalled();
      expect(HighScoreManager.init).toHaveBeenCalled();
    });

    it("should initialize CRT effect if parent element exists", async () => {
      const parent = document.createElement("div");
      parent.appendChild(canvas);

      await shell.init();

      expect(CRTEffect.init).toHaveBeenCalledWith(parent);
    });

    it("should not crash if parent element does not exist", async () => {
      await expect(shell.init()).resolves.not.toThrow();
    });
  });

  describe("State Management", () => {
    it("should return current state", () => {
      expect(shell.getState()).toBe("menu");
    });

    it("should transition to playing state when loading game", async () => {
      // Mock game class
      const MockGame = vi.fn().mockImplementation(() => ({
        init: vi.fn().mockResolvedValue(undefined),
        start: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
        destroy: vi.fn(),
        reset: vi.fn(),
        onGameOver: vi.fn(),
        score: 0,
        lives: 3,
        level: 1,
        constructor: {
          config: { id: "test-game" },
        },
      }));

      GameLoader.loadGame.mockResolvedValue(MockGame);

      await shell.init();
      await shell.loadGame("test-game");

      expect(shell.getState()).toBe("playing");
      expect(shell.currentGameId).toBe("test-game");
      expect(AudioManager.play).toHaveBeenCalledWith("game-start");
    });

    it("should transition to paused state", async () => {
      const mockGame = {
        pause: vi.fn(),
        resume: vi.fn(),
        destroy: vi.fn(),
      };

      shell.currentGame = mockGame;
      shell.state = "playing";

      shell.pauseGame();

      expect(shell.getState()).toBe("paused");
      expect(mockGame.pause).toHaveBeenCalled();
    });

    it("should transition to gameover state", () => {
      shell.currentGameId = "test-game";
      shell.handleGameOver(1000);

      expect(shell.getState()).toBe("gameover");
      expect(HighScoreManager.incrementGamesPlayed).toHaveBeenCalledWith(
        "test-game",
      );
    });

    it("should transition to settings state", () => {
      shell.state = "menu";
      shell.showSettings();

      expect(shell.getState()).toBe("settings");
      expect(shell.previousState).toBe("menu");
    });
  });

  describe("Game Loading", () => {
    it("should load game successfully", async () => {
      const MockGame = vi.fn().mockImplementation(() => ({
        init: vi.fn().mockResolvedValue(undefined),
        start: vi.fn(),
        onGameOver: vi.fn(),
        destroy: vi.fn(),
        score: 0,
        lives: 3,
        level: 1,
        constructor: {
          config: { id: "snake" },
        },
      }));

      GameLoader.loadGame.mockResolvedValue(MockGame);

      await shell.init();
      await shell.loadGame("snake");

      expect(GameLoader.loadGame).toHaveBeenCalledWith("snake");
      expect(shell.currentGame).toBeDefined();
      expect(shell.currentGameId).toBe("snake");
      expect(shell.getState()).toBe("playing");
    });

    it("should handle game loading errors", async () => {
      GameLoader.loadGame.mockRejectedValue(new Error("Game not found"));

      await shell.init();
      await shell.loadGame("invalid-game");

      expect(shell.getState()).toBe("menu");
      expect(shell.currentGame).toBeNull();
    });

    it("should unload game when returning to menu", async () => {
      const mockGame = {
        destroy: vi.fn(),
      };

      shell.currentGame = mockGame;
      shell.currentGameId = "test-game";

      shell.showMainMenu();

      expect(mockGame.destroy).toHaveBeenCalled();
      expect(shell.currentGame).toBeNull();
      expect(shell.currentGameId).toBeNull();
      expect(shell.getState()).toBe("menu");
    });
  });

  describe("Pause/Resume", () => {
    it("should pause game when in playing state", () => {
      const mockGame = {
        pause: vi.fn(),
        resume: vi.fn(),
      };

      shell.currentGame = mockGame;
      shell.state = "playing";

      shell.pauseGame();

      expect(shell.getState()).toBe("paused");
      expect(mockGame.pause).toHaveBeenCalled();
    });

    it("should resume game when in paused state", () => {
      const mockGame = {
        pause: vi.fn(),
        resume: vi.fn(),
      };

      shell.currentGame = mockGame;
      shell.state = "paused";

      shell.resumeGame();

      expect(shell.getState()).toBe("playing");
      expect(mockGame.resume).toHaveBeenCalled();
    });

    it("should not pause if not in playing state", () => {
      const mockGame = {
        pause: vi.fn(),
      };

      shell.currentGame = mockGame;
      shell.state = "menu";

      shell.pauseGame();

      expect(shell.getState()).toBe("menu");
      expect(mockGame.pause).not.toHaveBeenCalled();
    });

    it("should not resume if not in paused state", () => {
      const mockGame = {
        resume: vi.fn(),
      };

      shell.currentGame = mockGame;
      shell.state = "menu";

      shell.resumeGame();

      expect(shell.getState()).toBe("menu");
      expect(mockGame.resume).not.toHaveBeenCalled();
    });
  });

  describe("Restart Game", () => {
    it("should restart current game", async () => {
      const mockGame = {
        reset: vi.fn(),
        init: vi.fn().mockResolvedValue(undefined),
        start: vi.fn(),
      };

      shell.currentGame = mockGame;
      shell.state = "paused";

      shell.restartGame();

      // Wait for promise chain to resolve
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockGame.reset).toHaveBeenCalled();
      expect(mockGame.init).toHaveBeenCalled();
      expect(mockGame.start).toHaveBeenCalled();
      expect(shell.getState()).toBe("playing");
    });
  });

  describe("Navigation", () => {
    it("should quit to menu from pause state", () => {
      const mockGame = {
        destroy: vi.fn(),
      };

      shell.currentGame = mockGame;
      shell.state = "paused";

      shell.quitToMenu();

      expect(mockGame.destroy).toHaveBeenCalled();
      expect(shell.getState()).toBe("menu");
    });

    it("should go back from settings to previous state", () => {
      shell.state = "menu";
      shell.showSettings();

      expect(shell.getState()).toBe("settings");

      shell.goBack();

      expect(shell.getState()).toBe("menu");
    });

    it("should default to menu if no previous state", () => {
      shell.state = "settings";
      shell.previousState = null;

      shell.goBack();

      expect(shell.getState()).toBe("menu");
    });
  });

  describe("Rendering", () => {
    it("should render main menu in menu state", async () => {
      await shell.init();
      shell.state = "menu";

      // Trigger one render
      shell.render();

      expect(mockContext.fillRect).toHaveBeenCalled();
      expect(mockContext.fillText).toHaveBeenCalled();
    });

    it("should render HUD in playing state", async () => {
      const mockGame = {
        score: 100,
        lives: 3,
        level: 1,
        constructor: {
          config: { id: "test-game" },
        },
      };

      await shell.init();
      shell.currentGame = mockGame;
      shell.state = "playing";

      shell.render();

      expect(mockContext.fillRect).toHaveBeenCalled();
      expect(mockContext.fillText).toHaveBeenCalled();
    });

    it("should render pause menu in paused state", async () => {
      await shell.init();
      shell.state = "paused";

      shell.render();

      expect(mockContext.fillRect).toHaveBeenCalled();
      expect(mockContext.fillText).toHaveBeenCalled();
    });

    it("should render game over screen in gameover state", async () => {
      await shell.init();
      shell.state = "gameover";

      shell.render();

      expect(mockContext.fillRect).toHaveBeenCalled();
      expect(mockContext.fillText).toHaveBeenCalled();
    });

    it("should render settings screen in settings state", async () => {
      await shell.init();
      shell.state = "settings";

      shell.render();

      expect(mockContext.fillRect).toHaveBeenCalled();
      expect(mockContext.fillText).toHaveBeenCalled();
    });
  });

  describe("Input Handling", () => {
    it("should handle input in menu state", async () => {
      await shell.init();
      shell.state = "menu";

      shell.update();

      expect(InputManager.update).toHaveBeenCalled();
    });

    it("should pause game when ESC is pressed during gameplay", async () => {
      const mockGame = {
        pause: vi.fn(),
      };

      InputManager.isJustPressed.mockImplementation((key) => key === "pause");

      await shell.init();
      shell.currentGame = mockGame;
      shell.state = "playing";

      shell.update();

      expect(shell.getState()).toBe("paused");
    });
  });

  describe("Cleanup", () => {
    it("should clean up resources on destroy", () => {
      const mockGame = {
        destroy: vi.fn(),
      };

      shell.currentGame = mockGame;
      shell.animationId = 123;

      shell.destroy();

      expect(mockGame.destroy).toHaveBeenCalled();
      expect(shell.currentGame).toBeNull();
      expect(shell.isInitialized).toBe(false);
    });

    it("should unload game properly", () => {
      const mockGame = {
        destroy: vi.fn(),
      };

      shell.currentGame = mockGame;
      shell.currentGameId = "test-game";

      shell.unloadGame();

      expect(mockGame.destroy).toHaveBeenCalled();
      expect(GameLoader.unloadGame).toHaveBeenCalled();
      expect(shell.currentGame).toBeNull();
      expect(shell.currentGameId).toBeNull();
    });
  });

  describe("Game API", () => {
    it("should return current game", () => {
      const mockGame = { id: "test" };
      shell.currentGame = mockGame;

      expect(shell.getCurrentGame()).toBe(mockGame);
    });

    it("should return null if no game loaded", () => {
      shell.currentGame = null;

      expect(shell.getCurrentGame()).toBeNull();
    });
  });

  describe("Game Over Flow", () => {
    it("should show high score entry for high scores", () => {
      HighScoreManager.isHighScore.mockReturnValue(true);

      shell.currentGameId = "test-game";
      shell.handleGameOver(5000);

      expect(shell.getState()).toBe("gameover");
      expect(shell.gameOverScreen.isHighScore).toBe(true);
      expect(shell.gameOverScreen.nameEntry).toBeDefined();
    });

    it("should not show high score entry for low scores", () => {
      HighScoreManager.isHighScore.mockReturnValue(false);

      shell.currentGameId = "test-game";
      shell.handleGameOver(100);

      expect(shell.getState()).toBe("gameover");
      expect(shell.gameOverScreen.isHighScore).toBe(false);
      expect(shell.gameOverScreen.nameEntry).toBeNull();
    });
  });

  describe("Main Menu", () => {
    it("should have all 10 games listed", () => {
      expect(shell.mainMenu.games).toHaveLength(10);
      expect(shell.mainMenu.games).toContain("snake");
      expect(shell.mainMenu.games).toContain("pong");
      expect(shell.mainMenu.games).toContain("breakout");
      expect(shell.mainMenu.games).toContain("flappy");
      expect(shell.mainMenu.games).toContain("space-invaders");
      expect(shell.mainMenu.games).toContain("frogger");
      expect(shell.mainMenu.games).toContain("tetris");
      expect(shell.mainMenu.games).toContain("asteroids");
      expect(shell.mainMenu.games).toContain("pacman");
      expect(shell.mainMenu.games).toContain("roguelike");
    });

    it("should start at first game selection", () => {
      expect(shell.mainMenu.selectedIndex).toBe(0);
    });
  });

  describe("Pause Menu", () => {
    it("should have all pause options", () => {
      expect(shell.pauseMenu.options).toEqual([
        "RESUME",
        "RESTART",
        "SETTINGS",
        "QUIT",
      ]);
    });

    it("should start at first option", () => {
      expect(shell.pauseMenu.selectedIndex).toBe(0);
    });
  });

  describe("Settings Screen", () => {
    it("should have all settings options", () => {
      expect(shell.settingsScreen.options).toHaveLength(6);
      expect(shell.settingsScreen.options[0].label).toBe("MASTER VOLUME");
      expect(shell.settingsScreen.options[1].label).toBe("SFX VOLUME");
      expect(shell.settingsScreen.options[2].label).toBe("MUSIC VOLUME");
      expect(shell.settingsScreen.options[3].label).toBe("CRT EFFECT");
      expect(shell.settingsScreen.options[4].label).toBe("SCANLINES");
      expect(shell.settingsScreen.options[5].label).toBe("BACK");
    });

    it("should have correct option types", () => {
      expect(shell.settingsScreen.options[0].type).toBe("slider");
      expect(shell.settingsScreen.options[1].type).toBe("slider");
      expect(shell.settingsScreen.options[2].type).toBe("slider");
      expect(shell.settingsScreen.options[3].type).toBe("toggle");
      expect(shell.settingsScreen.options[4].type).toBe("slider");
      expect(shell.settingsScreen.options[5].type).toBe("button");
    });
  });
});
