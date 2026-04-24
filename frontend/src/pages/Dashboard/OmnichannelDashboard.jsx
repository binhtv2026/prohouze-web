import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Users,
  Building2,
  Package,
  Share2,
  Layers,
} from 'lucide-react';

export default function OmnichannelDashboard() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <div className="space-y-6" data-testid="omnichannel-dashboard">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Omnichannel</h1>
        <p className="text-slate-500 text-sm mt-1">Tổng quan marketing đa kênh</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Share2 className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-xs text-blue-600">Kênh hoạt động</p>
                <p className="text-2xl font-bold text-blue-700">8</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-xs text-green-600">Lead từ MKT</p>
                <p className="text-2xl font-bold text-green-700">1,250</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Layers className="h-6 w-6 text-purple-600" />
              <div>
                <p className="text-xs text-purple-600">Chiến dịch</p>
                <p className="text-2xl font-bold text-purple-700">12</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-amber-600" />
              <div>
                <p className="text-xs text-amber-600">Tỷ lệ chuyển đổi</p>
                <p className="text-2xl font-bold text-amber-700">15.2%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Hiệu suất các kênh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Facebook Ads', leads: 450, conversion: 18.5, spend: '25 tr' },
              { name: 'Google Ads', leads: 320, conversion: 22.1, spend: '35 tr' },
              { name: 'Zalo OA', leads: 180, conversion: 12.3, spend: '10 tr' },
              { name: 'Website SEO', leads: 150, conversion: 25.0, spend: '5 tr' },
              { name: 'Hotline', leads: 150, conversion: 35.0, spend: '8 tr' },
            ].map((channel, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium">{channel.name}</p>
                  <p className="text-xs text-slate-500">{channel.leads} leads | Chi phí: {channel.spend}</p>
                </div>
                <Badge className="bg-green-100 text-green-700">{channel.conversion}%</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
