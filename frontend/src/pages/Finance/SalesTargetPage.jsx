import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Plus,
  Target,
  Users,
  User,
  Building2,
  TrendingUp,
  Calendar,
  RefreshCw,
  Award,
  Trophy,
  Medal,
  Star,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';

const targetTypeLabels = {
  individual: { label: 'Cá nhân', icon: User, color: 'bg-blue-100 text-blue-700' },
  team: { label: 'Nhóm', icon: Users, color: 'bg-purple-100 text-purple-700' },
  branch: { label: 'Chi nhánh', icon: Building2, color: 'bg-teal-100 text-teal-700' },
  company: { label: 'Công ty', icon: Trophy, color: 'bg-amber-100 text-amber-700' },
};

const periodTypeLabels = {
  monthly: 'Tháng',
  quarterly: 'Quý',
  yearly: 'Năm',
};

const DEMO_TARGETS = [
  {
    id: 'target-001',
    name: 'Target tháng - Team Sales Online',
    target_type: 'team',
    period_type: 'monthly',
    period_label: 'Tháng hiện tại',
    target_amount: 12000000000,
    achieved_amount: 8650000000,
    achievement_rate: 72,
    target_deals: 18,
    achieved_deals: 12,
  },
  {
    id: 'target-002',
    name: 'Target cá nhân - Nguyen Van Minh',
    target_type: 'individual',
    period_type: 'monthly',
    period_label: 'Tháng hiện tại',
    target_amount: 3200000000,
    achieved_amount: 2550000000,
    achievement_rate: 80,
    target_deals: 4,
    achieved_deals: 3,
  },
];

export default function SalesTargetPage() {
  const { token } = useAuth();
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [filters, setFilters] = useState({
    target_type: 'all',
    period_year: new Date().getFullYear(),
  });

  const [formData, setFormData] = useState({
    name: '',
    target_type: 'individual',
    target_id: '',
    period_type: 'monthly',
    period_year: new Date().getFullYear(),
    period_month: new Date().getMonth() + 1,
    period_quarter: null,
    target_amount: '',
    target_deals: '',
  });

  const fetchTargets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.target_type && filters.target_type !== 'all') params.append('target_type', filters.target_type);
      if (filters.period_year) params.append('period_year', filters.period_year);

      const res = await api.get(`/finance/sales-targets?${params.toString()}`);
      const targetItems = Array.isArray(res.data) ? res.data : [];
      setTargets(targetItems.length > 0 ? targetItems : DEMO_TARGETS);
    } catch (error) {
      console.error('Error fetching targets:', error);
      setTargets(DEMO_TARGETS);
      toast.error('Không thể tải mục tiêu doanh số, đang hiển thị dữ liệu mẫu');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTargets();
  }, [fetchTargets]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const params = new URLSearchParams();
      params.append('name', formData.name);
      params.append('target_type', formData.target_type);
      if (formData.target_id) params.append('target_id', formData.target_id);
      params.append('period_type', formData.period_type);
      params.append('period_year', formData.period_year);
      if (formData.period_type === 'monthly') params.append('period_month', formData.period_month);
      if (formData.period_type === 'quarterly') params.append('period_quarter', formData.period_quarter);
      params.append('target_amount', formData.target_amount);
      params.append('target_deals', formData.target_deals || 0);

      await api.post(`/finance/sales-targets?${params.toString()}`);
      toast.success('Đã tạo mục tiêu doanh số');
      setShowDialog(false);
      resetForm();
      fetchTargets();
    } catch (error) {
      console.error('Error creating target:', error);
      toast.error('Không thể tạo mục tiêu');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      target_type: 'individual',
      target_id: '',
      period_type: 'monthly',
      period_year: new Date().getFullYear(),
      period_month: new Date().getMonth() + 1,
      period_quarter: null,
      target_amount: '',
      target_deals: '',
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  const formatShortCurrency = (value) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)} tỷ`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(0)} tr`;
    return formatCurrency(value);
  };

  const totalTarget = targets.reduce((sum, t) => sum + (t.target_amount || 0), 0);
  const totalAchieved = targets.reduce((sum, t) => sum + (t.achieved_amount || 0), 0);
  const avgAchievement = targets.length > 0 
    ? targets.reduce((sum, t) => sum + (t.achievement_rate || 0), 0) / targets.length 
    : 0;

  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }));
  const quarters = [
    { value: 1, label: 'Quý 1' },
    { value: 2, label: 'Quý 2' },
    { value: 3, label: 'Quý 3' },
    { value: 4, label: 'Quý 4' },
  ];
  const years = [2024, 2025, 2026];

  const getAchievementColor = (rate) => {
    if (rate >= 100) return 'text-green-600';
    if (rate >= 80) return 'text-blue-600';
    if (rate >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getProgressColor = (rate) => {
    if (rate >= 100) return '[&>div]:bg-green-500';
    if (rate >= 80) return '[&>div]:bg-blue-500';
    if (rate >= 50) return '[&>div]:bg-amber-500';
    return '[&>div]:bg-red-500';
  };

  const getRankIcon = (rate) => {
    if (rate >= 100) return <Trophy className="h-5 w-5 text-amber-500" />;
    if (rate >= 80) return <Medal className="h-5 w-5 text-slate-400" />;
    if (rate >= 50) return <Star className="h-5 w-5 text-amber-700" />;
    return <Target className="h-5 w-5 text-slate-400" />;
  };

  return (
    <div className="space-y-6" data-testid="sales-target-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mục tiêu Doanh số</h1>
          <p className="text-slate-500 text-sm mt-1">Thiết lập và theo dõi KPI doanh số</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button data-testid="add-target-btn">
              <Plus className="h-4 w-4 mr-2" />
              Tạo mục tiêu
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Tạo Mục tiêu Doanh số</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Tên mục tiêu</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Target T2 - Nguyễn Văn A"
                  required
                />
              </div>
              <div>
                <Label>Loại mục tiêu</Label>
                <Select value={formData.target_type} onValueChange={(v) => setFormData({ ...formData, target_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(targetTypeLabels).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>ID đối tượng (nếu có)</Label>
                <Input
                  value={formData.target_id}
                  onChange={(e) => setFormData({ ...formData, target_id: e.target.value })}
                  placeholder="ID nhân viên/team/chi nhánh"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Loại kỳ</Label>
                  <Select value={formData.period_type} onValueChange={(v) => setFormData({ ...formData, period_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Theo tháng</SelectItem>
                      <SelectItem value="quarterly">Theo quý</SelectItem>
                      <SelectItem value="yearly">Theo năm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Năm</Label>
                  <Select value={String(formData.period_year)} onValueChange={(v) => setFormData({ ...formData, period_year: Number(v) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {formData.period_type === 'monthly' && (
                <div>
                  <Label>Tháng</Label>
                  <Select value={String(formData.period_month)} onValueChange={(v) => setFormData({ ...formData, period_month: Number(v) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((m) => (
                        <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {formData.period_type === 'quarterly' && (
                <div>
                  <Label>Quý</Label>
                  <Select value={String(formData.period_quarter || '')} onValueChange={(v) => setFormData({ ...formData, period_quarter: Number(v) })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn quý" />
                    </SelectTrigger>
                    <SelectContent>
                      {quarters.map((q) => (
                        <SelectItem key={q.value} value={String(q.value)}>{q.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>Mục tiêu doanh số (VNĐ)</Label>
                <Input
                  type="number"
                  value={formData.target_amount}
                  onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                  placeholder="5,000,000,000"
                  required
                />
              </div>
              <div>
                <Label>Mục tiêu số deal</Label>
                <Input
                  type="number"
                  value={formData.target_deals}
                  onChange={(e) => setFormData({ ...formData, target_deals: e.target.value })}
                  placeholder="10"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Huỷ
                </Button>
                <Button type="submit">Tạo</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-purple-600">Tổng mục tiêu</p>
                <p className="text-2xl font-bold text-purple-700">{formatShortCurrency(totalTarget)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Đã đạt được</p>
                <p className="text-2xl font-bold text-slate-800">{formatShortCurrency(totalAchieved)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Award className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Tỷ lệ trung bình</p>
                <p className={`text-2xl font-bold ${getAchievementColor(avgAchievement)}`}>{avgAchievement.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Số mục tiêu</p>
                <p className="text-2xl font-bold text-slate-800">{targets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="w-40">
              <Label className="mb-2 block">Loại mục tiêu</Label>
              <Select value={filters.target_type} onValueChange={(v) => setFilters({ ...filters, target_type: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {Object.entries(targetTypeLabels).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-28">
              <Label className="mb-2 block">Năm</Label>
              <Select value={String(filters.period_year)} onValueChange={(v) => setFilters({ ...filters, period_year: Number(v) })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={fetchTargets}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tải lại
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Target List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Mục tiêu Doanh số</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Đang tải...</div>
          ) : targets.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Target className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>Chưa có mục tiêu nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {targets.map((target) => {
                const TypeInfo = targetTypeLabels[target.target_type] || { label: target.target_type, icon: Target, color: 'bg-slate-100' };
                const TypeIcon = TypeInfo.icon;
                const achievementRate = target.achievement_rate || 0;

                return (
                  <div
                    key={target.id}
                    className="p-4 rounded-lg border hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${TypeInfo.color.split(' ')[0]}`}>
                          <TypeIcon className={`h-5 w-5 ${TypeInfo.color.split(' ')[1]}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900">{target.name}</p>
                            <Badge variant="outline" className={TypeInfo.color}>{TypeInfo.label}</Badge>
                          </div>
                          <p className="text-sm text-slate-500">
                            {target.period_type === 'monthly' && `Tháng ${target.period_month}/`}
                            {target.period_type === 'quarterly' && `Quý ${target.period_quarter}/`}
                            {target.period_year}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {getRankIcon(achievementRate)}
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${getAchievementColor(achievementRate)}`}>
                            {achievementRate.toFixed(1)}%
                          </p>
                          <p className="text-xs text-slate-500">hoàn thành</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Tiến độ</span>
                        <span className="font-medium">
                          {formatShortCurrency(target.achieved_amount)} / {formatShortCurrency(target.target_amount)}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(achievementRate, 100)} 
                        className={`h-2 ${getProgressColor(achievementRate)}`}
                      />
                      {target.target_deals > 0 && (
                        <div className="flex justify-between text-sm text-slate-500">
                          <span>Số deal</span>
                          <span>{target.achieved_deals || 0} / {target.target_deals}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
