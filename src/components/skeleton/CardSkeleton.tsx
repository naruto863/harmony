import React from 'react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface CardSkeletonProps {
  showHeader?: boolean;
  showFooter?: boolean;
  contentLines?: number;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  showHeader = true,
  showFooter = false,
  contentLines = 3,
}) => (
  <Card>
    {showHeader && (
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
    )}
    <CardContent className="space-y-3">
      {Array.from({ length: contentLines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={`h-4 ${i === contentLines - 1 ? 'w-2/3' : 'w-full'}`} 
        />
      ))}
    </CardContent>
    {showFooter && (
      <CardFooter className="gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </CardFooter>
    )}
  </Card>
);

export const CardGridSkeleton: React.FC<{ count?: number; columns?: number }> = ({
  count = 6,
  columns = 3,
}) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-4`}>
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);
