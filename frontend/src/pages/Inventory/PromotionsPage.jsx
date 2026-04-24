import React from 'react';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tag, Calendar, Percent, Plus, Gift } from 'lucide-react';

const PromotionsPage = () => {
  const promotions = [
    { id: 1, name: 'Chiết khấu thanh toán sớm 5%', project: 'The Sun Avenue', status: 'active', discount: '5%', validUntil: '2026-06-30' },
    { id: 2, name: 'Tặng gói nội thất 200 triệu', project: 'Park Riverside', status: 'active', discount: '200M', validUntil: '2026-05-15' },
    { id: 3, name: 'Chiết khấu 3% khi mua 2 căn', project: 'All Projects', status: 'active', discount: '3%', validUntil: '2026-12-31' },
    { id: 4, name: 'Quà tặng Tết 2026', project: 'All Projects', status: 'ended', discount: 'Gift', validUntil: '2026-02-15' },
  ];

  return (
    <div className="space-y-6">
      <Header 
        title="Khuyến mãi" 
        subtitle="Quản lý chương trình khuyến mãi và chiết khấu"
        action={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Tạo khuyến mãi
          </Button>
        }
      />
      
      <div className="grid gap-4 md:grid-cols-2">
        {promotions.map((promo) => (
          <Card key={promo.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gift className="h-5 w-5 text-pink-500" />
                  {promo.name}
                </CardTitle>
                <Badge variant={promo.status === 'active' ? 'default' : 'secondary'}>
                  {promo.status === 'active' ? 'Đang chạy' : 'Đã kết thúc'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <span>Dự án: {promo.project}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  <span className="font-semibold text-green-600">Ưu đãi: {promo.discount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Hiệu lực đến: {promo.validUntil}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PromotionsPage;
