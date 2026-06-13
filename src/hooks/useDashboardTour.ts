import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TourStep } from '@/components/tour';

export const useDashboardTour = () => {
  const { t } = useTranslation();

  const steps: TourStep[] = useMemo(() => [
    {
      id: 'sidebar',
      target: '[data-tour="sidebar"]',
      title: t('tour.dashboard.sidebar.title'),
      content: t('tour.dashboard.sidebar.content'),
      placement: 'right',
    },
    {
      id: 'search',
      target: '[data-tour="global-search"]',
      title: t('tour.dashboard.search.title'),
      content: t('tour.dashboard.search.content'),
      placement: 'bottom',
    },
    {
      id: 'notifications',
      target: '[data-tour="notifications"]',
      title: t('tour.dashboard.notifications.title'),
      content: t('tour.dashboard.notifications.content'),
      placement: 'bottom',
    },
    {
      id: 'theme',
      target: '[data-tour="theme-toggle"]',
      title: t('tour.dashboard.theme.title'),
      content: t('tour.dashboard.theme.content'),
      placement: 'bottom',
    },
    {
      id: 'user-menu',
      target: '[data-tour="user-menu"]',
      title: t('tour.dashboard.userMenu.title'),
      content: t('tour.dashboard.userMenu.content'),
      placement: 'bottom',
    },
    {
      id: 'dashboard-widgets',
      target: '[data-tour="dashboard-widgets"]',
      title: t('tour.dashboard.widgets.title'),
      content: t('tour.dashboard.widgets.content'),
      placement: 'top',
    },
  ], [t]);

  return { steps, tourId: 'dashboard-tour' };
};
