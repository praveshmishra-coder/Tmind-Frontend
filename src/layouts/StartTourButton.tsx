import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";
import { useTour } from "../hooks/use-tour";

import { dashboardTour } from "../tour/dashboardTour";
import { devicesTour } from "../tour/deviceTour";
import { assetsTour } from "../tour/assetTour";
import { userManagementTour } from "../tour/userManagementTour";
import { deletedDevicesTour } from "../tour/deletedDeviceTour";
import { deletedAssetsTour } from "../tour/deletedAssetTour";
import { signalTour } from "../tour/signalTour";
import { reportTour } from "../tour/reportTour";

import { getTourStatus, markTourCompleted, getCurrentUser } from "@/api/userApi";

export default function StartTourButton() {
  const location = useLocation();
  const { startTour } = useTour();

  const getTourSteps = () => {
    if (location.pathname.startsWith("/dashboard")) return dashboardTour;
    if (location.pathname.startsWith("/devices")) return devicesTour;
    if (location.pathname.startsWith("/assets")) return assetsTour;
    if (location.pathname.startsWith("/manage-user")) return userManagementTour;
    if (location.pathname.startsWith("/deleted-devices")) return deletedDevicesTour;
    if (location.pathname.startsWith("/deleted-assets")) return deletedAssetsTour;
    if (location.pathname.startsWith("/signal")) return signalTour;
    if (location.pathname.startsWith("/reports")) return reportTour;
    return null;
  };

  const runTourIfFirstTime = async () => {
    try {
      const steps = getTourSteps();
      if (!steps) return;

      await getCurrentUser(); // ensures auth

      const tourStatus = await getTourStatus();
      console.log("tour status →", tourStatus);

      if (!tourStatus.isTourCompleted && !sessionStorage.getItem("tourRunning")) {
        sessionStorage.setItem("tourRunning", "true");

        setTimeout(() => startTour(steps), 500);

        setTimeout(async () => {
          await markTourCompleted();
          console.log("Tour marked completed.");
        }, steps.length * 2500 + 1000);
      }
    } catch (err) {
      console.warn("Tour auto-start failed:", err);
    }
  };

  useEffect(() => {
    runTourIfFirstTime();
  }, [location.pathname]);

  const handleStartTour = () => {
    const steps = getTourSteps();
    if (!steps) return alert("No tour available on this page yet!");
    startTour(steps);
  };

  return (
    <Button onClick={handleStartTour} variant="outline" className="text-sm">
      Start Tour
    </Button>
  );
}
