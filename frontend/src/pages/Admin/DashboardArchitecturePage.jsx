import React, { useMemo } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LayoutDashboard,
  Shield,
  Users,
  Layers,
  Target,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  CAP_BAC,
  MANG_PHU_TRACH,
  HO_SO_ROLE,
  DASHBOARD_CHINH,
  NHOM_MENU_MOI,
  TAB_DASHBOARD,
  getHoSoRole,
  getDanhSachDashboardTheoRole,
  getMaTranHienThiTabs,
} from '@/config/dashboardGovernance';

const capBacLabels = {
  [CAP_BAC.QUAN_TRI_HE_THONG]: 'Quản trị hệ thống',
  [CAP_BAC.LANH_DAO]: 'Lãnh đạo',
  [CAP_BAC.QUAN_LY]: 'Quản lý',
  [CAP_BAC.NHAN_VIEN]: 'Nhân viên',
  [CAP_BAC.CONG_TAC_VIEN]: 'Cộng tác viên',
};

const mangLabels = {
  [MANG_PHU_TRACH.DIEU_HANH]: 'Điều hành',
  [MANG_PHU_TRACH.KINH_DOANH]: 'Kinh doanh',
  [MANG_PHU_TRACH.MARKETING]: 'Marketing',
  [MANG_PHU_TRACH.TAI_CHINH]: 'Tài chính',
  [MANG_PHU_TRACH.NHAN_SU]: 'Nhân sự',
  [MANG_PHU_TRACH.PHAP_LY]: 'Pháp lý',
  [MANG_PHU_TRACH.VAN_HANH]: 'Vận hành',
  [MANG_PHU_TRACH.WEBSITE_CMS]: 'Website / CMS',
};

export default function DashboardArchitecturePage() {
  const { user } = useAuth();
  const hoSoRole = getHoSoRole(user?.role);

  const dashboardsTheoRole = useMemo(() => getDanhSachDashboardTheoRole(user?.role), [user?.role]);
  const maTranTabs = useMemo(() => getMaTranHienThiTabs(), []);

  return (
    <div className="space-y-6" data-testid="dashboard-architecture-page">
      <PageHeader
        title="Kiến trúc dashboard"
        subtitle="Nguồn chuẩn cho dashboard chính, tab chuẩn và quyền hiển thị theo cấp bậc + mảng phụ trách."
        breadcrumbs={[
          { label: 'Cài đặt', path: '/settings' },
          { label: 'Kiến trúc dashboard' },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Dashboard chính</CardDescription>
            <CardTitle className="text-3xl text-[#16314f]">{DASHBOARD_CHINH.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <LayoutDashboard className="h-4 w-4 text-[#316585]" />
              Đã chốt để dọn trùng menu và route.
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Tab chuẩn</CardDescription>
            <CardTitle className="text-3xl text-[#16314f]">{Object.keys(TAB_DASHBOARD).length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Layers className="h-4 w-4 text-[#316585]" />
              Dùng lại cho mọi dashboard để giao diện nhất quán.
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Vai trò hiện tại</CardDescription>
            <CardTitle className="text-xl text-[#16314f]">{hoSoRole.tenHienThi}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Badge className="bg-[#316585]">{capBacLabels[hoSoRole.capBac]}</Badge>
            <Badge variant="outline">{mangLabels[hoSoRole.mang]}</Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="dashboards" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap gap-2 bg-transparent p-0">
          <TabsTrigger value="dashboards">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard chính
          </TabsTrigger>
          <TabsTrigger value="tabs">
            <Layers className="mr-2 h-4 w-4" />
            Tab chuẩn
          </TabsTrigger>
          <TabsTrigger value="visibility">
            <Users className="mr-2 h-4 w-4" />
            Quyền ai thấy
          </TabsTrigger>
          <TabsTrigger value="menu">
            <Target className="mr-2 h-4 w-4" />
            Nhóm menu mới
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboards" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {DASHBOARD_CHINH.map((dashboard) => (
              <Card key={dashboard.id} className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-slate-900">{dashboard.label}</CardTitle>
                  <CardDescription>{dashboard.moTa}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {dashboard.tabs.map((tabId) => (
                      <Badge key={tabId} variant="outline" className="border-[#316585]/20 text-[#16314f]">
                        {TAB_DASHBOARD[tabId]?.label || tabId}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tabs" className="space-y-4">
          {maTranTabs.map((dashboard) => (
            <Card key={dashboard.id} className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{dashboard.label}</CardTitle>
                <CardDescription>{dashboard.tabsChiTiet.length} tab chuẩn</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {dashboard.tabsChiTiet.map((tab) => (
                  <div key={tab.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    {tab.label}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="visibility" className="space-y-4">
          <Card className="border-[#316585]/15 bg-gradient-to-r from-[#0d1f35] via-[#16314f] to-[#316585] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Quyền hiển thị theo role đang đăng nhập
              </CardTitle>
              <CardDescription className="text-white/75">
                Role hiện tại sẽ nhìn thấy đúng dashboard theo cấp bậc và mảng phụ trách.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {dashboardsTheoRole.map((dashboard) => (
                <Badge key={dashboard.id} className="bg-white/10 text-white">
                  {dashboard.label}
                </Badge>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {Object.entries(HO_SO_ROLE).map(([role, profile]) => (
              <Card key={role} className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-slate-900">{profile.tenHienThi}</CardTitle>
                  <CardDescription>
                    {capBacLabels[profile.capBac]} / {mangLabels[profile.mang]}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {getDanhSachDashboardTheoRole(role).map((dashboard) => (
                      <Badge key={dashboard.id} variant="outline" className="border-[#316585]/20 text-[#16314f]">
                        {dashboard.label}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="menu" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {NHOM_MENU_MOI.map((group) => (
              <Card key={group.id} className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{group.label}</CardTitle>
                  <CardDescription>Dùng để dọn menu trái hiện tại theo dashboard chính.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {group.dashboards.map((dashboardId) => {
                    const dashboard = DASHBOARD_CHINH.find((item) => item.id === dashboardId);
                    if (!dashboard) return null;
                    return (
                      <div key={dashboardId} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                        <CheckCircle2 className="h-4 w-4 text-[#316585]" />
                        {dashboard.label}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
