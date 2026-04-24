/**
 * MobileAnalyticsPage — Mobile-first wrapper for all analytics/reports
 * Routes: /analytics/executive | /analytics/reports | /analytics/content
 * Used by: BOD, Manager (bottom nav tabs)
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Users, Target, BarChart3, DollarSign,
  AlertTriangle, CheckCircle2, RefreshCw, ChevronRight,
  Building2, Activity, Clock,
} from 'lucide-react';
import analyticsApi from '@/api/analyticsApi';

const DEMO_METRICS = [
  { label: 'Doanh thu tháng', value: '23,5 tỷ', pct: '+14.8%', up: true, icon: DollarSign, bg: '#fef3c7', fg: '#d97706' },
  { label: 'Tổng Leads',      value: '682',      pct: '+11.2%', up: true, icon: Users,      bg: '#dbeafe', fg: '#2563eb' },
  { label: 'Pipeline Value',  value: '56,2 tỷ',  pct: '+9.5%',  up: true, icon: Target,     bg: '#dcfce7', fg: '#16a34a' },
  { label: 'Căn còn bán',     value: '184',      pct: '-4.1%',  up: false, icon: Building2, bg: '#f3e8ff', fg: '#9333ea' },
];

const DEMO_ALERTS = [
  { label: 'Lead nóng chưa được gọi lại', count: 12, tone: '#ef4444' },
  { label: 'Booking đang chờ duyệt chính sách', count: 5, tone: '#f59e0b' },
  { label: 'Hồ sơ pháp lý chưa đồng bộ', count: 2, tone: '#3b82f6' },
];

export default function MobileAnalyticsPage() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(DEMO_METRICS);
  const [alerts, setAlerts] = useState(DEMO_ALERTS);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [metricsRes, bottleneckRes] = await Promise.allSettled([
        analyticsApi.getKeyMetrics({ periodType: 'this_month', compare: true }),
        analyticsApi.getBottlenecks('this_month'),
      ]);

      if (metricsRes.status === 'fulfilled' && metricsRes.value?.success) {
        const raw = metricsRes.value.data || [];
        const icons = [DollarSign, Users, Target, Building2];
        const bgs   = ['#fef3c7','#dbeafe','#dcfce7','#f3e8ff'];
        const fgs   = ['#d97706','#2563eb','#16a34a','#9333ea'];
        const labels = ['Doanh thu tháng','Tổng Leads','Pipeline Value','Căn còn bán'];
        if (raw.length >= 4) {
          setMetrics(raw.slice(0, 4).map((m, i) => ({
            label: labels[i],
            value: m.formatted_value || m.value,
            pct: m.change_percent ? `${m.change_percent > 0 ? '+' : ''}${m.change_percent}%` : '',
            up: m.trend === 'up',
            icon: icons[i],
            bg:  bgs[i],
            fg:  fgs[i],
          })));
        }
      }

      if (bottleneckRes.status === 'fulfilled' && bottleneckRes.value?.success) {
        const b = bottleneckRes.value.data || {};
        const parsed = [
          b.stale_deals        && { label: 'Deals không cập nhật >7 ngày', count: b.stale_deals.count,         tone: '#f59e0b' },
          b.overdue_followups  && { label: 'Tasks quá hạn cần xử lý',       count: b.overdue_followups.count,  tone: '#ef4444' },
          b.pending_contracts  && { label: 'Hợp đồng chờ phê duyệt',        count: b.pending_contracts.count,  tone: '#3b82f6' },
          b.unassigned_leads   && { label: 'Leads chưa phân công',           count: b.unassigned_leads.count,   tone: '#9333ea' },
        ].filter(Boolean).filter(x => x.count > 0);
        if (parsed.length > 0) setAlerts(parsed);
      }

      setLastUpdated(new Date());
    } catch {
      // giữ demo data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f1f5f9',
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: 104,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* ── HEADER ── */}
      <div
        style={{
          background: 'linear-gradient(135deg,#3a1f2d,#5a2d45,#7b4260)',
          paddingTop: 'calc(env(safe-area-inset-top,44px) + 24px)',
          paddingBottom: 36,
          paddingLeft: 20,
          paddingRight: 20,
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: -32, right: -32, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', filter: 'blur(32px)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: '30%', width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', filter: 'blur(24px)' }} />
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Executive</p>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>Tổng quan</h1>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>CEO / Lãnh đạo · Tháng này</p>
            </div>
            <button
              onClick={load}
              disabled={loading}
              style={{ width: 40, height: 40, borderRadius: 14, background: 'rgba(255,255,255,0.15)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <RefreshCw style={{ width: 18, height: 18, color: '#fff', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
          {lastUpdated && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '4px 12px', width: 'fit-content' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Cập nhật {lastUpdated.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── METRIC CARDS ── */}
      <div style={{ padding: '0 16px', marginTop: -20, zIndex: 2, flexShrink: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} style={{ background: '#fff', borderRadius: 24, padding: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 12, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon style={{ width: 18, height: 18, color: m.fg }} />
                  </div>
                  {m.pct && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: m.up ? '#16a34a' : '#dc2626' }}>{m.pct}</span>
                  )}
                </div>
                <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>{m.label}</p>
                <p style={{ fontSize: 22, fontWeight: 900, color: '#1e293b' }}>{loading ? '...' : m.value}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── RISK ALERTS ── */}
      <div style={{ padding: '24px 16px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: 11, fontWeight: 800, color: '#1e293b', letterSpacing: 2, textTransform: 'uppercase' }}>Điểm nghẽn cần xử lý</h2>
          <AlertTriangle style={{ width: 16, height: 16, color: '#f59e0b' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(loading ? [{label:'Đang tải...',count:'-',tone:'#94a3b8'}] : alerts).map((a, i) => (
            <div
              key={i}
              style={{ background: '#fff', borderRadius: 20, padding: '14px 16px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 12, background: `${a.tone}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 15, fontWeight: 900, color: a.tone }}>{a.count}</span>
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#334155', flex: 1 }}>{a.label}</p>
            </div>
          ))}
          {!loading && alerts.length === 0 && (
            <div style={{ background: '#f0fdf4', borderRadius: 20, padding: '20px 16px', textAlign: 'center', border: '1px solid #bbf7d0' }}>
              <CheckCircle2 style={{ width: 28, height: 28, color: '#16a34a', margin: '0 auto 8px' }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: '#15803d' }}>Không có điểm nghẽn nghiêm trọng</p>
            </div>
          )}
        </div>
      </div>

      {/* ── QUICK LINKS ── */}
      <div style={{ padding: '24px 16px 0', flexShrink: 0 }}>
        <h2 style={{ fontSize: 11, fontWeight: 800, color: '#1e293b', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Đi sâu báo cáo</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'Analytics chi tiết', path: '/analytics/reports', icon: BarChart3, fg: '#2563eb' },
            { label: 'KPI đội nhóm',       path: '/kpi/team',          icon: Users,     fg: '#9333ea' },
            { label: 'Phê duyệt',          path: '/app/approvals',     icon: Activity,  fg: '#f59e0b' },
          ].map((lnk) => {
            const Icon = lnk.icon;
            return (
              <button
                key={lnk.path}
                onClick={() => navigate(lnk.path)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 20, padding: '14px 16px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', cursor: 'pointer', textAlign: 'left', width: '100%' }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 12, background: `${lnk.fg}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon style={{ width: 18, height: 18, color: lnk.fg }} />
                </div>
                <p style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#334155' }}>{lnk.label}</p>
                <ChevronRight style={{ width: 16, height: 16, color: '#94a3b8' }} />
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
