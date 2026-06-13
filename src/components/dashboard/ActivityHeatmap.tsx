import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

// 生成过去52周的活动数据
const generateHeatmapData = () => {
  const data: { date: string; count: number; dayOfWeek: number }[] = [];
  const today = new Date();
  
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // 模拟活动数据，工作日活动更多
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseCount = isWeekend ? 1 : 5;
    const count = Math.floor(Math.random() * baseCount * 3);
    
    data.push({
      date: date.toISOString().split('T')[0],
      count,
      dayOfWeek,
    });
  }
  
  return data;
};

const data = generateHeatmapData();

const getIntensityClass = (count: number): string => {
  if (count === 0) return 'bg-muted';
  if (count <= 3) return 'bg-primary/20';
  if (count <= 6) return 'bg-primary/40';
  if (count <= 9) return 'bg-primary/60';
  return 'bg-primary';
};

const DAYS = ['日', '一', '二', '三', '四', '五', '六'];
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

export const ActivityHeatmap: React.FC = () => {
  // 按周分组
  const weeks: { date: string; count: number; dayOfWeek: number }[][] = [];
  let currentWeek: { date: string; count: number; dayOfWeek: number }[] = [];
  
  data.forEach((day, index) => {
    if (index > 0 && day.dayOfWeek === 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  });
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  // 计算月份标签位置
  const monthLabels: { month: string; weekIndex: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, weekIndex) => {
    const firstDay = week[0];
    if (firstDay) {
      const month = new Date(firstDay.date).getMonth();
      if (month !== lastMonth) {
        monthLabels.push({ month: MONTHS[month], weekIndex });
        lastMonth = month;
      }
    }
  });

  const totalActivities = data.reduce((sum, day) => sum + day.count, 0);
  const activeDays = data.filter(day => day.count > 0).length;

  return (
    <Card className="col-span-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent-foreground flex items-center justify-center">
                <Activity className="h-4 w-4 text-white" />
              </div>
              操作活动热力图
            </CardTitle>
            <CardDescription className="mt-1">过去一年的操作活动分布</CardDescription>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p><span className="font-semibold gradient-text">{totalActivities}</span> 次操作</p>
            <p><span className="font-semibold gradient-text">{activeDays}</span> 个活跃日</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[750px]">
            {/* 月份标签 */}
            <div className="flex gap-[3px] mb-2 ml-8">
              {monthLabels.map(({ month, weekIndex }, index) => (
                <div
                  key={index}
                  className="text-xs text-muted-foreground"
                  style={{ 
                    position: 'relative',
                    left: `${weekIndex * 14}px`,
                    width: '40px',
                  }}
                >
                  {month}
                </div>
              ))}
            </div>
            
            <div className="flex gap-1">
              {/* 星期标签 */}
              <div className="flex flex-col gap-[3px] mr-2">
                {DAYS.map((day, index) => (
                  <div
                    key={day}
                    className="text-xs text-muted-foreground h-[11px] flex items-center"
                    style={{ visibility: index % 2 === 1 ? 'visible' : 'hidden' }}
                  >
                    {day}
                  </div>
                ))}
              </div>
              
              {/* 热力图 */}
              <div className="flex gap-[3px]">
                <TooltipProvider delayDuration={100}>
                  {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-[3px]">
                      {[0, 1, 2, 3, 4, 5, 6].map(dayOfWeek => {
                        const day = week.find(d => d.dayOfWeek === dayOfWeek);
                        if (!day) {
                          return <div key={dayOfWeek} className="w-[11px] h-[11px]" />;
                        }
                        return (
                          <Tooltip key={dayOfWeek}>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  'w-[11px] h-[11px] rounded-sm cursor-pointer transition-colors hover:ring-1 hover:ring-primary',
                                  getIntensityClass(day.count)
                                )}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                {day.date}: {day.count} 次操作
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  ))}
                </TooltipProvider>
              </div>
            </div>
            
            {/* 图例 */}
            <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
              <span>少</span>
              <div className="flex gap-1">
                {[0, 3, 6, 9, 12].map(count => (
                  <div
                    key={count}
                    className={cn(
                      'w-[11px] h-[11px] rounded-sm',
                      getIntensityClass(count)
                    )}
                  />
                ))}
              </div>
              <span>多</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
