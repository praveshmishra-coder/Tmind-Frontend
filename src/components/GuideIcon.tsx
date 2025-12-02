import { HelpCircle } from "lucide-react";
import Shepherd from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";
import { Step } from "@/types";

interface GuideIconProps {
  steps: Step[];
}

export default function GuideIcon({ steps }: GuideIconProps) {

  const startTour = () => {
    const tour = new Shepherd.Tour({
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        scrollTo: true,
        classes: "shadow-lg bg-white rounded-lg p-2"
      },
      useModalOverlay: true
    });

    steps.forEach(step => tour.addStep(step));
    tour.start();
  };

  return (
    <div
      className="fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full cursor-pointer shadow-lg"
      onClick={startTour}
    >
      <HelpCircle size={26} />
    </div>
  );
}
