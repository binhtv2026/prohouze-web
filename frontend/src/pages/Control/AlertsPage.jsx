import React from 'react';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const AlertsPage = () => {
  const alerts = [
    { id: 1, type: 'warning', title: '8 leads nóng chưa liên hệ', description: 'Ưu tiên liên hệ hôm nay', time: '2 giờ trước' },
    { id: 2, type: 'info', title: 'Có 3 hợp đồng sắp hết hạn', description: 'Cần gia hạn trong 7 ngày', time: '5 giờ trước' },
    { id: 3, type: 'success', title: 'KPI tháng đạt 85%', description: 'Tiến độ tốt, tiếp tục phát huy', time: '1 ngày trước' },
    { id: 4, type: 'warning', title: '2 task quá hạn', description: 'Cần xử lý gấp', time: '1 ngày trước' },
  ];

  const getIcon = (type) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Header 
        title="Alerts & Notifications" 
        subtitle="Theo dõi các cảnh báo và thông báo quan trọng"
      />
      
      <div className="grid gap-4">
        {alerts.map((alert) => (
          <Card key={alert.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {getIcon(alert.type)}
                <div className="flex-1">
                  <h3 className="font-semibold">{alert.title}</h3>
                  <p className="text-sm text-muted-foreground">{alert.description}</p>
                  <span className="text-xs text-muted-foreground">{alert.time}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AlertsPage;
