import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export interface TourStep {
  id: string;
  target: string; // CSS selector
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  spotlightPadding?: number;
}

interface TourContextType {
  isActive: boolean;
  currentStep: number;
  steps: TourStep[];
  startTour: (steps: TourStep[]) => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  skipTour: () => void;
  hasSeenTour: (tourId: string) => boolean;
  markTourAsSeen: (tourId: string) => void;
}

const TourContext = createContext<TourContextType | null>(null);

const TOUR_STORAGE_KEY = 'seen_tours';

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};

interface TourProviderProps {
  children: React.ReactNode;
}

export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<TourStep[]>([]);

  const getSeenTours = (): string[] => {
    try {
      const stored = localStorage.getItem(TOUR_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const hasSeenTour = useCallback((tourId: string): boolean => {
    return getSeenTours().includes(tourId);
  }, []);

  const markTourAsSeen = useCallback((tourId: string) => {
    const seenTours = getSeenTours();
    if (!seenTours.includes(tourId)) {
      localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify([...seenTours, tourId]));
    }
  }, []);

  const startTour = useCallback((newSteps: TourStep[]) => {
    if (newSteps.length > 0) {
      setSteps(newSteps);
      setCurrentStep(0);
      setIsActive(true);
    }
  }, []);

  const endTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    setSteps([]);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      endTour();
    }
  }, [currentStep, steps.length, endTour]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStep(index);
    }
  }, [steps.length]);

  const skipTour = useCallback(() => {
    endTour();
  }, [endTour]);

  return (
    <TourContext.Provider
      value={{
        isActive,
        currentStep,
        steps,
        startTour,
        endTour,
        nextStep,
        prevStep,
        goToStep,
        skipTour,
        hasSeenTour,
        markTourAsSeen,
      }}
    >
      {children}
    </TourContext.Provider>
  );
};
