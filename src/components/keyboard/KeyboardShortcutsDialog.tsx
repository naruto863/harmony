import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Keyboard } from 'lucide-react';

interface ShortcutItem {
  keys: string[];
  description: string;
  category?: string;
}

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

const shortcuts: ShortcutItem[] = [
  // 导航
  { keys: [isMac ? '⌘' : 'Ctrl', 'K'], description: 'shortcuts.search', category: 'shortcuts.navigation' },
  { keys: [isMac ? '⌘' : 'Ctrl', 'G'], description: 'shortcuts.goToPage', category: 'shortcuts.navigation' },
  { keys: ['Esc'], description: 'shortcuts.closeDialog', category: 'shortcuts.navigation' },
  { keys: [isMac ? '⌘' : 'Ctrl', 'Shift', 'B'], description: 'shortcuts.toggleSidebar', category: 'shortcuts.navigation' },
  
  // 操作
  { keys: [isMac ? '⌘' : 'Ctrl', 'N'], description: 'shortcuts.newItem', category: 'shortcuts.actions' },
  { keys: [isMac ? '⌘' : 'Ctrl', 'S'], description: 'shortcuts.save', category: 'shortcuts.actions' },
  { keys: [isMac ? '⌘' : 'Ctrl', 'E'], description: 'shortcuts.export', category: 'shortcuts.actions' },
  
  // 表格
  { keys: ['↑', '↓'], description: 'shortcuts.navigateRows', category: 'shortcuts.table' },
  { keys: ['Space'], description: 'shortcuts.selectRow', category: 'shortcuts.table' },
  { keys: [isMac ? '⌘' : 'Ctrl', 'A'], description: 'shortcuts.selectAll', category: 'shortcuts.table' },
];

export const KeyboardShortcutsDialog: React.FC<KeyboardShortcutsDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { t } = useTranslation();

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'shortcuts.other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, ShortcutItem[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            {t('shortcuts.title')}
          </DialogTitle>
          <DialogDescription>
            {t('shortcuts.description')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          {Object.entries(groupedShortcuts).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                {t(category)}
              </h4>
              <div className="space-y-2">
                {items.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50"
                  >
                    <span className="text-sm">{t(shortcut.description)}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          <Badge variant="outline" className="px-2 py-0.5 text-xs font-mono">
                            {key}
                          </Badge>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-muted-foreground text-xs">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
