"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type Station = {
  id: number;
  name: string;
  shortcode: string;
  description: string;
  public_player_url: string;
  serverUrl?: string;
  // ...other fields
};

type StationContextType = {
  stations: Station[];
  setStations: (stations: Station[]) => void;
  selectedStation: Station | null;
  setSelectedStation: (station: Station | null) => void;
};

const StationContext = createContext<StationContextType | undefined>(undefined);

export function StationProvider({ children }: { children: ReactNode }) {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStationState, setSelectedStationState] = useState<Station | null>(null);

  const setSelectedStation = (station: Station | null) => {
    setSelectedStationState(station);
    if (station) {
      localStorage.setItem("selected_station_id", station.id.toString());
    } else {
      localStorage.removeItem("selected_station_id");
    }
  };

  return (
    <StationContext.Provider value={{ stations, setStations, selectedStation: selectedStationState, setSelectedStation }}>
      {children}
    </StationContext.Provider>
  );
}

export function useStation() {
  const context = useContext(StationContext);
  if (!context) {
    throw new Error("useStation must be used within a StationProvider");
  }
  return context;
}
