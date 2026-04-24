import React, { useEffect, useState } from 'react';
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
  Database,
  GitBranch,
  Loader2,
  ShieldCheck,
  TableProperties,
} from 'lucide-react';

export default function GovernanceCoveragePage() {
  const [coverage, setCoverage] = useState(null);
  const [statusAlignment, setStatusAlignment] = useState([]);
  const [remediationPlan, setRemediationPlan] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadCoverage = async () => {
      try {
        const [coverageResponse, statusAlignmentResponse, remediationPlanResponse] = await Promise.all([
          governanceFoundationApi.getCoverage(),
          governanceFoundationApi.getStatusAlignment(),
          governanceFoundationApi.getRemediationPlan(),
        ]);
        if (active) {
          setCoverage(coverageResponse);
          setStatusAlignment(statusAlignmentResponse);
          setRemediationPlan(remediationPlanResponse);
        }
      } catch (error) {
        console.warn('Governance coverage API unavailable.', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadCoverage();

    return () => {
      active = false;
    };
  }, []);

  const safeCoverage = coverage || {
    total_master_data_categories: 0,
    mapped_master_data_categories: 0,
    unmapped_master_data_categories: 0,
    total_entity_schemas: 0,
    mapped_entity_schemas: 0,
    entities_without_master_data_dependencies: 0,
    entities_without_status_models: 0,
    entities_without_approval_flows: 0,
    entities_without_timeline_streams: 0,
    uncovered_master_data_categories: [],
    uncovered_entities: [],
  };
  const misalignedStatuses = statusAlignment.filter((item) => !item.aligned);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="governance-coverage-page">
      <PageHeader
        title="Bản đồ độ phủ quản trị"
        subtitle="Theo dõi mức độ hoàn thiện giữa governance, master data và entity schema của giai đoạn 1"
        breadcrumbs={[
          { label: 'Cài đặt', path: '/settings' },
          { label: 'Trung tâm quản trị nền tảng', path: '/settings/governance' },
          { label: 'Bản đồ độ phủ quản trị', path: '/settings/governance-coverage' },
        ]}
      />

      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Card className="border-slate-200 bg-gradient-to-r from-[#0d1f35] via-[#16314f] to-[#316585] text-white">
          <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge className="bg-white/10 text-white hover:bg-white/10">Dashboard kiểm soát độ phủ</Badge>
              <h2 className="mt-4 text-3xl font-bold">Nhìn rõ phần nào đã khóa chuẩn, phần nào còn hở trong vận hành</h2>
              <p className="mt-2 text-sm leading-6 text-white/75">
                Trang này giúp ProHouze tránh cảm giác “đã xong” khi dữ liệu, schema và kiểm soát
                vẫn chưa thực sự nối liền thành một hệ thống thống nhất.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/55">Độ phủ Master Data</p>
                <p className="mt-2 text-2xl font-bold">
                  {safeCoverage.mapped_master_data_categories}/{safeCoverage.total_master_data_categories}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/55">Độ phủ Entity Schema</p>
                <p className="mt-2 text-2xl font-bold">
                  {safeCoverage.mapped_entity_schemas}/{safeCoverage.total_entity_schemas}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin text-[#316585]" />
            Đang tải dữ liệu độ phủ quản trị...
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: 'Unmapped Master Data',
              titleVi: 'Master Data chưa map',
              value: safeCoverage.unmapped_master_data_categories,
              icon: Database,
              tone: 'text-amber-700 bg-amber-50 border-amber-200',
            },
            {
              title: 'No Master Data Dependency',
              titleVi: 'Entity chưa gắn dữ liệu',
              value: safeCoverage.entities_without_master_data_dependencies,
              icon: TableProperties,
              tone: 'text-slate-700 bg-slate-50 border-slate-200',
            },
            {
              title: 'No Status Model',
              titleVi: 'Thiếu mô hình trạng thái',
              value: safeCoverage.entities_without_status_models,
              icon: GitBranch,
              tone: 'text-red-700 bg-red-50 border-red-200',
            },
            {
              title: 'No Approval / Timeline',
              titleVi: 'Thiếu duyệt / lịch sử',
              value: safeCoverage.entities_without_approval_flows + safeCoverage.entities_without_timeline_streams,
              icon: ShieldCheck,
              tone: 'text-orange-700 bg-orange-50 border-orange-200',
            },
            {
              title: 'Status Mismatches',
              titleVi: 'Trạng thái lệch chuẩn',
              value: misalignedStatuses.length,
              icon: GitBranch,
              tone: 'text-rose-700 bg-rose-50 border-rose-200',
            },
          ].map((item) => (
            <Card key={item.title} className="border-slate-200 bg-white">
              <CardContent className="p-5">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${item.tone}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm text-slate-500">{item.titleVi}</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle>Danh mục master data chưa được dùng</CardTitle>
              <CardDescription>Những category chưa có field schema nào sử dụng.</CardDescription>
            </CardHeader>
            <CardContent>
              {safeCoverage.uncovered_master_data_categories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {safeCoverage.uncovered_master_data_categories.map((item) => (
                    <Badge key={item} className="bg-amber-50 text-amber-700 border border-amber-200">
                      {item}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                  <p className="text-sm text-emerald-700">Tất cả category master data hiện đã được schema sử dụng.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle>Entity còn thiếu liên kết</CardTitle>
              <CardDescription>Những entity chưa đủ dependency hoặc chưa đủ governance hooks.</CardDescription>
            </CardHeader>
            <CardContent>
              {safeCoverage.uncovered_entities.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {safeCoverage.uncovered_entities.map((item) => (
                    <Badge key={item} className="bg-red-50 text-red-700 border border-red-200">
                      {item}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                  <p className="text-sm text-emerald-700">Tất cả entity schema hiện đã đạt ngưỡng độ phủ đã định nghĩa.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle>Điểm lệch của mô hình trạng thái</CardTitle>
            <CardDescription>So sánh trạng thái trong master data với canonical state machine.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {misalignedStatuses.length > 0 ? (
              misalignedStatuses.map((item) => (
                <div key={item.category_key} className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{item.category_label}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {item.category_key} · {item.status_model_code || 'chưa map canonical model'}
                      </p>
                    </div>
                    <Badge className="w-fit bg-rose-100 text-rose-700 hover:bg-rose-100">
                      lệch chuẩn
                    </Badge>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Chỉ có ở master data</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.master_only_states.length > 0 ? item.master_only_states.map((state) => (
                          <Badge key={state} className="bg-amber-50 text-amber-700 border border-amber-200">
                            {state}
                          </Badge>
                        )) : <span className="text-sm text-slate-500">Không có</span>}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Chỉ có ở canonical</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.model_only_states.length > 0 ? item.model_only_states.map((state) => (
                          <Badge key={state} className="bg-red-50 text-red-700 border border-red-200">
                            {state}
                          </Badge>
                        )) : <span className="text-sm text-slate-500">Không có</span>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        className={
                          item.remediation_priority === 'critical'
                            ? 'bg-red-100 text-red-700'
                            : item.remediation_priority === 'high'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }
                      >
                        {item.remediation_priority}
                      </Badge>
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Hướng xử lý</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-700">{item.recommended_action}</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Button asChild size="sm" variant="outline">
                        <Link to="/settings/master-data">Mở Master Data</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link to="/settings/status-model">Mở Mô hình trạng thái</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link to="/settings/governance-remediation">Mở Kế hoạch chuẩn hóa</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                  <p className="text-sm text-emerald-700">Toàn bộ category trạng thái đang đồng bộ với canonical model.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle>Ưu tiên xử lý cao nhất</CardTitle>
            <CardDescription>Danh sách blocker cần xử lý trước để đưa giai đoạn 1 về đúng chuẩn.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {remediationPlan.length > 0 ? remediationPlan.map((item) => (
              <div key={`${item.title}-${item.target_route}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    className={
                      item.severity === 'critical'
                        ? 'bg-red-100 text-red-700'
                        : item.severity === 'high'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }
                  >
                    {item.severity}
                  </Badge>
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
                  <p className="text-sm text-emerald-700">Hiện không còn blocker remediation đang mở.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle>Thứ tự xử lý đề xuất</CardTitle>
            <CardDescription>Thứ tự vá khoảng trống để nâng chất lượng hệ thống nhanh nhất.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              'Xử lý trước các entity chưa có mô hình trạng thái hoặc chưa gắn master data dependency.',
              'Tiếp theo là rà soát các category master data chưa được schema nào sử dụng.',
              'Sau cùng hoàn thiện approval và timeline cho các entity nhạy cảm như booking, hợp đồng, thanh toán.',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-[#316585]" />
                <p className="text-sm leading-6 text-slate-700">{item}</p>
              </div>
            ))}

            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild className="bg-[#316585] hover:bg-[#274f67]">
                <Link to="/settings/master-data">
                  Đi tới Master Data
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/settings/entity-schemas">Đi tới Entity Schema</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/settings/governance-remediation">Đi tới Chuẩn hóa</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/settings/governance">Quay lại Trung tâm quản trị</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
