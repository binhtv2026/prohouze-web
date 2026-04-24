import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserPlus,
  UserCheck,
  TrendingUp,
  Phone,
  Mail,
} from 'lucide-react';

export default function CustomersDashboard() {
  const { token, user } = useAuth();

  return (
    <div className="space-y-6" data-testid="customers-dashboard">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Khách hàng</h1>
        <p className="text-slate-500 text-sm mt-1">Tổng quan quản lý khách hàng và leads</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-xs text-blue-600">Tổng Lead</p>
                <p className="text-2xl font-bold text-blue-700">1,250</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <UserCheck className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-xs text-green-600">Khách hàng</p>
                <p className="text-2xl font-bold text-green-700">340</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <UserPlus className="h-6 w-6 text-amber-600" />
              <div>
                <p className="text-xs text-amber-600">Lead mới (tuần)</p>
                <p className="text-2xl font-bold text-amber-700">45</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-purple-600" />
              <div>
                <p className="text-xs text-purple-600">Tỷ lệ chuyển đổi</p>
                <p className="text-2xl font-bold text-purple-700">27.2%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Leads */}
      <Card>
        <CardHeader>
          <CardTitle>Lead mới nhất</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Nguyễn Văn A', phone: '0901234567', source: 'Facebook', time: '5 phút trước' },
              { name: 'Trần Thị B', phone: '0912345678', source: 'Google', time: '15 phút trước' },
              { name: 'Lê Văn C', phone: '0923456789', source: 'Zalo', time: '30 phút trước' },
              { name: 'Phạm Thị D', phone: '0934567890', source: 'Website', time: '1 giờ trước' },
            ].map((lead, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="font-semibold text-blue-600">{lead.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium">{lead.name}</p>
                    <p className="text-xs text-slate-500">{lead.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline">{lead.source}</Badge>
                  <p className="text-xs text-slate-400 mt-1">{lead.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
