import React, { useMemo } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, Clock3, Layers3, Monitor, Shield, Smartphone, TabletSmartphone } from 'lucide-react';
import {
  PLATFORM_LAUNCH_SCOPE_PHASE_1,
  PLATFORM_LAUNCH_STATUS,
  getPlatformPhaseOneReadableStatus,
  getPlatformPhaseOneReadableSurface,
  getPlatformPhaseOneRoleCoverage,
  getPlatformPhaseOneScopeByStatus,
  getPlatformPhaseOneScopeBySurface,
  getPlatformPhaseOneScopeSummary,
} from '@/config/platformLaunchScopePhaseOne';

const surfaceIcon = {
  web: Monitor,
  app: Smartphone,
  hybrid: TabletSmartphone,
};

function StatusBadge({ status }) {
  const meta = getPlatformPhaseOneReadableStatus(status);
  return <Badge className={meta?.badgeClassName}>{meta?.label || status}</Badge>;
}

function SurfaceBadge({ surface }) {
  const meta = getPlatformPhaseOneReadableSurface(surface);
  return <Badge className={meta?.badgeClassName}>{meta?.label || surface}</Badge>;
}

export default function PlatformLaunchScopePage() {
  const summary = useMemo(() => getPlatformPhaseOneScopeSummary(), []);
  const goLiveItems = useMemo(() => getPlatformPhaseOneScopeByStatus(PLATFORM_LAUNCH_STATUS.GO_LIVE), []);
  const internalItems = useMemo(() => getPlatformPhaseOneScopeByStatus(PLATFORM_LAUNCH_STATUS.INTERNAL_ONLY), []);
  const laterItems = useMemo(() => getPlatformPhaseOneScopeByStatus(PLATFORM_LAUNCH_STATUS.LATER_PHASE), []);
  const webItems = useMemo(() => getPlatformPhaseOneScopeBySurface('web'), []);
  const appItems = useMemo(() => getPlatformPhaseOneScopeBySurface('app'), []);
  const hybridItems = useMemo(() => getPlatformPhaseOneScopeBySurface('hybrid'), []);
  const roleCoverage = useMemo(() => getPlatformPhaseOneRoleCoverage(), []);

  return (
    <div className="space-y-6" data-testid="platform-launch-scope-page">
      <PageHeader
        title="Khóa Scope Web / App Đợt 1"
        subtitle="Chốt tuyệt đối module nào mở ngay, module nào chỉ nội bộ và module nào để pha sau. Đây là nguồn sự thật để tách ProHouze thành web quản trị và app kinh doanh."
        breadcrumbs={[
          { label: 'Cài đặt', path: '/settings' },
          { label: 'Khóa Scope Web / App Đợt 1' },
        ]}
      />

      <Card className="border-[#316585]/15 bg-gradient-to-r from-[#0d1f35] via-[#16314f] to-[#316585] text-white">
        <CardHeader>
          <CardTitle>{PLATFORM_LAUNCH_SCOPE_PHASE_1.label}</CardTitle>
          <CardDescription className="text-white/75">
            {PLATFORM_LAUNCH_SCOPE_PHASE_1.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm font-semibold">Mở đợt 1</p>
            <p className="mt-2 text-sm text-white/75">Chỉ những cụm có tác động vận hành trực tiếp và đã đủ rõ web/app mới được mở ngay.</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm font-semibold">Chỉ nội bộ</p>
            <p className="mt-2 text-sm text-white/75">Vẫn dùng cho vận hành và admin, nhưng không coi là mặt trận sản phẩm chính thức.</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm font-semibold">Pha sau</p>
            <p className="mt-2 text-sm text-white/75">Không mở ở đợt 1 để tránh dàn trải và giữ nhịp triển khai tập trung.</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Tổng cụm</CardDescription>
            <CardTitle className="text-3xl text-[#16314f]">{summary.totalClusters}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Mở đợt 1</CardDescription>
            <CardTitle className="text-3xl text-emerald-700">{summary.goLiveClusters}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Nội bộ</CardDescription>
            <CardTitle className="text-3xl text-amber-700">{summary.internalClusters}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Pha sau</CardDescription>
            <CardTitle className="text-3xl text-slate-700">{summary.laterPhaseClusters}</CardTitle>
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
            <CardDescription>App + Hybrid</CardDescription>
            <CardTitle className="text-3xl text-[#16314f]">{summary.appClusters + summary.hybridClusters}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="go-live" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap gap-2 bg-transparent p-0">
          <TabsTrigger value="go-live">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Mở đợt 1
          </TabsTrigger>
          <TabsTrigger value="internal">
            <Shield className="mr-2 h-4 w-4" />
            Nội bộ / pha sau
          </TabsTrigger>
          <TabsTrigger value="surface">
            <Layers3 className="mr-2 h-4 w-4" />
            Theo nền tảng
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Clock3 className="mr-2 h-4 w-4" />
            Theo role
          </TabsTrigger>
        </TabsList>

        <TabsContent value="go-live" className="space-y-4">
          <div className="grid gap-4">
            {goLiveItems.map((item) => {
              const Icon = surfaceIcon[item.surface] || Monitor;
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
                        <SurfaceBadge surface={item.surface} />
                        <StatusBadge status={item.launchStatus} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-slate-600">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">Owner</p>
                      <p className="mt-1">{item.owner}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.roles.map((role) => (
                        <Badge key={role} variant="outline" className="border-[#316585]/20 text-[#16314f]">
                          {role}
                        </Badge>
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
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="internal" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {[...internalItems, ...laterItems].map((item) => (
              <Card key={item.id} className="border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{item.label}</CardTitle>
                      <CardDescription>{item.why}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <SurfaceBadge surface={item.surface} />
                      <StatusBadge status={item.launchStatus} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-600">
                  <p><span className="font-semibold text-slate-900">Owner:</span> {item.owner}</p>
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

        <TabsContent value="surface" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-3">
            {[
              { id: 'web', title: 'Web', items: webItems },
              { id: 'app', title: 'App', items: appItems },
              { id: 'hybrid', title: 'Hybrid', items: hybridItems },
            ].map((group) => (
              <Card key={group.id} className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle>{group.title}</CardTitle>
                  <CardDescription>{group.items.length} cụm đang được gán lên nền tảng này.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {group.items.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900">{item.label}</p>
                        <StatusBadge status={item.launchStatus} />
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{item.owner}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {Object.entries(roleCoverage).map(([role, items]) => (
              <Card key={role} className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{role}</CardTitle>
                  <CardDescription>{items.length} cụm module được mở hoặc gán trong đợt 1.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900">{item.label}</p>
                        <div className="flex items-center gap-2">
                          <SurfaceBadge surface={item.surface} />
                          <StatusBadge status={item.launchStatus} />
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{item.why}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
