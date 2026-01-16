// Manual verification script for CRTEffect
// This demonstrates the key features of the CRTEffect system

import { CRTEffect } from "../../src/arcade/CRTEffect.js";

console.log("=== CRTEffect Verification Script ===\n");

// 1. Create container
const container = document.createElement("div");
container.id = "crt-demo";
document.body.appendChild(container);

// 2. Initialize
console.log("1. Initializing CRTEffect...");
CRTEffect.init(container);
console.log("   ✓ Initialized");
console.log("   Enabled:", CRTEffect.isEnabled());
console.log("   Settings:", JSON.stringify(CRTEffect.getSettings(), null, 2));

// 3. Toggle functionality
console.log("\n2. Testing toggle...");
CRTEffect.toggle();
console.log("   After toggle - Enabled:", CRTEffect.isEnabled());
CRTEffect.toggle();
console.log("   After 2nd toggle - Enabled:", CRTEffect.isEnabled());

// 4. Intensity controls
console.log("\n3. Testing intensity controls...");
CRTEffect.setScanlineIntensity(0.8);
CRTEffect.setCurvature(0.5);
CRTEffect.setBloom(0.3);
console.log("   Set scanlines=0.8, curvature=0.5, bloom=0.3");
console.log("   Current scanlines:", CRTEffect.getSettings().scanlines);
console.log("   Current curvature:", CRTEffect.getSettings().curvature);
console.log("   Current bloom:", CRTEffect.getSettings().bloom);

// 5. Value clamping
console.log("\n4. Testing value clamping...");
CRTEffect.setScanlineIntensity(1.5);
console.log("   Set scanlines=1.5 (should clamp to 1.0)");
console.log("   Actual value:", CRTEffect.getSettings().scanlines);
CRTEffect.setScanlineIntensity(-0.5);
console.log("   Set scanlines=-0.5 (should clamp to 0.0)");
console.log("   Actual value:", CRTEffect.getSettings().scanlines);

// 6. Presets
console.log("\n5. Testing presets...");
CRTEffect.applyPreset("extreme");
console.log('   Applied "extreme" preset');
console.log("   Settings:", JSON.stringify(CRTEffect.getSettings(), null, 2));

// 7. Persistence
console.log("\n6. Testing persistence...");
const beforeSettings = CRTEffect.getSettings();
console.log(
  "   Settings before save:",
  JSON.stringify(beforeSettings, null, 2),
);
CRTEffect.saveSettings();
console.log("   Saved to localStorage");

// Simulate reload by destroying and reinitializing
CRTEffect.destroy();
container.remove();

const newContainer = document.createElement("div");
newContainer.id = "crt-demo-2";
document.body.appendChild(newContainer);
CRTEffect.init(newContainer);

const afterSettings = CRTEffect.getSettings();
console.log(
  "   Settings after reload:",
  JSON.stringify(afterSettings, null, 2),
);
console.log(
  "   Settings match:",
  JSON.stringify(beforeSettings) === JSON.stringify(afterSettings),
);

// 8. Cleanup
console.log("\n7. Cleanup...");
CRTEffect.destroy();
newContainer.remove();
console.log("   ✓ Destroyed and cleaned up");

console.log("\n=== All verifications complete ===");
