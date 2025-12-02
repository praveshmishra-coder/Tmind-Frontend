// src/guides/GuidedTourProvider.tsx

import React, { createContext, useContext, useState } from "react";
import introJs from "intro.js";
import "intro.js/minified/introjs.min.css";

interface TourContextType {
  startTour: (steps: any[]) => void;
}

const TourContext = createContext<TourContextType>({
  startTour: () => {},
});

export const useTour = () => useContext(TourContext);

const GuidedTourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tour] = useState(introJs());

  const startTour = (steps: any[]) => {
    tour.setOptions({
      steps,
      showStepNumbers: false,
      exitOnOverlayClick: false,
      nextLabel: "Next",
      prevLabel: "Back",
      doneLabel: "Done",
    });

    tour.start();
  };

  return (
    <TourContext.Provider value={{ startTour }}>
      {children}
    </TourContext.Provider>
  );
};

export default GuidedTourProvider;
