import { Page, Locator } from "@playwright/test";

/**
 * CanvasInspector - Utilities for inspecting canvas pixel data
 */
export class CanvasInspector {
  private page: Page;
  private canvas: Locator;

  constructor(page: Page) {
    this.page = page;
    this.canvas = page.locator("#game-canvas");
  }

  /**
   * Get the pixel color at a specific coordinate
   */
  async getPixelColor(
    x: number,
    y: number,
  ): Promise<{ r: number; g: number; b: number; a: number }> {
    return await this.page.evaluate(
      ([px, py]) => {
        const testBridge = (window as any).__ARCADE_TEST__;
        if (testBridge) {
          return testBridge.getPixelColor(px, py);
        }
        // Fallback: get directly from canvas
        const canvas = document.getElementById(
          "game-canvas",
        ) as HTMLCanvasElement;
        if (!canvas) return { r: 0, g: 0, b: 0, a: 0 };
        const ctx = canvas.getContext("2d");
        if (!ctx) return { r: 0, g: 0, b: 0, a: 0 };
        const imageData = ctx.getImageData(px, py, 1, 1);
        return {
          r: imageData.data[0],
          g: imageData.data[1],
          b: imageData.data[2],
          a: imageData.data[3],
        };
      },
      [x, y],
    );
  }

  /**
   * Get the pixel color as a hex string
   */
  async getPixelColorHex(x: number, y: number): Promise<string> {
    const color = await this.getPixelColor(x, y);
    const toHex = (n: number) => n.toString(16).padStart(2, "0");
    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
  }

  /**
   * Find all occurrences of a color in a region
   */
  async findColorInRegion(
    color: string | { r: number; g: number; b: number },
    x: number,
    y: number,
    width: number,
    height: number,
    tolerance: number = 10,
  ): Promise<Array<{ x: number; y: number }>> {
    return await this.page.evaluate(
      ([targetColor, rx, ry, rw, rh, tol]) => {
        const testBridge = (window as any).__ARCADE_TEST__;
        if (testBridge) {
          return testBridge.findColorInRegion(targetColor, rx, ry, rw, rh);
        }

        // Fallback implementation
        const canvas = document.getElementById(
          "game-canvas",
        ) as HTMLCanvasElement;
        if (!canvas) return [];
        const ctx = canvas.getContext("2d");
        if (!ctx) return [];

        const imageData = ctx.getImageData(rx, ry, rw, rh);
        const matches: Array<{ x: number; y: number }> = [];

        let tr: number, tg: number, tb: number;
        if (typeof targetColor === "string") {
          const hex = targetColor.replace("#", "");
          tr = parseInt(hex.substr(0, 2), 16);
          tg = parseInt(hex.substr(2, 2), 16);
          tb = parseInt(hex.substr(4, 2), 16);
        } else {
          tr = targetColor.r;
          tg = targetColor.g;
          tb = targetColor.b;
        }

        for (let py = 0; py < rh; py++) {
          for (let px = 0; px < rw; px++) {
            const i = (py * rw + px) * 4;
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];

            if (
              Math.abs(r - tr) <= tol &&
              Math.abs(g - tg) <= tol &&
              Math.abs(b - tb) <= tol
            ) {
              matches.push({ x: rx + px, y: ry + py });
            }
          }
        }

        return matches;
      },
      [color, x, y, width, height, tolerance],
    );
  }

  /**
   * Check if a color exists anywhere in a region
   */
  async hasColorInRegion(
    color: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ): Promise<boolean> {
    const matches = await this.findColorInRegion(color, x, y, width, height);
    return matches.length > 0;
  }

  /**
   * Get the canvas dimensions
   */
  async getCanvasDimensions(): Promise<{ width: number; height: number }> {
    return await this.page.evaluate(() => {
      const canvas = document.getElementById(
        "game-canvas",
      ) as HTMLCanvasElement;
      if (!canvas) return { width: 0, height: 0 };
      return { width: canvas.width, height: canvas.height };
    });
  }

  /**
   * Take a screenshot of just the canvas
   */
  async screenshot(): Promise<Buffer> {
    return await this.canvas.screenshot();
  }

  /**
   * Check if the canvas is rendering (has non-black pixels)
   */
  async isRendering(): Promise<boolean> {
    return await this.page.evaluate(() => {
      const canvas = document.getElementById(
        "game-canvas",
      ) as HTMLCanvasElement;
      if (!canvas) return false;
      const ctx = canvas.getContext("2d");
      if (!ctx) return false;

      // Sample a few points to see if there's content
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Check if there are any non-black pixels
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 0 || data[i + 1] > 0 || data[i + 2] > 0) {
          return true;
        }
      }
      return false;
    });
  }

  /**
   * Count pixels of a specific color in the entire canvas
   */
  async countPixelsOfColor(
    color: string,
    tolerance: number = 10,
  ): Promise<number> {
    const dims = await this.getCanvasDimensions();
    const matches = await this.findColorInRegion(
      color,
      0,
      0,
      dims.width,
      dims.height,
      tolerance,
    );
    return matches.length;
  }
}
