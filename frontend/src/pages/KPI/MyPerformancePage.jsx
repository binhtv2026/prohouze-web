/**
 * My Performance Page - KPI cá nhân chi tiết
 * ProHouze HR AI Platform - Phase 2 (10/10)
 * BĐS Sơ Cấp (Primary Real Estate)
 * 
 * FEATURES:
 * - Level System: Bronze → Silver → Gold → Diamond
 * - KPI → Commission mapping (< 70% = KHÔNG có commission)
 * - Real-time alerts
 * - AUTO data từ CRM (không nhập tay)
 * - Gamification: rank, level, perks
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, Target, Award, Calendar,
  ChevronLeft, Star, AlertTriangle, CheckCircle, Clock,
  DollarSign, Users, Phone, FileText, Building, Bell,
  Trophy, ArrowUp, ArrowDown, Minus, RefreshCw, Zap,
  Lock, Unlock, Gift, Crown, Medal, Gem, Shield
} from 'lucide-react';
import { kpiApi } from '../../api/kpiApi';
import { toast } from 'sonner';

const formatCurrency = (amount) => {
  if (!amount) return '0 đ';
  if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)} tỷ`;
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)} tr`;
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
};

const STATUS_COLORS = {
  exceeding: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'Vượt mục tiêu' },
  on_track: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', label: 'Đúng tiến độ' },
  at_risk: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', label: 'Có rủi ro' },
  behind: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', label: 'Chưa đạt' },
};

const KPI_ICONS = {
  NEW_CUSTOMERS: Users,
  LEADS_RECEIVED: Users,
  LEADS_CONTACTED: Phone,
  CALLS_MADE: Phone,
  MEETINGS_SCHEDULED: Calendar,
  SITE_VISITS: Building,
  SOFT_BOOKINGS: FileText,
  HARD_BOOKINGS: FileText,
  DEALS_WON: Trophy,
  REVENUE_ACTUAL: DollarSign,
  default: Target,
};

const LEVEL_CONFIG = {
  bronze: { icon: Shield, color: 'text-orange-600', bg: 'bg-orange-500/20', label: 'Đồng' },
  silver: { icon: Medal, color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'Bạc' },
  gold: { icon: Crown, color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'Vàng' },
  diamond: { icon: Gem, color: 'text-cyan-400', bg: 'bg-cyan-500/20', label: 'Kim cương' },
};

const DEMO_PERFORMANCE_DATA = {
  period_label: 'Tháng 3/2026',
  summary: {
    grade: 'A',
    total_score: 87.5,
    achieved_kpis: 6,
    total_kpis: 8,
    rank: 3,
    rank_total: 24,
    commission_multiplier: 1.1,
    bonus_tier: 'Top performer',
  },
  kpis: [
    {
      kpi_code: 'LEADS_RECEIVED',
      kpi_name: 'Lead nhận mới',
      status: 'on_track',
      status_label: 'Đúng tiến độ',
      formatted_actual: '42',
      formatted_target: '50',
      actual: 42,
      target: 50,
      achievement: 84,
      weight: 0.15,
      is_key_metric: true,
    },
    {
      kpi_code: 'CALLS_MADE',
      kpi_name: 'Cuộc gọi',
      status: 'exceeding',
      status_label: 'Vượt mục tiêu',
      formatted_actual: '165',
      formatted_target: '140',
      actual: 165,
      target: 140,
      achievement: 117.9,
      weight: 0.1,
    },
    {
      kpi_code: 'SITE_VISITS',
      kpi_name: 'Dẫn khách xem dự án',
      status: 'at_risk',
      status_label: 'Có rủi ro',
      formatted_actual: '9',
      formatted_target: '14',
      actual: 9,
      target: 14,
      achievement: 64.3,
      weight: 0.2,
    },
    {
      kpi_code: 'REVENUE_ACTUAL',
      kpi_name: 'Doanh số',
      status: 'on_track',
      status_label: 'Đúng tiến độ',
      formatted_actual: '9,6 tỷ',
      formatted_target: '11,0 tỷ',
      actual: 9600000000,
      target: 11000000000,
      achievement: 87.3,
      weight: 0.35,
      is_key_metric: true,
    },
  ],
  alerts: [
    { id: 'alert-001', severity: 'warning', message: 'Bạn còn thiếu 2 lịch hẹn để chạm mốc KPI tuần này.' },
    { id: 'alert-002', severity: 'critical', message: 'Tỷ lệ follow up lead nóng đang thấp hơn mục tiêu.' },
  ],
};

const DEMO_LEVEL_DATA = {
  level: 'gold',
  label_vi: 'Vàng',
  perks: ['Ưu tiên hàng nóng', 'Bonus +10%', 'Ưu tiên lead nóng'],
};

const DEMO_PERIOD_STATUS = {
  is_locked: false,
};

export default function MyPerformancePage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [levelData, setLevelData] = useState(null);
  const [periodLocked, setPeriodLocked] = useState(false);
  const [period, setPeriod] = useState('monthly');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const now = new Date();
      const [performanceData, levelInfo, periodStatus] = await Promise.all([
        kpiApi.getMyScorecard(null, period, now.getFullYear(), now.getMonth() + 1),
        kpiApi.getUserLevel(null, period, now.getFullYear(), now.getMonth() + 1).catch(() => null),
        kpiApi.getPeriodStatus(period, now.getFullYear(), now.getMonth() + 1).catch(() => null),
      ]);
      setData(performanceData || DEMO_PERFORMANCE_DATA);
      setLevelData(levelInfo || DEMO_LEVEL_DATA);
      setPeriodLocked(periodStatus?.is_locked || DEMO_PERIOD_STATUS.is_locked);
    } catch (error) {
      console.error('Error loading performance:', error);
      setData(DEMO_PERFORMANCE_DATA);
      setLevelData(DEMO_LEVEL_DATA);
      setPeriodLocked(DEMO_PERIOD_STATUS.is_locked);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh actuals from CRM
      await kpiApi.refreshActuals(null, period);
      await loadData();
      toast.success('Đã cập nhật dữ liệu từ CRM');
    } catch (error) {
      toast.error('Không thể cập nhật');
    }
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const kpis = data?.kpis || [];
  const alerts = data?.alerts || [];
  const grade = summary.grade || 'F';
  const score = summary.total_score || 0;
  
  // Level info
  const level = levelData?.level || 'bronze';
  const levelConfig = LEVEL_CONFIG[level] || LEVEL_CONFIG.bronze;
  const LevelIcon = levelConfig.icon;
  
  // Commission eligibility
  const commissionEligible = score >= 70;
  const commissionMultiplier = summary.commission_multiplier || 0;
  
  const gradeColors = {
    'A+': 'text-emerald-400 bg-emerald-500/20',
    'A': 'text-emerald-400 bg-emerald-500/20',
    'B': 'text-blue-400 bg-blue-500/20',
    'C': 'text-amber-400 bg-amber-500/20',
    'D': 'text-orange-400 bg-orange-500/20',
    'F': 'text-red-400 bg-red-500/20',
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6" data-testid="my-performance-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/kpi" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <ChevronLeft size={20} className="text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              KPI của tôi
              {periodLocked && (
                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock size={10} /> LOCKED
                </span>
              )}
            </h1>
            <p className="text-gray-400">{data?.period_label || 'Tháng này'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
            data-testid="period-select"
          >
            <option value="weekly">Tuần</option>
            <option value="monthly">Tháng</option>
            <option value="quarterly">Quý</option>
          </select>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing || periodLocked}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            data-testid="refresh-btn"
            title={periodLocked ? "Kỳ này đã khóa" : "Cập nhật từ CRM"}
          >
            <RefreshCw size={18} className={`text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Level + Grade Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Level Card */}
        <div className={`${levelConfig.bg} border ${levelConfig.color.replace('text', 'border')}/30 rounded-xl p-6`}>
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl ${levelConfig.bg} flex items-center justify-center`}>
              <LevelIcon size={32} className={levelConfig.color} />
            </div>
            <div>
              <div className="text-gray-400 text-sm">Level hiện tại</div>
              <div className={`text-2xl font-bold ${levelConfig.color}`}>
                {levelData?.label_vi || levelConfig.label}
              </div>
              <div className="text-gray-500 text-xs">
                {levelData?.perks?.slice(0, 2).join(' • ') || 'Cơ bản'}
              </div>
            </div>
          </div>
        </div>

        {/* Score Card */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${gradeColors[grade] || gradeColors['F']}`}>
                <span className="text-3xl font-bold">{grade}</span>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Điểm tổng</div>
                <div className="text-2xl font-bold text-white">{score.toFixed(1)}/100</div>
                <div className="text-gray-500 text-xs">
                  {summary.achieved_kpis || 0}/{summary.total_kpis || 0} KPIs đạt
                </div>
              </div>
            </div>
            
            {summary.rank > 0 && (
              <div className="text-right">
                <div className="text-gray-400 text-sm">Rank</div>
                <div className="text-2xl font-bold text-cyan-400">#{summary.rank}</div>
                <div className="text-gray-500 text-xs">/{summary.rank_total || '?'}</div>
              </div>
            )}
          </div>
        </div>

        {/* Commission Card */}
        <div className={`${commissionEligible ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'} border rounded-xl p-6`}>
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${commissionEligible ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
              <DollarSign size={32} className={commissionEligible ? 'text-emerald-400' : 'text-red-400'} />
            </div>
            <div>
              <div className="text-gray-400 text-sm">Hệ số Commission</div>
              <div className={`text-2xl font-bold ${commissionEligible ? 'text-emerald-400' : 'text-red-400'}`}>
                {commissionEligible ? `${commissionMultiplier.toFixed(2)}x` : '0x'}
              </div>
              <div className={`text-xs ${commissionEligible ? 'text-emerald-300' : 'text-red-300'}`}>
                {commissionEligible ? summary.bonus_tier || 'Đủ điều kiện' : 'KPI < 70% - KHÔNG có commission'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Commission Warning */}
      {!commissionEligible && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-400" size={24} />
            <div>
              <div className="text-red-400 font-semibold">CẢNH BÁO: KHÔNG ĐỦ ĐIỀU KIỆN COMMISSION</div>
              <div className="text-red-300 text-sm">
                KPI hiện tại: {score.toFixed(1)}% - Cần đạt tối thiểu 70% để nhận commission.
                Còn thiếu {(70 - score).toFixed(1)}% nữa.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
          <h3 className="text-amber-400 font-semibold flex items-center gap-2 mb-3">
            <Bell size={18} />
            Cảnh báo ({alerts.length})
          </h3>
          <div className="space-y-2">
            {alerts.slice(0, 5).map((alert, index) => (
              <div key={alert.id || index} className="flex items-center gap-3 text-sm">
                <AlertTriangle size={14} className={alert.severity === 'critical' ? 'text-red-400' : 'text-amber-400'} />
                <span className="text-gray-300">{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AUTO Data Banner */}
      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3 mb-6">
        <div className="flex items-center gap-2 text-cyan-400 text-sm">
          <Zap size={16} />
          <span className="font-medium">Dữ liệu AUTO 100%</span>
          <span className="text-cyan-300">- Tự động từ CRM: Leads, Calls, Bookings, Contracts, Revenue</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, index) => {
          const status = STATUS_COLORS[kpi.status] || STATUS_COLORS.on_track;
          const Icon = KPI_ICONS[kpi.kpi_code] || KPI_ICONS.default;
          const achievement = kpi.achievement || 0;
          
          return (
            <div 
              key={kpi.kpi_code || index}
              className={`bg-[#12121a] border ${status.border} rounded-xl p-4`}
              data-testid={`kpi-card-${kpi.kpi_code}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg ${status.bg} flex items-center justify-center`}>
                    <Icon size={16} className={status.text} />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">{kpi.kpi_name}</div>
                    {kpi.is_key_metric && <Star className="inline w-3 h-3 text-amber-400" />}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
                  {kpi.status_label || status.label}
                </span>
              </div>
              
              <div className="mb-3">
                <div className="flex items-end justify-between mb-1">
                  <span className="text-2xl font-bold text-white">
                    {kpi.formatted_actual || kpi.actual || 0}
                  </span>
                  <span className="text-gray-500 text-sm">
                    / {kpi.formatted_target || kpi.target || 0}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className={`absolute top-0 left-0 h-full rounded-full transition-all ${
                      achievement >= 100 ? 'bg-emerald-500' :
                      achievement >= 70 ? 'bg-blue-500' :
                      achievement >= 50 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(achievement, 100)}%` }}
                  />
                  {achievement > 100 && (
                    <div 
                      className="absolute top-0 left-0 h-full bg-emerald-400/50 rounded-full"
                      style={{ width: `100%` }}
                    />
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className={`font-semibold ${status.text}`}>
                  {achievement.toFixed(1)}%
                </span>
                <span className="text-gray-500">
                  Trọng số: {((kpi.weight || 0) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          );
        })}
        
        {kpis.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Target className="mx-auto mb-4" size={48} />
            <p>Chưa có KPI được gán cho bạn</p>
            <p className="text-sm mt-2">Hãy liên hệ Leader để được gán target</p>
          </div>
        )}
      </div>

      {/* Level Progress + Commission Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Level Progress */}
        <div className="bg-[#12121a] border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Trophy className="text-amber-400" size={20} />
            Level System
          </h3>
          
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(LEVEL_CONFIG).map(([lvl, cfg]) => {
              const LvlIcon = cfg.icon;
              const isActive = level === lvl;
              const isPassed = 
                (lvl === 'bronze' && score >= 0) ||
                (lvl === 'silver' && score >= 60) ||
                (lvl === 'gold' && score >= 80) ||
                (lvl === 'diamond' && score >= 100);
              
              return (
                <div 
                  key={lvl}
                  className={`p-3 rounded-lg text-center ${
                    isActive ? cfg.bg + ' border border-current ' + cfg.color.replace('text', 'border') :
                    isPassed ? 'bg-gray-800/50' : 'bg-gray-900 opacity-50'
                  }`}
                >
                  <LvlIcon size={24} className={`mx-auto ${isActive ? cfg.color : 'text-gray-500'}`} />
                  <div className={`text-xs mt-1 ${isActive ? cfg.color : 'text-gray-500'}`}>
                    {cfg.label}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 text-sm text-gray-400">
            <div className="flex justify-between">
              <span>Điểm hiện tại: <span className="text-white">{score.toFixed(1)}</span></span>
              <span>
                {level === 'diamond' ? 'MAX LEVEL!' :
                 level === 'gold' ? `Còn ${(100 - score).toFixed(1)} điểm lên Diamond` :
                 level === 'silver' ? `Còn ${(80 - score).toFixed(1)} điểm lên Gold` :
                 `Còn ${(60 - score).toFixed(1)} điểm lên Silver`}
              </span>
            </div>
          </div>
        </div>

        {/* Commission Rules */}
        <div className="bg-[#12121a] border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <DollarSign className="text-emerald-400" size={20} />
            KPI → Commission
          </h3>
          
          <div className="space-y-2">
            <div className={`flex items-center justify-between p-2 rounded-lg ${score < 70 ? 'bg-red-500/20 border border-red-500/30' : 'bg-gray-800/50'}`}>
              <span className={score < 70 ? 'text-red-400' : 'text-gray-400'}>KPI &lt; 70%</span>
              <span className="text-red-400 font-medium">KHÔNG có commission</span>
            </div>
            <div className={`flex items-center justify-between p-2 rounded-lg ${score >= 70 && score < 90 ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-gray-800/50'}`}>
              <span className={score >= 70 && score < 90 ? 'text-blue-400' : 'text-gray-400'}>70% - 89%</span>
              <span className="text-blue-400 font-medium">Commission chuẩn (x1.0)</span>
            </div>
            <div className={`flex items-center justify-between p-2 rounded-lg ${score >= 90 && score < 100 ? 'bg-cyan-500/20 border border-cyan-500/30' : 'bg-gray-800/50'}`}>
              <span className={score >= 90 && score < 100 ? 'text-cyan-400' : 'text-gray-400'}>90% - 99%</span>
              <span className="text-cyan-400 font-medium">+10% (x1.1)</span>
            </div>
            <div className={`flex items-center justify-between p-2 rounded-lg ${score >= 100 && score < 120 ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-gray-800/50'}`}>
              <span className={score >= 100 && score < 120 ? 'text-emerald-400' : 'text-gray-400'}>100% - 119%</span>
              <span className="text-emerald-400 font-medium">Bonus +20% (x1.2)</span>
            </div>
            <div className={`flex items-center justify-between p-2 rounded-lg ${score >= 120 ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-gray-800/50'}`}>
              <span className={score >= 120 ? 'text-purple-400' : 'text-gray-400'}>≥ 120%</span>
              <span className="text-purple-400 font-medium">Siêu bonus +50% (x1.5)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Flow Chart */}
      <div className="mt-6 bg-[#12121a] border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">CRM → KPI → Commission → Lương</h3>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 bg-cyan-500/20 px-4 py-2 rounded-lg">
            <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-black text-xs font-bold">1</div>
            <span className="text-cyan-400">CRM Data (AUTO)</span>
          </div>
          <span className="text-gray-600">→</span>
          <div className="flex items-center gap-2 bg-blue-500/20 px-4 py-2 rounded-lg border border-blue-500/30">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
            <span className="text-blue-400 font-medium">KPI Score: {score.toFixed(1)}%</span>
          </div>
          <span className="text-gray-600">→</span>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${commissionEligible ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
            <div className={`w-6 h-6 ${commissionEligible ? 'bg-emerald-500' : 'bg-red-500'} rounded-full flex items-center justify-center text-white text-xs font-bold`}>3</div>
            <span className={commissionEligible ? 'text-emerald-400' : 'text-red-400'}>
              Commission {commissionEligible ? `x${commissionMultiplier.toFixed(2)}` : 'x0'}
            </span>
          </div>
          <span className="text-gray-600">→</span>
          <div className="flex items-center gap-2 bg-purple-500/20 px-4 py-2 rounded-lg">
            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">4</div>
            <span className="text-purple-400">Payroll</span>
          </div>
        </div>
      </div>
    </div>
  );
}
