import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Building2,
  Database,
  FileCheck,
  GitBranch,
  Layers,
  Loader2,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { governanceFoundationService } from '@/services/governanceFoundationService';
import { governanceFoundationApi } from '@/api/governanceFoundationApi';

export default function DataFoundationPage() {
  const [domains, setDomains] = useState(governanceFoundationService.getCanonicalEntities());
  const [summary, setSummary] = useState(governanceFoundationService.getGovernanceSummary());
  const [rules, setRules] = useState([
    'PostgreSQL la single source of truth cho transactional data moi.',
    'Khong mo rong them model core tren legacy Mongo.',
    'Moi entity quan trong phai co id, created_at, updated_at, created_by, updated_by.',
    'Moi workflow quan trong phai co owner, status model, audit log va timeline.',
  ]);
  const [priorities, setPriorities] = useState([
    'organization / users / roles',
    'projects / products / price histories',
    'customers / leads / demands',
    'deals / bookings / contracts',
    'payments / commission / payouts',
    'hr / payroll / training',
  ]);
  const [deliverables, setDeliverables] = useState([
    'Canonical entity list',
    'Relationship map',
    'State machine list',
    'Approval model',
    'Audit model',
    'Master data list',
    'Migration mapping',
    'Import templates',
  ]);
  const [loading, setLoading] = useState(true);
  const domainIcons = {
    Organization: Building2,
    Customer: Users,
    Product: Layers,
    Sales: GitBranch,
    Finance: Wallet,
    Commission: Wallet,
    HR: Users,
    'Contract & Legal': ShieldCheck,
  };

  useEffect(() => {
    let active = true;

    const loadDataFoundation = async () => {
      try {
        const [summaryData, domainData, foundationRules, migrationPriorities, foundationDeliverables] = await Promise.all([
          governanceFoundationApi.getSummary(),
          governanceFoundationApi.getCanonicalDomains(),
          governanceFoundationApi.getFoundationRules(),
          governanceFoundationApi.getMigrationPriorities(),
          governanceFoundationApi.getFoundationDeliverables(),
        ]);

        if (active) {
          setSummary({
            domainCount: summaryData.domain_count,
            mappedEntityCount: summaryData.mapped_entity_count,
            statusModelCount: summaryData.status_model_count,
            approvalFlowCount: summaryData.approval_flow_count,
            timelineStreamCount: summaryData.timeline_stream_count,
            criticalMomentCount: summaryData.critical_moment_count,
          });
          setDomains(domainData);
          setRules(foundationRules);
          setPriorities(migrationPriorities);
          setDeliverables(foundationDeliverables);
        }
      } catch (error) {
        console.warn('Data foundation API unavailable, using local registry fallback.', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadDataFoundation();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="data-foundation-page">
      <Header
        title="Nền tảng dữ liệu"
        subtitle="Lớp nền dữ liệu cho giai đoạn 1: thực thể chuẩn, phê duyệt, nhật ký, trạng thái và thứ tự chuyển đổi"
      />

      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Card className="border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-[#16314f] text-white">
          <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge className="bg-white/10 text-white hover:bg-white/10">Nền dữ liệu đã khóa</Badge>
              <h2 className="mt-4 text-3xl font-bold">Nếu không khóa lớp dữ liệu nền, hệ thống sẽ rộng nhưng không sâu</h2>
              <p className="mt-2 text-sm leading-6 text-white/75">
                Trang này khóa cấu trúc dữ liệu và các quy tắc xuyên suốt để mọi mô-đun của giai đoạn 1 dùng chung một nguồn sự thật.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/55">Kho dữ liệu chính</p>
                <p className="mt-2 text-2xl font-bold">PostgreSQL</p>
                <p className="text-sm text-white/75">Nguồn giao dịch chuẩn cho các bước triển khai tiếp theo.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/55">Lớp kiểm soát</p>
                <p className="mt-2 text-2xl font-bold">RBAC + Audit</p>
                <p className="text-sm text-white/75">Áp dụng cho mọi workflow trong giai đoạn 1.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/55">Miền nghiệp vụ</p>
                <p className="mt-2 text-2xl font-bold">{summary.domainCount}</p>
                <p className="text-sm text-white/75">Miền nghiệp vụ chuẩn đã được khóa.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/55">Thực thể đã map</p>
                <p className="mt-2 text-2xl font-bold">{summary.mappedEntityCount}</p>
                <p className="text-sm text-white/75">Đã map vào registry quản trị nền tảng.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin text-[#316585]" />
            Đang đồng bộ nền tảng dữ liệu từ lớp cấu hình...
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle>Quy tắc nền</CardTitle>
              <CardDescription>Những quy tắc này có hiệu lực cho mọi phần triển khai tiếp theo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {rules.map((rule) => (
                <div key={rule} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <FileCheck className="mt-0.5 h-5 w-5 text-[#316585]" />
                  <p className="text-sm leading-6 text-slate-700">{rule}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle>Thứ tự chuyển đổi dữ liệu</CardTitle>
              <CardDescription>Ưu tiên migrate để đưa dữ liệu về chuẩn mà không làm vỡ workflow hiện hữu.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {priorities.map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#316585] text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-slate-800">{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 bg-white">
          <CardHeader>
              <CardTitle>Miền nghiệp vụ chuẩn</CardTitle>
              <CardDescription>Đây là bộ thực thể nền để map toàn bộ page, API và workflow của giai đoạn 1.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {domains.map((domain) => (
              <div key={domain.domain} className="rounded-2xl border border-slate-200 p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                    {React.createElement(domainIcons[domain.domain] || Database, {
                      className: 'h-5 w-5 text-slate-700',
                    })}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{domain.domain}</h3>
                    <p className="text-sm text-slate-500">{domain.purpose}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {domain.entities.map((entity) => (
                    <Badge key={entity} variant="secondary" className="bg-slate-100 text-slate-700">
                      {entity}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle>Tiêu chí hoàn tất</CardTitle>
              <CardDescription>Nền tảng dữ liệu chỉ được xem là hoàn tất khi có đủ các đầu ra này.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {deliverables.map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle>Bước triển khai tiếp theo</CardTitle>
              <CardDescription>Từ đây trở đi, các màn hình cấu hình dữ liệu phải đi thành một cụm thống nhất.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-dashed border-[#316585]/35 bg-[#316585]/5 p-5">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-[#316585]" />
                  <h3 className="font-semibold text-slate-900">Cụm cần triển khai ngay</h3>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['Master Data', 'Entity Schema', 'Mô hình trạng thái', 'Ma trận phê duyệt', 'Lịch sử / Nhật ký'].map((item) => (
                    <Badge key={item} className="bg-white text-[#316585] border border-[#316585]/20">
                      {item}
                    </Badge>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-700">
                  Khi cụm này được khóa, giai đoạn 1 sẽ triển khai nhanh hơn vì từng mô-đun không còn phải tự định nghĩa lại dữ liệu.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
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
                  <Link to="/settings/entity-governance">Đi tới Liên kết thực thể</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/settings/status-model">Đi tới Mô hình trạng thái</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/settings/approval-matrix">Đi tới Ma trận phê duyệt</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/settings/audit-timeline">Đi tới Lịch sử / Nhật ký</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/settings/governance-remediation">Đi tới Kế hoạch chuẩn hóa</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/settings/blueprint">Quay lại Bản đồ triển khai</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
