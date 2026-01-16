import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { InputManager } from "../../src/arcade/InputManager.js";

describe("InputManager - Integration Tests", () => {
  beforeEach(() => {
    InputManager.destroy();
    InputManager.init();
  });

  afterEach(() => {
    InputManager.destroy();
  });

  it("works with real DOM KeyboardEvent", () => {
    // Simulate real keyboard event
    const event = new KeyboardEvent("keydown", {
      key: "ArrowUp",
      bubbles: true,
      cancelable: true,
    });

    window.dispatchEvent(event);
    InputManager.update();

    expect(InputManager.isPressed(InputManager.UP)).toBe(true);
    expect(InputManager.getDirection().y).toBe(-1);
  });

  it("module is importable and has correct exports", () => {
    // Verify all required exports exist
    expect(InputManager).toBeDefined();
    expect(InputManager.UP).toBe("up");
    expect(InputManager.DOWN).toBe("down");
    expect(InputManager.LEFT).toBe("left");
    expect(InputManager.RIGHT).toBe("right");
    expect(InputManager.ACTION_1).toBe("action1");
    expect(InputManager.ACTION_2).toBe("action2");
    expect(InputManager.PAUSE).toBe("pause");
    expect(InputManager.START).toBe("start");

    expect(typeof InputManager.init).toBe("function");
    expect(typeof InputManager.update).toBe("function");
    expect(typeof InputManager.isPressed).toBe("function");
    expect(typeof InputManager.isJustPressed).toBe("function");
    expect(typeof InputManager.isJustReleased).toBe("function");
    expect(typeof InputManager.getDirection).toBe("function");
    expect(typeof InputManager.getDirectionVector).toBe("function");
    expect(typeof InputManager.getTouchPosition).toBe("function");
    expect(typeof InputManager.onSwipe).toBe("function");
    expect(typeof InputManager.onTap).toBe("function");
    expect(typeof InputManager.isGamepadConnected).toBe("function");
    expect(typeof InputManager.pollGamepad).toBe("function");
    expect(typeof InputManager.destroy).toBe("function");
  });

  it("can be used in a game loop simulation", () => {
    const frames = [];

    // Frame 1: Start moving up
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "w" }));
    InputManager.update();
    frames.push({
      up: InputManager.isPressed(InputManager.UP),
      justPressed: InputManager.isJustPressed(InputManager.UP),
      direction: InputManager.getDirection(),
    });

    // Frame 2: Continue moving up, press action
    window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
    InputManager.update();
    frames.push({
      up: InputManager.isPressed(InputManager.UP),
      justPressed: InputManager.isJustPressed(InputManager.UP),
      action: InputManager.isJustPressed(InputManager.ACTION_1),
      direction: InputManager.getDirection(),
    });

    // Frame 3: Release everything
    window.dispatchEvent(new KeyboardEvent("keyup", { key: "w" }));
    window.dispatchEvent(new KeyboardEvent("keyup", { key: " " }));
    InputManager.update();
    frames.push({
      up: InputManager.isPressed(InputManager.UP),
      upReleased: InputManager.isJustReleased(InputManager.UP),
      direction: InputManager.getDirection(),
    });

    // Verify frame sequence
    expect(frames[0].up).toBe(true);
    expect(frames[0].justPressed).toBe(true);
    expect(frames[0].direction.y).toBe(-1);

    expect(frames[1].up).toBe(true);
    expect(frames[1].justPressed).toBe(false); // Not just pressed anymore
    expect(frames[1].action).toBe(true);
    expect(frames[1].direction.y).toBe(-1);

    expect(frames[2].up).toBe(false);
    expect(frames[2].upReleased).toBe(true);
    expect(frames[2].direction.y).toBe(0);
  });

  it("supports all keyboard mappings correctly", () => {
    const testMappings = [
      { key: "ArrowUp", expected: InputManager.UP },
      { key: "w", expected: InputManager.UP },
      { key: "W", expected: InputManager.UP },
      { key: "ArrowDown", expected: InputManager.DOWN },
      { key: "s", expected: InputManager.DOWN },
      { key: "S", expected: InputManager.DOWN },
      { key: "ArrowLeft", expected: InputManager.LEFT },
      { key: "a", expected: InputManager.LEFT },
      { key: "A", expected: InputManager.LEFT },
      { key: "ArrowRight", expected: InputManager.RIGHT },
      { key: "d", expected: InputManager.RIGHT },
      { key: "D", expected: InputManager.RIGHT },
      { key: " ", expected: InputManager.ACTION_1 },
      { key: "Enter", expected: InputManager.ACTION_1 },
      { key: "z", expected: InputManager.ACTION_1 },
      { key: "Z", expected: InputManager.ACTION_1 },
      { key: "Shift", expected: InputManager.ACTION_2 },
      { key: "x", expected: InputManager.ACTION_2 },
      { key: "X", expected: InputManager.ACTION_2 },
      { key: "Escape", expected: InputManager.PAUSE },
      { key: "p", expected: InputManager.PAUSE },
      { key: "P", expected: InputManager.PAUSE },
    ];

    for (const { key, expected } of testMappings) {
      InputManager.destroy();
      InputManager.init();

      window.dispatchEvent(new KeyboardEvent("keydown", { key }));
      InputManager.update();

      expect(InputManager.isPressed(expected)).toBe(true);
    }
  });

  it("provides normalized direction vectors for diagonal movement", () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    InputManager.update();

    const vec = InputManager.getDirectionVector();
    const length = Math.sqrt(vec.x * vec.x + vec.y * vec.y);

    // Should be normalized to length 1
    expect(length).toBeCloseTo(1, 5);
    expect(vec.x).toBeCloseTo(Math.sqrt(2) / 2, 5);
    expect(vec.y).toBeCloseTo(-Math.sqrt(2) / 2, 5);
  });
});
