import React, { useMemo } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { CheckCircle2, ExternalLink, Shield, TestTube2, Users } from 'lucide-react';
import { getGoLiveRoleValidationMatrix, getGoLiveValidationSummary } from '@/config/goLiveRoleValidation';

const badgeClassByMode = {
  live: 'bg-emerald-100 text-emerald-700 border-0',
  hybrid: 'bg-amber-100 text-amber-700 border-0',
  seed: 'bg-slate-200 text-slate-700 border-0',
};

export default function GoLiveValidationPage() {
  const matrix = useMemo(() => getGoLiveRoleValidationMatrix(), []);
  const summary = useMemo(() => getGoLiveValidationSummary(), []);

  return (
    <div className="space-y-6" data-testid="go-live-validation-page">
      <PageHeader
        title="Kiểm thử go-live theo role"
        subtitle="Bảng khóa bước 3: role nào vào đâu, phải bấm gì, và luồng nào phải pass trước khi đưa vào vận hành."
        breadcrumbs={[
          { label: 'Cài đặt', path: '/settings' },
          { label: 'Kiểm thử go-live theo role' },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Số role phải kiểm thử</CardDescription>
            <CardTitle className="text-3xl text-[#16314f]">{summary.totalRoles}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Vai trò bắt buộc phải đi hết luồng.
          </CardContent>
        </Card>

        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Bước kiểm thử</CardDescription>
            <CardTitle className="text-3xl text-[#16314f]">{summary.totalSteps}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Đăng nhập, điểm vào và luồng tab con.
          </CardContent>
        </Card>

        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Đã khóa</CardDescription>
            <CardTitle className="text-3xl text-[#16314f]">{summary.readySteps}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Scope, route và chính sách dữ liệu đều hợp lệ.
          </CardContent>
        </Card>

        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Role đã pass</CardDescription>
            <CardTitle className="text-3xl text-[#16314f]">{summary.rolesLocked}/{summary.totalRoles}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            {summary.fullyLocked ? 'Tất cả role đã được khóa.' : 'Phải đạt đủ 100% trước khi nghiệm thu.'}
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#316585]/15 bg-gradient-to-r from-[#0d1f35] via-[#16314f] to-[#316585] text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Tiêu chuẩn pass bước 3
          </CardTitle>
          <CardDescription className="text-white/75">
            Mỗi role phải đăng nhập được, vào đúng home, đi hết các luồng tab con, có contract backend và có quyền view hợp lệ.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge className="bg-white/10 text-white">{summary.liveSteps} bước dữ liệu thật</Badge>
          <Badge className="bg-white/10 text-white">{summary.hybridSteps} bước dữ liệu kết hợp</Badge>
          <Badge className="bg-white/10 text-white">{summary.actionLockedSteps} bước quyền view đã khóa</Badge>
          <Badge className="bg-white/10 text-white">{summary.foundationLockedSteps} bước dữ liệu nền đã khóa</Badge>
          <Badge className="bg-white/10 text-white">{summary.platformApiLockedSteps} bước runtime API + permission đã khóa</Badge>
          <Badge className="bg-white/10 text-white">{summary.platformFieldLockedRoles} role đã pass thực địa web/app</Badge>
          <Badge className="bg-white/10 text-white">{summary.totalSteps} bước cần pass</Badge>
        </CardContent>
      </Card>

      <Tabs defaultValue={matrix[0]?.role} className="space-y-4">
        <TabsList className="flex h-auto flex-wrap gap-2 bg-transparent p-0">
          {matrix.map((item) => (
            <TabsTrigger key={item.role} value={item.role}>
              <Users className="mr-2 h-4 w-4" />
              {item.profile.ten}
            </TabsTrigger>
          ))}
        </TabsList>

        {matrix.map((item) => (
          <TabsContent key={item.role} value={item.role} className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[1.1fr_1.4fr]">
              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{item.profile.ten}</CardTitle>
                  <CardDescription>
                    {item.profile.capBac} / {item.profile.mang}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-600">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                    <p className="font-semibold text-slate-900">Tài khoản demo</p>
                    <p className="mt-1">{item.demoEmail}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                    <p className="font-semibold text-slate-900">Home bắt buộc</p>
                    <p className="mt-1">{item.homePath}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-emerald-100 text-emerald-700 border-0">{item.liveSteps} bước dữ liệu thật</Badge>
                    <Badge className="bg-amber-100 text-amber-700 border-0">{item.hybridSteps} bước dữ liệu kết hợp</Badge>
                    <Badge className="bg-sky-100 text-sky-700 border-0">{item.actionLockedSteps} bước quyền view</Badge>
                    <Badge className="bg-violet-100 text-violet-700 border-0">{item.foundationLockedSteps} bước dữ liệu nền</Badge>
                    <Badge className="bg-amber-100 text-amber-700 border-0">{item.platformApiLockedSteps} bước API + permission</Badge>
                    <Badge className={item.platformFieldLocked ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-rose-100 text-rose-700 border-0'}>
                      {item.platformFieldLocked ? 'Đã pass thực địa web/app' : 'Chưa pass thực địa web/app'}
                    </Badge>
                    <Badge className="bg-[#316585]">{item.readySteps}/{item.totalSteps} pass</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TestTube2 className="h-5 w-5 text-[#316585]" />
                    Checklist bắt buộc
                  </CardTitle>
                  <CardDescription>Đây là các bước phải đi hết khi test role này.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {item.steps.map((step) => (
                    <div key={step.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{step.label}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">
                            {step.tabCha} · {step.tabCon}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge className={badgeClassByMode[step.dataPolicy.mode] || badgeClassByMode.hybrid}>
                            {step.dataPolicy.label}
                          </Badge>
                          <Badge className={step.ready ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-rose-100 text-rose-700 border-0'}>
                            {step.ready ? 'Pass' : 'Chưa khóa'}
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_1fr]">
                        <div className="rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
                          <p className="font-semibold text-slate-900">Kỳ vọng</p>
                          <p className="mt-1">{step.expected}</p>
                          {step.demoEmail && <p className="mt-2 text-xs text-slate-500">Dùng tài khoản: {step.demoEmail}</p>}
                        </div>
                          <div className="rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
                            <p className="font-semibold text-slate-900">Route</p>
                            <p className="mt-1 break-all">{step.route}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Badge className={step.inScope ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-rose-100 text-rose-700 border-0'}>
                                {step.inScope ? 'Đúng scope' : 'Lệch scope'}
                              </Badge>
                              <Badge className={step.routeRegistered ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-rose-100 text-rose-700 border-0'}>
                                {step.routeRegistered ? 'Có route' : 'Thiếu route'}
                              </Badge>
                              <Badge className={step.actionLocked ? 'bg-sky-100 text-sky-700 border-0' : 'bg-rose-100 text-rose-700 border-0'}>
                                {step.actionLocked ? 'Quyền view đã khóa' : 'Thiếu quyền view'}
                              </Badge>
                              <Badge className={step.backendLocked ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-rose-100 text-rose-700 border-0'}>
                                {step.backendLocked ? 'Contract backend đã khóa' : 'Thiếu contract backend'}
                              </Badge>
                              <Badge className={step.foundationLocked ? 'bg-violet-100 text-violet-700 border-0' : 'bg-rose-100 text-rose-700 border-0'}>
                                {step.foundationLocked ? 'Dữ liệu nền đã khóa' : 'Thiếu dữ liệu nền'}
                              </Badge>
                              <Badge className={step.platformApiLocked ? 'bg-amber-100 text-amber-700 border-0' : 'bg-rose-100 text-rose-700 border-0'}>
                                {step.platformApiLocked ? 'Runtime API + permission đã khóa' : 'Thiếu khóa API + permission'}
                              </Badge>
                            </div>
                            {step.routeActionContract && (
                              <div className="mt-3">
                                <Badge variant="outline" className="border-[#316585]/20 text-[#16314f]">
                                  {step.routeActionContract.resource}.{step.routeActionContract.action}
                                </Badge>
                              </div>
                            )}
                            {step.platformApiRuntime && (
                              <div className="mt-3">
                                <Badge variant="outline" className="border-amber-200 text-amber-700">
                                  {step.platformApiRuntime.label}
                                </Badge>
                              </div>
                            )}
                            {step.backendContracts?.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {step.backendContracts.map((contract) => (
                                  <Badge key={contract.key} variant="outline" className="border-[#316585]/20 text-[#16314f]">
                                    {contract.key}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {step.foundationDependencies?.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {step.foundationDependencies.map((dependency) => (
                                  <Badge key={dependency.key} variant="outline" className="border-violet-200 text-violet-700">
                                    {dependency.label}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                      </div>

                      <div className="mt-3 flex justify-end">
                        <Link to={step.route}>
                          <Button variant="outline" className="gap-2">
                            Mở route kiểm thử
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            Kết luận khóa bước 3
          </CardTitle>
          <CardDescription>
            Bước 3 chỉ được coi là hoàn tất khi tất cả role và tất cả bước kiểm thử đều pass.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          <p>
            Trạng thái hiện tại: <span className="font-semibold text-slate-900">{summary.rolesLocked}/{summary.totalRoles} role đã khóa</span>,
            {' '}<span className="font-semibold text-slate-900">{summary.readySteps}/{summary.totalSteps} bước đã pass</span>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
