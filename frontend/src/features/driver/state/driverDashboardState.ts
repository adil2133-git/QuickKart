import { create } from "zustand";

export type LocationStatus = "idle" | "acquiring" | "active" | "denied" | "unavailable";

interface DriverDashboardState {
  locationStatus: LocationStatus;
  currentArea: string | null;
}

interface DriverDashboardActions {
  setLocationStatus: (status: LocationStatus) => void;
  setCurrentArea: (area: string) => void;
}

export const useDriverDashboardStore = create<DriverDashboardState & DriverDashboardActions>(
  (set) => ({
    locationStatus: "idle",
    currentArea: null,
    setLocationStatus: (status) => set({ locationStatus: status }),
    setCurrentArea: (area) => set({ currentArea: area }),
  })
);