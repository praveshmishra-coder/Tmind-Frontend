// 📌 StartTourButton.tsx

import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";
import { useTour } from "../hooks/use-tour";
import { useEffect } from "react";

import { getTourStatus, markTourCompleted } from "@/api/userApi";

import {
  PAGE_TOUR_KEY,
  BACKEND_TOUR_KEY,
  getPageTourState,
  markPageCompleted,
  getBackendTourStatus,
  setBackendTourDone
} from "../hooks/tourStorage";

import { dashboardTour } from "../tour/dashboardTour";
import { devicesTour } from "../tour/deviceTour";
import { assetsTour } from "@/tour/assetTour";
import { userManagementTour } from "@/tour/userManagementTour";
import { deletedDevicesTour } from "@/tour/deletedDeviceTour";
import { deletedAssetsTour } from "@/tour/deletedAssetTour";
import { signalTour } from "@/tour/signalTour";
import { reportTour } from "@/tour/reportTour";

import { Info } from "lucide-react";

export default function StartTourButton() {
  const location = useLocation();
  const { startTour } = useTour();

  // ----------- Identify current page ---------------
  const getPageKey = () => {
    if (location.pathname.startsWith("/dashboard")) return "dashboard";
    if (location.pathname.startsWith("/devices")) return "devices";
    if (location.pathname.startsWith("/assets")) return "assets";
    if (location.pathname.startsWith("/manage-user")) return "user-management";
    if (location.pathname.startsWith("/deleted-devices")) return "deleted-devices";
    if (location.pathname.startsWith("/deleted-assets")) return "deleted-assets";
    if (location.pathname.startsWith("/signal")) return "signal";
    if (location.pathname.startsWith("/reports")) return "reports";
    return null;
  };

  const ALL_PAGES = [
    "dashboard",
    "devices",
    "assets",
    "user-management",
    "deleted-devices",
    "deleted-assets",
    "signal",
    "reports",
  ];

  // ----------- Steps for page ---------------
  const getStepsForPage = () => {
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

  // ⭐ AUTO TOUR BASED ON BACKEND
  useEffect(() => {
    const autoStart = async () => {
      let backendTourDone = getBackendTourStatus();

      // First time → GET from backend
      if (backendTourDone === null) {
        try {
          const { isTourCompleted } = await getTourStatus();
          backendTourDone = isTourCompleted ? "true" : "false";
          localStorage.setItem(BACKEND_TOUR_KEY, backendTourDone);
        } catch (err) {
          console.error("Backend fetch failed:", err);
          return;
        }
      }

      // If backend says tour is completed → stop auto-tour
      if (backendTourDone === "true") return;

      const pageKey = getPageKey();
      if (!pageKey) return;

      const pageState = getPageTourState();

      // If this page is already shown → skip
      if (pageState[pageKey]) return;

      const steps = getStepsForPage();
      if (!steps) return;

      // Run auto tour
      startTour(steps);

      // Mark page completed
      markPageCompleted(pageKey);

      // Check if every page is done
      const allDone = ALL_PAGES.every((p) => pageState[p] || p === pageKey);

      if (allDone) {
        await markTourCompleted();
        setBackendTourDone();
      }
    };

    autoStart();
  }, [location.pathname]);

  const handleStartTour = () => {
    const steps = getStepsForPage();
    if (steps) startTour(steps);
    else alert("No tour available!");
  };

  return (
    <Button onClick={handleStartTour} className="text-sm bg-transparent" title="Start Tour">
      <Info className="h-5 w-5 text-gray-700" />
    </Button>
  );
}
