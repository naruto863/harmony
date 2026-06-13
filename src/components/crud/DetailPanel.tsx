import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface DetailField {
  label: string;
  value: React.ReactNode;
  span?: 1 | 2;
}

interface DetailSection {
  title: string;
  fields: DetailField[];
}

interface DetailPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  sections?: DetailSection[];
  tabs?: {
    id: string;
    label: string;
    content: React.ReactNode;
  }[];
  footer?: React.ReactNode;
  width?: 'sm' | 'md' | 'lg';
}

export const DetailPanel: React.FC<DetailPanelProps> = ({
  open,
  onOpenChange,
  title,
  description,
  sections,
  tabs,
  footer,
  width = 'md',
}) => {
  const widthClass = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
  }[width];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={`${widthClass} flex flex-col`}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 pb-6">
            {/* 基本信息区域 */}
            {sections && sections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  {section.title}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {section.fields.map((field, fieldIndex) => (
                    <div 
                      key={fieldIndex}
                      className={field.span === 2 ? 'col-span-2' : ''}
                    >
                      <dt className="text-sm text-muted-foreground">{field.label}</dt>
                      <dd className="mt-1 text-sm font-medium">{field.value}</dd>
                    </div>
                  ))}
                </div>
                {sectionIndex < sections.length - 1 && <Separator className="mt-6" />}
              </div>
            ))}

            {/* Tabs 区域 */}
            {tabs && tabs.length > 0 && (
              <Tabs defaultValue={tabs[0].id} className="w-full">
                <TabsList className="w-full justify-start">
                  {tabs.map((tab) => (
                    <TabsTrigger key={tab.id} value={tab.id}>
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {tabs.map((tab) => (
                  <TabsContent key={tab.id} value={tab.id} className="mt-4">
                    {tab.content}
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </div>
        </ScrollArea>

        {footer && (
          <div className="pt-4 border-t -mx-6 px-6">
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

// 辅助组件：时间线
interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  time: string;
  icon?: React.ReactNode;
}

export const Timeline: React.FC<{ items: TimelineItem[] }> = ({ items }) => {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={item.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              {item.icon || <div className="h-2 w-2 rounded-full bg-primary" />}
            </div>
            {index < items.length - 1 && (
              <div className="w-px h-full bg-border mt-2" />
            )}
          </div>
          <div className="flex-1 pb-4">
            <p className="text-sm font-medium">{item.title}</p>
            {item.description && (
              <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
