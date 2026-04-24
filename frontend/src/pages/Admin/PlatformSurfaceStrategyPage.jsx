import React, { useMemo } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Smartphone,
  Monitor,
  TabletSmartphone,
  Building2,
  Layers3,
  Users,
} from 'lucide-react';
import {
  getDepartmentPlatformMatrix,
  getModulePlatformMatrix,
  getPlatformSurfaceSummary,
  getRolePlatformMatrix,
  PLATFORM_SURFACE_META,
  PLATFORM_SURFACES,
} from '@/config/platformSurfaceStrategy';

const surfaceIcon = {
  [PLATFORM_SURFACES.WEB]: Monitor,
  [PLATFORM_SURFACES.APP]: Smartphone,
  [PLATFORM_SURFACES.HYBRID]: TabletSmartphone,
};

function SurfaceBadge({ surface }) {
  const meta = PLATFORM_SURFACE_META[surface];
  return <Badge className={meta?.badgeClassName}>{meta?.label || surface}</Badge>;
}

export default function PlatformSurfaceStrategyPage() {
  const summary = useMemo(() => getPlatformSurfaceSummary(), []);
  const roles = useMemo(() => getRolePlatformMatrix(), []);
  const departments = useMemo(() => getDepartmentPlatformMatrix(), []);
  const modules = useMemo(() => getModulePlatformMatrix(), []);

  return (
    <div className="space-y-6" data-testid="platform-surface-strategy-page">
      <PageHeader
        title="Phân bổ Web / App"
        subtitle="Bản đồ khóa chuẩn 10/10: web phục vụ quản trị và back office, app phục vụ lực lượng kinh doanh và hiện trường."
        breadcrumbs={[
          { label: 'Cài đặt', path: '/settings' },
          { label: 'Phân bổ Web / App' },
        ]}
      />

      <Card className="border-[#316585]/15 bg-gradient-to-r from-[#0d1f35] via-[#16314f] to-[#316585] text-white">
        <CardHeader>
          <CardTitle>Nguyên tắc khóa chuẩn</CardTitle>
          <CardDescription className="text-white/75">
            Web là nơi quản trị, BO, BOD và các bộ phận cần bảng lớn. App là nơi làm việc trong ngày, xử lý nhanh, theo khách, theo lịch, theo giao dịch.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-3">
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm font-semibold">Web only</p>
            <p className="mt-2 text-sm text-white/75">Admin, Finance, HR, Legal, CMS.</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm font-semibold">App first</p>
            <p className="mt-2 text-sm text-white/75">Sales, CTV / Đại lý, lực lượng kiếm tiền ngoài hiện trường.</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm font-semibold">Hybrid</p>
            <p className="mt-2 text-sm text-white/75">BOD, Manager, Marketing dùng cả web và app theo vai trò.</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Tổng role</CardDescription>
            <CardTitle className="text-3xl text-[#16314f]">{summary.totalRoles}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">Role được khóa nền tảng chính thức.</CardContent>
        </Card>
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Web only</CardDescription>
            <CardTitle className="text-3xl text-[#16314f]">{summary.webOnlyRoles}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">Role dùng web làm mặt trận chính.</CardContent>
        </Card>
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>App first</CardDescription>
            <CardTitle className="text-3xl text-[#16314f]">{summary.appFirstRoles}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">Role dùng app là chính.</CardContent>
        </Card>
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Hybrid</CardDescription>
            <CardTitle className="text-3xl text-[#16314f]">{summary.hybridRoles}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">Role dùng cả web và app.</CardContent>
        </Card>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap gap-2 bg-transparent p-0">
          <TabsTrigger value="roles">
            <Users className="mr-2 h-4 w-4" />
            Theo role
          </TabsTrigger>
          <TabsTrigger value="departments">
            <Building2 className="mr-2 h-4 w-4" />
            Theo bộ phận
          </TabsTrigger>
          <TabsTrigger value="modules">
            <Layers3 className="mr-2 h-4 w-4" />
            Theo cụm module
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {roles.map((role) => {
              const Icon = surfaceIcon[role.primarySurface] || Monitor;
              return (
                <Card key={role.role} className="border-slate-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">{role.ten}</CardTitle>
                        <CardDescription>{role.boPhan}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-[#316585]" />
                        <SurfaceBadge surface={role.primarySurface} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-slate-600">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">Kết luận triển khai</p>
                      <p className="mt-1">{role.deploymentDecision}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">Vì sao</p>
                      <p className="mt-1">{role.useCase}</p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="font-semibold text-slate-900">Trên web</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {role.webCore.length > 0 ? role.webCore.map((item) => (
                            <Badge key={item} variant="outline" className="border-slate-200 text-slate-700">
                              {item}
                            </Badge>
                          )) : <span className="text-slate-400">Không ưu tiên trên web</span>}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="font-semibold text-slate-900">Trên app</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {role.appCore.length > 0 ? role.appCore.map((item) => (
                            <Badge key={item} variant="outline" className="border-slate-200 text-slate-700">
                              {item}
                            </Badge>
                          )) : <span className="text-slate-400">Không mở trên app</span>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {departments.map((item) => (
              <Card key={item.id} className="border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{item.label}</CardTitle>
                      <CardDescription>{item.reason}</CardDescription>
                    </div>
                    <SurfaceBadge surface={item.surface} />
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {item.includedRoles.map((role) => (
                    <Badge key={role} variant="outline" className="border-[#316585]/20 text-[#16314f]">
                      {role}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="modules" className="space-y-4">
          <div className="grid gap-4">
            {modules.map((item) => (
              <Card key={item.id} className="border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{item.label}</CardTitle>
                      <CardDescription>{item.why}</CardDescription>
                    </div>
                    <SurfaceBadge surface={item.surface} />
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {item.modules.map((module) => (
                    <Badge key={module} variant="outline" className="border-slate-200 text-slate-700">
                      {module}
                    </Badge>
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
