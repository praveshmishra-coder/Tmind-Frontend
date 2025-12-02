// Define Step type yourself
export interface Step {
  element?: string; // CSS selector
  intro: string;
  position?: string;
}

import dashboardSteps from "./dashboardGuide";
import deviceSteps from "./deviceGuide";
import assetSteps from "./assetGuide";
import adminSteps from "./adminGuide";

/**
 * Map pathname -> intro.js Steps array
 */
const guidesMap: Record<string, Step[]> = {
  "/": dashboardSteps,
  "/devices": deviceSteps,
  "/assets": assetSteps,
  "/admin": adminSteps,
};

export default guidesMap;
