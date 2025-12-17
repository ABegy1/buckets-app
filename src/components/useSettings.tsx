'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface SettingsContextProps {
  shotsPerDay: number;
  setShotsPerDay: (value: number) => void;
}

const SettingsContext = createContext<SettingsContextProps>({
  shotsPerDay: 4,
  setShotsPerDay: () => {},
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shotsPerDay, setShotsPerDayState] = useState<number>(4);

  useEffect(() => {
    const stored = localStorage.getItem('shotsPerDay');
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed)) {
        setShotsPerDayState(parsed);
      }
    }
  }, []);

  const setShotsPerDay = (value: number) => {
    setShotsPerDayState(value);
    localStorage.setItem('shotsPerDay', value.toString());
  };

  return (
    <SettingsContext.Provider value={{ shotsPerDay, setShotsPerDay }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);

