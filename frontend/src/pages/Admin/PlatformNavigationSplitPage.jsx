import React, { useMemo } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Monitor, Smartphone, SplitSquareVertical, Users } from 'lucide-react';
import {
  NAVIGATION_SHELL_META,
  NAVIGATION_SHELLS,
  PLATFORM_NAVIGATION_SPLIT_PHASE_1,
  getRoleNavigationShellMatrix,
} from '@/config/platformNavigationSplit';

function ShellBadge({ shell }) {
  const meta = NAVIGATION_SHELL_META[shell];
  return <Badge className={meta?.badgeClassName}>{meta?.label || shell}</Badge>;
}

function TabPill({ label }) {
  return (
    <Badge variant="outline" className="border-slate-200 text-slate-700">
      {label}
    </Badge>
  );
}

export default function PlatformNavigationSplitPage() {
  const matrix = useMemo(() => getRoleNavigationShellMatrix(), []);
  const webRoles = matrix.filter((item) => item.defaultShell === NAVIGATION_SHELLS.WEB);
  const appRoles = matrix.filter((item) => item.defaultShell === NAVIGATION_SHELLS.APP);
  const hybridRoles = matrix.filter((item) => item.appTabs.length > 0 && item.webTabs.length > 0);

  return (
    <div className="space-y-6" data-testid="platform-navigation-split-page">
      <PageHeader
        title="Tách điều hướng website quản trị / ứng dụng"
        subtitle="Khóa giao diện điều hướng thật theo vai trò: website chỉ giữ menu back office và quản trị, ứng dụng chỉ giữ menu hiện trường và thao tác nhanh."
        breadcrumbs={[
          { label: 'Cài đặt', path: '/settings' },
          { label: 'Tách điều hướng website quản trị / ứng dụng' },
        ]}
      />

      <Card className="border-[#316585]/15 bg-gradient-to-r from-[#0d1f35] via-[#16314f] to-[#316585] text-white">
        <CardHeader>
          <CardTitle>{PLATFORM_NAVIGATION_SPLIT_PHASE_1.label}</CardTitle>
          <CardDescription className="text-white/75">
            {PLATFORM_NAVIGATION_SPLIT_PHASE_1.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm font-semibold">Giao diện website quản trị</p>
            <p className="mt-2 text-sm text-white/75">Dành cho bảng điều hành, back office, cấu hình, phân tích và quản trị sâu.</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm font-semibold">Giao diện ứng dụng</p>
            <p className="mt-2 text-sm text-white/75">Dành cho lực lượng hiện trường, thao tác trong ngày, theo khách, theo giữ chỗ và theo KPI cá nhân.</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm font-semibold">Vai trò dùng hai nền tảng</p>
            <p className="mt-2 text-sm text-white/75">Vai trò có cả hai giao diện, nhưng giao diện mặc định phải được khóa rõ để tránh trộn menu.</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Vai trò mặc định dùng website quản trị</CardDescription>
            <CardTitle className="text-3xl text-sky-700">{webRoles.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Vai trò mặc định dùng ứng dụng</CardDescription>
            <CardTitle className="text-3xl text-emerald-700">{appRoles.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Vai trò có 2 giao diện</CardDescription>
            <CardTitle className="text-3xl text-[#16314f]">{hybridRoles.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap gap-2 bg-transparent p-0">
          <TabsTrigger value="roles">
            <Users className="mr-2 h-4 w-4" />
            Theo role
          </TabsTrigger>
          <TabsTrigger value="web">
            <Monitor className="mr-2 h-4 w-4" />
            Giao diện website quản trị
          </TabsTrigger>
          <TabsTrigger value="app">
            <Smartphone className="mr-2 h-4 w-4" />
            Giao diện ứng dụng
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {matrix.map((item) => (
              <Card key={item.role} className="border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{item.surfaceStrategy?.ten || item.role}</CardTitle>
                      <CardDescription>{item.surfaceStrategy?.boPhan || item.role}</CardDescription>
                    </div>
                    <ShellBadge shell={item.defaultShell} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-slate-600">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">Kết luận giao diện mặc định</p>
                    <p className="mt-1">{item.defaultShellMeta?.description}</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="font-semibold text-slate-900">Giao diện website quản trị</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.webTabs.length > 0 ? item.webTabs.map((tab) => (
                          <TabPill key={tab.id} label={tab.label} />
                        )) : <span className="text-slate-400">Không mở</span>}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="font-semibold text-slate-900">Giao diện ứng dụng</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.appTabs.length > 0 ? item.appTabs.map((tab) => (
                          <TabPill key={tab.id} label={tab.label} />
                        )) : <span className="text-slate-400">Không mở</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="web" className="space-y-4">
          <div className="grid gap-4">
            {matrix.filter((item) => item.webTabs.length > 0).map((item) => (
              <Card key={item.role} className="border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{item.surfaceStrategy?.ten || item.role}</CardTitle>
                      <CardDescription>Menu website quản trị chính thức cho vai trò này</CardDescription>
                    </div>
                    <Badge className="bg-sky-100 text-sky-700 border-0">
                      <SplitSquareVertical className="mr-2 h-4 w-4" />
                      {item.webTabs.length} tab cha
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {item.webTabs.map((tab) => (
                    <TabPill key={tab.id} label={tab.label} />
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="app" className="space-y-4">
          <div className="grid gap-4">
            {matrix.filter((item) => item.appTabs.length > 0).map((item) => (
              <Card key={item.role} className="border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{item.surfaceStrategy?.ten || item.role}</CardTitle>
                      <CardDescription>Menu ứng dụng chính thức cho vai trò này</CardDescription>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 border-0">
                      <SplitSquareVertical className="mr-2 h-4 w-4" />
                      {item.appTabs.length} tab cha
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {item.appTabs.map((tab) => (
                    <TabPill key={tab.id} label={tab.label} />
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
