// src/hooks/use-tour.ts
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export type DriveStep = {
  element?: string | Element | (() => Element);
  popover?: {
    title?: string;
    description?: string;
  };
};

export const useTour = () => {
  const startTour = (steps: DriveStep[], autoDelayMs: number = 2500) => {
    // Filter only those steps where the element exists
    const filteredSteps = steps.filter((step) => {
      if (!step.element) return false;

      if (typeof step.element === "string") {
        return !!document.querySelector(step.element);
      }

      if (typeof step.element === "function") {
        return !!step.element();
      }

      if (step.element instanceof Element) return true;

      return false;
    });

    if (!filteredSteps.length) return;

    // Driver.js v1+ API
    const tour = driver({
      animate: true,
      showProgress: true,
      overlayOpacity: 0.6,
      steps: filteredSteps,
      allowClose: true
    });

    // Start tour
    tour.drive();

    // Auto delay through steps (optional)
    if (autoDelayMs > 0) {
      let index = 0;

      const interval = setInterval(() => {
        index++;
        if (index < filteredSteps.length) {
          tour.moveNext();
        } else {
          clearInterval(interval);
        }
      }, autoDelayMs);
    }
  };

  return { startTour };
};
