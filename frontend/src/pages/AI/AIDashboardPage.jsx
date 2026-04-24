/**
 * AIDashboardPage.jsx — D10
 * Tổng hợp tất cả AI Features + quick access vào mỗi tool
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertTriangle, BarChart3, Bot, ChevronRight, FileText,
  Heart, Lightbulb, Star, TrendingUp, Zap, RefreshCw,
} from 'lucide-react';

const PRIORITY_COLORS = {
  critical: 'bg-red-50 border-red-200 text-red-700',
  high:     'bg-orange-50 border-orange-200 text-orange-700',
  medium:   'bg-amber-50 border-amber-200 text-amber-700',
  low:      'bg-slate-50 border-slate-200 text-slate-600',
};

const AI_FEATURES = [
  { id: 'valuation',    icon: '🏷️', label: 'Định giá BĐS',     desc: 'Ước tính giá thị trường',     route: '/ai/valuation',    color: 'bg-blue-50 border-blue-200' },
  { id: 'lead',         icon: '🎯', label: 'Lead Scoring',      desc: 'Phân loại Hot/Warm/Cold',      route: '/ai/lead-scoring', color: 'bg-red-50 border-red-200' },
  { id: 'chat',         icon: '🤖', label: 'AI Assistant',      desc: 'Hỏi bất cứ điều gì',          route: '/ai/chat',         color: 'bg-violet-50 border-violet-200' },
  { id: 'deal',         icon: '📊', label: 'Deal Advisor',      desc: 'Xác suất chốt deal',           route: '/ai/deal-advisor', color: 'bg-emerald-50 border-emerald-200' },
  { id: 'content',      icon: '✍️', label: 'Content Generator', desc: 'Soạn nội dung tự động',        route: '/ai/content',      color: 'bg-amber-50 border-amber-200' },
  { id: 'recommend',    icon: '💡', label: 'Gợi ý sản phẩm',   desc: 'Match khách – căn hộ phù hợp', route: '/ai/recommend',    color: 'bg-teal-50 border-teal-200' },
  { id: 'coaching',     icon: '📈', label: 'KPI Coaching',      desc: 'Phân tích & gợi ý cải thiện',  route: '/ai/kpi-coaching', color: 'bg-orange-50 border-orange-200' },
  { id: 'sentiment',    icon: '❤️', label: 'Sentiment',         desc: 'Đọc cảm xúc ghi chú khách',   route: '/ai/sentiment',    color: 'bg-pink-50 border-pink-200' },
];

const METRICS = [
  { icon: '🎯', label: 'Lead HOT hôm nay',   key: 'hot_leads_today',    color: 'text-red-600' },
  { icon: '📊', label: 'Tỷ lệ win deal',      key: 'deal_win_rate',      color: 'text-emerald-600', suffix: '%' },
  { icon: '📋', label: 'KPI tháng',           key: 'kpi_completion_pct', color: 'text-[#316585]',   suffix: '%' },
  { icon: '✍️', label: 'Nội dung đã tạo',    key: 'content_generated',  color: 'text-amber-600' },
];

export default function AIDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/ai/dashboard?user_id=${user?.id || 'demo'}`);
      setData(res.data);
    } catch {
      // Use demo data if API fails
      setData({ highlights: [], quick_insights: {}, generated_at: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadDashboard(); }, []);

  return (
    <div className="space-y-5 max-w-3xl" data-testid="ai-dashboard-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-2xl">🧠</span> AI Command Center
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Tất cả công cụ AI — Phân tích thông minh mọi lúc</p>
        </div>
        <button onClick={loadDashboard} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Cập nhật
        </button>
      </div>

      {/* AI Alerts */}
      {data?.highlights?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">🚨 AI Insights cần xử lý</p>
          {data.highlights.map((h, i) => (
            <button key={i} onClick={() => navigate(h.action)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:shadow-sm ${PRIORITY_COLORS[h.priority]}`}>
              <span className="text-xl flex-shrink-0">{h.icon}</span>
              <p className="font-medium text-sm flex-1">{h.title}</p>
              <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-60" />
            </button>
          ))}
        </div>
      )}

      {/* Quick metrics */}
      {data?.quick_insights && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {METRICS.map(m => (
            <Card key={m.key} className="border-slate-200">
              <CardContent className="p-3 text-center">
                <p className="text-lg">{m.icon}</p>
                <p className={`text-2xl font-bold mt-1 ${m.color}`}>
                  {data.quick_insights[m.key] ?? '—'}{m.suffix || ''}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">{m.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* AI Feature Grid */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">⚡ Công cụ AI</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {AI_FEATURES.map(feat => (
            <button key={feat.id} onClick={() => navigate(feat.route)}
              className={`flex flex-col p-4 rounded-2xl border text-left transition-all hover:shadow-md hover:-translate-y-0.5 ${feat.color}`}>
              <span className="text-2xl mb-2">{feat.icon}</span>
              <p className="font-semibold text-sm text-slate-900">{feat.label}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{feat.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Model status */}
      {data?.model_status && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Bot className="w-4 h-4 text-[#316585]" />Trạng thái AI Models</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(data.model_status).map(([key, info]) => (
                <div key={key} className="flex items-center justify-between py-1.5 px-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-xs font-medium text-slate-700 capitalize">{key.replace('_', ' ')}</p>
                    <p className="text-[10px] text-slate-400">{info.version}</p>
                  </div>
                  <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-0">{info.accuracy}</Badge>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-center">
              Phase D: Rule-based models · Phase D+ sẽ upgrade lên ML thật
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
