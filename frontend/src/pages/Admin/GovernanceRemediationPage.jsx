import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { governanceFoundationApi } from '@/api/governanceFoundationApi';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  GitMerge,
  Loader2,
  ShieldAlert,
  SplitSquareVertical,
} from 'lucide-react';

const severityTone = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-amber-100 text-amber-700',
  medium: 'bg-blue-100 text-blue-700',
  ok: 'bg-emerald-100 text-emerald-700',
};

export default function GovernanceRemediationPage() {
  const [remediationPlan, setRemediationPlan] = useState([]);
  const [statusNormalization, setStatusNormalization] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        const [planResponse, normalizationResponse] = await Promise.all([
          governanceFoundationApi.getRemediationPlan(),
          governanceFoundationApi.getStatusNormalization(),
        ]);

        if (active) {
          setRemediationPlan(planResponse);
          setStatusNormalization(normalizationResponse);
        }
      } catch (error) {
        console.warn('Governance remediation API unavailable.', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const groupedNormalization = useMemo(() => {
    return statusNormalization.reduce((acc, item) => {
      if (!acc[item.category_key]) {
        acc[item.category_key] = {
          categoryLabel: item.category_label,
          statusModelCode: item.status_model_code,
          items: [],
        };
      }
      acc[item.category_key].items.push(item);
      return acc;
    }, {});
  }, [statusNormalization]);

  const groupedEntries = Object.entries(groupedNormalization);
  const autoMappableCount = statusNormalization.filter((item) => item.suggestion_type === 'map').length;
  const manualReviewCount = statusNormalization.filter((item) => item.suggestion_type === 'review').length;
  const canonicalMissingCount = statusNormalization.filter((item) => item.suggestion_type === 'add').length;

  return (
    <div className="min-h-screen bg-slate-50" data-testid="governance-remediation-page">
      <PageHeader
        title="Kế hoạch chuẩn hóa"
        subtitle="Danh sách xử lý để đưa master data, mô hình trạng thái và governance về cùng một chuẩn vận hành"
        breadcrumbs={[
          { label: 'Cài đặt', path: '/settings' },
          { label: 'Trung tâm quản trị nền tảng', path: '/settings/governance' },
          { label: 'Kế hoạch chuẩn hóa', path: '/settings/governance-remediation' },
        ]}
      />

      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Card className="border-slate-200 bg-gradient-to-r from-[#1f2937] via-[#22344b] to-[#316585] text-white">
          <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge className="bg-white/10 text-white hover:bg-white/10">Bộ điều khiển chuẩn hóa</Badge>
              <h2 className="mt-4 text-3xl font-bold">Chuẩn hóa phải chỉ rõ cần đổi gì, đổi về đâu và đổi theo thứ tự nào</h2>
              <p className="mt-2 text-sm leading-6 text-white/75">
                Trang này gom danh sách blocker ưu tiên cao và ma trận chuẩn hóa từng trạng thái legacy
                để giai đoạn 1 không dừng lại ở mức phát hiện lỗi.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/55">Tự động map được</p>
                <p className="mt-2 text-2xl font-bold">{autoMappableCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/55">Cần rà soát tay</p>
                <p className="mt-2 text-2xl font-bold">{manualReviewCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/55">Thiếu trạng thái chuẩn</p>
                <p className="mt-2 text-2xl font-bold">{canonicalMissingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin text-[#316585]" />
            Đang tải kế hoạch chuẩn hóa...
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle>Danh sách ưu tiên cao nhất</CardTitle>
              <CardDescription>Đây là các việc nên xử lý trước để đưa giai đoạn 1 về đúng state machine và mô hình kiểm soát.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {remediationPlan.length > 0 ? remediationPlan.map((item) => (
                <div key={`${item.title}-${item.target_route}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={severityTone[item.severity] || severityTone.medium}>{item.severity}</Badge>
                    <Badge variant="outline" className="border-slate-200 text-slate-700">
                      {item.owner_area}
                    </Badge>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{item.detail}</p>
                  <div className="mt-4">
                    <Button asChild variant="outline">
                      <Link to={item.target_route}>Mở khu vực xử lý</Link>
                    </Button>
                  </div>
                </div>
              )) : (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                  <p className="text-sm text-emerald-700">Hiện không có blocker chuẩn hóa đang mở.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle>Nguyên tắc chuẩn hóa</CardTitle>
              <CardDescription>Quy tắc xử lý để không làm vỡ dashboard, workflow và báo cáo điều hành.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  icon: GitMerge,
                  title: 'Map trạng thái legacy về trạng thái chuẩn khi cùng một ý nghĩa nghiệp vụ.',
                },
                {
                  icon: SplitSquareVertical,
                  title: 'Nếu trạng thái chuẩn chưa có trong master data, bổ sung vào category trước khi đối soát.',
                },
                {
                  icon: ShieldAlert,
                  title: 'Trạng thái không rõ nghĩa phải rà soát với owner nghiệp vụ, không gộp đoán.',
                },
                {
                  icon: AlertTriangle,
                  title: 'KPI và dashboard chỉ được đọc từ canonical state machine sau khi chuẩn hóa.',
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <item.icon className="mt-0.5 h-5 w-5 text-[#316585]" />
                  <p className="text-sm leading-6 text-slate-700">{item.title}</p>
                </div>
              ))}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild className="bg-[#316585] hover:bg-[#274f67]">
                  <Link to="/settings/master-data">
                    Mở Master Data
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/settings/status-model">Mở Mô hình trạng thái</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle>Ma trận chuẩn hóa trạng thái</CardTitle>
            <CardDescription>Danh sách trạng thái legacy cần map, bổ sung hoặc rà soát để đồng bộ với canonical model.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {groupedEntries.length > 0 ? groupedEntries.map(([categoryKey, group]) => (
              <div key={categoryKey} className="rounded-3xl border border-slate-200 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{group.categoryLabel}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {categoryKey} · {group.statusModelCode || 'chưa map canonical model'}
                    </p>
                  </div>
                  <Badge variant="outline" className="border-slate-200 text-slate-700">
                    {group.items.length} gợi ý
                  </Badge>
                </div>
                <div className="mt-4 space-y-3">
                  {group.items.map((item) => (
                    <div key={`${item.legacy_state}-${item.suggestion_type}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="grid gap-3 md:grid-cols-3 md:items-center">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Trạng thái hiện tại</p>
                            <Badge className="mt-2 bg-amber-50 text-amber-700 border border-amber-200">
                              {item.legacy_state}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Hành động</p>
                            <Badge className={`mt-2 ${item.suggestion_type === 'map' ? 'bg-blue-100 text-blue-700' : item.suggestion_type === 'add' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              {item.suggestion_type}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Trạng thái chuẩn đích</p>
                            {item.suggested_canonical_state ? (
                              <Badge className="mt-2 bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {item.suggested_canonical_state}
                              </Badge>
                            ) : (
                              <span className="mt-2 block text-sm text-slate-500">Cần rà soát thủ công</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-6 text-slate-700">{item.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>
            )) : (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                <p className="text-sm text-emerald-700">Hiện không còn trạng thái legacy cần chuẩn hóa.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
