import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, className }) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<'enter' | 'exit'>('enter');

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setTransitionStage('exit');
    }
  }, [location, displayLocation]);

  const handleAnimationEnd = () => {
    if (transitionStage === 'exit') {
      setDisplayLocation(location);
      setTransitionStage('enter');
    }
  };

  return (
    <div
      className={cn(
        'w-full h-full',
        transitionStage === 'enter' && 'animate-page-enter',
        transitionStage === 'exit' && 'animate-page-exit',
        className
      )}
      onAnimationEnd={handleAnimationEnd}
    >
      {children}
    </div>
  );
};
