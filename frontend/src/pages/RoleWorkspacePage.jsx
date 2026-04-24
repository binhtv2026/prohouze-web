import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getHoSoRole } from '@/config/dashboardGovernance';
import {
  groupIcons,
  roleDayIntent,
  roleSupportBenefits,
  roleVisualTone,
  roleWorkspaceConfig,
  roleWorkspaceUx,
} from '@/config/roleWorkspaceUx';
import {
  getRoleNavigationShellTabs,
} from '@/config/platformNavigationSplit';
import { getRoleLabel } from '@/lib/utils';
import {
  ArrowRight,
  LayoutDashboard,
  Users,
} from 'lucide-react';

export default function RoleWorkspacePage() {
  const { user } = useAuth();

  if (user?.role === 'sales') {
    return <Navigate to="/sales" replace />;
  }

  const role = user?.role || 'manager';
  const profile = getHoSoRole(role);
  const groups = getRoleNavigationShellTabs(role);
  const workspace = roleWorkspaceConfig[role] || roleWorkspaceConfig.manager;
  const priorityActions = [
    { label: 'Mở hồ sơ cá nhân', link: '/me', icon: Users },
    ...groups
      .map((group) => {
        const primarySubtab = group.children.find((child) => (child.grandchildren || []).length > 0);
        const primaryLeaf = primarySubtab?.grandchildren?.[0];
        if (!primaryLeaf) return null;
        return {
          label: `${group.label}: ${primaryLeaf.label}`,
          link: primaryLeaf.path,
          icon: groupIcons[group.id] || LayoutDashboard,
        };
      })
      .filter(Boolean)
      .slice(0, 3),
  ];
  const firstAction = priorityActions[0];
  const supportBenefits = roleSupportBenefits[role] || roleSupportBenefits.manager;
  const threeMoves = workspace.queue.slice(0, 3);
  const dayIntent = roleDayIntent[role] || roleDayIntent.manager;
  const visualTone = roleVisualTone[role] || roleVisualTone.manager;
  const workspaceUx = roleWorkspaceUx[role] || roleWorkspaceUx.manager;
  const [primaryHighlight, ...secondaryHighlights] = workspace.highlights;

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        title={workspace.title}
        subtitle={workspace.subtitle}
        showNotifications={true}
        showAIButton={true}
      />

      <div className="mx-auto max-w-[1600px] space-y-6 p-6">
        <Card className={`${visualTone.softBorder} overflow-hidden bg-gradient-to-r from-white via-white to-white`}>
          <CardContent className="grid gap-5 p-0 lg:grid-cols-[minmax(0,1.32fr)_minmax(300px,0.96fr)]">
            <div className="p-6">
              <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${visualTone.softText}`}>{workspaceUx.heroKicker}</p>
              <h2 className="mt-2 text-3xl font-bold leading-tight text-slate-900">{workspace.queue[0]}</h2>
              <p className="mt-2 text-sm text-slate-600">{dayIntent.openingQuestion}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge className={`border-0 ${visualTone.chipBg} ${visualTone.chipText}`}>
                  {getRoleLabel(role)}
                </Badge>
                {workspace.focus.slice(0, 4).map((item) => (
                  <Badge key={item} className={`bg-white ${visualTone.softText}`}>
                    {item}
                  </Badge>
                ))}
              </div>

              {firstAction && (
                <div className="mt-5">
                  <Link to={firstAction.link}>
                    <Button style={{ backgroundColor: visualTone.accent }} className="h-11 px-5 text-sm font-semibold">
                      {firstAction.label}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            <div className={`${visualTone.softBg} border-t p-6 lg:border-l lg:border-t-0 ${visualTone.softBorder}`}>
              <p className="text-sm font-semibold text-slate-900">Nếu hôm nay chỉ làm 3 việc</p>
              <div className="mt-4 space-y-3">
                {threeMoves.map((item, index) => (
                  <div key={item} className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold text-white"
                      style={{ backgroundColor: visualTone.accent }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{item}</p>
                      <p className="mt-1 text-sm text-slate-500">Làm xong mục này là ngày làm việc tiến rõ một bước.</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.24fr)_minmax(320px,0.96fr)]">
          <Card className={`${visualTone.softBorder} ${visualTone.softBg} overflow-hidden`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${visualTone.softText}`}>
                    {primaryHighlight.label}
                  </p>
                  <p className="mt-3 text-4xl font-bold leading-none text-slate-900">{primaryHighlight.value}</p>
                  <p className="mt-3 max-w-xl text-sm text-slate-600">{primaryHighlight.note}</p>
                </div>
                <div className={`flex h-14 w-14 items-center justify-center rounded-3xl bg-white shadow-sm`}>
                  <primaryHighlight.icon className={`h-6 w-6 ${visualTone.chipText}`} />
                </div>
              </div>
              {primaryHighlight.link && (
                <div className="mt-5">
                  <Link to={primaryHighlight.link}>
                    <Button style={{ backgroundColor: visualTone.accent }}>
                      Mở ngay
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
          {secondaryHighlights.map((item) => {
            const Icon = item.icon;
            const content = (
              <Card key={item.label} className="border-slate-200 transition-colors hover:border-[#316585]/30 hover:bg-slate-50/60">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">{item.value}</p>
                      <p className="mt-2 text-sm text-slate-500">{item.note}</p>
                    </div>
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${visualTone.chipBg}`}>
                      <Icon className={`h-5 w-5 ${visualTone.chipText}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );

            if (item.link) {
              return (
                <Link key={item.label} to={item.link}>
                  {content}
                </Link>
              );
            }

            return content;
          })}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>{workspaceUx.actionsTitle}</CardTitle>
              <CardDescription>{workspaceUx.actionsSubtitle}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                {priorityActions.map((action) => {
                  const Icon = action.icon || LayoutDashboard;
                  return (
                    <Link
                      key={action.label}
                      to={action.link}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${visualTone.chipBg}`}>
                          <Icon className={`h-5 w-5 ${visualTone.chipText}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{action.label}</p>
                          <p className="text-sm text-slate-500">Ưu tiên mở trước</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className={`rounded-3xl border ${visualTone.softBorder} bg-white p-4`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Hồ sơ cá nhân</p>
                    <p className="mt-1 text-sm text-slate-500">Xem vai trò, KPI, quyền lợi và lộ trình của chính bạn.</p>
                  </div>
                  <Link to="/me">
                    <Button style={{ backgroundColor: visualTone.accent }}>
                      Mở hồ sơ
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>{workspaceUx.focusTitle}</CardTitle>
              <CardDescription>Nhìn một lượt là biết hôm nay nên bắt đầu từ đâu.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className={`rounded-2xl border ${visualTone.softBorder} ${visualTone.softBg} p-4`}>
                <p className="text-sm font-semibold text-slate-900">4 vùng cần nhìn đầu tiên</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {workspace.focus.map((item) => (
                    <Badge key={item} className={`bg-white ${visualTone.softText}`}>{item}</Badge>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">{workspaceUx.successTitle}</p>
                <div className="mt-3 space-y-2">
                  {dayIntent.successSignals.map((item) => (
                    <div key={item} className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">{workspaceUx.supportTitle}</p>
                <div className="mt-3 space-y-2">
                  {supportBenefits.map((item) => (
                    <div key={item} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className={`rounded-2xl border ${visualTone.softBorder} bg-white p-4`}>
                <p className="text-sm font-semibold text-slate-900">Vai trò hiện tại</p>
                <p className="mt-1 text-sm text-slate-600">{profile.tenHienThi}</p>
                <p className="mt-2 text-sm text-slate-500">
                  Bảng làm việc này chỉ giữ đúng các lối vào phù hợp với vai trò hiện tại để mở ra là biết phải làm gì trước.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge className={`border-0 ${visualTone.chipBg} ${visualTone.chipText}`}>
                    {groups.length} nhóm việc chính
                  </Badge>
                  <Badge className="border-0 bg-slate-100 text-slate-700">
                    Tập trung đúng việc
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="xl:col-span-2">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">{workspaceUx.groupsTitle}</p>
          </div>
          {groups.map((group) => {
            const Icon = groupIcons[group.id] || LayoutDashboard;
            const actionableChildren = group.children.filter((child) => (child.grandchildren || []).length > 0);
            const primarySubtab = actionableChildren[0];
            const primaryLeaf = primarySubtab?.grandchildren?.[0];

            return (
              <Card key={group.id} className="border-slate-200">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${visualTone.chipBg}`}>
                      <Icon className={`h-5 w-5 ${visualTone.chipText}`} />
                    </div>
                    <div>
                      <CardTitle>{group.label}</CardTitle>
                      <CardDescription>{group.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {primaryLeaf && (
                    <Link
                      to={primaryLeaf.path}
                      className={`block rounded-2xl border ${visualTone.softBorder} ${visualTone.softBg} p-4 transition-colors hover:bg-white`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${visualTone.softText}`}>Lối vào chính</p>
                          <p className="mt-1 text-lg font-semibold text-slate-900">{primaryLeaf.label}</p>
                          <p className="mt-1 text-sm text-slate-500">{primarySubtab?.label}</p>
                        </div>
                        <ArrowRight className={`h-5 w-5 ${visualTone.softText}`} />
                      </div>
                    </Link>
                  )}

                  <div className="space-y-3">
                    {actionableChildren.map((subtab) => (
                      <div key={subtab.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{subtab.label}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">Nhóm xử lý</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Link to={subtab.path} className={`text-xs font-semibold ${visualTone.softText}`}>
                              Mở tất cả
                            </Link>
                          </div>
                        </div>
                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                          {subtab.grandchildren.slice(0, 4).map((leaf) => (
                            <Link
                              key={leaf.id}
                              to={leaf.path}
                              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-white"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span>{leaf.label}</span>
                                <div className="flex items-center gap-2">
                                  {leaf.badge && (
                                    <Badge className={`border-0 ${visualTone.chipBg} ${visualTone.chipText}`}>
                                      {leaf.badge}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
