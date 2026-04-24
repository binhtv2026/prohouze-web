/**
 * AppSettingsPage.jsx — A7
 * Cài đặt ứng dụng: Thông báo, Giao diện, Bảo mật, Về ứng dụng
 */
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import {
  Bell, ChevronRight, Globe, Lock, LogOut, Moon,
  Shield, Smartphone, Sun, User, Zap, Info, HelpCircle,
  Star, Check,
} from 'lucide-react';

const Toggle = ({ value, onChange }) => (
  <button
    onClick={() => onChange(!value)}
    className={`w-11 h-6 rounded-full transition-all relative ${value ? 'bg-[#316585]' : 'bg-slate-200'}`}
  >
    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all shadow-sm ${value ? 'left-6' : 'left-1'}`} />
  </button>
);

export default function AppSettingsPage() {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState({
    notifDeal: true,
    notifContract: true,
    notifMaintenance: true,
    notifRanking: true,
    notifSystem: false,
    darkMode: false,
    compactView: false,
    language: 'vi',
    twoFA: false,
    biometric: true,
  });

  const set = (key) => (val) => setSettings(prev => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-5 max-w-xl" data-testid="app-settings-page">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#316585]" /> Cài đặt
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Tuỳ chỉnh trải nghiệm ứng dụng</p>
      </div>

      {/* Account Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#316585] to-violet-500 flex items-center justify-center text-white text-xl font-bold">
              {user?.full_name?.[0] || 'U'}
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-900">{user?.full_name || 'Người dùng'}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <Badge className="mt-1 text-[10px] bg-[#316585]/10 text-[#316585] border-0 capitalize">{user?.role || 'sales'}</Badge>
            </div>
            <Button size="sm" variant="outline" className="text-xs gap-1">
              <User className="w-3.5 h-3.5" /> Hồ sơ
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#316585]" /> Thông báo
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100">
          {[
            { key: 'notifDeal', label: 'Deal & khách hàng mới', desc: 'Lead nóng, deal cần xử lý' },
            { key: 'notifContract', label: 'Hợp đồng', desc: 'HĐ sắp hết hạn, cần ký duyệt' },
            { key: 'notifMaintenance', label: 'Bảo trì & sự cố', desc: 'Phân công, cập nhật sự cố' },
            { key: 'notifRanking', label: 'Thi đua & KPI', desc: 'Thay đổi thứ hạng, đạt mục tiêu' },
            { key: 'notifSystem', label: 'Hệ thống', desc: 'Cập nhật app, thông báo quản trị' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-medium text-slate-800">{item.label}</p>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
              <Toggle value={settings[item.key]} onChange={set(item.key)} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Giao diện */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-500" /> Giao diện
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100">
          <div className="flex items-center justify-between py-3 first:pt-0">
            <div>
              <p className="text-sm font-medium text-slate-800">Dark Mode</p>
              <p className="text-xs text-slate-400">Giao diện tối, tiết kiệm pin</p>
            </div>
            <Toggle value={settings.darkMode} onChange={set('darkMode')} />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-slate-800">Chế độ gọn</p>
              <p className="text-xs text-slate-400">Hiển thị nhiều thông tin hơn trên màn hình</p>
            </div>
            <Toggle value={settings.compactView} onChange={set('compactView')} />
          </div>
          <div className="flex items-center justify-between py-3 last:pb-0">
            <div>
              <p className="text-sm font-medium text-slate-800">Ngôn ngữ</p>
              <p className="text-xs text-slate-400">Tiếng Việt</p>
            </div>
            <button className="flex items-center gap-1 text-sm text-[#316585] font-medium">
              <Globe className="w-3.5 h-3.5" /> VI <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Bảo mật */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" /> Bảo mật
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100">
          <div className="flex items-center justify-between py-3 first:pt-0">
            <div>
              <p className="text-sm font-medium text-slate-800">Xác thực 2 lớp (2FA)</p>
              <p className="text-xs text-slate-400">Bảo vệ tài khoản với mã OTP</p>
            </div>
            <Toggle value={settings.twoFA} onChange={set('twoFA')} />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-slate-800">Face ID / Touch ID</p>
              <p className="text-xs text-slate-400">Đăng nhập bằng sinh trắc học</p>
            </div>
            <Toggle value={settings.biometric} onChange={set('biometric')} />
          </div>
          <button className="flex items-center justify-between w-full py-3 last:pb-0 hover:opacity-70">
            <div className="text-left">
              <p className="text-sm font-medium text-slate-800">Đổi mật khẩu</p>
              <p className="text-xs text-slate-400">Cập nhật mật khẩu đăng nhập</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </CardContent>
      </Card>

      {/* Về ứng dụng */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400" /> Về ứng dụng
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100">
          {[
            { icon: Star, label: 'Đánh giá ứng dụng', desc: 'App Store / Google Play' },
            { icon: HelpCircle, label: 'Hỗ trợ & Phản hồi', desc: 'Gửi yêu cầu hỗ trợ' },
            { icon: Smartphone, label: 'Phiên bản', desc: 'ProHouze v2.1.0 (Phase A)' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <button key={i} className="flex items-center justify-between w-full py-3 first:pt-0 last:pb-0 hover:opacity-70">
                <div className="flex items-center gap-2.5 text-left">
                  <Icon className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 gap-2"
        onClick={logout}
      >
        <LogOut className="w-4 h-4" /> Đăng xuất
      </Button>
    </div>
  );
}
