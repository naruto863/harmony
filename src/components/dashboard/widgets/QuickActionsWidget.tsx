import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  UserPlus, 
  FolderPlus, 
  Upload, 
  Settings,
  Zap,
} from 'lucide-react';

const quickActions = [
  { label: '新建项目', icon: FolderPlus, path: '/projects', color: 'text-primary' },
  { label: '添加用户', icon: UserPlus, path: '/users', color: 'text-success' },
  { label: '上传文件', icon: Upload, path: '/files', color: 'text-warning' },
  { label: '系统设置', icon: Settings, path: '/settings/profile', color: 'text-muted-foreground' },
];

export const QuickActionsWidget: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <Zap className="h-3.5 w-3.5 text-white" />
          </div>
          快捷操作
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              className="h-auto py-3 flex flex-col gap-1 hover:bg-accent/50"
              onClick={() => navigate(action.path)}
            >
              <action.icon className={`h-4 w-4 ${action.color}`} />
              <span className="text-xs">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
