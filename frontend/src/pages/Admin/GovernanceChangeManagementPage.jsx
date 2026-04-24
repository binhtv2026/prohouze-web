import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { governanceFoundationApi } from '@/api/governanceFoundationApi';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Loader2,
  ShieldCheck,
  TimerReset,
} from 'lucide-react';

const priorityStyles = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-amber-100 text-amber-700',
  medium: 'bg-blue-100 text-blue-700',
};

const statusLabels = {
  ban_nhap: 'Bản nháp',
  cho_phe_duyet: 'Chờ phê duyệt',
  dang_ra_soat: 'Đang rà soát',
  can_thuc_hien: 'Cần thực hiện',
  da_ap_dung: 'Đã áp dụng',
};

const DEMO_CHANGE_QUEUE = [
  {
    id: 'change-1',
    priority: 'critical',
    status: 'cho_phe_duyet',
    module: 'Booking & Ngoại lệ',
    title: 'Khóa override giữ chỗ ngoài quota dự án Eastmark',
    impact: 'Nếu chưa khóa đúng policy, sale có thể giữ chỗ vượt quota và làm lệch hàng chờ booking.',
    owner: 'Sales Ops + Finance',
    next_action: 'Rà lại điều kiện quota và trình duyệt ngoại lệ theo chi nhánh.',
  },
  {
    id: 'change-2',
    priority: 'high',
    status: 'ban_nhap',
    module: 'Master data',
    title: 'Chuẩn hóa mã nguồn khách từ Facebook/Zalo/TikTok',
    impact: 'Nguồn khách đang bị trùng mã, gây lệch báo cáo marketing và assignment rule.',
    owner: 'Marketing Operations',
    next_action: 'Chốt danh mục canonical và map các mã cũ về một chuẩn duy nhất.',
  },
  {
    id: 'change-3',
    priority: 'medium',
    status: 'dang_ra_soat',
    module: 'Pháp lý hợp đồng',
    title: 'Bổ sung nhánh rà soát phụ lục cho mẫu hợp đồng sơ cấp',
    impact: 'Hợp đồng điều chỉnh giá đang thiếu nhánh xử lý riêng cho legal và finance.',
    owner: 'Legal',
    next_action: 'Kiểm tra ảnh hưởng tới approval matrix và timeline audit.',
  },
  {
    id: 'change-4',
    priority: 'high',
    status: 'da_ap_dung',
    module: 'Pricing policy',
    title: 'Cập nhật policy chiết khấu chiến dịch mở bán tháng 4',
    impact: 'Sales cần nhìn đúng bảng giá và mức chiết khấu hiện hành để gửi khách ngay.',
    owner: 'Sales Director',
    next_action: 'Theo dõi phản hồi sau triển khai và đối chiếu commission basis.',
  },
];

const QUERY_STATUS_MAP = {
  draft: ['ban_nhap'],
  approved: ['da_ap_dung'],
  pending: ['cho_phe_duyet', 'dang_ra_soat', 'can_thuc_hien'],
};

export default function GovernanceChangeManagementPage() {
  const [searchParams] = useSearchParams();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const routeStatus = searchParams.get('status') || 'all';

  useEffect(() => {
    let active = true;

    const loadQueue = async () => {
      try {
        const data = await governanceFoundationApi.getChangeManagementQueue();
        if (active) {
          setQueue(Array.isArray(data) && data.length > 0 ? data : DEMO_CHANGE_QUEUE);
        }
      } catch (error) {
        console.warn('Governance change management API unavailable.', error);
        if (active) {
          setQueue(DEMO_CHANGE_QUEUE);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadQueue();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => ({
    total: queue.length,
    critical: queue.filter((item) => item.priority === 'critical').length,
    pending: queue.filter((item) => item.status === 'cho_phe_duyet' || item.status === 'can_thuc_hien').length,
  }), [queue]);

  const visibleQueue = useMemo(() => {
    const allowedStatuses = QUERY_STATUS_MAP[routeStatus];
    if (!allowedStatuses) return queue;
    return queue.filter((item) => allowedStatuses.includes(item.status));
  }, [queue, routeStatus]);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="governance-change-management-page">
      <PageHeader
        title="Quản lý thay đổi"
        subtitle="Điều phối thay đổi cấu hình theo thứ tự ưu tiên để triển khai an toàn cho doanh nghiệp bất động sản sơ cấp"
        breadcrumbs={[
          { label: 'Cài đặt', path: '/settings' },
          { label: 'Trung tâm quản trị nền tảng', path: '/settings/governance' },
          { label: 'Quản lý thay đổi', path: '/settings/change-management' },
        ]}
      />

      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Card className="border-slate-200 bg-gradient-to-r from-[#0d1f35] via-[#16314f] to-[#316585] text-white">
          <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge className="bg-white/10 text-white hover:bg-white/10">Triển khai có kiểm soát</Badge>
              <h2 className="mt-4 text-3xl font-bold">Mọi thay đổi quan trọng phải đi qua hàng đợi điều phối</h2>
              <p className="mt-2 text-sm leading-6 text-white/75">
                Từ trạng thái, phê duyệt, booking ngoại lệ tới thay đổi master data sản phẩm sơ cấp,
                tất cả cần có owner, mức độ ưu tiên, tác động và bước xử lý tiếp theo.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/55">Tổng yêu cầu</p>
                <p className="mt-2 text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/55">Ưu tiên rất cao</p>
                <p className="mt-2 text-2xl font-bold">{stats.critical}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/55">Chờ xử lý</p>
                <p className="mt-2 text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin text-[#316585]" />
            Đang tải hàng đợi quản lý thay đổi...
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle>Hàng đợi thay đổi</CardTitle>
              <CardDescription>Danh sách thay đổi phải triển khai theo đúng thứ tự và đúng chủ sở hữu nghiệp vụ.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button asChild variant={routeStatus === 'all' ? 'default' : 'outline'} size="sm" className={routeStatus === 'all' ? 'bg-[#316585] hover:bg-[#274f67]' : ''}>
                  <Link to="/settings/change-management">Tất cả</Link>
                </Button>
                <Button asChild variant={routeStatus === 'pending' ? 'default' : 'outline'} size="sm" className={routeStatus === 'pending' ? 'bg-[#316585] hover:bg-[#274f67]' : ''}>
                  <Link to="/settings/change-management?status=pending">Đang chờ</Link>
                </Button>
                <Button asChild variant={routeStatus === 'draft' ? 'default' : 'outline'} size="sm" className={routeStatus === 'draft' ? 'bg-[#316585] hover:bg-[#274f67]' : ''}>
                  <Link to="/settings/change-management?status=draft">Bản nháp</Link>
                </Button>
                <Button asChild variant={routeStatus === 'approved' ? 'default' : 'outline'} size="sm" className={routeStatus === 'approved' ? 'bg-[#316585] hover:bg-[#274f67]' : ''}>
                  <Link to="/settings/change-management?status=approved">Đã áp dụng</Link>
                </Button>
              </div>

              {visibleQueue.length > 0 ? visibleQueue.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={priorityStyles[item.priority] || priorityStyles.medium}>{item.priority}</Badge>
                    <Badge variant="outline" className="border-slate-200 text-slate-700">
                      {statusLabels[item.status] || item.status}
                    </Badge>
                    <Badge variant="outline" className="border-slate-200 text-slate-700">
                      {item.module}
                    </Badge>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{item.impact}</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Owner</p>
                      <p className="mt-2 text-sm text-slate-700">{item.owner}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Bước tiếp theo</p>
                      <p className="mt-2 text-sm text-slate-700">{item.next_action}</p>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                  <p className="text-sm text-emerald-700">Không có yêu cầu thay đổi nào khớp với bộ lọc hiện tại.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle>Nguyên tắc triển khai</CardTitle>
              <CardDescription>Giữ đúng nhịp triển khai đã duyệt để không làm lệch hệ thống lõi.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { icon: ClipboardList, text: 'Mỗi thay đổi phải chỉ rõ mô-đun, owner, tác động và bước xử lý tiếp theo.' },
                { icon: ShieldCheck, text: 'Thay đổi ảnh hưởng booking, hợp đồng, thanh toán hoặc hoa hồng phải có lớp phê duyệt.' },
                { icon: TimerReset, text: 'Chỉ áp dụng sau khi đối chiếu tác động tới dashboard, báo cáo và quy trình vận hành.' },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <item.icon className="mt-0.5 h-5 w-5 text-[#316585]" />
                  <p className="text-sm leading-6 text-slate-700">{item.text}</p>
                </div>
              ))}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild className="bg-[#316585] hover:bg-[#274f67]">
                  <Link to="/settings/governance-remediation">
                    Đi tới Kế hoạch chuẩn hóa
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/settings/master-data">Đi tới Master Data</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/settings/governance">Quay lại Trung tâm quản trị</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
