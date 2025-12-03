// src/hooks/use-tour.ts
import { driver } from "driver.js"; // only import the runtime function
import "driver.js/dist/driver.css";

// TypeScript type for tour steps
export type DriveStep = {
  element?: string | Element | (() => Element);
  popover?: {
    title?: string;
    description?: string;
  };
};

export const useTour = () => {
  const startTour = (steps: DriveStep[]) => {
    // Filter dynamically: only include elements that exist in the DOM
    const filteredSteps = steps.filter(step => {
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

    if (!filteredSteps.length) return; // nothing to show

    const tour = driver({
      animate: true,
      showProgress: true,
      overlayOpacity: 0.6,
      allowClose: true,
      steps: filteredSteps,
    });

    tour.drive();
  };

  return { startTour };
};
