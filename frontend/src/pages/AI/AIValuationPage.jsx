/**
 * AIValuationPage.jsx — D1
 * AI Định giá BĐS — Interactive form + kết quả phân tích
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { TrendingUp, Zap, BarChart3, Info, RefreshCw, Clipboard } from 'lucide-react';

const DIRECTIONS = ['Đông', 'Tây', 'Nam', 'Bắc', 'Đông Nam', 'Tây Nam', 'Đông Bắc', 'Tây Bắc'];
const CONDITIONS = [
  { value: 'excellent', label: 'Mới hoàn toàn', bonus: '+5%' },
  { value: 'good',      label: 'Tốt', bonus: '0%' },
  { value: 'fair',      label: 'Trung bình', bonus: '-8%' },
  { value: 'poor',      label: 'Cũ, cần sửa', bonus: '-18%' },
];

const fmt = (n) => n ? new Intl.NumberFormat('vi-VN').format(n) + ' đ' : '—';

export default function AIValuationPage() {
  const [form, setForm] = useState({
    project: '', area: '', floor: '', direction: 'Đông Nam',
    bedrooms: '2', condition: 'good', age_years: '3',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const f = (k) => (v) => setForm(prev => ({ ...prev, [k]: typeof v === 'string' ? v : v.target.value }));

  const handleEstimate = async () => {
    if (!form.project || !form.area || !form.floor) {
      toast.error('Điền đầy đủ: Dự án, Diện tích, Tầng');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/ai/valuation/estimate', {
        ...form,
        area: parseFloat(form.area),
        floor: parseInt(form.floor),
        bedrooms: parseInt(form.bedrooms),
        age_years: parseInt(form.age_years),
      });
      setResult(res.data);
    } catch (err) {
      toast.error('Lỗi định giá. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const copyResult = () => {
    if (!result) return;
    const text = `Định giá AI — ${form.project}\nEst: ${fmt(result.estimated_price)}\nRange: ${fmt(result.range_low)} – ${fmt(result.range_high)}\nĐộ tin cậy: ${result.confidence}%`;
    navigator.clipboard.writeText(text);
    toast.success('Đã copy kết quả');
  };

  return (
    <div className="space-y-5 max-w-2xl" data-testid="ai-valuation-page">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <span className="text-2xl">🏷️</span> AI Định giá BĐS
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Ước tính giá thị trường dựa trên dữ liệu thực tế + AI analysis</p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Thông tin căn hộ</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Tên dự án *</label>
              <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#316585]/30"
                value={form.project} onChange={f('project')} placeholder="Vinhomes Central Park, Masteri..." />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Diện tích (m²) *</label>
                <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#316585]/30"
                  value={form.area} onChange={f('area')} placeholder="65" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Tầng *</label>
                <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#316585]/30"
                  value={form.floor} onChange={f('floor')} placeholder="15" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Phòng ngủ</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  value={form.bedrooms} onChange={f('bedrooms')}>
                  {[1,2,3,4].map(n => <option key={n} value={n}>{n} PN</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Hướng</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  value={form.direction} onChange={f('direction')}>
                  {DIRECTIONS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Tuổi căn (năm)</label>
                <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#316585]/30"
                  value={form.age_years} onChange={f('age_years')} placeholder="3" min="0" max="30" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Tình trạng nội thất</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CONDITIONS.map(c => (
                  <button key={c.value} onClick={() => setForm(p => ({...p, condition: c.value}))}
                    className={`p-2 rounded-lg border text-xs font-medium text-center transition-all ${form.condition === c.value ? 'border-[#316585] bg-[#316585]/5 text-[#316585]' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                    {c.label}<br/><span className="text-[10px] opacity-60">{c.bonus}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <Button onClick={handleEstimate} disabled={loading} className="w-full bg-[#316585] hover:bg-[#264f68] gap-2">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {loading ? 'Đang phân tích...' : 'Định giá ngay'}
          </Button>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Main price */}
          <Card className="border-[#316585]/30 bg-gradient-to-br from-[#316585]/5 to-blue-50/40">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">GIÁ ƯỚC TÍNH</p>
                  <p className="text-3xl font-bold text-[#316585]">{fmt(result.estimated_price)}</p>
                  <p className="text-sm text-slate-500 mt-1">{fmt(result.price_per_m2)}/m²</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Range: {fmt(result.range_low)} – {fmt(result.range_high)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button onClick={copyResult} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600">
                    <Clipboard className="w-3.5 h-3.5" /> Copy
                  </button>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">{result.confidence}%</p>
                    <p className="text-[10px] text-slate-400">Độ tin cậy</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                  📈 {result.market_trend}
                </Badge>
                <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
                  💧 Thanh khoản: {result.liquidity_score}/100
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Factors */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#316585]" />Phân tích các yếu tố</CardTitle></CardHeader>
            <CardContent className="space-y-2.5">
              {Object.entries({
                'Bonus tầng cao':   result.factors.floor_bonus_pct,
                'Bonus hướng':      result.factors.direction_bonus_pct,
                'Tình trạng căn':   result.factors.condition_adj_pct,
                'Tuổi công trình':  result.factors.age_adj_pct,
              }).map(([label, val]) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-600 w-28">{label}</p>
                  <div className="flex-1 flex items-center gap-2">
                    <Progress value={Math.abs(val) * 5} className="flex-1 h-1.5" />
                    <span className={`text-xs font-semibold w-12 text-right ${val >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {val >= 0 ? '+' : ''}{val}%
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Comparables */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Giao dịch tương đương</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {result.comparables.map((c, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div><p className="text-xs font-medium text-slate-700">{c.label}</p>
                    <p className="text-[11px] text-slate-400">{c.date} · {c.area}m²</p></div>
                  <p className="text-sm font-bold text-slate-900">{fmt(c.price)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
