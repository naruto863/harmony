import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  Maximize2,
  Minimize2,
  X,
  Users,
  Activity,
  Server,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import { useRealTimeData, useRealTimeChartData } from '@/hooks/useRealTimeData';
import { cn } from '@/lib/utils';

// 实时指标卡片组件
const MetricCard: React.FC<{
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  color: string;
}> = ({ name, value, unit, trend, icon, color }) => {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground';

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", color)}>
            {icon}
          </div>
          <TrendIcon className={cn("h-4 w-4", trendColor)} />
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold">{value.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">{unit}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{name}</p>
        </div>
      </CardContent>
    </Card>
  );
};

// 实时折线图组件
const RealTimeLineChart: React.FC<{
  title: string;
  metricId: string;
  color: string;
}> = ({ title, metricId, color }) => {
  const { chartData } = useRealTimeChartData(metricId, 15, 2000);

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`gradient-${metricId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              <XAxis 
                dataKey="time" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                fill={`url(#gradient-${metricId})`}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// 地域分布图是固定样例数据，用于校验大屏布局和图表配色，不代表真实用户地域统计。
const RegionDistribution: React.FC = () => {
  const data = [
    { name: '华东', value: 4500, color: 'hsl(var(--primary))' },
    { name: '华南', value: 3200, color: 'hsl(var(--success))' },
    { name: '华北', value: 2800, color: 'hsl(var(--warning))' },
    { name: '华中', value: 1800, color: 'hsl(var(--info))' },
    { name: '西南', value: 1200, color: 'hsl(var(--destructive))' },
    { name: '其他', value: 800, color: 'hsl(var(--muted-foreground))' },
  ];

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">用户地域分布</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-1.5 text-xs">
              <div 
                className="h-2 w-2 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-muted-foreground">{item.name}</span>
              <span className="font-medium ml-auto">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// 实时事件流是前端随机生成的演示流，真实事件应来自审计/消息/业务事件接口。
const EventStream: React.FC = () => {
  const [events, setEvents] = useState<Array<{
    id: number;
    type: 'login' | 'purchase' | 'error' | 'signup';
    message: string;
    time: string;
  }>>([]);

  useEffect(() => {
    const eventTypes = ['login', 'purchase', 'error', 'signup'] as const;
    const eventMessages = {
      login: ['用户登录成功', '管理员登录', 'API访问'],
      purchase: ['订单创建', '支付成功', '订阅升级'],
      error: ['请求超时', '认证失败', '服务器错误'],
      signup: ['新用户注册', '邀请注册', '第三方注册'],
    };

    // 每 3 秒插入一条本地事件，只保留最近 8 条，避免长时间打开大屏导致数组无限增长。
    const interval = setInterval(() => {
      const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const messages = eventMessages[type];
      const message = messages[Math.floor(Math.random() * messages.length)];

      setEvents(prev => [{
        id: Date.now(),
        type,
        message,
        time: new Date().toLocaleTimeString('zh-CN'),
      }, ...prev].slice(0, 8));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getEventColor = (type: string) => {
    switch (type) {
      case 'login': return 'bg-primary';
      case 'purchase': return 'bg-success';
      case 'error': return 'bg-destructive';
      case 'signup': return 'bg-warning';
      default: return 'bg-muted';
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4" />
          实时事件流
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[250px] overflow-y-auto">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">等待事件...</p>
          ) : (
            events.map((event) => (
              <div 
                key={event.id} 
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 animate-in slide-in-from-right-5"
              >
                <div className={cn("h-2 w-2 rounded-full", getEventColor(event.type))} />
                <span className="text-sm flex-1">{event.message}</span>
                <span className="text-xs text-muted-foreground">{event.time}</span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// 服务状态同样是静态样例；真实健康状态请走 monitoringService/getMonitoringHealth。
const ServiceStatus: React.FC = () => {
  const services = [
    { name: 'API 网关', status: 'healthy', latency: 12 },
    { name: '数据库服务', status: 'healthy', latency: 5 },
    { name: '缓存服务', status: 'healthy', latency: 2 },
    { name: '消息队列', status: 'warning', latency: 45 },
    { name: '文件存储', status: 'healthy', latency: 18 },
    { name: '搜索服务', status: 'healthy', latency: 8 },
  ];

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Server className="h-4 w-4" />
          服务状态
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {services.map((service) => (
            <div key={service.name} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  service.status === 'healthy' ? 'bg-success' : 'bg-warning'
                )} />
                <span className="text-sm">{service.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">{service.latency}ms</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// 主页面组件
export const DataScreenPage: React.FC = () => {
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { metrics, isConnected, lastUpdate, connect, disconnect } = useRealTimeData({ 
    updateInterval: 2000,
    enabled: true,
  });

  const toggleFullscreen = () => {
    // Fullscreen API 可能被浏览器策略拒绝；当前页面只同步 UI 状态，不把失败视为业务错误。
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    // 监听浏览器原生 fullscreenchange，处理用户按 Esc 退出后按钮状态不同步的问题。
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const getMetricIcon = (id: string) => {
    switch (id) {
      case 'active_users': return <Users className="h-5 w-5 text-white" />;
      case 'requests_per_second': return <Activity className="h-5 w-5 text-white" />;
      case 'response_time': return <Clock className="h-5 w-5 text-white" />;
      case 'error_rate': return <AlertTriangle className="h-5 w-5 text-white" />;
      case 'cpu_usage': return <Server className="h-5 w-5 text-white" />;
      default: return <Activity className="h-5 w-5 text-white" />;
    }
  };

  const getMetricColor = (id: string) => {
    switch (id) {
      case 'active_users': return 'bg-primary';
      case 'requests_per_second': return 'bg-success';
      case 'response_time': return 'bg-warning';
      case 'error_rate': return 'bg-destructive';
      case 'cpu_usage': return 'bg-info';
      case 'memory_usage': return 'bg-purple-500';
      default: return 'bg-muted';
    }
  };

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4",
      isFullscreen && "p-6"
    )}>
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold gradient-text">数据监控大屏</h1>
          <Badge 
            variant={isConnected ? "default" : "destructive"}
            className="flex items-center gap-1"
          >
            {isConnected ? (
              <>
                <Wifi className="h-3 w-3" />
                实时连接
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                已断开
              </>
            )}
          </Badge>
          <span className="text-xs text-muted-foreground">
            最后更新: {lastUpdate.toLocaleTimeString('zh-CN')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={isConnected ? disconnect : connect}
          >
            <RefreshCw className={cn("h-4 w-4 mr-1", isConnected && "animate-spin")} />
            {isConnected ? '暂停' : '恢复'}
          </Button>
          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
        {metrics.slice(0, 8).map((metric) => (
          <MetricCard
            key={metric.id}
            name={metric.name}
            value={metric.value}
            unit={metric.unit}
            trend={metric.trend}
            icon={getMetricIcon(metric.id)}
            color={getMetricColor(metric.id)}
          />
        ))}
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <RealTimeLineChart 
          title="在线用户趋势" 
          metricId="active_users" 
          color="hsl(var(--primary))" 
        />
        <RealTimeLineChart 
          title="请求速率趋势" 
          metricId="requests_per_second" 
          color="hsl(var(--success))" 
        />
        <RealTimeLineChart 
          title="响应时间趋势" 
          metricId="response_time" 
          color="hsl(var(--warning))" 
        />
      </div>

      {/* 底部区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RegionDistribution />
        <EventStream />
        <ServiceStatus />
      </div>
    </div>
  );
};
