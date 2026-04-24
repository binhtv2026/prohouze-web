import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Database,
  FileCheck,
  GitBranch,
  History,
  LayoutDashboard,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { governanceFoundationService } from '@/services/governanceFoundationService';
import { governanceFoundationApi } from '@/api/governanceFoundationApi';

export default function GovernanceConsolePage() {
  const [summary, setSummary] = useState(governanceFoundationService.getGovernanceSummary());
  const [canonicalEntities, setCanonicalEntities] = useState(governanceFoundationService.getCanonicalEntities());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadGovernanceData = async () => {
      try {
        const [summaryData, domainData] = await Promise.all([
          governanceFoundationApi.getSummary(),
          governanceFoundationApi.getCanonicalDomains(),
        ]);

        if (!active) {
          return;
        }

        setSummary({
          domainCount: summaryData.domain_count,
          mappedEntityCount: summaryData.mapped_entity_count,
          statusModelCount: summaryData.status_model_count,
          approvalFlowCount: summaryData.approval_flow_count,
          timelineStreamCount: summaryData.timeline_stream_count,
          criticalMomentCount: summaryData.critical_moment_count,
        });
        setCanonicalEntities(domainData);
      } catch (error) {
        // Fall back to local registry during local preview or when backend foundation API is unavailable.
        console.warn('Governance foundation API unavailable, using local registry fallback.', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadGovernanceData();

    return () => {
      active = false;
    };
  }, []);

  const governanceModules = [
    {
      title: 'Bản đồ triển khai',
      path: '/settings/blueprint',
      icon: Target,
      description: 'Khóa tầm nhìn, phạm vi giai đoạn 1, KPI và tiêu chí nghiệm thu.',
      metric: '6 mô-đun ưu tiên',
    },
    {
      title: 'Nền tảng dữ liệu',
      path: '/settings/data-foundation',
      icon: Database,
      description: 'Khóa thực thể chuẩn, thứ tự chuyển đổi dữ liệu và quy tắc nền.',
      metric: `${summary.domainCount} miền nghiệp vụ`,
    },
    {
      title: 'Mô hình trạng thái',
      path: '/settings/status-model',
      icon: GitBranch,
      description: 'Chuẩn hóa vòng đời trạng thái cho các luồng nghiệp vụ cốt lõi.',
      metric: `${summary.statusModelCount} state machine`,
    },
    {
      title: 'Ma trận phê duyệt',
      path: '/settings/approval-matrix',
      icon: ShieldCheck,
      description: 'Khóa luồng duyệt cho booking, hợp đồng, chi phí và chi trả.',
      metric: `${summary.approvalFlowCount} luồng kiểm soát`,
    },
    {
      title: 'Lịch sử & nhật ký',
      path: '/settings/audit-timeline',
      icon: History,
      description: 'Theo dõi đầy đủ lịch sử thao tác, duyệt và thay đổi dữ liệu.',
      metric: `${summary.timelineStreamCount} luồng lịch sử`,
    },
    {
      title: 'Độ phủ quản trị',
      path: '/settings/governance-coverage',
      icon: FileCheck,
      description: 'Đo khoảng trống giữa governance, master data và entity schema.',
      metric: 'bản đồ độ phủ',
    },
    {
      title: 'Kế hoạch chuẩn hóa',
      path: '/settings/governance-remediation',
      icon: ShieldAlert,
      description: 'Danh sách chuẩn hóa trạng thái lệch chuẩn và thứ tự xử lý ưu tiên.',
      metric: 'hàng đợi xử lý',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50" data-testid="governance-console-page">
      <PageHeader
        title="Trung tâm quản trị"
        subtitle="Điều hành lớp quản trị cốt lõi gồm dữ liệu, trạng thái, phê duyệt, nhật ký và lộ trình triển khai"
        breadcrumbs={[
          { label: 'Cài đặt', path: '/settings' },
          { label: 'Trung tâm quản trị', path: '/settings/governance' },
        ]}
      />

      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Card className="border-slate-200 bg-gradient-to-r from-[#0d1f35] via-[#16314f] to-[#316585] text-white">
          <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge className="bg-white/10 text-white hover:bg-white/10">Giai đoạn 1 doanh nghiệp sơ cấp</Badge>
              <h2 className="mt-4 text-3xl font-bold">Một nơi duy nhất để khóa nền vận hành chuẩn cho ProHouze</h2>
              <p className="mt-2 text-sm leading-6 text-white/75">
                Khu vực này gom toàn bộ lớp điều hành nền để triển khai đúng hướng doanh nghiệp môi giới bất động sản sơ cấp:
                sản phẩm, khách hàng, booking, hợp đồng, dòng tiền và kiểm soát nội bộ.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/55">Lớp nền</p>
                <p className="mt-2 text-2xl font-bold">5 trục</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/55">Miền nghiệp vụ</p>
                <p className="mt-2 text-2xl font-bold">{summary.domainCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/55">Thực thể đã map</p>
                <p className="mt-2 text-2xl font-bold">{summary.mappedEntityCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin text-[#316585]" />
            Đang đồng bộ dữ liệu quản trị nền tảng...
          </div>
        )}

        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle>Cụm chức năng điều hành</CardTitle>
            <CardDescription>Gom gọn theo nhịp dashboard cũ để theo dõi nhanh, rõ và bám đúng phương án đã duyệt.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
            {governanceModules.map((item) => (
              <Link key={item.title} to={item.path} className="block">
                <div className="h-full rounded-2xl border border-slate-200 p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                    <item.icon className="h-5 w-5 text-slate-700" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                  <Badge variant="outline" className="mt-4 border-[#316585]/20 text-[#316585]">
                    {item.metric}
                  </Badge>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle>Danh mục thực thể chuẩn</CardTitle>
              <CardDescription>Bản đồ từ miền nghiệp vụ tới thực thể, luồng vận hành và lớp kiểm soát.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {canonicalEntities.map((domain) => (
                <div key={domain.domain} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{domain.domain}</h3>
                      <p className="mt-1 text-sm text-slate-600">{domain.purpose}</p>
                    </div>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                      {domain.entities.length} thực thể
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {domain.entities.map((entity) => (
                      <Badge key={entity} variant="secondary" className="bg-slate-100 text-slate-700">
                        {entity}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Luồng nghiệp vụ</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {domain.workflows.map((workflow) => (
                          <Badge key={workflow} className="bg-[#316585]/10 text-[#316585] hover:bg-[#316585]/10">
                            {workflow}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Kiểm soát</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {domain.governance.map((item) => (
                          <Badge key={item} variant="outline" className="border-slate-200 text-slate-700">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle>Quy tắc vận hành</CardTitle>
              <CardDescription>Mọi màn hình, API và workflow mới phải đi qua cụm quản trị này.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                'Không tạo thực thể mới nếu chưa có chủ sở hữu nghiệp vụ rõ ràng.',
                'Không mở workflow mới nếu chưa map mô hình trạng thái và luồng duyệt.',
                'Không đưa KPI lên dashboard nếu chưa có nguồn dữ liệu chuẩn.',
                'Không xem mô-đun là hoàn tất nếu chưa có lịch sử và khả năng truy vết.',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <FileCheck className="mt-0.5 h-5 w-5 text-[#316585]" />
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </div>
              ))}

              <div className="rounded-2xl border border-dashed border-[#316585]/35 bg-[#316585]/5 p-5">
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="h-5 w-5 text-[#316585]" />
                  <h3 className="font-semibold text-slate-900">Bước triển khai tiếp theo</h3>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Từ đây, hướng đúng là khóa lại `Master Data`, `Entity Schemas`, `Mô hình trạng thái`
                  và triển khai lớp thay đổi có kiểm soát để đưa vào các module kinh doanh thật.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button asChild className="bg-[#316585] hover:bg-[#274f67]">
                    <Link to="/settings/data-foundation">
                      Đi tới Nền tảng dữ liệu
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/settings/entity-governance">Đi tới Liên kết thực thể</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/settings/governance-coverage">Mở Bản đồ độ phủ</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/settings/governance-remediation">Mở Kế hoạch chuẩn hóa</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/settings/master-data">Đi tới Master Data</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
