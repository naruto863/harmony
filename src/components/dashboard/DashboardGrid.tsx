import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Settings2,
  GripVertical,
  RotateCcw,
  Save,
  Eye,
  EyeOff,
  Unlock,
  LayoutGrid,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { DashboardWidget, DEFAULT_WIDGETS, WidgetType } from '@/types/dashboard';
import { UserGrowthChart, ProjectStatusChart, ActivityHeatmap, RecentActivityList } from '@/components/dashboard';
import { StatsWidget, QuickActionsWidget, SystemInfoWidget } from './widgets';

const STORAGE_KEY = 'dashboard-config-v2';

interface SortableWidgetProps {
  id: string;
  widget: DashboardWidget;
  isEditing: boolean;
  children: React.ReactNode;
}

const SortableWidget: React.FC<SortableWidgetProps> = ({ id, widget, isEditing, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group',
        isDragging && 'opacity-50',
        getWidgetGridClass(widget.type)
      )}
    >
      <Card className={cn(
        'h-full overflow-hidden transition-all',
        isEditing && 'ring-2 ring-primary/30 ring-dashed',
        widget.type === 'stats' && 'bg-transparent shadow-none border-0'
      )}>
        {isEditing && (
          <div
            {...attributes}
            {...listeners}
            className="absolute top-2 left-2 z-10 p-1.5 rounded-md bg-primary/10 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <GripVertical className="h-4 w-4 text-primary" />
          </div>
        )}
        {children}
      </Card>
    </div>
  );
};

const getWidgetGridClass = (type: WidgetType): string => {
  switch (type) {
    case 'stats':
      return 'col-span-full';
    case 'user-growth':
      return 'col-span-full lg:col-span-2';
    case 'project-status':
      return 'col-span-full md:col-span-1';
    case 'activity-heatmap':
      return 'col-span-full lg:col-span-2';
    case 'recent-activity':
    case 'quick-actions':
    case 'system-info':
      return 'col-span-full md:col-span-1';
    default:
      return 'col-span-full md:col-span-1';
  }
};

interface DashboardConfig {
  widgets: DashboardWidget[];
  widgetOrder: string[];
}

const loadConfig = (): DashboardConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    console.error('Failed to load dashboard config');
  }
  return {
    widgets: DEFAULT_WIDGETS,
    widgetOrder: DEFAULT_WIDGETS.map(w => w.id),
  };
};

const saveConfig = (config: DashboardConfig) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    console.error('Failed to save dashboard config');
  }
};

interface DashboardGridProps {
  className?: string;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({ className }) => {
  const { toast } = useToast();
  const [config, setConfig] = useState<DashboardConfig>(loadConfig);
  const [isEditing, setIsEditing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setConfig((prev) => {
        const oldIndex = prev.widgetOrder.indexOf(active.id as string);
        const newIndex = prev.widgetOrder.indexOf(over.id as string);
        const newOrder = arrayMove(prev.widgetOrder, oldIndex, newIndex);
        return { ...prev, widgetOrder: newOrder };
      });
    }
  };

  const toggleWidgetVisibility = (widgetId: string) => {
    setConfig((prev) => ({
      ...prev,
      widgets: prev.widgets.map((w) =>
        w.id === widgetId ? { ...w, visible: !w.visible } : w
      ),
    }));
  };

  const resetToDefault = () => {
    const defaultConfig: DashboardConfig = {
      widgets: DEFAULT_WIDGETS,
      widgetOrder: DEFAULT_WIDGETS.map(w => w.id),
    };
    setConfig(defaultConfig);
    saveConfig(defaultConfig);
    toast({ title: '已重置', description: '看板已恢复为默认布局' });
  };

  const handleSave = () => {
    saveConfig(config);
    setIsEditing(false);
    toast({ title: '已保存', description: '看板布局已保存' });
  };

  const renderWidgetContent = (type: WidgetType) => {
    switch (type) {
      case 'stats':
        return <StatsWidget />;
      case 'user-growth':
        return (
          <Card className="h-full border-0 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">用户增长趋势</CardTitle>
            </CardHeader>
            <CardContent className="h-[280px]">
              <UserGrowthChart />
            </CardContent>
          </Card>
        );
      case 'project-status':
        return (
          <Card className="h-full border-0 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">项目状态分布</CardTitle>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ProjectStatusChart />
            </CardContent>
          </Card>
        );
      case 'activity-heatmap':
        return (
          <Card className="h-full border-0 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">活动热力图</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityHeatmap />
            </CardContent>
          </Card>
        );
      case 'recent-activity':
        return (
          <Card className="h-full border-0 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">最近活动</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentActivityList />
            </CardContent>
          </Card>
        );
      case 'quick-actions':
        return <QuickActionsWidget />;
      case 'system-info':
        return <SystemInfoWidget />;
      default:
        return <div className="p-4 text-muted-foreground">未知组件</div>;
    }
  };

  const visibleWidgets = config.widgetOrder
    .map((id) => config.widgets.find((w) => w.id === id))
    .filter((w): w is DashboardWidget => w !== undefined && w.visible);

  return (
    <div className={cn('relative', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-primary" />
            自定义看板
          </h2>
          {isEditing && (
            <Badge variant="secondary" className="animate-pulse">
              编辑模式
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={resetToDefault}>
                <RotateCcw className="h-4 w-4 mr-1" />
                重置
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4 mr-1" />
                取消
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-1" />
                保存
              </Button>
            </>
          ) : (
            <>
              <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings2 className="h-4 w-4 mr-1" />
                    配置
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>看板配置</SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
                    <div className="space-y-4 pr-4">
                      <div className="text-sm text-muted-foreground mb-2">
                        选择要显示的组件
                      </div>
                      {config.widgets.map((widget) => (
                        <div
                          key={widget.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {widget.visible ? (
                              <Eye className="h-4 w-4 text-primary" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className={cn('text-sm', !widget.visible && 'text-muted-foreground')}>
                              {widget.title}
                            </span>
                          </div>
                          <Switch
                            checked={widget.visible}
                            onCheckedChange={() => toggleWidgetVisibility(widget.id)}
                          />
                        </div>
                      ))}
                      <div className="pt-4 border-t">
                        <Button variant="outline" className="w-full" onClick={resetToDefault}>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          恢复默认配置
                        </Button>
                      </div>
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Unlock className="h-4 w-4 mr-1" />
                编辑布局
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Grid with DnD */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={visibleWidgets.map((w) => w.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleWidgets.map((widget) => (
              <SortableWidget key={widget.id} id={widget.id} widget={widget} isEditing={isEditing}>
                {widget.type === 'stats' ? (
                  renderWidgetContent(widget.type)
                ) : (
                  <div className="h-full overflow-auto">{renderWidgetContent(widget.type)}</div>
                )}
              </SortableWidget>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Editing hint */}
      {isEditing && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-fade-in z-50">
          <GripVertical className="h-4 w-4" />
          <span className="text-sm">拖拽组件调整位置</span>
        </div>
      )}
    </div>
  );
};
