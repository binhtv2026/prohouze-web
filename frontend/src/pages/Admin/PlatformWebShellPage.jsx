import React, { useMemo } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, LayoutDashboard, ListChecks, Monitor, ShieldCheck, UserCircle, Workflow } from 'lucide-react';
import {
  PLATFORM_WEB_SHELL_PHASE_5,
  WEB_SHELL_BLOCK_META,
  getWebShellMatrix,
  getWebShellSummary,
} from '@/config/platformWebShellPhaseFive';

function BlockBadge({ block }) {
  const meta = WEB_SHELL_BLOCK_META[block];
  return <Badge className={meta?.badgeClassName}>{meta?.label || block}</Badge>;
}

export default function PlatformWebShellPage() {
  const summary = useMemo(() => getWebShellSummary(), []);
  const matrix = useMemo(() => getWebShellMatrix(), []);
  const webOnly = matrix.filter((item) => item.webOnly);
  const hybrid = matrix.filter((item) => !item.webOnly);

  return (
    <div className="space-y-6" data-testid="platform-web-shell-page">
      <PageHeader
        title="Khóa giao diện website quản trị chuẩn"
        subtitle="Chốt tuyệt đối màn chính website quản trị, menu trái, hàng chờ xử lý, phê duyệt, báo cáo và hồ sơ cho các vai trò dùng website quản trị."
        breadcrumbs={[
          { label: 'Cài đặt', path: '/settings' },
          { label: 'Khóa giao diện website quản trị chuẩn' },
        ]}
      />

      <Card className="border-[#316585]/15 bg-gradient-to-r from-[#0d1f35] via-[#16314f] to-[#316585] text-white">
        <CardHeader>
          <CardTitle>{PLATFORM_WEB_SHELL_PHASE_5.label}</CardTitle>
          <CardDescription className="text-white/75">
            {PLATFORM_WEB_SHELL_PHASE_5.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm font-semibold">Màn chính website quản trị</p>
            <p className="mt-2 text-sm text-white/75">Vào website quản trị là biết việc gì cần xử lý, duyệt gì, mở báo cáo nào và vào đâu tiếp theo.</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm font-semibold">Menu trái</p>
            <p className="mt-2 text-sm text-white/75">Menu trái phải là nhóm điều hành thật, không được là cây module hỗn loạn.</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm font-semibold">Hàng chờ xử lý và phê duyệt</p>
            <p className="mt-2 text-sm text-white/75">Giao diện website quản trị phải kéo người dùng vào danh sách xử lý và hàng chờ duyệt, không chỉ là bảng xem số.</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Tổng giao diện website quản trị</CardDescription>
            <CardTitle className="text-3xl text-[#16314f]">{summary.totalShells}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Chỉ dùng website quản trị</CardDescription>
            <CardTitle className="text-3xl text-sky-700">{summary.webOnlyShells}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Website trong mô hình hai nền tảng</CardDescription>
            <CardTitle className="text-3xl text-amber-700">{summary.hybridWebShells}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap gap-2 bg-transparent p-0">
          <TabsTrigger value="roles">
            <Monitor className="mr-2 h-4 w-4" />
            Theo role
          </TabsTrigger>
          <TabsTrigger value="web-only">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Chỉ dùng website quản trị
          </TabsTrigger>
          <TabsTrigger value="hybrid">
            <Workflow className="mr-2 h-4 w-4" />
            Website trong mô hình hai nền tảng
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {matrix.map((item) => (
              <Card key={item.role} className="border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <CardDescription>{item.why}</CardDescription>
                    </div>
                    <Badge className={item.webOnly ? 'bg-sky-100 text-sky-700 border-0' : 'bg-amber-100 text-amber-700 border-0'}>
                      {item.webOnly ? 'Chỉ dùng website quản trị' : 'Website trong mô hình hai nền tảng'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-slate-600">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">Đường vào chính</p>
                    <p className="mt-1 break-all">{item.homeRoute}</p>
                  </div>

                  <div>
                    <p className="mb-2 font-semibold text-slate-900">Khối bắt buộc</p>
                    <div className="flex flex-wrap gap-2">
                      {item.mustHave.map((block) => (
                        <BlockBadge key={block} block={block} />
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="font-semibold text-slate-900">Menu trái</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.leftNav.map((entry) => (
                          <Badge key={entry} variant="outline" className="border-slate-200 text-slate-700">
                            {entry}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="font-semibold text-slate-900">Hàng chờ xử lý</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.workQueues.map((entry) => (
                          <Badge key={entry} variant="outline" className="border-slate-200 text-slate-700">
                            {entry}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="font-semibold text-slate-900">Phê duyệt</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.approvals.map((entry) => (
                          <Badge key={entry} variant="outline" className="border-slate-200 text-slate-700">
                            {entry}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="font-semibold text-slate-900">Báo cáo / phân tích</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.reporting.map((entry) => (
                          <Badge key={entry} variant="outline" className="border-slate-200 text-slate-700">
                            {entry}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="font-semibold text-slate-900">Hồ sơ / quyền lợi</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.profile.map((entry) => (
                        <Badge key={entry} variant="outline" className="border-slate-200 text-slate-700">
                          {entry}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="web-only" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {webOnly.map((item) => (
              <Card key={item.role} className="border-slate-200">
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.why}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {item.leftNav.map((entry) => (
                      <Badge key={entry} variant="outline" className="border-slate-200 text-slate-700">
                        {entry}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="hybrid" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {hybrid.map((item) => (
              <Card key={item.role} className="border-slate-200">
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.why}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {item.approvals.map((entry) => (
                      <Badge key={entry} variant="outline" className="border-slate-200 text-slate-700">
                        {entry}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
