import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  FolderKanban, 
  FileText, 
  ScrollText, 
  Search,
  Clock,
  Folder,
} from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { globalSearch, getRecentItems, SearchResult, SearchResultType } from '@/services/searchService';

const typeIcons: Record<string, React.ReactNode> = {
  User: <User className="h-4 w-4" />,
  FolderKanban: <FolderKanban className="h-4 w-4" />,
  File: <FileText className="h-4 w-4" />,
  Folder: <Folder className="h-4 w-4" />,
  ScrollText: <ScrollText className="h-4 w-4" />,
};

const typeLabels: Record<SearchResultType, string> = {
  user: '用户',
  project: '项目',
  file: '文件',
  log: '日志',
};

const typeBadgeVariants: Record<SearchResultType, 'default' | 'secondary' | 'outline'> = {
  user: 'default',
  project: 'secondary',
  file: 'outline',
  log: 'outline',
};

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const { currentTenant } = useTenant();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentItems, setRecentItems] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 加载最近访问
  useEffect(() => {
    if (open && currentTenant) {
      getRecentItems(currentTenant.id).then(setRecentItems);
    }
  }, [open, currentTenant]);

  // 搜索
  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!currentTenant || !searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await globalSearch(searchQuery, currentTenant.id);
      setResults(response.results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentTenant]);

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  // 选择结果
  const handleSelect = (result: SearchResult) => {
    navigate(result.url);
    onOpenChange(false);
    setQuery('');
  };

  // 分组结果
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<SearchResultType, SearchResult[]>);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="搜索用户、项目、文件、日志..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isLoading && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            搜索中...
          </div>
        )}
        
        {!isLoading && !query && recentItems.length > 0 && (
          <CommandGroup heading="最近访问">
            {recentItems.map(item => (
              <CommandItem
                key={item.id}
                value={item.title}
                onSelect={() => handleSelect(item)}
                className="gap-3"
              >
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!isLoading && query && results.length === 0 && (
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 py-6">
              <Search className="h-10 w-10 text-muted-foreground/50" />
              <p>没有找到匹配的结果</p>
              <p className="text-xs text-muted-foreground">尝试其他关键词</p>
            </div>
          </CommandEmpty>
        )}

        {!isLoading && Object.entries(groupedResults).map(([type, items], index) => (
          <React.Fragment key={type}>
            {index > 0 && <CommandSeparator />}
            <CommandGroup heading={typeLabels[type as SearchResultType]}>
              {items.map(item => (
                <CommandItem
                  key={item.id}
                  value={`${item.type}-${item.title}`}
                  onSelect={() => handleSelect(item)}
                  className="gap-3"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
                    {typeIcons[item.icon]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                  </div>
                  <Badge variant={typeBadgeVariants[item.type as SearchResultType]} className="ml-auto">
                    {typeLabels[item.type as SearchResultType]}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          </React.Fragment>
        ))}
      </CommandList>
    </CommandDialog>
  );
};
