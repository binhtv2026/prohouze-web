import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Search, Plus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

export default function Header({ title, onSearch, onAddNew, addNewLabel }) {
  const { user } = useAuth();
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = (e) => {
    setSearchValue(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-40 flex items-center px-6 justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-slate-900" data-testid="page-title">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        {onSearch && (
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchValue}
              onChange={handleSearch}
              data-testid="search-input"
              className="pl-9 h-9 bg-slate-50 border-slate-200 focus:bg-white"
            />
          </div>
        )}

        {/* Add New Button */}
        {onAddNew && (
          <Button
            onClick={onAddNew}
            data-testid="add-new-btn"
            className="h-9 bg-[#316585] hover:bg-[#264f68] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            {addNewLabel || 'Thêm mới'}
          </Button>
        )}

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" data-testid="notifications-btn">
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                3
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Thông báo</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium">Lead mới từ Facebook</span>
              <span className="text-xs text-slate-500">Nguyễn Văn A vừa đăng ký quan tâm dự án Sky Garden</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium">Nhắc nhở liên hệ</span>
              <span className="text-xs text-slate-500">3 lead cần liên hệ lại hôm nay</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium">KPI tháng này</span>
              <span className="text-xs text-slate-500">Bạn đã đạt 75% chỉ tiêu</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* AI Assistant Quick Access */}
        <Button
          variant="outline"
          size="icon"
          className="border-[#316585]/30 text-[#316585] hover:bg-[#316585]/10"
          data-testid="ai-quick-btn"
        >
          <MessageSquare className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
