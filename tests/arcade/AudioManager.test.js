import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AudioManager } from "../../src/arcade/AudioManager.js";

describe("AudioManager", () => {
  let mockAudioContext;
  let mockGainNode;
  let mockSourceNode;
  let mockDestination;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Create mock gain node
    mockGainNode = {
      gain: { value: 1 },
      connect: vi.fn(),
    };

    // Create mock source node
    mockSourceNode = {
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      buffer: null,
      loop: false,
      playbackRate: { value: 1 },
    };

    // Create mock destination
    mockDestination = {};

    // Create mock AudioContext
    mockAudioContext = {
      state: "running",
      currentTime: 0,
      destination: mockDestination,
      createGain: vi.fn(() => ({ ...mockGainNode })),
      createBufferSource: vi.fn(() => ({ ...mockSourceNode })),
      resume: vi.fn(() => Promise.resolve()),
      close: vi.fn(() => Promise.resolve()),
      decodeAudioData: vi.fn(() => Promise.resolve({ duration: 1.0 })),
    };

    // Mock global AudioContext
    global.AudioContext = vi.fn(() => mockAudioContext);
    global.webkitAudioContext = vi.fn(() => mockAudioContext);

    // Mock fetch for sound loading
    global.fetch = vi.fn(() =>
      Promise.resolve({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      }),
    );

    // Mock document event listeners
    global.document = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    // Initialize AudioManager
    AudioManager.init();
  });

  afterEach(() => {
    AudioManager.destroy();
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("initializes AudioContext on init", () => {
      expect(global.AudioContext).toHaveBeenCalled();
    });

    it("creates gain nodes for master, sfx, and music", () => {
      expect(mockAudioContext.createGain).toHaveBeenCalledTimes(3);
    });

    it("does not reinitialize if already initialized", () => {
      const callCount = global.AudioContext.mock.calls.length;
      AudioManager.init();
      expect(global.AudioContext.mock.calls.length).toBe(callCount);
    });

    it("sets up unlock event listeners", () => {
      expect(document.addEventListener).toHaveBeenCalledWith(
        "click",
        expect.any(Function),
        { once: true },
      );
      expect(document.addEventListener).toHaveBeenCalledWith(
        "touchstart",
        expect.any(Function),
        { once: true },
      );
      expect(document.addEventListener).toHaveBeenCalledWith(
        "keydown",
        expect.any(Function),
        { once: true },
      );
    });
  });

  describe("isReady", () => {
    it("returns true when context is running and unlocked", () => {
      expect(AudioManager.isReady()).toBe(true);
    });

    it("returns false when context is suspended", () => {
      mockAudioContext.state = "suspended";
      expect(AudioManager.isReady()).toBe(false);
    });
  });

  describe("unlock", () => {
    it("resumes suspended AudioContext", async () => {
      // Destroy and reinitialize with suspended state
      AudioManager.destroy();
      mockAudioContext.state = "suspended";
      mockAudioContext.resume = vi.fn(() => Promise.resolve());
      AudioManager.init();

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(mockAudioContext.resume).toHaveBeenCalled();
    });

    it("does nothing if already unlocked", () => {
      const resumeCalls = mockAudioContext.resume.mock.calls.length;
      AudioManager.unlock();
      expect(mockAudioContext.resume.mock.calls.length).toBe(resumeCalls);
    });
  });

  describe("volume controls", () => {
    describe("master volume", () => {
      it("sets and gets master volume", () => {
        AudioManager.setMasterVolume(0.5);
        expect(AudioManager.getMasterVolume()).toBe(0.5);
      });

      it("clamps volume to 0-1 range", () => {
        AudioManager.setMasterVolume(1.5);
        expect(AudioManager.getMasterVolume()).toBe(1);

        AudioManager.setMasterVolume(-0.5);
        expect(AudioManager.getMasterVolume()).toBe(0);
      });

      it("saves to localStorage", () => {
        AudioManager.setMasterVolume(0.7);
        const saved = JSON.parse(localStorage.getItem("retroarcade-audio"));
        expect(saved.master).toBe(0.7);
      });
    });

    describe("SFX volume", () => {
      it("sets and gets SFX volume", () => {
        AudioManager.setSFXVolume(0.6);
        expect(AudioManager.getSFXVolume()).toBe(0.6);
      });

      it("clamps volume to 0-1 range", () => {
        AudioManager.setSFXVolume(2.0);
        expect(AudioManager.getSFXVolume()).toBe(1);

        AudioManager.setSFXVolume(-1.0);
        expect(AudioManager.getSFXVolume()).toBe(0);
      });

      it("saves to localStorage", () => {
        AudioManager.setSFXVolume(0.8);
        const saved = JSON.parse(localStorage.getItem("retroarcade-audio"));
        expect(saved.sfx).toBe(0.8);
      });
    });

    describe("music volume", () => {
      it("sets and gets music volume", () => {
        AudioManager.setMusicVolume(0.4);
        expect(AudioManager.getMusicVolume()).toBe(0.4);
      });

      it("clamps volume to 0-1 range", () => {
        AudioManager.setMusicVolume(1.8);
        expect(AudioManager.getMusicVolume()).toBe(1);

        AudioManager.setMusicVolume(-0.3);
        expect(AudioManager.getMusicVolume()).toBe(0);
      });

      it("saves to localStorage", () => {
        AudioManager.setMusicVolume(0.3);
        const saved = JSON.parse(localStorage.getItem("retroarcade-audio"));
        expect(saved.music).toBe(0.3);
      });
    });
  });

  describe("mute functionality", () => {
    it("mutes audio", () => {
      AudioManager.mute();
      expect(AudioManager.isMuted()).toBe(true);
    });

    it("unmutes audio", () => {
      AudioManager.mute();
      AudioManager.unmute();
      expect(AudioManager.isMuted()).toBe(false);
    });

    it("toggles mute state", () => {
      const initial = AudioManager.isMuted();
      AudioManager.toggleMute();
      expect(AudioManager.isMuted()).toBe(!initial);

      AudioManager.toggleMute();
      expect(AudioManager.isMuted()).toBe(initial);
    });

    it("saves mute state to localStorage", () => {
      AudioManager.mute();
      const saved = JSON.parse(localStorage.getItem("retroarcade-audio"));
      expect(saved.muted).toBe(true);

      AudioManager.unmute();
      const savedAfterUnmute = JSON.parse(
        localStorage.getItem("retroarcade-audio"),
      );
      expect(savedAfterUnmute.muted).toBe(false);
    });
  });

  describe("persistence", () => {
    it("saves all volume settings to localStorage", () => {
      AudioManager.setMasterVolume(0.8);
      AudioManager.setSFXVolume(0.6);
      AudioManager.setMusicVolume(0.4);
      AudioManager.mute();

      const saved = JSON.parse(localStorage.getItem("retroarcade-audio"));
      expect(saved.master).toBe(0.8);
      expect(saved.sfx).toBe(0.6);
      expect(saved.music).toBe(0.4);
      expect(saved.muted).toBe(true);
    });

    it("loads volume settings from localStorage on init", () => {
      // Set some values
      localStorage.setItem(
        "retroarcade-audio",
        JSON.stringify({
          master: 0.7,
          sfx: 0.5,
          music: 0.3,
          muted: true,
        }),
      );

      // Destroy and reinitialize
      AudioManager.destroy();
      AudioManager.init();

      // Check loaded values
      expect(AudioManager.getMasterVolume()).toBe(0.7);
      expect(AudioManager.getSFXVolume()).toBe(0.5);
      expect(AudioManager.getMusicVolume()).toBe(0.3);
      expect(AudioManager.isMuted()).toBe(true);
    });

    it("handles invalid localStorage data gracefully", () => {
      localStorage.setItem("retroarcade-audio", "invalid json");

      AudioManager.destroy();
      AudioManager.init();

      // Should use defaults
      expect(AudioManager.getMasterVolume()).toBe(1.0);
      expect(AudioManager.getSFXVolume()).toBe(1.0);
      expect(AudioManager.getMusicVolume()).toBe(0.5);
    });

    it("handles missing localStorage gracefully", () => {
      // Mock localStorage to throw error
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error("localStorage not available");
      });

      AudioManager.setMasterVolume(0.5);

      // Should not throw error
      expect(AudioManager.getMasterVolume()).toBe(0.5);

      // Restore
      Storage.prototype.setItem = originalSetItem;
    });
  });

  describe("sound playback", () => {
    it("plays a sound effect", async () => {
      AudioManager.play("score");
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(fetch).toHaveBeenCalledWith("/assets/sounds/score.wav");
      expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
    });

    it("plays a sound with playOneShot", async () => {
      AudioManager.playOneShot("hit");
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(fetch).toHaveBeenCalledWith("/assets/sounds/hit.wav");
    });

    it("does not play when not ready", () => {
      mockAudioContext.state = "suspended";
      AudioManager.play("score");

      expect(mockAudioContext.createBufferSource).not.toHaveBeenCalled();
    });

    it("handles unknown sound ID gracefully", () => {
      const consoleWarn = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});
      AudioManager.play("unknown-sound");

      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining("Unknown sound"),
      );
      consoleWarn.mockRestore();
    });

    it("handles sound loading errors gracefully", async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error("Network error")));
      const consoleWarn = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      AudioManager.play("score");
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(consoleWarn).toHaveBeenCalled();
      consoleWarn.mockRestore();
    });

    it("caches loaded sound buffers", async () => {
      AudioManager.play("score");
      await new Promise((resolve) => setTimeout(resolve, 10));

      AudioManager.play("score");
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should only fetch once
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("music playback", () => {
    it("plays a music track", async () => {
      AudioManager.playMusic("music-menu");
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(fetch).toHaveBeenCalledWith("/assets/sounds/music-menu.mp3");
      expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
    });

    it("loops music by default", async () => {
      const source = { ...mockSourceNode };
      mockAudioContext.createBufferSource = vi.fn(() => source);

      AudioManager.playMusic("music-menu");
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(source.loop).toBe(true);
    });

    it("stops previous music when playing new track", async () => {
      const firstSource = { ...mockSourceNode };
      const secondSource = { ...mockSourceNode };

      let callCount = 0;
      mockAudioContext.createBufferSource = vi.fn(() => {
        callCount++;
        return callCount === 1 ? firstSource : secondSource;
      });

      AudioManager.playMusic("music-menu");
      await new Promise((resolve) => setTimeout(resolve, 10));

      AudioManager.playMusic("music-game");
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(firstSource.stop).toHaveBeenCalled();
    });

    it("stops music", async () => {
      const source = { ...mockSourceNode };
      mockAudioContext.createBufferSource = vi.fn(() => source);

      AudioManager.playMusic("music-menu");
      await new Promise((resolve) => setTimeout(resolve, 10));

      AudioManager.stopMusic();

      expect(source.stop).toHaveBeenCalled();
    });

    it("pauses music", async () => {
      const source = { ...mockSourceNode };
      mockAudioContext.createBufferSource = vi.fn(() => source);

      AudioManager.playMusic("music-menu");
      await new Promise((resolve) => setTimeout(resolve, 10));

      AudioManager.pauseMusic();

      expect(source.stop).toHaveBeenCalled();
    });

    it("resumes paused music", async () => {
      AudioManager.playMusic("music-menu");
      await new Promise((resolve) => setTimeout(resolve, 10));

      AudioManager.pauseMusic();
      await new Promise((resolve) => setTimeout(resolve, 10));

      const createCalls = mockAudioContext.createBufferSource.mock.calls.length;

      AudioManager.resumeMusic();
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should create a new source when resuming
      expect(
        mockAudioContext.createBufferSource.mock.calls.length,
      ).toBeGreaterThan(createCalls);
    });

    it("sets music track without playing", async () => {
      AudioManager.setMusicTrack("music-game");
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should fetch to preload
      expect(fetch).toHaveBeenCalledWith("/assets/sounds/music-game.mp3");

      // Should not start playback
      expect(mockSourceNode.start).not.toHaveBeenCalled();
    });

    it("handles unknown music track gracefully", () => {
      const consoleWarn = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});
      AudioManager.playMusic("unknown-track");

      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining("Unknown music track"),
      );
      consoleWarn.mockRestore();
    });

    it("does not play music when not ready", () => {
      mockAudioContext.state = "suspended";
      AudioManager.playMusic("music-menu");

      expect(mockAudioContext.createBufferSource).not.toHaveBeenCalled();
    });
  });

  describe("sound pooling", () => {
    it("allows overlapping sound plays", async () => {
      AudioManager.play("hit");
      AudioManager.play("hit");
      AudioManager.play("hit");

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should create multiple sources
      expect(mockAudioContext.createBufferSource).toHaveBeenCalledTimes(3);
    });

    it("reuses cached buffer for overlapping sounds", async () => {
      AudioManager.play("hit");
      await new Promise((resolve) => setTimeout(resolve, 10));

      AudioManager.play("hit");
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should only fetch once
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("destroy", () => {
    it("stops music on destroy", async () => {
      const source = { ...mockSourceNode };
      mockAudioContext.createBufferSource = vi.fn(() => source);

      AudioManager.playMusic("music-menu");
      await new Promise((resolve) => setTimeout(resolve, 10));

      AudioManager.destroy();

      expect(source.stop).toHaveBeenCalled();
    });

    it("closes AudioContext on destroy", () => {
      AudioManager.destroy();
      expect(mockAudioContext.close).toHaveBeenCalled();
    });

    it("allows reinitialization after destroy", () => {
      AudioManager.destroy();
      AudioManager.init();

      expect(AudioManager.isReady()).toBe(true);
    });
  });

  describe("graceful fallbacks", () => {
    it("handles AudioContext creation failure", () => {
      global.AudioContext = vi.fn(() => {
        throw new Error("AudioContext not supported");
      });
      global.webkitAudioContext = undefined;

      const consoleWarn = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      AudioManager.destroy();
      AudioManager.init();

      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining("Web Audio API not supported"),
        expect.any(Error),
      );
      consoleWarn.mockRestore();
    });

    it("handles play calls when audio is not available", () => {
      AudioManager.destroy();
      global.AudioContext = vi.fn(() => {
        throw new Error("AudioContext not supported");
      });
      global.webkitAudioContext = undefined;
      AudioManager.init();

      // Should not throw
      expect(() => AudioManager.play("score")).not.toThrow();
    });
  });
});
