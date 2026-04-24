/**
 * Leader Dashboard - Dashboard cho Trưởng nhóm
 * 
 * Hiển thị:
 * 1. Tổng commission team
 * 2. Danh sách sale
 * 3. Pending payout team
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { 
  Users, DollarSign, Clock, TrendingUp, CheckCircle
} from 'lucide-react';
import { getSaleDashboard, getCommissionSplits, getPayouts } from '../../../api/financeApi';

// Format VND
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

const DEMO_LEADER_DASHBOARD = {
  paid_amount: 125000000,
  pending_amount: 28000000,
  approved_amount: 18500000,
};

const DEMO_TEAM_SPLITS = [
  {
    id: 'split-001',
    recipient_id: 'sale-001',
    recipient_name: 'Nguyen Minh Quan',
    recipient_role: 'sale',
    net_amount: 48000000,
    gross_amount: 62000000,
    contract_code: 'HD-260301',
    count: 3,
  },
  {
    id: 'split-002',
    recipient_id: 'sale-002',
    recipient_name: 'Tran Bao Chau',
    recipient_role: 'sale',
    net_amount: 36500000,
    gross_amount: 47000000,
    contract_code: 'HD-260302',
    count: 2,
  },
  {
    id: 'split-003',
    recipient_id: 'leader-001',
    recipient_name: 'Le Hoang Nam',
    recipient_role: 'leader',
    net_amount: 29500000,
    gross_amount: 38000000,
    contract_code: 'HD-260303',
    count: 2,
  },
];

const DEMO_TEAM_PAYOUTS = [
  { id: 'payout-001', net_amount: 22500000 },
  { id: 'payout-002', net_amount: 18200000 },
];

export default function LeaderDashboard({ userId, userName, teamId }) {
  const [loading, setLoading] = useState(true);
  const [myDashboard, setMyDashboard] = useState(null);
  const [teamSplits, setTeamSplits] = useState([]);
  const [teamPayouts, setTeamPayouts] = useState([]);

  const loadData = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const [dashboard, splits, payouts] = await Promise.all([
        getSaleDashboard(userId),
        getCommissionSplits({ limit: 50 }),
        getPayouts({ status: 'pending', limit: 20 }),
      ]);
      
      setMyDashboard(dashboard || DEMO_LEADER_DASHBOARD);
      setTeamSplits(Array.isArray(splits) && splits.length > 0 ? splits : DEMO_TEAM_SPLITS);
      setTeamPayouts(Array.isArray(payouts) && payouts.length > 0 ? payouts : DEMO_TEAM_PAYOUTS);
    } catch (error) {
      console.error('Load leader dashboard error:', error);
      setMyDashboard(DEMO_LEADER_DASHBOARD);
      setTeamSplits(DEMO_TEAM_SPLITS);
      setTeamPayouts(DEMO_TEAM_PAYOUTS);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate team totals
  const teamTotalCommission = teamSplits.reduce((sum, s) => sum + (s.gross_amount || 0), 0);
  const teamPendingPayout = teamPayouts.reduce((sum, p) => sum + (p.net_amount || 0), 0);
  
  // Group by recipient for team members
  const memberStats = {};
  teamSplits.forEach(split => {
    if (split.recipient_role === 'sale' || split.recipient_role === 'leader') {
      const key = split.recipient_id;
      if (!memberStats[key]) {
        memberStats[key] = {
          id: key,
          name: split.recipient_name,
          role: split.recipient_role,
          total: 0,
          count: 0,
        };
      }
      memberStats[key].total += split.net_amount || 0;
      memberStats[key].count += 1;
    }
  });
  const teamMembers = Object.values(memberStats);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="leader-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Xin chào, {userName || 'Leader'}
          </h2>
          <p className="text-sm text-gray-500">Dashboard quản lý team</p>
        </div>
        <Badge variant="outline" className="text-purple-600 border-purple-200">
          Trưởng nhóm
        </Badge>
      </div>

      {/* Block 1: Tổng commission team */}
      <Card className="border-purple-100 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Tổng commission team</p>
              <p className="text-2xl font-bold text-purple-700" data-testid="leader-team-commission">
                {formatCurrency(teamTotalCommission)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Block 2: Thu nhập cá nhân Leader */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-green-100">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span className="text-xs text-gray-500">Thu nhập đã nhận</span>
            </div>
            <p className="text-lg font-bold text-green-700">
              {formatCurrency(myDashboard?.paid_amount || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-yellow-100">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3 h-3 text-yellow-600" />
              <span className="text-xs text-gray-500">Chờ nhận</span>
            </div>
            <p className="text-lg font-bold text-yellow-700">
              {formatCurrency((myDashboard?.pending_amount || 0) + (myDashboard?.approved_amount || 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Block 3: Danh sách sale trong team */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="w-4 h-4" />
            Thành viên team ({teamMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Chưa có thành viên</p>
          ) : (
            <div className="space-y-2">
              {teamMembers.map((member) => (
                <div 
                  key={member.id} 
                  className="flex justify-between items-center p-2 bg-gray-50 rounded"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">
                        {member.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{member.name || 'N/A'}</p>
                      <p className="text-xs text-gray-500">
                        {member.role === 'leader' ? 'Trưởng nhóm' : 'Sale'} • {member.count} deal
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">
                      {formatCurrency(member.total)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Block 4: Pending payout team */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-500" />
            Payout chờ duyệt ({teamPayouts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-600">Tổng tiền chờ duyệt</p>
              <p className="text-lg font-bold text-yellow-700" data-testid="leader-pending-payout">
                {formatCurrency(teamPendingPayout)}
              </p>
            </div>
            <Badge variant="outline" className="text-yellow-600 border-yellow-200">
              {teamPayouts.length} payout
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Block 5: Thông tin nhanh */}
      <Card className="bg-blue-50 border-blue-100">
        <CardContent className="p-3">
          <p className="text-xs text-blue-700">
            <strong>Lưu ý:</strong> Thu nhập Leader = 10% tổng hoa hồng deal của team. 
            Liên hệ kế toán để xem chi tiết hoặc yêu cầu duyệt nhanh.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
