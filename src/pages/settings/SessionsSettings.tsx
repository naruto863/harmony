import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Globe, 
  Clock, 
  MapPin, 
  Trash2,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  getUserSessions,
  terminateSession,
  terminateOtherSessions,
  Session,
} from '@/services/securityService';
import { cn } from '@/lib/utils';

const deviceIcons: Record<Session['deviceType'], React.ReactNode> = {
  desktop: <Monitor className="h-5 w-5" />,
  mobile: <Smartphone className="h-5 w-5" />,
  tablet: <Tablet className="h-5 w-5" />,
};

const formatLastActive = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
};

export const SessionsSettings: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [terminatingId, setTerminatingId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'single' | 'all';
    sessionId?: string;
  }>({ open: false, type: 'single' });

  useEffect(() => {
    loadSessions();
  }, [user]);

  const loadSessions = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const data = await getUserSessions(user.id);
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    setTerminatingId(sessionId);
    try {
      await terminateSession(sessionId);
      await loadSessions();
      toast({
        title: t('success.deleted'),
      });
    } catch (error) {
      toast({
        title: t('errors.serverError'),
        variant: 'destructive',
      });
    } finally {
      setTerminatingId(null);
      setConfirmDialog({ open: false, type: 'single' });
    }
  };

  const handleTerminateOthers = async () => {
    if (!user) return;
    
    setTerminatingId('all');
    try {
      const count = await terminateOtherSessions(user.id);
      await loadSessions();
      toast({
        title: `已终止 ${count} 个会话`,
      });
    } catch (error) {
      toast({
        title: t('errors.serverError'),
        variant: 'destructive',
      });
    } finally {
      setTerminatingId(null);
      setConfirmDialog({ open: false, type: 'all' });
    }
  };

  const otherSessions = sessions.filter(s => !s.isCurrent);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('settings.sessions.title')}</h1>
          <p className="text-muted-foreground">{t('settings.sessions.description')}</p>
        </div>
        {otherSessions.length > 0 && (
          <Button
            variant="destructive"
            onClick={() => setConfirmDialog({ open: true, type: 'all' })}
            disabled={terminatingId === 'all'}
          >
            {terminatingId === 'all' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <ShieldAlert className="h-4 w-4 mr-2" />
            {t('settings.sessions.terminateOthers')}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.sessions.activeSessions')}</CardTitle>
          <CardDescription>
            {sessions.length} 个活跃会话
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.map(session => (
            <div
              key={session.id}
              className={cn(
                'flex items-start gap-4 p-4 rounded-lg border',
                session.isCurrent && 'bg-primary/5 border-primary/20'
              )}
            >
              <div className={cn(
                'h-12 w-12 rounded-lg flex items-center justify-center',
                session.isCurrent ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              )}>
                {deviceIcons[session.deviceType]}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{session.device}</h4>
                  {session.isCurrent && (
                    <Badge variant="default" className="text-xs">
                      {t('settings.sessions.currentSession')}
                    </Badge>
                  )}
                </div>
                
                <div className="mt-1 text-sm text-muted-foreground">
                  <p>{session.browser} · {session.os}</p>
                </div>
                
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {session.ipAddress}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {session.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatLastActive(session.lastActiveAt)}
                  </span>
                </div>
              </div>
              
              {!session.isCurrent && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => setConfirmDialog({ 
                    open: true, 
                    type: 'single', 
                    sessionId: session.id 
                  })}
                  disabled={terminatingId === session.id}
                >
                  {terminatingId === session.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          ))}
          
          {sessions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {t('common.noData')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 确认对话框 */}
      <AlertDialog 
        open={confirmDialog.open} 
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.type === 'all' 
                ? t('settings.sessions.terminateOthers')
                : t('settings.sessions.terminateSession')
              }
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.type === 'all'
                ? t('settings.sessions.terminateOthersConfirm')
                : t('settings.sessions.terminateConfirm')
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmDialog.type === 'all') {
                  handleTerminateOthers();
                } else if (confirmDialog.sessionId) {
                  handleTerminateSession(confirmDialog.sessionId);
                }
              }}
            >
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
