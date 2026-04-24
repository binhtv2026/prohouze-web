import React, { useMemo } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileStack, LayoutDashboard, Monitor, Smartphone, TabletSmartphone, Workflow } from 'lucide-react';
import {
  PLATFORM_SCREEN_STANDARD_PHASE_3,
  SCREEN_REQUIREMENT_META,
  getPlatformScreenStandardMatrix,
  getPlatformScreenStandardSummary,
  getPlatformScreenStandardsBySurface,
} from '@/config/platformScreenStandardsPhaseThree';

const surfaceIcon = {
  web: Monitor,
  app: Smartphone,
  hybrid: TabletSmartphone,
};

function RequirementBadge({ type }) {
  const meta = SCREEN_REQUIREMENT_META[type];
  return <Badge className={meta?.badgeClassName}>{meta?.label || type}</Badge>;
}

export default function PlatformScreenStandardsPage() {
  const summary = useMemo(() => getPlatformScreenStandardSummary(), []);
  const matrix = useMemo(() => getPlatformScreenStandardMatrix(), []);
  const webItems = useMemo(() => getPlatformScreenStandardsBySurface('web'), []);
  const appItems = useMemo(() => getPlatformScreenStandardsBySurface('app'), []);
  const hybridItems = useMemo(() => getPlatformScreenStandardsBySurface('hybrid'), []);

  return (
    <div className="space-y-6" data-testid="platform-screen-standards-page">
      <PageHeader
        title="Chuẩn Màn Hình Theo Surface"
        subtitle="Khóa tuyệt đối bộ màn hình bắt buộc cho web, app và hybrid. Từ đây không còn làm màn legacy trộn lẫn hoặc dashboard chỉ để xem."
        breadcrumbs={[
          { label: 'Cài đặt', path: '/settings' },
          { label: 'Chuẩn Màn Hình Theo Surface' },
        ]}
      />

      <Card className="border-[#316585]/15 bg-gradient-to-r from-[#0d1f35] via-[#16314f] to-[#316585] text-white">
        <CardHeader>
          <CardTitle>{PLATFORM_SCREEN_STANDARD_PHASE_3.label}</CardTitle>
          <CardDescription className="text-white/75">
            {PLATFORM_SCREEN_STANDARD_PHASE_3.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm font-semibold">Web</p>
            <p className="mt-2 text-sm text-white/75">Phải có workspace, list, detail, action. Không mở page chỉ để nhìn KPI.</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm font-semibold">App</p>
            <p className="mt-2 text-sm text-white/75">Phải có home ngày, list, detail ngắn gọn và quick action. Không copy nguyên web xuống app.</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm font-semibold">Hybrid</p>
            <p className="mt-2 text-sm text-white/75">Phải có 2 bộ màn khác nhau cho web và app, không dùng một màn chung cho cả hai mặt trận.</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Tổng cụm</CardDescription>
            <CardTitle className="text-3xl text-[#16314f]">{summary.totalClusters}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Cụm go-live</CardDescription>
            <CardTitle className="text-3xl text-emerald-700">{summary.goLiveClusters}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Web</CardDescription>
            <CardTitle className="text-3xl text-sky-700">{summary.webClusters}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>App</CardDescription>
            <CardTitle className="text-3xl text-emerald-700">{summary.appClusters}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Hybrid</CardDescription>
            <CardTitle className="text-3xl text-[#16314f]">{summary.hybridClusters}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="matrix" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap gap-2 bg-transparent p-0">
          <TabsTrigger value="matrix">
            <Workflow className="mr-2 h-4 w-4" />
            Theo cụm
          </TabsTrigger>
          <TabsTrigger value="web">
            <Monitor className="mr-2 h-4 w-4" />
            Web
          </TabsTrigger>
          <TabsTrigger value="app">
            <Smartphone className="mr-2 h-4 w-4" />
            App
          </TabsTrigger>
          <TabsTrigger value="hybrid">
            <TabletSmartphone className="mr-2 h-4 w-4" />
            Hybrid
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="space-y-4">
          <div className="grid gap-4">
            {matrix.map((item) => {
              const Icon = surfaceIcon[item.surface] || LayoutDashboard;
              return (
                <Card key={item.id} className="border-slate-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">{item.label}</CardTitle>
                        <CardDescription>{item.why}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-[#316585]" />
                        <Badge className={item.screenTemplate?.surface === 'web' ? 'bg-sky-100 text-sky-700 border-0' : item.screenTemplate?.surface === 'app' ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-amber-100 text-amber-700 border-0'}>
                          {item.screenTemplate?.title}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-slate-600">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">Nguyên tắc màn hình</p>
                      <p className="mt-1">{item.screenTemplate?.principle}</p>
                    </div>
                    <div>
                      <p className="mb-2 font-semibold text-slate-900">Màn bắt buộc</p>
                      <div className="flex flex-wrap gap-2">
                        {item.mustHave.map((type) => (
                          <RequirementBadge key={type} type={type} />
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="font-semibold text-slate-900">Route mẫu phải có</p>
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        {Object.entries(item.exampleRoutes).map(([key, value]) => (
                          <div key={key} className="rounded-xl bg-slate-50 px-3 py-2">
                            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{key}</p>
                            <p className="mt-1 break-all font-medium text-slate-900">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-dashed border-slate-200 p-4">
                      <p className="font-semibold text-slate-900">Không được làm</p>
                      <div className="mt-3 space-y-2">
                        {item.screenTemplate?.bannedPatterns.map((rule) => (
                          <div key={rule} className="rounded-xl bg-rose-50 px-3 py-2 text-rose-900">
                            {rule}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {[{ key: 'web', items: webItems }, { key: 'app', items: appItems }, { key: 'hybrid', items: hybridItems }].map((group) => (
          <TabsContent key={group.key} value={group.key} className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {group.items.map((item) => (
                <Card key={item.id} className="border-slate-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{item.label}</CardTitle>
                    <CardDescription>{item.owner}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {item.mustHave.map((type) => (
                        <RequirementBadge key={type} type={type} />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.modules.map((module) => (
                        <Badge key={module} variant="outline" className="border-slate-200 text-slate-700">
                          {module}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
