/**
 * SystemHealthPage.jsx — F4
 * Production Monitoring Dashboard — Real-time system status
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSystemHealth } from '@/hooks/useSystemHealth';
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Activity, Server, Database, Wifi, Cpu } from 'lucide-react';

const STATUS_CONFIG = {
  healthy:  { color: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-200', icon: CheckCircle,   badge: 'bg-emerald-500' },
  degraded: { color: 'text-amber-600',   bg: 'bg-amber-50',    border: 'border-amber-200',   icon: AlertCircle,   badge: 'bg-amber-500' },
  down:     { color: 'text-red-600',     bg: 'bg-red-50',      border: 'border-red-200',     icon: XCircle,       badge: 'bg-red-500' },
  loading:  { color: 'text-slate-400',   bg: 'bg-slate-50',    border: 'border-slate-200',   icon: Activity,      badge: 'bg-slate-400' },
};

const SERVICE_ICONS = { api: Server, supabase: Database, network: Wifi, serviceWorker: Activity, performance: Cpu };
const SERVICE_LABELS = { api: 'Backend API', supabase: 'Supabase DB', network: 'Network', serviceWorker: 'Service Worker', performance: 'Performance' };

export default function SystemHealthPage() {
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useSystemHealth();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const overall = data?.overall || 'loading';
  const cfg = STATUS_CONFIG[overall] || STATUS_CONFIG.loading;
  const OverallIcon = cfg.icon;

  return (
    <div className="space-y-5 max-w-3xl" data-testid="system-health-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#316585]" /> System Health
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {data?.timestamp ? `Cập nhật: ${new Date(data.timestamp).toLocaleTimeString('vi-VN')}` : 'Đang kiểm tra...'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading || refreshing} className="gap-1.5">
          <RefreshCw className={`w-3.5 h-3.5 ${(isLoading || refreshing) ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overall Status */}
      <Card className={`${cfg.bg} ${cfg.border} border-2`}>
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cfg.bg}`}>
              <OverallIcon className={`w-7 h-7 ${cfg.color}`} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg text-slate-900">
                {overall === 'healthy' ? '✅ Tất cả hệ thống hoạt động' :
                 overall === 'degraded' ? '⚠️ Một số dịch vụ gián đoạn' :
                 overall === 'down' ? '❌ Hệ thống đang có sự cố' : '⏳ Đang kiểm tra...'}
              </p>
              <p className="text-sm text-slate-500 mt-0.5">ProHouze v2.1.0 — Phase A-F Complete</p>
            </div>
            <div className={`w-4 h-4 rounded-full ${cfg.badge} ${overall !== 'down' ? 'animate-pulse' : ''}`} />
          </div>
        </CardContent>
      </Card>

      {/* Service Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data?.services && Object.entries(data.services).map(([key, svc]) => {
          const Icon = SERVICE_ICONS[key] || Activity;
          const healthy = svc?.healthy !== false;
          const sc = STATUS_CONFIG[healthy ? 'healthy' : 'degraded'];

          return (
            <Card key={key} className={`${sc.border} border`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${sc.bg}`}>
                    <Icon className={`w-4.5 h-4.5 ${sc.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm text-slate-900">{SERVICE_LABELS[key]}</p>
                      <Badge className={`text-[10px] text-white border-0 ${sc.badge} shrink-0`}>
                        {healthy ? 'OK' : 'Issue'}
                      </Badge>
                    </div>
                    {/* Details */}
                    <div className="mt-1.5 space-y-0.5">
                      {svc?.latency   && <p className="text-[11px] text-slate-500">Latency: {svc.latency}ms {svc.latency < 500 ? '⚡' : svc.latency < 1500 ? '👍' : '⚠️'}</p>}
                      {svc?.version   && <p className="text-[11px] text-slate-500">Version: {svc.version}</p>}
                      {svc?.type      && <p className="text-[11px] text-slate-500">Network: {svc.type} {svc.downlink ? `(${svc.downlink} Mbps)` : ''}</p>}
                      {svc?.state     && <p className="text-[11px] text-slate-500">SW State: {svc.state}</p>}
                      {svc?.ttfb      && <p className="text-[11px] text-slate-500">TTFB: {svc.ttfb}ms | Page: {svc.page_load_ms}ms</p>}
                      {svc?.error     && <p className="text-[11px] text-red-500">❌ {svc.error}</p>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Phase Roadmap Status */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">🏆 Phase Completion</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { id: 'A', label: 'Foundation',    tag: 'v1.0-phase-a' },
              { id: 'B', label: 'Data Layer',    tag: 'v1.0-phase-b' },
              { id: 'C', label: 'Native App',    tag: 'v1.0-phase-c' },
              { id: 'D', label: 'AI Features',   tag: 'v1.0-phase-d' },
              { id: 'E', label: 'Integration',   tag: 'v1.0-phase-e' },
              { id: 'F', label: 'Production 🎯', tag: 'v1.0-phase-f' },
            ].map(phase => (
              <div key={phase.id} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-white">{phase.id}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-800">Phase {phase.id} — {phase.label}</p>
                    <code className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{phase.tag}</code>
                  </div>
                  <div className="w-full h-1.5 bg-emerald-100 rounded-full mt-1.5">
                    <div className="h-full bg-emerald-500 rounded-full w-full" />
                  </div>
                </div>
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
