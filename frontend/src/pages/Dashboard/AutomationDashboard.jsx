import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  Bot,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function AutomationDashboard() {
  const { token, user } = useAuth();

  return (
    <div className="space-y-6" data-testid="automation-dashboard">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard AI & Automation</h1>
        <p className="text-slate-500 text-sm mt-1">Tổng quan tự động hóa và AI</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-purple-50 border-purple-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Zap className="h-6 w-6 text-purple-600" />
              <div>
                <p className="text-xs text-purple-600">Rules hoạt động</p>
                <p className="text-2xl font-bold text-purple-700">24</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Bot className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-xs text-blue-600">AI Conversations</p>
                <p className="text-2xl font-bold text-blue-700">1,250</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-xs text-green-600">Hiệu suất</p>
                <p className="text-2xl font-bold text-green-700">92%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-amber-600" />
              <div>
                <p className="text-xs text-amber-600">Thời gian tiết kiệm</p>
                <p className="text-2xl font-bold text-amber-700">120h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automation Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Automation Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Tự động phân bổ Lead', triggers: 450, status: 'active' },
              { name: 'Gửi email chào mừng', triggers: 320, status: 'active' },
              { name: 'Nhắc follow-up Lead', triggers: 180, status: 'active' },
              { name: 'Tạo task cho Sales', triggers: 150, status: 'paused' },
            ].map((rule, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {rule.status === 'active' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                  <div>
                    <p className="font-medium">{rule.name}</p>
                    <p className="text-xs text-slate-500">{rule.triggers} lần kích hoạt</p>
                  </div>
                </div>
                <Badge className={rule.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                  {rule.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
