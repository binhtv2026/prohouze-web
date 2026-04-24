import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, CheckCircle2, Database, ExternalLink, Layers3, ShieldCheck } from 'lucide-react';
import {
  getFoundationBaselineSummary,
  getFoundationDependenciesForPath,
  getGoLiveFoundationBaselines,
  GO_LIVE_FOUNDATION_ROUTE_MAP,
} from '@/config/goLiveFoundationBaseline';

export default function GoLiveFoundationBaselinePage() {
  const baselines = useMemo(() => getGoLiveFoundationBaselines(), []);
  const summary = useMemo(() => getFoundationBaselineSummary(), []);
  const grouped = useMemo(
    () =>
      baselines.reduce((accumulator, item) => {
        accumulator[item.group] = accumulator[item.group] || [];
        accumulator[item.group].push(item);
        return accumulator;
      }, {}),
    [baselines],
  );
  const groups = Object.keys(grouped);

  return (
    <div className="space-y-6" data-testid="go-live-foundation-baseline-page">
      <PageHeader
        title="Dữ liệu nền go-live"
        subtitle="Nguồn chuẩn cho người dùng, cơ cấu tổ chức, master data, status, giá, chính sách và pháp lý bắt buộc phải khóa trước khi vận hành."
        breadcrumbs={[
          { label: 'Cài đặt', path: '/settings' },
          { label: 'Dữ liệu nền go-live' },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Domain dữ liệu nền</CardDescription>
            <CardTitle className="text-3xl text-[#16314f]">{summary.totalDomains}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">Các lớp dữ liệu nền bắt buộc cho go-live.</CardContent>
        </Card>
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Đã khóa</CardDescription>
            <CardTitle className="text-3xl text-[#16314f]">{summary.lockedDomains}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">Chỉ pass khi toàn bộ domain nền đạt trạng thái khóa.</CardContent>
        </Card>
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Nhóm nền tảng</CardDescription>
            <CardTitle className="text-3xl text-[#16314f]">{summary.groups}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">Identity, foundation, product, policy, legal.</CardContent>
        </Card>
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Trạng thái</CardDescription>
            <CardTitle className="text-xl text-[#16314f]">{summary.fullyLocked ? 'Locked 100%' : 'Chưa đủ'}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">Toàn bộ route go-live sẽ đọc dependency từ registry này.</CardContent>
        </Card>
      </div>

      <Card className="border-[#316585]/15 bg-gradient-to-r from-[#0d1f35] via-[#16314f] to-[#316585] text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Tiêu chuẩn khóa bước 6
          </CardTitle>
          <CardDescription className="text-white/75">
            Mỗi route go-live phải phụ thuộc vào dữ liệu nền chuẩn. Không có dữ liệu nền chuẩn thì route đó không được coi là sẵn sàng vận hành.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge className="bg-white/10 text-white">{summary.lockedDomains}/{summary.totalDomains} domain đã khóa</Badge>
          <Badge className="bg-white/10 text-white">{summary.routeCoverage} lớp route đã map dependency</Badge>
        </CardContent>
      </Card>

      <Tabs defaultValue={groups[0]} className="space-y-4">
        <TabsList className="flex h-auto flex-wrap gap-2 bg-transparent p-0">
          {groups.map((group) => (
            <TabsTrigger key={group} value={group}>
              <Layers3 className="mr-2 h-4 w-4" />
              {group}
            </TabsTrigger>
          ))}
        </TabsList>

        {groups.map((group) => (
          <TabsContent key={group} value={group} className="space-y-4">
            <div className="grid gap-4">
              {grouped[group].map((item) => (
                <Card key={item.key} className="border-slate-200">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">{item.label}</CardTitle>
                        <CardDescription>{item.key}</CardDescription>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 border-0">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Locked
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
                    <div className="space-y-3">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                        <p className="font-semibold text-slate-900">Nguồn sự thật</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.sourceOfTruth.map((source) => (
                            <Badge key={source} variant="outline" className="border-[#316585]/20 text-[#16314f]">
                              {source}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                        <p className="font-semibold text-slate-900">Đối tượng chính</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.entities.map((entity) => (
                            <Badge key={entity} variant="outline" className="border-slate-300 text-slate-700">
                              {entity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                        <p className="font-semibold text-slate-900">Owner</p>
                        <p className="mt-1">{item.owner}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                        <p className="font-semibold text-slate-900">Điều kiện khóa</p>
                        <div className="mt-2 space-y-2">
                          {item.lockedChecks.map((check) => (
                            <p key={check}>• {check}</p>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Link to={item.settingsPath}>
                          <Button variant="outline" className="gap-2">
                            Mở màn quản trị
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-[#316585]" />
            Phụ thuộc route go-live
          </CardTitle>
          <CardDescription>Mỗi route chính thức đã được map tới các domain dữ liệu nền bắt buộc.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {GO_LIVE_FOUNDATION_ROUTE_MAP.map((item) => {
            const dependencies = getFoundationDependenciesForPath(item.prefixes[0]);

            return (
              <div key={item.prefixes.join('|')} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{item.prefixes.join(' · ')}</p>
                    <p className="mt-1 text-sm text-slate-500">Route nhóm này chỉ pass khi các dependency dưới đây đã khóa.</p>
                  </div>
                  <Badge className="bg-violet-100 text-violet-700 border-0">{dependencies.length} dependency</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {dependencies.map((dependency) => (
                    <Badge key={dependency.key} variant="outline" className="border-violet-200 text-violet-700">
                      {dependency.label}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="h-5 w-5 text-[#316585]" />
            Kết luận khóa bước 6
          </CardTitle>
          <CardDescription>
            Tất cả route go-live hiện đã có dependency dữ liệu nền chuẩn và registry trung tâm để nghiệm thu.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
