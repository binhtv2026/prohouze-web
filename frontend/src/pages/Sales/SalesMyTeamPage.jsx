import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Crown, Medal, Trophy, Users } from 'lucide-react';

const members = [
  { rank: 1, name: 'Nguyễn Minh Quân', role: 'Top 1', score: 96, revenue: '6,8 tỷ' },
  { rank: 2, name: 'Trần Khánh Linh', role: 'Top 2', score: 92, revenue: '5,9 tỷ' },
  { rank: 3, name: 'Phạm Gia Hưng', role: 'Top 3', score: 88, revenue: '5,1 tỷ' },
  { rank: 4, name: 'Bạn', role: 'Vị trí hiện tại', score: 78, revenue: '2,4 tỷ' },
];

const notices = [
  '9h00 sáng mai họp đội bán hàng dự án The Opus One.',
  'Team đang được đẩy mạnh chiến dịch Masteri Grand View đến hết tuần.',
  'Ai chốt booking đầu tiên hôm nay được thưởng nóng thêm 3 triệu.',
];

export default function SalesMyTeamPage() {
  return (
    <div className="space-y-6 p-6" data-testid="sales-my-team-page">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Team</h1>
          <p className="mt-1 text-slate-500">
            Xem ngay ai đang dẫn đội, ai là người quản lý trực tiếp và mình đang đứng ở đâu.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/kpi/leaderboard">
            <Button variant="outline" size="sm">Xem bảng xếp hạng</Button>
          </Link>
          <Link to="/work/reminders">
            <Button size="sm" className="bg-[#316585] hover:bg-[#264f68]">Thông báo từ quản lý</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Thủ lĩnh trực tiếp</CardTitle>
            <CardDescription>Người dẫn đội và quản lý trực tiếp của bạn.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Trưởng nhóm</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">Nguyễn Hoàng Nam</p>
              <p className="text-sm text-slate-600">Theo sát giao dịch, hỗ trợ chốt khách và xử lý booking.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Giám đốc kinh doanh</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">Lê Minh Tâm</p>
              <p className="text-sm text-slate-600">Phụ trách mục tiêu doanh số, chiến dịch và chính sách đẩy bán.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Xếp hạng hiện tại</CardTitle>
            <CardDescription>Biết ngay mình đang đứng thứ mấy trong đội.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-[#316585]/20 bg-[#316585]/[0.05] p-4">
              <p className="text-sm text-slate-500">Vị trí hiện tại</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">#4</p>
              <p className="mt-2 text-sm text-slate-600">Còn thiếu 1 booking chính thức hoặc 650 triệu để vào top 3.</p>
            </div>
            <div className="grid gap-3">
              {members.slice(0, 3).map((member, index) => {
                const Icon = index === 0 ? Crown : index === 1 ? Medal : Trophy;
                return (
                  <div key={member.name} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50">
                        <Icon className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{member.name}</p>
                        <p className="text-sm text-slate-500">{member.role}</p>
                      </div>
                    </div>
                    <Badge className="bg-slate-100 text-slate-700">KPI {member.score}%</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#316585]" />
              Thông báo từ quản lý
            </CardTitle>
            <CardDescription>Những điều đội đang cần xử lý hoặc đang được đẩy mạnh.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {notices.map((notice) => (
              <div key={notice} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                {notice}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#316585]" />
            Thành viên trong nhóm
          </CardTitle>
          <CardDescription>Danh sách hiện tại trong nhóm, thứ hạng và kết quả nổi bật.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {members.map((member) => (
            <div
              key={member.name}
              className={`flex items-center justify-between rounded-2xl border p-4 ${
                member.name === 'Bạn' ? 'border-[#316585]/30 bg-[#316585]/[0.05]' : 'border-slate-200 bg-white'
              }`}
            >
              <div>
                <p className="font-semibold text-slate-900">#{member.rank} - {member.name}</p>
                <p className="text-sm text-slate-500">{member.role}</p>
              </div>
              <div className="text-right">
                <Badge className="bg-slate-100 text-slate-700">KPI {member.score}%</Badge>
                <p className="mt-2 text-sm text-slate-500">{member.revenue}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
