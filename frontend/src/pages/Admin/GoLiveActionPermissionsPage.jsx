import React, { useMemo } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, Eye, KeyRound, Shield } from 'lucide-react';
import { GO_LIVE_ACTION_PERMISSIONS, ACTION_KEYS, getRoleActionPermissionSummary } from '@/config/goLiveActionPermissions';
import { ROLE_ORDER, ROLE_GOVERNANCE } from '@/config/roleGovernance';

const actionLabels = {
  view: 'Xem',
  create: 'Tạo',
  edit: 'Sửa',
  delete: 'Xóa',
  assign: 'Phân công',
  approve: 'Duyệt',
  export: 'Xuất',
  configure: 'Cấu hình',
  publish: 'Xuất bản',
};

const scopeBadgeClass = {
  none: 'bg-slate-100 text-slate-400 border-0',
  self: 'bg-amber-100 text-amber-800 border-0',
  team: 'bg-cyan-100 text-cyan-800 border-0',
  department: 'bg-blue-100 text-blue-800 border-0',
  branch: 'bg-indigo-100 text-indigo-800 border-0',
  all: 'bg-emerald-100 text-emerald-800 border-0',
};

export default function GoLiveActionPermissionsPage() {
  const resources = useMemo(() => Object.entries(GO_LIVE_ACTION_PERMISSIONS), []);
  const roleSummaries = useMemo(
    () =>
      ROLE_ORDER.map((role) => ({
        role,
        profile: ROLE_GOVERNANCE[role],
        summary: getRoleActionPermissionSummary(role),
      })),
    [],
  );

  return (
    <div className="space-y-6" data-testid="go-live-action-permissions-page">
      <PageHeader
        title="Quyền hành động go-live"
        subtitle="Nguồn chuẩn cho quyền xem, tạo, sửa, duyệt, xuất và cấu hình theo từng role trong đợt go-live 1."
        breadcrumbs={[
          { label: 'Cài đặt', path: '/settings' },
          { label: 'Quyền hành động go-live' },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Role kiểm soát</CardDescription>
            <CardTitle className="text-3xl text-[#16314f]">{ROLE_ORDER.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">Tất cả role trong go-live đều có ma trận quyền hành động riêng.</CardContent>
        </Card>
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Tài nguyên</CardDescription>
            <CardTitle className="text-3xl text-[#16314f]">{resources.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">Các domain nghiệp vụ đang được khóa ở mức action.</CardContent>
        </Card>
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Action chuẩn</CardDescription>
            <CardTitle className="text-3xl text-[#16314f]">{ACTION_KEYS.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">Bao gồm xem, tạo, sửa, xóa, duyệt, xuất, cấu hình...</CardContent>
        </Card>
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Trạng thái</CardDescription>
            <CardTitle className="text-xl text-[#16314f]">Locked 100%</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">Route guard và PermissionContext đều đã dùng cùng một nguồn sự thật.</CardContent>
        </Card>
      </div>

      <Card className="border-[#316585]/15 bg-gradient-to-r from-[#0d1f35] via-[#16314f] to-[#316585] text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Tiêu chuẩn khóa bước 5
          </CardTitle>
          <CardDescription className="text-white/75">
            Không chỉ ẩn menu. Route, context phân quyền và checklist go-live đều phải đọc cùng ma trận quyền hành động.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap gap-2 bg-transparent p-0">
          <TabsTrigger value="summary">
            <Eye className="mr-2 h-4 w-4" />
            Tóm tắt theo role
          </TabsTrigger>
          <TabsTrigger value="matrix">
            <KeyRound className="mr-2 h-4 w-4" />
            Ma trận chi tiết
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {roleSummaries.map((item) => (
              <Card key={item.role} className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{item.profile.ten}</CardTitle>
                  <CardDescription>{item.profile.capBac} / {item.profile.mang}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Badge className="bg-emerald-100 text-emerald-800 border-0">{item.summary.view} quyền xem</Badge>
                  <Badge className="bg-blue-100 text-blue-800 border-0">{item.summary.create} quyền tạo</Badge>
                  <Badge className="bg-amber-100 text-amber-800 border-0">{item.summary.edit} quyền sửa</Badge>
                  <Badge className="bg-violet-100 text-violet-800 border-0">{item.summary.approve} quyền duyệt</Badge>
                  <Badge className="bg-cyan-100 text-cyan-800 border-0">{item.summary.export} quyền xuất</Badge>
                  <Badge className="bg-slate-200 text-slate-800 border-0">{item.summary.configure} quyền cấu hình</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="matrix" className="space-y-4">
          <div className="grid gap-4">
            {resources.map(([resourceKey, resource]) => (
              <Card key={resourceKey} className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{resource.label}</CardTitle>
                  <CardDescription>{resourceKey}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {ACTION_KEYS.filter((action) => resource.actions[action]).map((action) => (
                    <div key={action} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[#316585]" />
                        <p className="font-semibold text-slate-900">{actionLabels[action]}</p>
                      </div>
                      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
                        {ROLE_ORDER.map((role) => (
                          <div key={`${resourceKey}-${action}-${role}`} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm">
                            <p className="font-medium text-slate-900">{ROLE_GOVERNANCE[role].ten}</p>
                            <Badge className={`mt-2 ${scopeBadgeClass[resource.actions[action][role]] || scopeBadgeClass.none}`}>
                              {resource.actions[action][role]}
                            </Badge>
                          </div>
                        ))}
                      </div>
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
