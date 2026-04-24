import React, { useMemo } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppWindow, Bell, Bolt, LayoutDashboard, UserCircle } from 'lucide-react';
import {
  APP_SHELL_BLOCK_META,
  PLATFORM_APP_SHELL_PHASE_4,
  getAppShellMatrix,
  getAppShellSummary,
} from '@/config/platformAppShellPhaseFour';

function BlockBadge({ block }) {
  const meta = APP_SHELL_BLOCK_META[block];
  return <Badge className={meta?.badgeClassName}>{meta?.label || block}</Badge>;
}

export default function PlatformAppShellPage() {
  const summary = useMemo(() => getAppShellSummary(), []);
  const matrix = useMemo(() => getAppShellMatrix(), []);
  const appFirst = matrix.filter((item) => item.appFirst);
  const hybrid = matrix.filter((item) => !item.appFirst);

  return (
    <div className="space-y-6" data-testid="platform-app-shell-page">
      <PageHeader
        title="Khóa App Shell Chuẩn"
        subtitle="Chốt tuyệt đối home app, bottom navigation, quick actions, thông báo và khay duyệt nhanh cho các role dùng app."
        breadcrumbs={[
          { label: 'Cài đặt', path: '/settings' },
          { label: 'Khóa App Shell Chuẩn' },
        ]}
      />

      <Card className="border-[#316585]/15 bg-gradient-to-r from-[#0d1f35] via-[#16314f] to-[#316585] text-white">
        <CardHeader>
          <CardTitle>{PLATFORM_APP_SHELL_PHASE_4.label}</CardTitle>
          <CardDescription className="text-white/75">
            {PLATFORM_APP_SHELL_PHASE_4.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm font-semibold">Home app</p>
            <p className="mt-2 text-sm text-white/75">Mở app là biết hôm nay làm gì, khách nào cần bám và tiền đang ở đâu.</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm font-semibold">Bottom navigation</p>
            <p className="mt-2 text-sm text-white/75">Chỉ giữ 4-5 tab sống còn, không nhồi menu kiểu web.</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm font-semibold">Quick actions</p>
            <p className="mt-2 text-sm text-white/75">Mọi role dùng app đều phải có thao tác nhanh phục vụ nhịp làm việc thực tế.</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Tổng app shell</CardDescription>
            <CardTitle className="text-3xl text-[#16314f]">{summary.totalShells}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>App-first</CardDescription>
            <CardTitle className="text-3xl text-emerald-700">{summary.appFirstShells}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Hybrid support</CardDescription>
            <CardTitle className="text-3xl text-[#16314f]">{summary.hybridSupportShells}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap gap-2 bg-transparent p-0">
          <TabsTrigger value="roles">
            <AppWindow className="mr-2 h-4 w-4" />
            Theo role
          </TabsTrigger>
          <TabsTrigger value="app-first">
            <Bolt className="mr-2 h-4 w-4" />
            App-first
          </TabsTrigger>
          <TabsTrigger value="hybrid">
            <Bell className="mr-2 h-4 w-4" />
            Hybrid support
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
                    <Badge className={item.appFirst ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-amber-100 text-amber-700 border-0'}>
                      {item.appFirst ? 'App-first' : 'Hybrid support'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-slate-600">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">Home route</p>
                    <p className="mt-1 break-all">{item.homeRoute}</p>
                  </div>

                  <div>
                    <p className="mb-2 font-semibold text-slate-900">Màn bắt buộc</p>
                    <div className="flex flex-wrap gap-2">
                      {item.mustHave.map((block) => (
                        <BlockBadge key={block} block={block} />
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="font-semibold text-slate-900">Bottom navigation</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.bottomNav.map((tab) => (
                          <Badge key={tab} variant="outline" className="border-slate-200 text-slate-700">
                            {tab}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="font-semibold text-slate-900">Quick actions</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.quickActions.map((action) => (
                          <Badge key={action} variant="outline" className="border-slate-200 text-slate-700">
                            {action}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="font-semibold text-slate-900">Thông báo phải có</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.notifications.map((note) => (
                          <Badge key={note} variant="outline" className="border-slate-200 text-slate-700">
                            {note}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="font-semibold text-slate-900">Hồ sơ / KPI / thu nhập</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.profile.map((entry) => (
                          <Badge key={entry} variant="outline" className="border-slate-200 text-slate-700">
                            {entry}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {item.approvalTray.length > 0 && (
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="font-semibold text-slate-900">Khay duyệt nhanh</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.approvalTray.map((entry) => (
                          <Badge key={entry} variant="outline" className="border-slate-200 text-slate-700">
                            {entry}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="app-first" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {appFirst.map((item) => (
              <Card key={item.role} className="border-slate-200">
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.why}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {item.bottomNav.map((tab) => (
                      <Badge key={tab} variant="outline" className="border-slate-200 text-slate-700">
                        {tab}
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
                    {item.approvalTray.length > 0 ? item.approvalTray.map((entry) => (
                      <Badge key={entry} variant="outline" className="border-slate-200 text-slate-700">
                        {entry}
                      </Badge>
                    )) : <span className="text-sm text-slate-400">Không cần khay duyệt nhanh</span>}
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
