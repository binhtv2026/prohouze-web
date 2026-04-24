/**
 * KPI Dashboard - Personal Scorecard View
 * Prompt 12/20 - KPI & Performance Engine
 */
import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, TrendingDown, Target, Award, Calendar,
  ChevronRight, Star, AlertTriangle, CheckCircle,
  BarChart3, Users, DollarSign, Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { kpiApi } from '@/api/kpiApi';

// Status color mapping
const STATUS_COLORS = {
  exceeding: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500' },
  on_track: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500' },
  at_risk: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500' },
  behind: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500' },
};

// Category icon mapping
const CATEGORY_ICONS = {
  sales: TrendingUp,
  revenue: DollarSign,
  activity: Activity,
  lead: Users,
  customer: Users,
  quality: CheckCircle,
  team: Users,
  efficiency: BarChart3,
};

const DEMO_SCORECARD = {
  scope_name: 'Khối kinh doanh',
  period_label: 'Tháng 3/2026',
  bonus_modifier: 1.15,
  bonus_tier_label: 'Vượt chuẩn',
  summary: {
    overall_score: 86,
    kpis_exceeding: 2,
    kpis_on_track: 4,
    kpis_at_risk: 1,
    kpis_behind: 1,
  },
  key_metrics: [
    {
      kpi_code: 'REVENUE_ACTUAL',
      kpi_name: 'Doanh số thực thu',
      status: 'exceeding',
      status_label: 'Vượt',
      formatted_actual: '12,8 tỷ',
      formatted_target: '11,0 tỷ',
      achievement: 116.4,
      rank: 2,
      rank_total: 12,
      is_key_metric: true,
    },
    {
      kpi_code: 'DEALS_WON',
      kpi_name: 'Số giao dịch chốt',
      status: 'on_track',
      status_label: 'Đúng tiến độ',
      formatted_actual: '18 deal',
      formatted_target: '20 deal',
      achievement: 90,
      rank: 3,
      rank_total: 12,
      is_key_metric: true,
    },
  ],
  categories: [
    {
      category: 'sales',
      category_label: 'Kinh doanh',
      category_color: '#3b82f6',
      category_achievement: 94,
      kpis: [
        {
          kpi_code: 'LEADS_CONTACTED',
          kpi_name: 'Khách mới đã liên hệ',
          status: 'on_track',
          status_label: 'Đúng tiến độ',
          formatted_actual: '86',
          formatted_target: '100',
          achievement: 86,
          rank: 4,
          rank_total: 12,
          is_key_metric: false,
        },
        {
          kpi_code: 'MEETINGS_SCHEDULED',
          kpi_name: 'Lịch hẹn',
          status: 'at_risk',
          status_label: 'Có rủi ro',
          formatted_actual: '14',
          formatted_target: '20',
          achievement: 70,
          rank: 6,
          rank_total: 12,
          is_key_metric: false,
        },
      ],
    },
    {
      category: 'quality',
      category_label: 'Chất lượng',
      category_color: '#10b981',
      category_achievement: 78,
      kpis: [
        {
          kpi_code: 'CUSTOMER_SAT',
          kpi_name: 'Hài lòng khách hàng',
          status: 'exceeding',
          status_label: 'Vượt',
          formatted_actual: '4.8/5',
          formatted_target: '4.5/5',
          achievement: 106.7,
          rank: 2,
          rank_total: 12,
          is_key_metric: false,
        },
        {
          kpi_code: 'FOLLOW_UP',
          kpi_name: 'Tỷ lệ follow up',
          status: 'behind',
          status_label: 'Chưa đạt',
          formatted_actual: '62%',
          formatted_target: '80%',
          achievement: 77.5,
          rank: 8,
          rank_total: 12,
          is_key_metric: false,
        },
      ],
    },
  ],
};

// Status badge component
const StatusBadge = ({ status, label }) => {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.on_track;
  return (
    <Badge className={`${colors.bg} ${colors.text} border ${colors.border}`}>
      {label}
    </Badge>
  );
};

// KPI Card Component
const KPICard = ({ kpi }) => {
  const colors = STATUS_COLORS[kpi.status] || STATUS_COLORS.on_track;
  const progressColor = kpi.status === 'exceeding' ? 'bg-emerald-500' : 
                        kpi.status === 'on_track' ? 'bg-blue-500' :
                        kpi.status === 'at_risk' ? 'bg-amber-500' : 'bg-red-500';
  
  return (
    <Card className={`${colors.bg} border ${colors.border}/30 hover:shadow-md transition-all`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-slate-600">{kpi.kpi_name}</p>
            {kpi.is_key_metric && (
              <Star className="w-3 h-3 text-amber-500 inline ml-1" />
            )}
          </div>
          <StatusBadge status={kpi.status} label={kpi.status_label} />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-slate-900">{kpi.formatted_actual}</span>
            <span className="text-sm text-slate-500">/ {kpi.formatted_target}</span>
          </div>
          
          <div className="relative">
            <Progress 
              value={Math.min(kpi.achievement, 150)} 
              className="h-2 bg-slate-200"
            />
            <div 
              className={`absolute top-0 left-0 h-2 rounded-full ${progressColor}`}
              style={{ width: `${Math.min(kpi.achievement, 100)}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs">
            <span className={`font-semibold ${colors.text}`}>{(kpi.achievement ?? 0).toFixed(1)}%</span>
            {kpi.rank > 0 && (
              <span className="text-slate-500">
                Hạng #{kpi.rank}/{kpi.rank_total}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Summary Card Component
const SummaryCard = ({ title, value, icon: Icon, trend, color = 'blue' }) => {
  const colorMap = {
    blue: 'bg-blue-500/10 text-blue-600',
    green: 'bg-emerald-500/10 text-emerald-600',
    amber: 'bg-amber-500/10 text-amber-600',
    red: 'bg-red-500/10 text-red-600',
  };
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorMap[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="text-xl font-bold text-slate-900">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Category Section Component
const CategorySection = ({ category }) => {
  const Icon = CATEGORY_ICONS[category.category] || BarChart3;
  const [expanded, setExpanded] = useState(true);
  
  return (
    <div className="mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 mb-4 text-slate-700 hover:text-slate-900 transition-colors"
      >
        <div className="p-1.5 rounded-lg" style={{ backgroundColor: category.category_color + '20' }}>
          <Icon className="w-4 h-4" style={{ color: category.category_color }} />
        </div>
        <h3 className="text-lg font-semibold">{category.category_label}</h3>
        <Badge variant="outline" className="ml-2">
          {(category.category_achievement ?? 0).toFixed(0)}%
        </Badge>
        <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>
      
      {expanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {category.kpis.map((kpi) => (
            <KPICard key={kpi.kpi_code} kpi={kpi} />
          ))}
        </div>
      )}
    </div>
  );
};

// Main Dashboard Component
const KPIDashboard = () => {
  const [scorecard, setScorecard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [periodType, setPeriodType] = useState('monthly');

  const loadScorecard = useCallback(async () => {
    try {
      setLoading(true);
      const data = await kpiApi.getMyScorecard(null, periodType);
      setScorecard(data || DEMO_SCORECARD);
      setError(null);
    } catch (err) {
      setScorecard(DEMO_SCORECARD);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [periodType]);

  useEffect(() => {
    loadScorecard();
  }, [loadScorecard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-2" />
          <p className="text-slate-600">{error}</p>
          <Button onClick={loadScorecard} className="mt-4">Thử lại</Button>
        </div>
      </div>
    );
  }

  if (!scorecard) return null;

  const { summary, categories, key_metrics, bonus_modifier, bonus_tier_label } = scorecard;

  return (
    <div className="p-6 space-y-6" data-testid="kpi-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bảng KPI cá nhân</h1>
          <p className="text-slate-500">{scorecard.scope_name} | {scorecard.period_label}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Tabs value={periodType} onValueChange={setPeriodType}>
            <TabsList>
              <TabsTrigger value="monthly">Tháng</TabsTrigger>
              <TabsTrigger value="quarterly">Quý</TabsTrigger>
              <TabsTrigger value="yearly">Năm</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Overall Score Card */}
      <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Điểm tổng hợp</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-5xl font-bold">{(summary.overall_score ?? 0).toFixed(0)}</span>
                <span className="text-xl text-blue-200">%</span>
              </div>
              <div className="text-blue-100 mt-2">
                {bonus_tier_label && (
                  <Badge className="bg-white/20 text-white border-0">
                    {bonus_tier_label} (x{(bonus_modifier ?? 1).toFixed(2)})
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-400/20 mx-auto mb-1">
                    <TrendingUp className="w-5 h-5 text-emerald-300" />
                  </div>
                  <p className="text-2xl font-bold">{summary.kpis_exceeding + summary.kpis_on_track}</p>
                  <p className="text-xs text-blue-200">Đạt/Vượt</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-400/20 mx-auto mb-1">
                    <TrendingDown className="w-5 h-5 text-red-300" />
                  </div>
                  <p className="text-2xl font-bold">{summary.kpis_at_risk + summary.kpis_behind}</p>
                  <p className="text-xs text-blue-200">Rủi ro</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard 
          title="Vượt mục tiêu" 
          value={summary.kpis_exceeding} 
          icon={Star} 
          color="green"
        />
        <SummaryCard 
          title="Đúng tiến độ" 
          value={summary.kpis_on_track} 
          icon={CheckCircle} 
          color="blue"
        />
        <SummaryCard 
          title="Có rủi ro" 
          value={summary.kpis_at_risk} 
          icon={AlertTriangle} 
          color="amber"
        />
        <SummaryCard 
          title="Chưa đạt" 
          value={summary.kpis_behind} 
          icon={TrendingDown} 
          color="red"
        />
      </div>

      {/* Key Metrics */}
      {key_metrics && key_metrics.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Chỉ số quan trọng
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {key_metrics.map((kpi) => (
              <KPICard key={kpi.kpi_code} kpi={kpi} />
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Chi tiết theo nhóm
        </h2>
        {categories.map((category) => (
          <CategorySection key={category.category} category={category} />
        ))}
      </div>
    </div>
  );
};

export default KPIDashboard;
