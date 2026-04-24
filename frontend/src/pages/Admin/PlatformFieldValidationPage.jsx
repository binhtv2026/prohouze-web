import React, { useMemo } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Monitor, Smartphone, CheckCircle2, ClipboardList, ShieldCheck, Layers3 } from 'lucide-react';
import { APP_SHELL_BLOCK_META } from '@/config/platformAppShellPhaseFour';
import {
  getPlatformFieldValidationMatrix,
  getPlatformFieldValidationSummary,
  PLATFORM_FIELD_VALIDATION_PHASE_7,
} from '@/config/platformFieldValidationPhaseSeven';
import { NAVIGATION_SHELL_META } from '@/config/platformNavigationSplit';
import { WEB_SHELL_BLOCK_META } from '@/config/platformWebShellPhaseFive';

const surfaceMeta = {
  web: { label: 'Website quản trị', className: 'bg-sky-100 text-sky-700 border-0', icon: Monitor },
  app: { label: 'Ứng dụng', className: 'bg-emerald-100 text-emerald-700 border-0', icon: Smartphone },
};

const statusBadge = (ok, okLabel, badLabel = 'Thiếu') =>
  ok
    ? `bg-emerald-100 text-emerald-700 border-0`
    : `bg-rose-100 text-rose-700 border-0`;

export default function PlatformFieldValidationPage() {
  const matrix = useMemo(() => getPlatformFieldValidationMatrix(), []);
  const summary = useMemo(() => getPlatformFieldValidationSummary(), []);

  return (
    <div className="space-y-6" data-testid="platform-field-validation-page">
      <PageHeader
        title="Kiểm thử thực địa website quản trị / ứng dụng theo vai trò"
        subtitle="Khóa bước 7: mỗi vai trò phải có danh sách kiểm thử riêng cho website quản trị hoặc ứng dụng, bấm vào đúng luồng xử lý và đạt đủ các điểm kiểm tra thực địa."
        breadcrumbs={[
          { label: 'Cài đặt', path: '/settings' },
          { label: 'Kiểm thử thực địa website quản trị / ứng dụng theo vai trò' },
        ]}
      />

      <Card className="border-[#316585]/15 bg-gradient-to-r from-[#0d1f35] via-[#16314f] to-[#316585] text-white">
        <CardHeader>
          <CardTitle>{PLATFORM_FIELD_VALIDATION_PHASE_7.label}</CardTitle>
          <CardDescription className="text-white/75">
            {PLATFORM_FIELD_VALIDATION_PHASE_7.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm font-semibold">Scope + shell</p>
            <p className="mt-2 text-sm text-white/75">Role phải có scope đợt 1, navigation split và shell đúng nền tảng.</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm font-semibold">Điểm kiểm tra vận hành</p>
            <p className="mt-2 text-sm text-white/75">Mỗi vai trò có route riêng cho website quản trị hoặc ứng dụng để kiểm thử luồng làm việc thật.</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm font-semibold">Pass thật mới locked</p>
            <p className="mt-2 text-sm text-white/75">Role chỉ pass khi tất cả checkpoint, API, permission và dữ liệu nền đều hợp lệ.</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Tổng role</CardDescription>
            <CardTitle className="text-3xl text-[#16314f]">{summary.totalRoles}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Role đã khóa</CardDescription>
            <CardTitle className="text-3xl text-emerald-700">{summary.lockedRoles}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Tổng checkpoint</CardDescription>
            <CardTitle className="text-3xl text-[#16314f]">{summary.totalCheckpoints}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Điểm kiểm tra website quản trị</CardDescription>
            <CardTitle className="text-3xl text-sky-700">{summary.webCheckpoints}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Điểm kiểm tra ứng dụng</CardDescription>
            <CardTitle className="text-3xl text-emerald-700">{summary.appCheckpoints}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue={matrix[0]?.role} className="space-y-4">
        <TabsList className="flex h-auto flex-wrap gap-2 bg-transparent p-0">
          {matrix.map((item) => (
            <TabsTrigger key={item.role} value={item.role}>
              <ClipboardList className="mr-2 h-4 w-4" />
              {item.profile.ten}
            </TabsTrigger>
          ))}
        </TabsList>

        {matrix.map((item) => (
          <TabsContent key={item.role} value={item.role} className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_1.35fr]">
              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{item.profile.ten}</CardTitle>
                  <CardDescription>
                    {item.profile.capBac} / {item.profile.mang}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-slate-600">
                  <div className="flex flex-wrap gap-2">
                    {item.requiredSurfaceMeta.map((surface) => {
                      const meta = surfaceMeta[surface.key];
                      const Icon = meta?.icon || Layers3;
                      return (
                        <Badge key={surface.key} className={meta?.className}>
                          <Icon className="mr-1 h-3 w-3" />
                          {surface.label}
                        </Badge>
                      );
                    })}
                    <Badge className={item.locked ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-rose-100 text-rose-700 border-0'}>
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      {item.locked ? 'Đã khóa' : 'Chưa khóa'}
                    </Badge>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">Default shell</p>
                    <p className="mt-1">{NAVIGATION_SHELL_META[item.defaultShell]?.label || item.defaultShell}</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">Cụm scope đợt 1</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.scopeClusters.map((cluster) => (
                        <Badge key={cluster.id} variant="outline" className="border-slate-200 text-slate-700">
                          {cluster.label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge className={statusBadge(item.launchLocked)}>
                      {item.launchLocked ? 'Scope đợt 1 đã khóa' : 'Thiếu scope'}
                    </Badge>
                    <Badge className={statusBadge(item.navigationLocked)}>
                      {item.navigationLocked ? 'Điều hướng tách riêng đã khóa' : 'Thiếu điều hướng tách riêng'}
                    </Badge>
                    <Badge className={statusBadge(item.webShellLocked)}>
                      {item.webShellLocked ? 'Giao diện website quản trị đã khóa' : 'Thiếu giao diện website quản trị'}
                    </Badge>
                    <Badge className={statusBadge(item.appShellLocked)}>
                      {item.appShellLocked ? 'Giao diện ứng dụng đã khóa' : 'Thiếu giao diện ứng dụng'}
                    </Badge>
                    <Badge className={statusBadge(item.screenStandardLocked)}>
                      {item.screenStandardLocked ? 'Chuẩn màn hình đã khóa' : 'Thiếu chuẩn màn hình'}
                    </Badge>
                    <Badge className={statusBadge(item.checkpointsLocked)}>
                      {item.checkpointsLocked ? 'Điểm kiểm tra đã đạt' : 'Điểm kiểm tra chưa đạt'}
                    </Badge>
                  </div>

                  {item.webShell && (
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="font-semibold text-slate-900">{item.webShell.title}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.webShell.mustHave.map((block) => (
                          <Badge key={block} variant="outline" className="border-slate-200 text-slate-700">
                            {WEB_SHELL_BLOCK_META[block]?.label || block}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.appShell && (
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="font-semibold text-slate-900">{item.appShell.title}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.appShell.mustHave.map((block) => (
                          <Badge key={block} variant="outline" className="border-slate-200 text-slate-700">
                            {APP_SHELL_BLOCK_META[block]?.label || block}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ShieldCheck className="h-5 w-5 text-[#316585]" />
                    Điểm kiểm tra thực địa
                  </CardTitle>
                  <CardDescription>
                    {item.readyCheckpoints}/{item.totalCheckpoints} điểm kiểm tra đã đạt.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {item.checkpoints.map((step) => {
                    const meta = surfaceMeta[step.surface];
                    const Icon = meta?.icon || Layers3;
                    return (
                      <div key={`${item.role}-${step.surface}-${step.route}-${step.label}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{step.label}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">{step.type}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge className={meta?.className}>
                              <Icon className="mr-1 h-3 w-3" />
                              {meta?.label}
                            </Badge>
                            <Badge className={step.ready ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-rose-100 text-rose-700 border-0'}>
                              {step.ready ? 'Pass' : 'Chưa pass'}
                            </Badge>
                          </div>
                        </div>

                        <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_1fr]">
                          <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                            <p className="font-semibold text-slate-900">Kỳ vọng</p>
                            <p className="mt-1">{step.expected}</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                            <p className="font-semibold text-slate-900">Route</p>
                            <p className="mt-1 break-all">{step.route}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Badge className={statusBadge(step.routeRegistered)}>{step.routeRegistered ? 'Có route' : 'Thiếu route'}</Badge>
                              <Badge className={statusBadge(step.actionLocked)}>{step.actionLocked ? 'Có quyền' : 'Thiếu quyền'}</Badge>
                              <Badge className={statusBadge(step.backendLocked)}>{step.backendLocked ? 'Đủ ràng buộc backend' : 'Thiếu ràng buộc backend'}</Badge>
                              <Badge className={statusBadge(step.foundationLocked)}>{step.foundationLocked ? 'Dữ liệu nền' : 'Thiếu dữ liệu nền'}</Badge>
                              <Badge className={statusBadge(step.platformApiLocked)}>{step.platformApiLocked ? 'API và quyền truy cập đã khóa' : 'Thiếu API và quyền truy cập'}</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
