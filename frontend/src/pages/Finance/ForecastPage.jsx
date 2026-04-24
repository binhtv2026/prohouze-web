import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart,
  Calendar,
  Target,
  Brain,
  Calculator,
  History,
  Sparkles,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';

const forecastTypeLabels = {
  revenue: { label: 'Doanh thu', icon: TrendingUp, color: 'bg-emerald-100 text-emerald-700' },
  expense: { label: 'Chi phí', icon: TrendingDown, color: 'bg-red-100 text-red-700' },
  cash_flow: { label: 'Dòng tiền', icon: Activity, color: 'bg-blue-100 text-blue-700' },
  profit: { label: 'Lợi nhuận', icon: Target, color: 'bg-purple-100 text-purple-700' },
};

const methodologyLabels = {
  historical: { label: 'Dữ liệu lịch sử', icon: History, description: 'Dựa trên xu hướng quá khứ' },
  trend: { label: 'Phân tích xu hướng', icon: LineChart, description: 'Phân tích đường xu hướng' },
  ai: { label: 'Mô hình AI', icon: Brain, description: 'Machine Learning prediction' },
  manual: { label: 'Nhập thủ công', icon: Calculator, description: 'Dự báo từ chuyên gia' },
};

const periodTypeLabels = {
  monthly: 'Tháng',
  quarterly: 'Quý',
  yearly: 'Năm',
};

const DEMO_FORECASTS = [
  { id: 'forecast-1', name: 'Dự báo doanh thu tháng 3', forecast_type: 'revenue', period_type: 'monthly', period_year: 2026, period_month: 3, forecast_amount: 12600000000, confidence_level: 0.86, methodology: 'ai', accuracy: 91 },
  { id: 'forecast-2', name: 'Dự báo chi phí tháng 3', forecast_type: 'expense', period_type: 'monthly', period_year: 2026, period_month: 3, forecast_amount: 3920000000, confidence_level: 0.82, methodology: 'historical', accuracy: 88 },
  { id: 'forecast-3', name: 'Dự báo lợi nhuận quý 2', forecast_type: 'profit', period_type: 'quarterly', period_year: 2026, period_quarter: 2, forecast_amount: 23500000000, confidence_level: 0.79, methodology: 'trend', accuracy: 83 },
];

export default function ForecastPage() {
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [filters, setFilters] = useState({
    forecast_type: 'all',
    period_year: new Date().getFullYear(),
  });

  const [formData, setFormData] = useState({
    name: '',
    forecast_type: 'revenue',
    period_type: 'monthly',
    period_year: new Date().getFullYear(),
    period_month: new Date().getMonth() + 1,
    period_quarter: null,
    forecast_amount: '',
    confidence_level: '0.8',
    methodology: 'historical',
    assumptions: '',
    notes: '',
  });

  const fetchForecasts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.forecast_type && filters.forecast_type !== 'all') params.append('forecast_type', filters.forecast_type);
      if (filters.period_year) params.append('period_year', filters.period_year);

      const res = await api.get(`/finance/forecasts?${params.toString()}`);
      const payload = Array.isArray(res?.data) && res.data.length > 0 ? res.data : DEMO_FORECASTS;
      setForecasts(payload.filter((item) => filters.forecast_type === 'all' || item.forecast_type === filters.forecast_type));
    } catch (error) {
      console.error('Error fetching forecasts:', error);
      setForecasts(DEMO_FORECASTS.filter((item) => filters.forecast_type === 'all' || item.forecast_type === filters.forecast_type));
      toast.error('Không thể tải dự báo');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchForecasts();
  }, [fetchForecasts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const assumptions = formData.assumptions ? formData.assumptions.split('\n').filter(a => a.trim()) : [];
      
      await api.post('/finance/forecasts', {
        name: formData.name,
        forecast_type: formData.forecast_type,
        period_type: formData.period_type,
        period_year: formData.period_year,
        period_month: formData.period_type === 'monthly' ? formData.period_month : null,
        period_quarter: formData.period_type === 'quarterly' ? formData.period_quarter : null,
        forecast_amount: parseFloat(formData.forecast_amount),
        confidence_level: parseFloat(formData.confidence_level),
        methodology: formData.methodology,
        assumptions,
        notes: formData.notes,
      });
      toast.success('Đã tạo dự báo');
      setShowDialog(false);
      resetForm();
      fetchForecasts();
    } catch (error) {
      console.error('Error creating forecast:', error);
      toast.error('Không thể tạo dự báo');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      forecast_type: 'revenue',
      period_type: 'monthly',
      period_year: new Date().getFullYear(),
      period_month: new Date().getMonth() + 1,
      period_quarter: null,
      forecast_amount: '',
      confidence_level: '0.8',
      methodology: 'historical',
      assumptions: '',
      notes: '',
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

  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }));
  const quarters = [
    { value: 1, label: 'Quý 1' },
    { value: 2, label: 'Quý 2' },
    { value: 3, label: 'Quý 3' },
    { value: 4, label: 'Quý 4' },
  ];
  const years = [2024, 2025, 2026, 2027];

  // Group forecasts by type
  const revenueForecasts = forecasts.filter(f => f.forecast_type === 'revenue');
  const expenseForecasts = forecasts.filter(f => f.forecast_type === 'expense');
  const profitForecasts = forecasts.filter(f => f.forecast_type === 'profit');

  const totalForecastRevenue = revenueForecasts.reduce((sum, f) => sum + (f.forecast_amount || 0), 0);
  const totalForecastExpense = expenseForecasts.reduce((sum, f) => sum + (f.forecast_amount || 0), 0);
  const avgAccuracy = forecasts.length > 0 
    ? forecasts.reduce((sum, f) => sum + (f.accuracy || 0), 0) / forecasts.length 
    : 0;

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 90) return 'text-green-600';
    if (accuracy >= 70) return 'text-blue-600';
    if (accuracy >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getConfidenceColor = (level) => {
    if (level >= 0.9) return 'bg-green-500';
    if (level >= 0.7) return 'bg-blue-500';
    if (level >= 0.5) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6" data-testid="forecast-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dự báo Tài chính</h1>
          <p className="text-slate-500 text-sm mt-1">Phân tích và dự báo doanh thu, chi phí, lợi nhuận</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button data-testid="add-forecast-btn">
              <Plus className="h-4 w-4 mr-2" />
              Tạo dự báo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Tạo Dự báo Tài chính
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Tên dự báo</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Dự báo doanh thu Q1/2025"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Loại dự báo</Label>
                  <Select value={formData.forecast_type} onValueChange={(v) => setFormData({ ...formData, forecast_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(forecastTypeLabels).map(([key, val]) => (
                        <SelectItem key={key} value={key}>{val.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Phương pháp</Label>
                  <Select value={formData.methodology} onValueChange={(v) => setFormData({ ...formData, methodology: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(methodologyLabels).map(([key, val]) => (
                        <SelectItem key={key} value={key}>{val.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Số tiền dự báo (VNĐ)</Label>
                  <Input
                    type="number"
                    value={formData.forecast_amount}
                    onChange={(e) => setFormData({ ...formData, forecast_amount: e.target.value })}
                    placeholder="10,000,000,000"
                    required
                  />
                </div>
                <div>
                  <Label>Độ tin cậy (0-1)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={formData.confidence_level}
                    onChange={(e) => setFormData({ ...formData, confidence_level: e.target.value })}
                    placeholder="0.8"
                  />
                </div>
              </div>

              <div>
                <Label>Các giả định (mỗi dòng 1 giả định)</Label>
                <Textarea
                  value={formData.assumptions}
                  onChange={(e) => setFormData({ ...formData, assumptions: e.target.value })}
                  placeholder="- Thị trường BĐS ổn định&#10;- Không có biến động kinh tế lớn&#10;- Đội ngũ sales đủ nguồn lực"
                  rows={3}
                />
              </div>

              <div>
                <Label>Ghi chú</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ghi chú thêm"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Huỷ
                </Button>
                <Button type="submit">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Tạo dự báo
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-emerald-600">Dự báo Doanh thu</p>
                <p className="text-2xl font-bold text-emerald-700">{formatShortCurrency(totalForecastRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-white border-red-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-red-600">Dự báo Chi phí</p>
                <p className="text-2xl font-bold text-red-700">{formatShortCurrency(totalForecastExpense)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Dự báo Lợi nhuận</p>
                <p className="text-2xl font-bold text-purple-700">{formatShortCurrency(totalForecastRevenue - totalForecastExpense)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Độ chính xác TB</p>
                <p className={`text-2xl font-bold ${getAccuracyColor(avgAccuracy)}`}>{avgAccuracy.toFixed(1)}%</p>
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
              <Label className="mb-2 block">Loại dự báo</Label>
              <Select value={filters.forecast_type} onValueChange={(v) => setFilters({ ...filters, forecast_type: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {Object.entries(forecastTypeLabels).map(([key, val]) => (
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
            <Button variant="outline" onClick={fetchForecasts}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tải lại
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Forecast List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Danh sách Dự báo
          </CardTitle>
          <CardDescription>Các dự báo tài chính đã tạo</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Đang tải...</div>
          ) : forecasts.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <LineChart className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>Chưa có dự báo nào</p>
              <p className="text-sm mt-1">Tạo dự báo đầu tiên để bắt đầu</p>
            </div>
          ) : (
            <div className="space-y-4">
              {forecasts.map((forecast) => {
                const TypeInfo = forecastTypeLabels[forecast.forecast_type] || forecastTypeLabels.revenue;
                const TypeIcon = TypeInfo.icon;
                const MethodInfo = methodologyLabels[forecast.methodology] || methodologyLabels.manual;
                const MethodIcon = MethodInfo.icon;
                const variance = forecast.actual_amount > 0 ? forecast.variance : 0;
                const variancePercent = forecast.variance_percent || 0;

                return (
                  <div
                    key={forecast.id}
                    className="p-4 rounded-lg border hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${TypeInfo.color.split(' ')[0]}`}>
                          <TypeIcon className={`h-5 w-5 ${TypeInfo.color.split(' ')[1]}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900">{forecast.name}</p>
                            <Badge variant="outline" className={TypeInfo.color}>{TypeInfo.label}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Calendar className="h-3 w-3" />
                            {forecast.period_label}
                            <span className="text-slate-300">|</span>
                            <MethodIcon className="h-3 w-3" />
                            {MethodInfo.label}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold ${TypeInfo.color.split(' ')[1]}`}>
                          {formatShortCurrency(forecast.forecast_amount)}
                        </p>
                        <p className="text-xs text-slate-500">Dự báo</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Độ tin cậy</p>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={forecast.confidence_level * 100} 
                            className={`h-2 flex-1 [&>div]:${getConfidenceColor(forecast.confidence_level)}`}
                          />
                          <span className="text-sm font-medium">{(forecast.confidence_level * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Thực tế</p>
                        <p className="font-medium">
                          {forecast.actual_amount > 0 ? formatShortCurrency(forecast.actual_amount) : 'Chưa có'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Độ chính xác</p>
                        <p className={`font-medium ${getAccuracyColor(forecast.accuracy || 0)}`}>
                          {forecast.accuracy > 0 ? `${forecast.accuracy.toFixed(1)}%` : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {forecast.assumptions && forecast.assumptions.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-slate-500 mb-1">Giả định:</p>
                        <ul className="text-sm text-slate-600 list-disc list-inside">
                          {forecast.assumptions.slice(0, 3).map((a, idx) => (
                            <li key={idx}>{a}</li>
                          ))}
                          {forecast.assumptions.length > 3 && (
                            <li className="text-slate-400">+{forecast.assumptions.length - 3} giả định khác</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Methodology Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-indigo-600" />
            Phương pháp Dự báo
          </CardTitle>
          <CardDescription>Các phương pháp dự báo tài chính phổ biến</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(methodologyLabels).map(([key, method]) => {
              const Icon = method.icon;
              return (
                <div key={key} className="p-4 rounded-lg border bg-gradient-to-br from-slate-50 to-white hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-indigo-600" />
                    </div>
                    <p className="font-medium text-slate-900">{method.label}</p>
                  </div>
                  <p className="text-sm text-slate-500">{method.description}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-6 p-4 rounded-lg bg-indigo-50 border border-indigo-200">
            <h4 className="font-medium text-indigo-800 mb-2">Gợi ý sử dụng</h4>
            <ul className="text-sm text-indigo-700 space-y-1 list-disc list-inside">
              <li><strong>Dữ liệu lịch sử:</strong> Phù hợp khi có đủ dữ liệu quá khứ (12+ tháng)</li>
              <li><strong>Phân tích xu hướng:</strong> Tốt cho các chỉ số có tính mùa vụ</li>
              <li><strong>Mô hình AI:</strong> Phù hợp với dữ liệu lớn, nhiều biến số</li>
              <li><strong>Nhập thủ công:</strong> Sử dụng khi cần kinh nghiệm chuyên gia</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
