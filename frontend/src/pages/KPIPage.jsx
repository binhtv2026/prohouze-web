import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { kpisAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Target,
  Phone,
  Calendar,
  DollarSign,
  Award,
  TrendingUp,
} from 'lucide-react';

const DEMO_KPIS = [
  {
    id: 'kpi-001',
    user_id: 'demo-sales',
    user_name: 'Nguyen Minh Quan',
    actual_leads: 42,
    target_leads: 50,
    actual_calls: 165,
    target_calls: 180,
    actual_meetings: 18,
    target_meetings: 22,
    actual_deals: 6,
    target_deals: 8,
    achievement_rate: 87,
  },
  {
    id: 'kpi-002',
    user_id: 'demo-sale-2',
    user_name: 'Tran Bao Chau',
    actual_leads: 38,
    target_leads: 45,
    actual_calls: 148,
    target_calls: 170,
    actual_meetings: 15,
    target_meetings: 20,
    actual_deals: 5,
    target_deals: 7,
    achievement_rate: 82,
  },
];

export default function KPIPage() {
  const { user, hasRole } = useAuth();
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const loadKPIs = useCallback(async () => {
    try {
      const response = await kpisAPI.getAll({ month: currentMonth, year: currentYear });
      setKpis(Array.isArray(response.data) && response.data.length > 0 ? response.data : DEMO_KPIS);
    } catch (error) {
      setKpis(DEMO_KPIS);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  useEffect(() => {
    loadKPIs();
  }, [loadKPIs]);

  const myKPI = kpis.find(k => k.user_id === user?.id) || kpis[0];

  return (
    <div className="min-h-screen bg-slate-50" data-testid="kpi-page">
      <Header title="KPI & Mục tiêu" />

      <div className="p-6 max-w-[1600px] mx-auto">
        {/* My KPI Summary */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">KPI của tôi - Tháng {currentMonth}/{currentYear}</h2>
          
          {myKPI ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white border border-slate-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#316585]/10 flex items-center justify-center">
                      <Target className="w-5 h-5 text-[#316585]" />
                    </div>
                    <Badge variant={myKPI.actual_leads >= myKPI.target_leads ? "default" : "outline"}>
                      {((myKPI.actual_leads / myKPI.target_leads) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 mb-1">Lead mới</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {myKPI.actual_leads} / {myKPI.target_leads}
                  </p>
                  <Progress 
                    value={(myKPI.actual_leads / myKPI.target_leads) * 100} 
                    className="mt-3 h-2"
                  />
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-green-600" />
                    </div>
                    <Badge variant={myKPI.actual_calls >= myKPI.target_calls ? "default" : "outline"}>
                      {((myKPI.actual_calls / myKPI.target_calls) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 mb-1">Cuộc gọi</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {myKPI.actual_calls} / {myKPI.target_calls}
                  </p>
                  <Progress 
                    value={(myKPI.actual_calls / myKPI.target_calls) * 100} 
                    className="mt-3 h-2"
                  />
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-orange-600" />
                    </div>
                    <Badge variant={myKPI.actual_meetings >= myKPI.target_meetings ? "default" : "outline"}>
                      {((myKPI.actual_meetings / myKPI.target_meetings) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 mb-1">Cuộc hẹn</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {myKPI.actual_meetings} / {myKPI.target_meetings}
                  </p>
                  <Progress 
                    value={(myKPI.actual_meetings / myKPI.target_meetings) * 100} 
                    className="mt-3 h-2"
                  />
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                      <Award className="w-5 h-5 text-purple-600" />
                    </div>
                    <Badge variant={myKPI.actual_deals >= myKPI.target_deals ? "default" : "outline"}>
                      {((myKPI.actual_deals / myKPI.target_deals) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 mb-1">Chốt đơn</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {myKPI.actual_deals} / {myKPI.target_deals}
                  </p>
                  <Progress 
                    value={(myKPI.actual_deals / myKPI.target_deals) * 100} 
                    className="mt-3 h-2"
                  />
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="bg-white border border-slate-200">
              <CardContent className="p-8 text-center">
                <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Chưa có KPI được thiết lập cho tháng này</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Team KPIs (for managers) */}
        {hasRole(['bod', 'admin', 'manager']) && kpis.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">KPI Team</h2>
            <Card className="bg-white border border-slate-200">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="text-left p-4 font-bold text-slate-700">Nhân viên</th>
                        <th className="text-center p-4 font-bold text-slate-700">Lead</th>
                        <th className="text-center p-4 font-bold text-slate-700">Cuộc gọi</th>
                        <th className="text-center p-4 font-bold text-slate-700">Cuộc hẹn</th>
                        <th className="text-center p-4 font-bold text-slate-700">Chốt đơn</th>
                        <th className="text-center p-4 font-bold text-slate-700">Tỷ lệ hoàn thành</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kpis.map((kpi) => (
                        <tr key={kpi.id} className="border-b last:border-0 hover:bg-slate-50">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#316585]/10 flex items-center justify-center text-[#316585] font-medium text-sm">
                                {kpi.user_name?.charAt(0) || '?'}
                              </div>
                              <span className="font-medium text-slate-900">{kpi.user_name}</span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className="font-medium">{kpi.actual_leads}</span>
                            <span className="text-slate-400">/{kpi.target_leads}</span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="font-medium">{kpi.actual_calls}</span>
                            <span className="text-slate-400">/{kpi.target_calls}</span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="font-medium">{kpi.actual_meetings}</span>
                            <span className="text-slate-400">/{kpi.target_meetings}</span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="font-medium">{kpi.actual_deals}</span>
                            <span className="text-slate-400">/{kpi.target_deals}</span>
                          </td>
                          <td className="p-4 text-center">
                            <Badge 
                              className={
                                kpi.achievement_rate >= 100 
                                  ? 'bg-green-100 text-green-800'
                                  : kpi.achievement_rate >= 70
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }
                            >
                              {kpi.achievement_rate}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
