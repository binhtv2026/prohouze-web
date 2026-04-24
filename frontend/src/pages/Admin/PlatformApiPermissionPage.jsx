import React, { useMemo } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, Database, LockKeyhole, Monitor, Smartphone, TabletSmartphone } from 'lucide-react';
import {
  PLATFORM_API_PERMISSION_PHASE_6,
  PLATFORM_CLIENT_META,
  PLATFORM_CLIENTS,
  getPlatformApiPermissionMatrix,
  getPlatformApiPermissionSummary,
} from '@/config/platformApiPermissionPhaseSix';

function ClientBadge({ client }) {
  const meta = PLATFORM_CLIENT_META[client];
  return <Badge className={meta?.badgeClassName}>{meta?.label || client}</Badge>;
}

export default function PlatformApiPermissionPage() {
  const summary = useMemo(() => getPlatformApiPermissionSummary(), []);
  const matrix = useMemo(() => getPlatformApiPermissionMatrix(), []);
  const webItems = matrix.filter((item) => item.client === PLATFORM_CLIENTS.WEB);
  const appItems = matrix.filter((item) => item.client === PLATFORM_CLIENTS.APP);
  const sharedItems = matrix.filter((item) => item.client === PLATFORM_CLIENTS.BOTH);

  return (
    <div className="space-y-6" data-testid="platform-api-permission-page">
      <PageHeader
        title="Khóa API và quyền truy cập theo website quản trị / ứng dụng"
        subtitle="Chốt tuyệt đối cụm chạy nào dùng ràng buộc backend nào và quyền thao tác nào. Đây là lớp khóa giữa giao diện, API và quyền truy cập."
        breadcrumbs={[
          { label: 'Cài đặt', path: '/settings' },
          { label: 'Khóa API và quyền truy cập theo website quản trị / ứng dụng' },
        ]}
      />

      <Card className="border-[#316585]/15 bg-gradient-to-r from-[#0d1f35] via-[#16314f] to-[#316585] text-white">
        <CardHeader>
          <CardTitle>{PLATFORM_API_PERMISSION_PHASE_6.label}</CardTitle>
          <CardDescription className="text-white/75">
            {PLATFORM_API_PERMISSION_PHASE_6.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm font-semibold">Ràng buộc backend đã khóa</p>
            <p className="mt-2 text-sm text-white/75">Mỗi cụm chạy đều phải chỉ ra ràng buộc backend cụ thể, không được gọi tự do.</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm font-semibold">Quyền truy cập đã khóa</p>
            <p className="mt-2 text-sm text-white/75">Mọi cụm chạy phải map tới quyền thao tác cụ thể, không chỉ có lớp chặn route ở giao diện.</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm font-semibold">Đối chiếu tự động</p>
            <p className="mt-2 text-sm text-white/75">Nếu thiếu khóa ràng buộc backend hoặc thiếu quyền thao tác, bước này không được coi là đã khóa.</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Tổng cụm chạy</CardDescription>
            <CardTitle className="text-3xl text-[#16314f]">{summary.totalRuntimeClusters}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Đã khóa</CardDescription>
            <CardTitle className="text-3xl text-emerald-700">{summary.fullyLockedClusters}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Website quản trị</CardDescription>
            <CardTitle className="text-3xl text-sky-700">{summary.webClusters}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Ứng dụng</CardDescription>
            <CardTitle className="text-3xl text-emerald-700">{summary.appClusters}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Website quản trị + ứng dụng</CardDescription>
            <CardTitle className="text-3xl text-amber-700">{summary.sharedClusters}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="matrix" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap gap-2 bg-transparent p-0">
          <TabsTrigger value="matrix">
            <LockKeyhole className="mr-2 h-4 w-4" />
            Theo cụm chạy
          </TabsTrigger>
          <TabsTrigger value="web">
            <Monitor className="mr-2 h-4 w-4" />
            Website quản trị
          </TabsTrigger>
          <TabsTrigger value="app">
            <Smartphone className="mr-2 h-4 w-4" />
            Ứng dụng
          </TabsTrigger>
          <TabsTrigger value="shared">
            <TabletSmartphone className="mr-2 h-4 w-4" />
            Website quản trị + ứng dụng
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="space-y-4">
          <div className="grid gap-4">
            {matrix.map((item) => (
              <Card key={item.id} className="border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{item.label}</CardTitle>
                      <CardDescription>{item.why}</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <ClientBadge client={item.client} />
                      <Badge className={item.locked ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-rose-100 text-rose-700 border-0'}>
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        {item.locked ? 'Đã khóa' : 'Thiếu'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                  <div className="space-y-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">Ràng buộc backend</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.contracts.map((contract) => (
                          <Badge key={contract} variant="outline" className="border-slate-200 text-slate-700">
                            {contract}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">Nhóm quyền truy cập</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.permissions.map((entry) => (
                          <Badge key={`${entry.resource}-${entry.actions.join('-')}`} variant="outline" className="border-slate-200 text-slate-700">
                            {entry.resource}: {entry.actions.join(', ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">Thiếu khóa ràng buộc backend</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.missingContracts.length > 0 ? item.missingContracts.map((entry) => (
                          <Badge key={entry} className="bg-rose-100 text-rose-700 border-0">
                            {entry}
                          </Badge>
                        )) : <span className="text-sm text-emerald-700">Không thiếu</span>}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">Thiếu quyền truy cập</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.missingPermissions.length > 0 ? item.missingPermissions.map((entry) => (
                          <Badge key={entry.resource} className="bg-rose-100 text-rose-700 border-0">
                            {entry.resource}
                          </Badge>
                        )) : <span className="text-sm text-emerald-700">Không thiếu</span>}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">Thiếu quyền thao tác</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.missingActions.length > 0 ? item.missingActions.map((entry) => (
                          <Badge key={entry} className="bg-rose-100 text-rose-700 border-0">
                            {entry}
                          </Badge>
                        )) : <span className="text-sm text-emerald-700">Không thiếu</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {[{ key: 'web', items: webItems }, { key: 'app', items: appItems }, { key: 'shared', items: sharedItems }].map((group) => (
          <TabsContent key={group.key} value={group.key} className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {group.items.map((item) => (
                <Card key={item.id} className="border-slate-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{item.label}</CardTitle>
                    <CardDescription>{item.why}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {item.roles.map((role) => (
                        <Badge key={role} variant="outline" className="border-slate-200 text-slate-700">
                          {role}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.contracts.map((entry) => (
                        <Badge key={entry} variant="outline" className="border-slate-200 text-slate-700">
                          <Database className="mr-1 h-3 w-3" />
                          {entry}
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
