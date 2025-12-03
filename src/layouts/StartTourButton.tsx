import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";
import { useTour } from "../hooks/use-tour";
import { dashboardTour } from "../tour/dashboardTour";
import { devicesTour } from "../tour/deviceTour";
import { assetsTour } from "@/tour/assetTour";

export default function StartTourButton() {
  const location = useLocation();
  const { startTour } = useTour();

  const handleStartTour = () => {
    if (location.pathname.startsWith("/dashboard")) {
      startTour(dashboardTour);
    }else if (location.pathname.startsWith("/devices")) {
      startTour(devicesTour);
    }else if (location.pathname.startsWith("/assets")) {
      startTour(assetsTour);
    } else {
      alert("No tour available on this page yet!");
    }
  };

  return (
    <Button onClick={handleStartTour} variant="outline" className="text-sm">
      Start Tour
    </Button>
  );
}
