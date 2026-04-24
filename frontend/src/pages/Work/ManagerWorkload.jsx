/**
 * Manager Workload Dashboard
 * Shows team workload, bottlenecks, and performance
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, AlertTriangle, CheckCircle, Clock, 
  BarChart3, TrendingUp, AlertOctagon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { toast } from 'sonner';
import { getManagerWorkload } from '../../lib/workApi';

const DEMO_MANAGER_WORKLOAD = {
  total_team_tasks: 42,
  total_overdue: 4,
  total_completed_today: 11,
  team_completion_rate: 76,
  users: [
    { user_id: 'mgr-user-1', user_name: 'Nguyễn Minh Anh', total_active: 8, overdue: 1, completed_today: 3, completion_rate: 82, is_overloaded: false },
    { user_id: 'mgr-user-2', user_name: 'Trần Quốc Huy', total_active: 11, overdue: 2, completed_today: 2, completion_rate: 68, is_overloaded: true },
    { user_id: 'mgr-user-3', user_name: 'Lê Thanh Hà', total_active: 7, overdue: 1, completed_today: 4, completion_rate: 88, is_overloaded: false },
  ],
  bottleneck_alerts: [
    { id: 'bottleneck-1', title: 'Team Sunrise có 2 task quá hạn cần xử lý', severity: 'high' },
  ],
};

export default function ManagerWorkload() {
  const [workload, setWorkload] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const fetchWorkload = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getManagerWorkload();
      setWorkload(data || DEMO_MANAGER_WORKLOAD);
    } catch (err) {
      toast.error('Khong the tai du lieu');
      setWorkload(DEMO_MANAGER_WORKLOAD);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchWorkload();
  }, [fetchWorkload]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!workload) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Khong co du lieu</p>
        <Button onClick={fetchWorkload} className="mt-4">Thu lai</Button>
      </div>
    );
  }
  
  const { 
    total_team_tasks, 
    total_overdue, 
    total_completed_today,
    team_completion_rate,
    users,
    bottleneck_alerts
  } = workload;
  
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen" data-testid="manager-workload">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workload Team</h1>
          <p className="text-gray-500">Theo doi tien do va bottleneck cua team</p>
        </div>
        <Button onClick={fetchWorkload} variant="outline">
          Lam moi
        </Button>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="manager-stats">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tong task</p>
                <p className="text-2xl font-bold text-gray-700">
                  {total_team_tasks}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className={total_overdue > 0 ? 'border-red-200 bg-red-50' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Qua han</p>
                <p className="text-2xl font-bold text-red-600">
                  {total_overdue}
                </p>
              </div>
              <AlertTriangle className={`w-8 h-8 ${total_overdue > 0 ? 'text-red-500' : 'text-gray-300'}`} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Hoan thanh hom nay</p>
                <p className="text-2xl font-bold text-green-600">
                  {total_completed_today}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Hieu suat team</p>
                <p className="text-2xl font-bold text-blue-600">
                  {team_completion_rate}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Members */}
        <div className="lg:col-span-2">
          <Card data-testid="team-workload">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                WORKLOAD THEO NHAN VIEN
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {users.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Chua co du lieu nhan vien
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 text-xs text-gray-500">
                      <tr>
                        <th className="text-left p-3">Nhan vien</th>
                        <th className="text-center p-3">Dang lam</th>
                        <th className="text-center p-3">Qua han</th>
                        <th className="text-center p-3">Hoan thanh</th>
                        <th className="text-center p-3">Hieu suat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {users.map((user) => (
                        <tr 
                          key={user.user_id} 
                          className={user.is_overloaded ? 'bg-yellow-50' : ''}
                          data-testid={`user-row-${user.user_id}`}
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {user.user_name?.charAt(0) || 'U'}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-sm">{user.user_name || user.user_id}</p>
                                {user.is_overloaded && (
                                  <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-300">
                                    Overload
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="text-center p-3">
                            <span className="font-medium">{user.total_active}</span>
                          </td>
                          <td className="text-center p-3">
                            {user.overdue > 0 ? (
                              <Badge className="bg-red-100 text-red-700">
                                {user.overdue}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">0</span>
                            )}
                          </td>
                          <td className="text-center p-3">
                            <span className="text-green-600">{user.completed_today}</span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={user.completion_rate} 
                                className="h-2 flex-1"
                              />
                              <span className="text-sm font-medium w-12 text-right">
                                {user.completion_rate}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Bottleneck Alerts */}
        <div>
          <Card data-testid="bottleneck-alerts">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertOctagon className="w-4 h-4 text-orange-500" />
                CANH BAO BOTTLENECK
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {bottleneck_alerts.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">
                  Khong co canh bao
                </div>
              ) : (
                <div className="divide-y">
                  {bottleneck_alerts.map((alert, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 ${
                        alert.alert_level === 'critical' ? 'bg-red-50' : 'bg-yellow-50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          alert.alert_level === 'critical' ? 'text-red-500' : 'text-yellow-500'
                        }`} />
                        <div>
                          <p className="font-medium text-sm">{alert.title}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {alert.description}
                          </p>
                          <Badge 
                            variant="outline" 
                            className={`mt-2 text-xs ${
                              alert.alert_level === 'critical' 
                                ? 'border-red-300 text-red-700' 
                                : 'border-yellow-300 text-yellow-700'
                            }`}
                          >
                            {alert.count} items
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
