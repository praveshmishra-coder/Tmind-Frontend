// src/hooks/use-tour.ts
import { driver } from "driver.js"; // only import the runtime function
import "driver.js/dist/driver.css";

// TypeScript type for tour steps
type DriveStep = {
  element?: string | Element | (() => Element);
  popover?: {
    title?: string;
    description?: string;
  };
};

export const useTour = () => {
  const startTour = (steps: DriveStep[]) => {
    const tour = driver({
      animate: true,
      showProgress: true,
      overlayOpacity: 0.6,
      allowClose: true,
      steps,
    });

    tour.drive();
  };

  return { startTour };
};
