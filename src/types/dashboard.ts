export type WidgetType =
  | 'stats'
  | 'user-growth'
  | 'project-status'
  | 'activity-heatmap'
  | 'recent-activity'
  | 'quick-actions'
  | 'system-info';

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  visible: boolean;
}

export const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'stats', type: 'stats', title: '统计概览', visible: true },
  { id: 'user-growth', type: 'user-growth', title: '用户增长趋势', visible: true },
  { id: 'project-status', type: 'project-status', title: '项目状态分布', visible: true },
  { id: 'activity-heatmap', type: 'activity-heatmap', title: '活动热力图', visible: true },
  { id: 'recent-activity', type: 'recent-activity', title: '最近活动', visible: true },
  { id: 'quick-actions', type: 'quick-actions', title: '快捷操作', visible: true },
  { id: 'system-info', type: 'system-info', title: '系统信息', visible: true },
];
