/**
 * HR Recruitment Dashboard - Internal admin page
 * View pipeline, candidates, and statistics
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { 
  listCandidates, getPipelineStats, getPipelineFunnel,
  overrideDecision, runAutoFlow 
} from '../../api/recruitmentApi';
import { 
  Users, UserCheck, UserX, Clock, Search, Filter,
  BarChart3, TrendingUp, Play, RefreshCw, Eye, ChevronRight
} from 'lucide-react';

const STATUS_LABELS = {
  applied: { label: 'Đã nộp đơn', color: 'bg-gray-100 text-gray-700' },
  verified: { label: 'Đã xác thực', color: 'bg-blue-100 text-blue-700' },
  consented: { label: 'Đã đồng ý', color: 'bg-indigo-100 text-indigo-700' },
  kyc_verified: { label: 'KYC OK', color: 'bg-purple-100 text-purple-700' },
  screened: { label: 'Đã sàng lọc', color: 'bg-yellow-100 text-yellow-700' },
  tested: { label: 'Đã test', color: 'bg-orange-100 text-orange-700' },
  passed: { label: 'Đạt', color: 'bg-green-100 text-green-700' },
  contracted: { label: 'Có hợp đồng', color: 'bg-teal-100 text-teal-700' },
  onboarded: { label: 'Onboarded', color: 'bg-cyan-100 text-cyan-700' },
  active: { label: 'Active', color: 'bg-emerald-100 text-emerald-700' },
  blocked: { label: 'Blocked', color: 'bg-red-100 text-red-700' },
  rejected: { label: 'Từ chối', color: 'bg-red-100 text-red-700' },
};

const POSITION_LABELS = {
  ctv: 'CTV',
  sale: 'Sale',
  leader: 'Leader',
  manager: 'Manager',
};

const DEMO_RECRUITMENT_STATS = {
  total: 48,
  by_status: {
    applied: 12,
    verified: 8,
    screened: 6,
    active: 14,
  },
  conversion_rate: 29.2,
};

const DEMO_RECRUITMENT_FUNNEL = [
  { status: 'applied', count: 12 },
  { status: 'verified', count: 8 },
  { status: 'screened', count: 6 },
  { status: 'tested', count: 5 },
  { status: 'passed', count: 4 },
  { status: 'active', count: 14 },
];

const DEMO_CANDIDATES = [
  { id: 'candidate-1', full_name: 'Nguyễn Minh Tâm', phone: '0901234567', email: 'tam.nguyen@example.com', position: 'sale', current_status: 'screened' },
  { id: 'candidate-2', full_name: 'Lê Hoàng My', phone: '0912345678', email: 'my.le@example.com', position: 'ctv', current_status: 'verified' },
  { id: 'candidate-3', full_name: 'Phạm Đức Anh', phone: '0934567890', email: 'anh.pham@example.com', position: 'leader', current_status: 'active' },
];

export default function RecruitmentDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState([]);
  const [stats, setStats] = useState(null);
  const [funnel, setFunnel] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    position: '',
    search: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [candidatesData, statsData, funnelData] = await Promise.all([
        listCandidates({
          status: filters.status || undefined,
          position: filters.position || undefined,
          limit: 100,
        }),
        getPipelineStats(),
        getPipelineFunnel(),
      ]);
      const candidateItems = candidatesData.candidates || [];
      setCandidates(candidateItems.length > 0 ? candidateItems : DEMO_CANDIDATES);
      setStats(statsData && Object.keys(statsData).length > 0 ? statsData : DEMO_RECRUITMENT_STATS);
      setFunnel(funnelData.funnel?.length > 0 ? funnelData.funnel : DEMO_RECRUITMENT_FUNNEL);
    } catch (error) {
      toast.warning('Đang hiển thị dữ liệu mẫu cho tuyển dụng');
      setCandidates(DEMO_CANDIDATES);
      setStats(DEMO_RECRUITMENT_STATS);
      setFunnel(DEMO_RECRUITMENT_FUNNEL);
    } finally {
      setLoading(false);
    }
  }, [filters.position, filters.status]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAutoFlow = async (candidateId) => {
    try {
      await runAutoFlow(candidateId, true, false);
      toast.success('Auto flow hoàn tất!');
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleOverride = async (candidateId, decision) => {
    try {
      await overrideDecision(candidateId, decision, 'Manual override by HR');
      toast.success(`Đã cập nhật: ${decision}`);
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        c.full_name?.toLowerCase().includes(search) ||
        c.phone?.includes(search) ||
        c.email?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tuyển dụng</h1>
            <p className="text-gray-600">Quản lý pipeline ứng viên</p>
          </div>
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                  <p className="text-sm text-gray-500">Tổng ứng viên</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.by_status?.active || 0}</p>
                  <p className="text-sm text-gray-500">Đã onboard</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {(stats?.by_status?.applied || 0) + 
                     (stats?.by_status?.verified || 0) + 
                     (stats?.by_status?.screened || 0)}
                  </p>
                  <p className="text-sm text-gray-500">Đang xử lý</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.conversion_rate?.toFixed(1) || 0}%</p>
                  <p className="text-sm text-gray-500">Tỷ lệ chuyển đổi</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Funnel Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Pipeline Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-32">
              {funnel.map((stage, idx) => {
                const maxCount = Math.max(...funnel.map(f => f.count), 1);
                const height = (stage.count / maxCount) * 100;
                const statusInfo = STATUS_LABELS[stage.status] || {};
                
                return (
                  <div key={stage.status} className="flex-1 flex flex-col items-center">
                    <p className="text-sm font-medium mb-1">{stage.count}</p>
                    <div 
                      className="w-full bg-blue-500 rounded-t transition-all"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    />
                    <p className="text-xs text-gray-500 mt-2 text-center truncate w-full">
                      {statusInfo.label || stage.status}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Tìm theo tên, SĐT, email..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? '' : value })}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.position}
                onValueChange={(value) => setFilters({ ...filters, position: value === 'all' ? '' : value })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Vị trí" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {Object.entries(POSITION_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Candidates Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách ứng viên ({filteredCandidates.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Ứng viên</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Vị trí</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Trạng thái</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Bước</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Điểm</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Ngày nộp</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCandidates.map((candidate) => {
                    const statusInfo = STATUS_LABELS[candidate.status] || {};
                    
                    return (
                      <tr key={candidate.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{candidate.full_name}</p>
                            <p className="text-sm text-gray-500">{candidate.phone}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="capitalize">{POSITION_LABELS[candidate.position] || candidate.position}</span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={statusInfo.color}>
                            {statusInfo.label || candidate.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm">{candidate.current_step || 1}/11</span>
                        </td>
                        <td className="py-3 px-4">
                          {candidate.final_score ? (
                            <span className={`font-medium ${
                              candidate.final_score >= 60 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {candidate.final_score.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {new Date(candidate.applied_at).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/recruitment/status?candidate_id=${candidate.id}`)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {candidate.status !== 'active' && candidate.status !== 'rejected' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAutoFlow(candidate.id)}
                                title="Auto Flow"
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredCandidates.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        Không có ứng viên nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
