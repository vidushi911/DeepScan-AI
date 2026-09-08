import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { SAMPLE_DATASETS } from '../data/sampleData';
import type { SurveyDataset } from '../types/sonar';

const STORAGE_KEY = 'deepScanLatestDataset';

interface AppDataContextValue {
  latestDataset: SurveyDataset | null;
  setLatestDataset: (dataset: SurveyDataset) => void;
  resetLatestDataset: () => void;
}

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

const readStoredDataset = (): SurveyDataset | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SurveyDataset) : null;
  } catch {
    return null;
  }
};

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [latestDataset, setLatestDatasetState] = useState<SurveyDataset | null>(() =>
    readStoredDataset() ?? SAMPLE_DATASETS[0]
  );

  useEffect(() => {
    if (latestDataset) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(latestDataset));
    }
  }, [latestDataset]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      latestDataset,
      setLatestDataset: (dataset) => setLatestDatasetState(dataset),
      resetLatestDataset: () => setLatestDatasetState(SAMPLE_DATASETS[0]),
    }),
    [latestDataset]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export const useAppData = (): AppDataContextValue => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within AppDataProvider');
  }
  return context;
};
