// src/hooks/use-tour.ts
import * as DriverJS from "driver.js";
import "driver.js/dist/driver.css";

const Driver = DriverJS.default || DriverJS; 

export type DriveStep = {
  element?: string | Element | (() => Element);
  popover?: {
    title?: string;
    description?: string;
  };
};

export const useTour = () => {
  const startTour = (steps: DriveStep[], autoDelayMs: number = 2500) => {
    // Filter steps dynamically
    const filteredSteps = steps.filter(step => {
      if (!step.element) return false;
      if (typeof step.element === "string") return !!document.querySelector(step.element);
      if (typeof step.element === "function") return !!step.element();
      if (step.element instanceof Element) return true;
      return false;
    });

    if (!filteredSteps.length) return;

    const tour = Driver({
      animate: true,
      showProgress: true,
      overlayOpacity: 0.6,
      allowClose: true,
      steps: filteredSteps,
    });

    // Auto-start with optional autoDelay between steps
    tour.drive();

    let stepIndex = 0;

    const nextStep = () => {
      stepIndex++;
      if (stepIndex < filteredSteps.length) {
        setTimeout(() => tour.moveNext(), autoDelayMs);
        nextStep();
      }
    };

    nextStep();
  };

  return { startTour };
};
