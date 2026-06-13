import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTour } from './TourProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { X, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const TourOverlay: React.FC = () => {
  const { t } = useTranslation();
  const { isActive, currentStep, steps, nextStep, prevStep, skipTour, endTour } = useTour();
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStepData = steps[currentStep];

  useEffect(() => {
    if (!isActive || !currentStepData) {
      setSpotlight(null);
      return;
    }

    const updatePosition = () => {
      const target = document.querySelector(currentStepData.target);
      if (!target) {
        // 如果找不到目标元素，跳到下一步
        setTimeout(() => {
          if (currentStep < steps.length - 1) {
            nextStep();
          } else {
            endTour();
          }
        }, 100);
        return;
      }

      const rect = target.getBoundingClientRect();
      const padding = currentStepData.spotlightPadding ?? 8;

      const spotlightRect: SpotlightRect = {
        top: rect.top - padding + window.scrollY,
        left: rect.left - padding + window.scrollX,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      };

      setSpotlight(spotlightRect);

      // 计算提示框位置
      const placement = currentStepData.placement || 'bottom';
      const tooltipWidth = 320;
      const tooltipHeight = 180;
      const gap = 12;

      let tooltipTop = 0;
      let tooltipLeft = 0;

      switch (placement) {
        case 'top':
          tooltipTop = rect.top - tooltipHeight - gap + window.scrollY;
          tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2 + window.scrollX;
          break;
        case 'bottom':
          tooltipTop = rect.bottom + gap + window.scrollY;
          tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2 + window.scrollX;
          break;
        case 'left':
          tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY;
          tooltipLeft = rect.left - tooltipWidth - gap + window.scrollX;
          break;
        case 'right':
          tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY;
          tooltipLeft = rect.right + gap + window.scrollX;
          break;
      }

      // 确保提示框在视口内
      tooltipTop = Math.max(10, Math.min(tooltipTop, window.innerHeight - tooltipHeight - 10));
      tooltipLeft = Math.max(10, Math.min(tooltipLeft, window.innerWidth - tooltipWidth - 10));

      setTooltipPosition({ top: tooltipTop, left: tooltipLeft });

      // 滚动到目标元素
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    updatePosition();

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isActive, currentStep, currentStepData, steps.length, nextStep, endTour]);

  // 键盘导航
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          skipTour();
          break;
        case 'ArrowRight':
        case 'Enter':
          nextStep();
          break;
        case 'ArrowLeft':
          prevStep();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, nextStep, prevStep, skipTour]);

  if (!isActive || !currentStepData) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* 遮罩层 */}
      <div className="absolute inset-0 pointer-events-auto">
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {spotlight && (
                <rect
                  x={spotlight.left}
                  y={spotlight.top}
                  width={spotlight.width}
                  height={spotlight.height}
                  rx="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.7)"
            mask="url(#spotlight-mask)"
          />
        </svg>
      </div>

      {/* 聚焦区域边框 */}
      {spotlight && (
        <div
          className="absolute border-2 border-primary rounded-lg pointer-events-none animate-pulse"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
          }}
        />
      )}

      {/* 提示卡片 */}
      <Card
        ref={tooltipRef}
        className="absolute w-80 pointer-events-auto shadow-2xl animate-scale-in border-primary/20"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{currentStepData.title}</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={skipTour}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-1 mt-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-200',
                  index === currentStep
                    ? 'w-6 bg-primary'
                    : index < currentStep
                    ? 'w-1.5 bg-primary/50'
                    : 'w-1.5 bg-muted'
                )}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-sm text-muted-foreground">{currentStepData.content}</p>
        </CardContent>
        <CardFooter className="flex items-center justify-between pt-0">
          <div className="text-xs text-muted-foreground">
            {currentStep + 1} / {steps.length}
          </div>
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={prevStep}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t('tour.prev')}
              </Button>
            )}
            {currentStep === 0 && steps.length > 1 && (
              <Button variant="ghost" size="sm" onClick={skipTour}>
                <SkipForward className="h-4 w-4 mr-1" />
                {t('tour.skip')}
              </Button>
            )}
            <Button size="sm" onClick={nextStep}>
              {currentStep === steps.length - 1 ? (
                t('tour.finish')
              ) : (
                <>
                  {t('tour.next')}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
