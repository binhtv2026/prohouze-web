import React from 'react';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Tag, Calendar, Percent, Plus } from 'lucide-react';

const PriceListsPage = () => {
  const priceLists = [
    { id: 1, name: 'Bảng giá căn hộ Block A', project: 'The Sun Avenue', status: 'active', items: 120, lastUpdated: '2026-03-15' },
    { id: 2, name: 'Bảng giá căn hộ Block B', project: 'The Sun Avenue', status: 'active', items: 85, lastUpdated: '2026-03-10' },
    { id: 3, name: 'Bảng giá biệt thự Phase 1', project: 'Park Riverside', status: 'draft', items: 45, lastUpdated: '2026-03-08' },
    { id: 4, name: 'Bảng giá shophouse', project: 'Central Mall', status: 'pending', items: 32, lastUpdated: '2026-03-05' },
  ];

  return (
    <div className="space-y-6">
      <Header 
        title="Bảng giá" 
        subtitle="Quản lý bảng giá theo dự án và loại sản phẩm"
        action={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Tạo bảng giá mới
          </Button>
        }
      />
      
      <div className="grid gap-4 md:grid-cols-2">
        {priceLists.map((list) => (
          <Card key={list.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{list.name}</CardTitle>
                <Badge variant={list.status === 'active' ? 'default' : list.status === 'draft' ? 'secondary' : 'outline'}>
                  {list.status === 'active' ? 'Đang áp dụng' : list.status === 'draft' ? 'Nháp' : 'Chờ duyệt'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <span>Dự án: {list.project}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span>{list.items} sản phẩm</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Cập nhật: {list.lastUpdated}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PriceListsPage;
