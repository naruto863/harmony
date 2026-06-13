import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  Bell,
  Check,
  Clock,
  Eye,
  Globe,
  Laptop,
  Mail,
  MapPin,
  Monitor,
  Settings2,
  Shield,
  Smartphone,
  Tablet,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getAnomalyDetectionSettings,
  updateAnomalyDetectionSettings,
  getLoginAlerts,
  getKnownDevices,
  markAlertAsRead,
  resolveAlert,
  deleteAlert,
  removeDevice,
  trustDevice,
  AnomalyDetectionSettings,
  LoginAlert,
  DeviceInfo,
} from '@/services/securityService';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const DeviceIcon: React.FC<{ type: DeviceInfo['deviceType'] }> = ({ type }) => {
  switch (type) {
    case 'mobile':
      return <Smartphone className="h-4 w-4" />;
    case 'tablet':
      return <Tablet className="h-4 w-4" />;
    default:
      return <Monitor className="h-4 w-4" />;
  }
};

const AlertSeverityBadge: React.FC<{ severity: LoginAlert['severity'] }> = ({ severity }) => {
  const variants: Record<string, string> = {
    low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    high: 'bg-red-500/10 text-red-500 border-red-500/20',
  };
  const labels: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
  };
  return (
    <Badge variant="outline" className={variants[severity]}>
      {labels[severity]}
    </Badge>
  );
};

const AlertTypeIcon: React.FC<{ type: LoginAlert['type'] }> = ({ type }) => {
  switch (type) {
    case 'new_device':
      return <Laptop className="h-4 w-4" />;
    case 'new_location':
      return <MapPin className="h-4 w-4" />;
    case 'suspicious_time':
      return <Clock className="h-4 w-4" />;
    case 'ip_change':
      return <Globe className="h-4 w-4" />;
    default:
      return <AlertTriangle className="h-4 w-4" />;
  }
};

export const AnomalyDetectionCard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [settings, setSettings] = useState<AnomalyDetectionSettings | null>(null);
  const [alerts, setAlerts] = useState<LoginAlert[]>([]);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showDevices, setShowDevices] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<LoginAlert | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [settingsData, alertsData, devicesData] = await Promise.all([
        getAnomalyDetectionSettings(),
        user?.email ? getLoginAlerts(user.email) : Promise.resolve([]),
        user?.email ? getKnownDevices(user.email) : Promise.resolve([]),
      ]);
      setSettings(settingsData);
      setAlerts(alertsData);
      setDevices(devicesData);
    } catch (error) {
      toast.error(t('errors.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEnabled = async (enabled: boolean) => {
    try {
      await updateAnomalyDetectionSettings({ enabled });
      setSettings(prev => prev ? { ...prev, enabled } : null);
      toast.success(enabled ? t('common.enabled') : t('common.disabled'));
    } catch (error) {
      toast.error(t('errors.networkError'));
    }
  };

  const handleToggleSetting = async <K extends keyof AnomalyDetectionSettings>(
    key: K,
    value: AnomalyDetectionSettings[K]
  ) => {
    try {
      await updateAnomalyDetectionSettings({ [key]: value });
      setSettings(prev => prev ? { ...prev, [key]: value } : null);
    } catch (error) {
      toast.error(t('errors.networkError'));
    }
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await markAlertAsRead(alertId);
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isRead: true } : a));
    } catch (error) {
      toast.error(t('errors.networkError'));
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await resolveAlert(alertId);
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isResolved: true } : a));
      toast.success(t('settings.security.alertResolved'));
    } catch (error) {
      toast.error(t('errors.networkError'));
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      await deleteAlert(alertId);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      setSelectedAlert(null);
      toast.success(t('success.deleted'));
    } catch (error) {
      toast.error(t('errors.networkError'));
    }
  };

  const handleTrustDevice = async (deviceId: string) => {
    if (!user?.email) return;
    try {
      await trustDevice(user.email, deviceId);
      setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, isTrusted: true } : d));
      toast.success(t('settings.security.deviceTrusted'));
    } catch (error) {
      toast.error(t('errors.networkError'));
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    if (!user?.email) return;
    try {
      await removeDevice(user.email, deviceId);
      setDevices(prev => prev.filter(d => d.id !== deviceId));
      toast.success(t('success.deleted'));
    } catch (error) {
      toast.error(t('errors.networkError'));
    }
  };

  const unreadCount = alerts.filter(a => !a.isRead).length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-48 bg-muted animate-pulse rounded mt-2" />
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{t('settings.security.anomalyDetection')}</CardTitle>
                <CardDescription>{t('settings.security.anomalyDetectionDesc')}</CardDescription>
              </div>
            </div>
            <Switch
              checked={settings?.enabled}
              onCheckedChange={handleToggleEnabled}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 提醒概览 */}
          {alerts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  {t('settings.security.recentAlerts')}
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="h-5 px-1.5">
                      {unreadCount}
                    </Badge>
                  )}
                </h4>
              </div>

              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {alerts.slice(0, 5).map(alert => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                        !alert.isRead ? 'bg-primary/5 border-primary/20' : ''
                      } ${alert.isResolved ? 'opacity-60' : ''}`}
                      onClick={() => {
                        setSelectedAlert(alert);
                        if (!alert.isRead) handleMarkAsRead(alert.id);
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <AlertTypeIcon type={alert.type} />
                          <div>
                            <div className="text-sm font-medium flex items-center gap-2">
                              {alert.title}
                              {alert.isResolved && (
                                <Badge variant="outline" className="bg-green-500/10 text-green-500">
                                  <Check className="h-3 w-3 mr-1" />
                                  {t('settings.security.resolved')}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatDistanceToNow(new Date(alert.timestamp), {
                                addSuffix: true,
                                locale: zhCN,
                              })}
                            </p>
                          </div>
                        </div>
                        <AlertSeverityBadge severity={alert.severity} />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {alerts.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('settings.security.noAlerts')}</p>
            </div>
          )}

          <Separator />

          {/* 检测选项 */}
          {settings?.enabled && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">{t('settings.security.detectionOptions')}</h4>
              <div className="grid gap-2">
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Laptop className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{t('settings.security.detectNewDevice')}</span>
                  </div>
                  <Switch
                    checked={settings.detectNewDevice}
                    onCheckedChange={(v) => handleToggleSetting('detectNewDevice', v)}
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{t('settings.security.detectNewLocation')}</span>
                  </div>
                  <Switch
                    checked={settings.detectNewLocation}
                    onCheckedChange={(v) => handleToggleSetting('detectNewLocation', v)}
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{t('settings.security.detectSuspiciousTime')}</span>
                  </div>
                  <Switch
                    checked={settings.detectSuspiciousTime}
                    onCheckedChange={(v) => handleToggleSetting('detectSuspiciousTime', v)}
                  />
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* 操作按钮 */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDevices(true)}
            >
              <Laptop className="h-4 w-4 mr-2" />
              {t('settings.security.manageDevices')}
              <Badge variant="secondary" className="ml-2">
                {devices.length}
              </Badge>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(true)}
            >
              <Settings2 className="h-4 w-4 mr-2" />
              {t('settings.security.notificationSettings')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 提醒详情对话框 */}
      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTypeIcon type={selectedAlert?.type || 'new_device'} />
              {selectedAlert?.title}
            </DialogTitle>
            <DialogDescription>
              {formatDistanceToNow(new Date(selectedAlert?.timestamp || Date.now()), {
                addSuffix: true,
                locale: zhCN,
              })}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertSeverityBadge severity={selectedAlert?.severity || 'low'} />
              {selectedAlert?.isResolved && (
                <Badge variant="outline" className="bg-green-500/10 text-green-500">
                  <Check className="h-3 w-3 mr-1" />
                  {t('settings.security.resolved')}
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground">{selectedAlert?.description}</p>

            {selectedAlert?.deviceInfo && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <h5 className="text-sm font-medium mb-2">{t('settings.security.deviceDetails')}</h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">{t('settings.sessions.browser')}:</div>
                  <div>{selectedAlert.deviceInfo.browser}</div>
                  <div className="text-muted-foreground">{t('settings.security.os')}:</div>
                  <div>{selectedAlert.deviceInfo.os}</div>
                </div>
              </div>
            )}

            {selectedAlert?.locationInfo && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <h5 className="text-sm font-medium mb-2">{t('settings.security.locationDetails')}</h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">{t('settings.sessions.location')}:</div>
                  <div>{selectedAlert.locationInfo.city}, {selectedAlert.locationInfo.country}</div>
                  <div className="text-muted-foreground">IP:</div>
                  <div>{selectedAlert.locationInfo.ip}</div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedAlert && handleDeleteAlert(selectedAlert.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {t('common.delete')}
              </Button>
              {!selectedAlert?.isResolved && (
                <Button
                  size="sm"
                  onClick={() => selectedAlert && handleResolveAlert(selectedAlert.id)}
                >
                  <Check className="h-4 w-4 mr-1" />
                  {t('settings.security.markResolved')}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 设备管理对话框 */}
      <Dialog open={showDevices} onOpenChange={setShowDevices}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('settings.security.knownDevices')}</DialogTitle>
            <DialogDescription>{t('settings.security.knownDevicesDesc')}</DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-3">
              {devices.map(device => (
                <div
                  key={device.id}
                  className="p-3 border rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <DeviceIcon type={device.deviceType} />
                      </div>
                      <div>
                        <div className="text-sm font-medium flex items-center gap-2">
                          {device.browser} on {device.os}
                          {device.isTrusted && (
                            <Badge variant="outline" className="bg-green-500/10 text-green-500 text-xs">
                              <Check className="h-3 w-3 mr-0.5" />
                              {t('settings.security.trusted')}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {t('settings.security.lastSeen')}: {formatDistanceToNow(new Date(device.lastSeen), {
                            addSuffix: true,
                            locale: zhCN,
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    {!device.isTrusted && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTrustDevice(device.id)}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        {t('settings.security.trust')}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDevice(device.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      {t('common.delete')}
                    </Button>
                  </div>
                </div>
              ))}
              
              {devices.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <Laptop className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t('settings.security.noDevices')}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* 通知设置对话框 */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('settings.security.notificationSettings')}</DialogTitle>
            <DialogDescription>{t('settings.security.notificationSettingsDesc')}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">{t('settings.security.emailNotify')}</div>
                  <div className="text-xs text-muted-foreground">{t('settings.security.emailNotifyDesc')}</div>
                </div>
              </div>
              <Switch
                checked={settings?.notifyByEmail}
                onCheckedChange={(v) => handleToggleSetting('notifyByEmail', v)}
              />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">{t('settings.security.inAppNotify')}</div>
                  <div className="text-xs text-muted-foreground">{t('settings.security.inAppNotifyDesc')}</div>
                </div>
              </div>
              <Switch
                checked={settings?.notifyInApp}
                onCheckedChange={(v) => handleToggleSetting('notifyInApp', v)}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <h5 className="text-sm font-medium">{t('settings.security.suspiciousTimeRange')}</h5>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={settings?.suspiciousTimeStart ?? 0}
                  onChange={(e) => handleToggleSetting('suspiciousTimeStart', parseInt(e.target.value))}
                  className="w-20"
                />
                <span className="text-muted-foreground">:00 -</span>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={settings?.suspiciousTimeEnd ?? 6}
                  onChange={(e) => handleToggleSetting('suspiciousTimeEnd', parseInt(e.target.value))}
                  className="w-20"
                />
                <span className="text-muted-foreground">:00</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('settings.security.suspiciousTimeHint')}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
