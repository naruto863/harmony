import { useState, useEffect, useCallback, useRef } from 'react';

export interface RealTimeMetric {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  timestamp: Date;
}

export interface RealTimeDataConfig {
  updateInterval?: number; // 更新间隔（毫秒）
  enabled?: boolean;
}

// 模拟实时数据生成
const generateMetricValue = (baseValue: number, variance: number): number => {
  const change = (Math.random() - 0.5) * variance;
  return Math.max(0, baseValue + change);
};

const getTrend = (current: number, previous: number): 'up' | 'down' | 'stable' => {
  const diff = current - previous;
  if (Math.abs(diff) < 0.5) return 'stable';
  return diff > 0 ? 'up' : 'down';
};

// 初始指标数据
const initialMetrics: RealTimeMetric[] = [
  { id: 'active_users', name: '在线用户', value: 1234, previousValue: 1234, unit: '人', trend: 'stable', timestamp: new Date() },
  { id: 'requests_per_second', name: '请求速率', value: 856, previousValue: 856, unit: 'req/s', trend: 'stable', timestamp: new Date() },
  { id: 'response_time', name: '响应时间', value: 45, previousValue: 45, unit: 'ms', trend: 'stable', timestamp: new Date() },
  { id: 'error_rate', name: '错误率', value: 0.12, previousValue: 0.12, unit: '%', trend: 'stable', timestamp: new Date() },
  { id: 'cpu_usage', name: 'CPU使用率', value: 62, previousValue: 62, unit: '%', trend: 'stable', timestamp: new Date() },
  { id: 'memory_usage', name: '内存使用率', value: 78, previousValue: 78, unit: '%', trend: 'stable', timestamp: new Date() },
  { id: 'bandwidth', name: '带宽使用', value: 245, previousValue: 245, unit: 'MB/s', trend: 'stable', timestamp: new Date() },
  { id: 'queue_length', name: '队列长度', value: 12, previousValue: 12, unit: '个', trend: 'stable', timestamp: new Date() },
];

const metricConfigs = {
  active_users: { base: 1200, variance: 100 },
  requests_per_second: { base: 850, variance: 150 },
  response_time: { base: 45, variance: 20 },
  error_rate: { base: 0.15, variance: 0.1 },
  cpu_usage: { base: 60, variance: 15 },
  memory_usage: { base: 75, variance: 10 },
  bandwidth: { base: 240, variance: 50 },
  queue_length: { base: 10, variance: 8 },
};

export const useRealTimeData = (config: RealTimeDataConfig = {}) => {
  const { updateInterval = 2000, enabled = true } = config;
  const [metrics, setMetrics] = useState<RealTimeMetric[]>(initialMetrics);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateMetrics = useCallback(() => {
    setMetrics(prevMetrics => 
      prevMetrics.map(metric => {
        const config = metricConfigs[metric.id as keyof typeof metricConfigs];
        if (!config) return metric;

        const newValue = generateMetricValue(config.base, config.variance);
        const roundedValue = metric.id === 'error_rate' 
          ? Math.round(newValue * 100) / 100 
          : Math.round(newValue);

        return {
          ...metric,
          previousValue: metric.value,
          value: roundedValue,
          trend: getTrend(roundedValue, metric.value),
          timestamp: new Date(),
        };
      })
    );
    setLastUpdate(new Date());
  }, []);

  const connect = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    setIsConnected(true);
    intervalRef.current = setInterval(updateMetrics, updateInterval);
  }, [updateInterval, updateMetrics]);

  const disconnect = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  const getMetricById = useCallback((id: string) => {
    return metrics.find(m => m.id === id);
  }, [metrics]);

  return {
    metrics,
    isConnected,
    lastUpdate,
    connect,
    disconnect,
    getMetricById,
  };
};

// 实时图表数据 Hook
export interface ChartDataPoint {
  time: string;
  value: number;
}

export const useRealTimeChartData = (
  metricId: string,
  maxPoints: number = 20,
  updateInterval: number = 2000
) => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const { getMetricById, isConnected } = useRealTimeData({ updateInterval });

  useEffect(() => {
    const interval = setInterval(() => {
      const metric = getMetricById(metricId);
      if (metric) {
        setChartData(prev => {
          const newPoint = {
            time: new Date().toLocaleTimeString('zh-CN', { 
              hour: '2-digit', 
              minute: '2-digit', 
              second: '2-digit' 
            }),
            value: metric.value,
          };
          const newData = [...prev, newPoint];
          return newData.slice(-maxPoints);
        });
      }
    }, updateInterval);

    return () => clearInterval(interval);
  }, [metricId, maxPoints, updateInterval, getMetricById]);

  return { chartData, isConnected };
};
