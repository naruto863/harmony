import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Breadcrumb } from './Breadcrumb';
import { PageTransition } from '@/components/transitions';
import { TourProvider, TourOverlay } from '@/components/tour';

export const MainLayout: React.FC = () => {
  const location = useLocation();

  return (
    <TourProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <Sidebar />
          <SidebarInset className="flex-1 flex flex-col min-w-0">
            <Topbar />
            <div className="flex-1 flex flex-col min-w-0">
              <div className="px-4 md:px-6 py-3 md:py-4 border-b bg-muted/30">
                <Breadcrumb />
              </div>
              <main className="flex-1 p-4 md:p-6 bg-background overflow-x-hidden">
                <PageTransition key={location.pathname}>
                  <Outlet />
                </PageTransition>
              </main>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
      <TourOverlay />
    </TourProvider>
  );
};
