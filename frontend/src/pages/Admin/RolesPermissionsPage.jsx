import React, { useMemo, useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Eye,
  Info,
  KeyRound,
  LayoutDashboard,
  Shield,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getDanhSachDashboardTheoRole,
  getTabsChoDashboard,
  HO_SO_ROLE,
} from '@/config/dashboardGovernance';
import {
  DEMO_PASSWORD,
  getDemoAccountsList,
  getRoleGovernanceList,
  ROLE_GOVERNANCE,
  ROLE_PERMISSION_GROUPS,
} from '@/config/roleGovernance';

const ROLE_COLOR = {
  'Quản trị': 'bg-slate-100 text-slate-800 border-slate-200',
  'Lãnh đạo': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Quản lý': 'bg-blue-100 text-blue-800 border-blue-200',
  'Nhân viên': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Cộng tác viên': 'bg-amber-100 text-amber-800 border-amber-200',
};

const ACCESS_BADGE = {
  'Toàn quyền': 'bg-slate-900 text-white',
  'Toàn bộ': 'bg-slate-100 text-slate-800',
  'Duyệt cấp cao': 'bg-violet-100 text-violet-800',
  'Thiết lập': 'bg-blue-100 text-blue-800',
  'Thực hiện': 'bg-emerald-100 text-emerald-800',
  'Theo phòng / đội': 'bg-cyan-100 text-cyan-800',
  'Theo phòng / dự án': 'bg-cyan-100 text-cyan-800',
  'Đội nhóm phụ trách': 'bg-cyan-100 text-cyan-800',
  'Dữ liệu được giao': 'bg-emerald-100 text-emerald-800',
  'Khách được giao': 'bg-emerald-100 text-emerald-800',
  'Chỉ phần liên quan': 'bg-amber-100 text-amber-800',
  'Hồ sơ của mình': 'bg-amber-100 text-amber-800',
  'Khách của mình': 'bg-amber-100 text-amber-800',
  'Hoa hồng của mình': 'bg-amber-100 text-amber-800',
  'Không': 'bg-slate-100 text-slate-400',
};

const getAccessClass = (value) => ACCESS_BADGE[value] || 'bg-slate-100 text-slate-700';

export default function RolesPermissionsPage() {
  const [activeTab, setActiveTab] = useState('roles');
  const [selectedRoleCode, setSelectedRoleCode] = useState(null);

  const roles = useMemo(() => getRoleGovernanceList(), []);
  const demoAccounts = useMemo(() => getDemoAccountsList(), []);

  const selectedRole = selectedRoleCode ? ROLE_GOVERNANCE[selectedRoleCode] : null;
  const selectedDashboards = selectedRoleCode ? getDanhSachDashboardTheoRole(selectedRoleCode) : [];
  const selectedPermissionRows = selectedRoleCode
    ? ROLE_PERMISSION_GROUPS.map((group) => ({
        ...group,
        actions: group.actions.map((action) => ({
          ...action,
          value: action.access[selectedRoleCode] || 'Không',
        })),
      }))
    : [];

  const handleCopy = async (value, message) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(message);
    } catch (error) {
      toast.error('Không thể sao chép, vui lòng thử lại');
    }
  };

  return (
    <div className="space-y-6" data-testid="roles-permissions-page">
      <PageHeader
        title="Vai trò & phân quyền"
        subtitle="Bản chuẩn để xác định ai đăng nhập vào đâu, thấy gì và làm được gì."
        breadcrumbs={[
          { label: 'Cài đặt', path: '/settings' },
          { label: 'Vai trò & phân quyền' },
        ]}
        rightContent={
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.success('Trang vai trò đang dùng bộ cấu hình chuẩn cục bộ')}
          >
            <Shield className="h-4 w-4 mr-2" />
            Đang dùng cấu hình chuẩn
          </Button>
        }
      />

      <Card className="border-[#316585]/15 bg-[#316585]/[0.03]">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-[#316585] mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-slate-900">Cách đọc trang này</p>
              <p className="text-sm text-slate-600">
                Mỗi vai trò được mô tả theo ngôn ngữ vận hành doanh nghiệp, không theo ngôn ngữ kỹ thuật.
                Anh/chị chỉ cần xem 4 câu hỏi: <strong>vào dashboard nào</strong>, <strong>thấy dữ liệu gì</strong>,
                <strong>được xử lý việc gì</strong>, và <strong>dùng tài khoản demo nào để kiểm tra</strong>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex h-auto flex-wrap gap-2 bg-transparent p-0">
          <TabsTrigger value="roles">
            <Shield className="h-4 w-4 mr-2" />
            Danh sách vai trò
          </TabsTrigger>
          <TabsTrigger value="dashboards">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Dashboard theo vai trò
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Eye className="h-4 w-4 mr-2" />
            Quyền chính theo vai trò
          </TabsTrigger>
          <TabsTrigger value="demo">
            <KeyRound className="h-4 w-4 mr-2" />
            Tài khoản demo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {roles.map((role) => {
              const profile = HO_SO_ROLE[role.code];
              const dashboards = getDanhSachDashboardTheoRole(role.code);
              return (
                <Card key={role.code} className="border-slate-200 shadow-sm">
                  <CardHeader className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg">{role.ten}</CardTitle>
                        <CardDescription className="mt-1">{role.moTa}</CardDescription>
                      </div>
                      <Badge className={ROLE_COLOR[role.capBac] || ROLE_COLOR['Nhân viên']}>
                        {role.capBac}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{role.code}</Badge>
                      <Badge variant="outline">{role.mang}</Badge>
                      <Badge variant="outline">{profile?.tenHienThi || role.ten}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 text-sm text-slate-600">
                      <div>
                        <p className="font-medium text-slate-900">Phạm vi dữ liệu</p>
                        <p>{role.phamVi}</p>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Ưu tiên công việc</p>
                        <p>{role.uuTien}</p>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Số dashboard nhìn thấy</p>
                        <p>{dashboards.length} màn hình chính</p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setSelectedRoleCode(role.code)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Xem chi tiết vai trò
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="dashboards" className="space-y-4">
          <div className="grid gap-4">
            {roles.map((role) => {
              const dashboards = getDanhSachDashboardTheoRole(role.code);
              return (
                <Card key={`dashboard-${role.code}`} className="border-slate-200 shadow-sm">
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-lg">{role.ten}</CardTitle>
                      <Badge className={ROLE_COLOR[role.capBac] || ROLE_COLOR['Nhân viên']}>
                        {role.capBac}
                      </Badge>
                      <Badge variant="outline">{role.mang}</Badge>
                    </div>
                    <CardDescription>
                      Vào mặc định tại <code className="rounded bg-slate-100 px-2 py-0.5 text-xs">{role.defaultDashboard}</code>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {dashboards.map((dashboard) => (
                      <div key={`${role.code}-${dashboard.id}`} className="rounded-xl border border-slate-200 p-4">
                        <p className="font-medium text-slate-900">{dashboard.label}</p>
                        <p className="mt-1 text-sm text-slate-500">{dashboard.moTa}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {getTabsChoDashboard(dashboard.id).slice(0, 4).map((tab) => (
                            <Badge key={tab.id} variant="secondary">
                              {tab.label}
                            </Badge>
                          ))}
                          {getTabsChoDashboard(dashboard.id).length > 4 ? (
                            <Badge variant="outline">
                              +{getTabsChoDashboard(dashboard.id).length - 4} tab
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Accordion type="multiple" className="w-full space-y-4">
            {ROLE_PERMISSION_GROUPS.map((group) => (
              <AccordionItem
                key={group.id}
                value={group.id}
                className="rounded-2xl border border-slate-200 px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">{group.label}</p>
                    <p className="text-sm text-slate-500">
                      Ma trận quyền chính để chốt ai được làm gì trong hệ thống.
                    </p>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1100px] border-separate border-spacing-y-2 text-sm">
                      <thead>
                        <tr className="text-left text-slate-500">
                          <th className="w-56 px-3 py-2">Nội dung công việc</th>
                          {roles.map((role) => (
                            <th key={`${group.id}-${role.code}`} className="px-3 py-2">
                              {role.ten}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {group.actions.map((action) => (
                          <tr key={`${group.id}-${action.label}`}>
                            <td className="rounded-l-xl border border-r-0 border-slate-200 bg-white px-3 py-3 font-medium text-slate-800">
                              {action.label}
                            </td>
                            {roles.map((role, index) => {
                              const access = action.access[role.code] || 'Không';
                              const radiusClass = index === roles.length - 1 ? 'rounded-r-xl' : '';
                              return (
                                <td
                                  key={`${group.id}-${action.label}-${role.code}`}
                                  className={`border border-l-0 border-slate-200 bg-white px-3 py-3 ${radiusClass}`}
                                >
                                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getAccessClass(access)}`}>
                                    {access}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>

        <TabsContent value="demo" className="space-y-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Tài khoản demo để kiểm tra từng vai trò
              </CardTitle>
              <CardDescription>
                Tất cả tài khoản demo local đều dùng chung mật khẩu <strong>{DEMO_PASSWORD}</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {demoAccounts.map((account) => {
                const role = ROLE_GOVERNANCE[account.role];
                return (
                  <div key={account.email} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">{role?.ten || account.full_name}</p>
                        <p className="text-sm text-slate-500">{role?.mang || 'Nghiệp vụ'}</p>
                      </div>
                      <Badge className={ROLE_COLOR[role?.capBac] || ROLE_COLOR['Nhân viên']}>
                        {role?.capBac || 'Nhân viên'}
                      </Badge>
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      <div>
                        <p className="text-slate-500">Email</p>
                        <div className="flex items-center gap-2">
                          <code className="rounded bg-slate-100 px-2 py-1 text-xs">{account.email}</code>
                          <Button size="sm" variant="ghost" onClick={() => handleCopy(account.email, 'Đã sao chép email')}>
                            Sao chép
                          </Button>
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-500">Mật khẩu</p>
                        <div className="flex items-center gap-2">
                          <code className="rounded bg-slate-100 px-2 py-1 text-xs">{DEMO_PASSWORD}</code>
                          <Button size="sm" variant="ghost" onClick={() => handleCopy(DEMO_PASSWORD, 'Đã sao chép mật khẩu')}>
                            Sao chép
                          </Button>
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-500">Dashboard mặc định</p>
                        <code className="rounded bg-slate-100 px-2 py-1 text-xs">{role?.defaultDashboard}</code>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(selectedRole)} onOpenChange={(open) => !open && setSelectedRoleCode(null)}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Chi tiết vai trò: {selectedRole?.ten}
            </DialogTitle>
          </DialogHeader>

          {selectedRole ? (
            <div className="space-y-6">
              <Card>
                <CardContent className="grid gap-4 pt-6 md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <p className="text-sm text-slate-500">Cấp bậc</p>
                    <p className="font-medium text-slate-900">{selectedRole.capBac}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Mảng phụ trách</p>
                    <p className="font-medium text-slate-900">{selectedRole.mang}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Phạm vi dữ liệu</p>
                    <p className="font-medium text-slate-900">{selectedRole.phamVi}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Điểm vào mặc định</p>
                    <code className="rounded bg-slate-100 px-2 py-1 text-xs">{selectedRole.defaultDashboard}</code>
                  </div>
                  <div className="md:col-span-2 xl:col-span-4">
                    <p className="text-sm text-slate-500">Mô tả</p>
                    <p className="font-medium text-slate-900">{selectedRole.moTa}</p>
                  </div>
                  <div className="md:col-span-2 xl:col-span-4">
                    <p className="text-sm text-slate-500">Ưu tiên công việc</p>
                    <p className="font-medium text-slate-900">{selectedRole.uuTien}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Dashboard nhìn thấy</CardTitle>
                  <CardDescription>
                    Các màn hình chính mà vai trò này được truy cập sau khi đăng nhập.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  {selectedDashboards.map((dashboard) => (
                    <div key={dashboard.id} className="rounded-xl border border-slate-200 p-4">
                      <p className="font-medium text-slate-900">{dashboard.label}</p>
                      <p className="mt-1 text-sm text-slate-500">{dashboard.moTa}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {getTabsChoDashboard(dashboard.id).map((tab) => (
                          <Badge key={`${dashboard.id}-${tab.id}`} variant="secondary">
                            {tab.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quyền chính cần biết</CardTitle>
                  <CardDescription>
                    Bản rút gọn theo ngôn ngữ vận hành để kiểm tra nhanh phạm vi công việc của vai trò này.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedPermissionRows.map((group) => (
                    <div key={`${selectedRole.code}-${group.id}`} className="rounded-xl border border-slate-200 p-4">
                      <p className="font-medium text-slate-900">{group.label}</p>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        {group.actions.map((action) => (
                          <div key={`${group.id}-${action.label}`} className="rounded-lg bg-slate-50 p-3">
                            <p className="text-sm font-medium text-slate-800">{action.label}</p>
                            <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getAccessClass(action.value)}`}>
                              {action.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
