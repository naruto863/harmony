import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTour, TourStep } from './TourProvider';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface TourTriggerProps {
  tourId: string;
  steps: TourStep[];
  autoStart?: boolean;
  className?: string;
}

export const TourTrigger: React.FC<TourTriggerProps> = ({
  tourId,
  steps,
  autoStart = false,
  className,
}) => {
  const { t } = useTranslation();
  const { startTour, hasSeenTour, markTourAsSeen, isActive } = useTour();

  React.useEffect(() => {
    if (autoStart && !hasSeenTour(tourId) && !isActive) {
      // 延迟启动以确保页面已渲染
      const timer = setTimeout(() => {
        startTour(steps);
        markTourAsSeen(tourId);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoStart, tourId, hasSeenTour, startTour, markTourAsSeen, steps, isActive]);

  const handleClick = () => {
    startTour(steps);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={className}
          onClick={handleClick}
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{t('tour.startTour')}</p>
      </TooltipContent>
    </Tooltip>
  );
};
