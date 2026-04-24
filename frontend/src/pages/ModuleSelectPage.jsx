/**
 * ModuleSelectPage.jsx
 * Màn hình chọn mảng sau đăng nhập
 * Hiển thị: Sơ cấp | Thứ cấp | Cho thuê
 * Logic: 1 mảng → vào thẳng | nhiều mảng → chọn
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, ArrowRight, Home, RefreshCw, Key } from 'lucide-react';

// ─── Cấu hình 3 module ────────────────────────────────────────────────────────
const MODULES = [
  {
    key: 'primary',
    label: 'Sơ cấp',
    sublabel: 'Môi giới dự án mới',
    description: 'Bán căn hộ, đất nền từ chủ đầu tư. Sơ đồ tầng, giữ chỗ, tư vấn iPad.',
    icon: Building2,
    route: '/sales',
    gradient: 'from-[#1a3a52] to-[#316585]',
    accent: '#316585',
    lightBg: 'bg-blue-50',
    lightText: 'text-blue-700',
    tag: 'PRIMARY',
    features: ['Sơ đồ căn hộ', 'Soft/Hard Booking', 'iPad Presentation', 'KPI & Hoa hồng'],
  },
  {
    key: 'secondary',
    label: 'Thứ cấp',
    sublabel: 'Mua bán & sang nhượng',
    description: 'Ký gửi, đăng tin, định giá và chốt deal mua bán lại bất động sản.',
    icon: RefreshCw,
    route: '/secondary',
    gradient: 'from-[#2d1b69] to-[#7c3aed]',
    accent: '#7c3aed',
    lightBg: 'bg-violet-50',
    lightText: 'text-violet-700',
    tag: 'SECONDARY',
    features: ['Tin đăng bán lại', 'Định giá thứ cấp', 'Deal Pipeline', 'Sang nhượng'],
  },
  {
    key: 'leasing',
    label: 'Cho thuê',
    sublabel: 'Vận hành & quản lý thuê',
    description: 'Hợp đồng thuê, thu tiền, bảo trì, quản lý người thuê và tài sản.',
    icon: Key,
    route: '/leasing',
    gradient: 'from-[#064e3b] to-[#059669]',
    accent: '#059669',
    lightBg: 'bg-emerald-50',
    lightText: 'text-emerald-700',
    tag: 'LEASING',
    features: ['Hợp đồng thuê', 'Thu tiền & HĐ', 'Bảo trì sự cố', 'Quản lý tài sản'],
  },
];

// Mapping role → module được phép
const ROLE_MODULE_MAP = {
  sales:            ['primary'],
  agency:           ['primary'],
  sale_secondary:   ['secondary'],
  leasing_manager:  ['leasing'],
  sale_multi:       ['primary', 'secondary'],
  manager:          ['primary', 'secondary', 'leasing'],
  bod:              ['primary', 'secondary', 'leasing'],
  admin:            ['primary', 'secondary', 'leasing'],
  // fallback: tất cả nếu role không xác định
};

export default function ModuleSelectPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const userRole = user?.role || 'sales';
  const allowedKeys = ROLE_MODULE_MAP[userRole] || ['primary'];
  const allowedModules = MODULES.filter(m => allowedKeys.includes(m.key));

  const isNative = !!(window.Capacitor?.isNativePlatform?.() || window.location.protocol === 'capacitor:');

  // Nếu chỉ có 1 module → redirect thẳng, không cần chọn
  useEffect(() => {
    if (allowedModules.length === 1) {
      if (isNative) {
        sessionStorage.setItem('activeModule', allowedModules[0].key);
        navigate('/app', { replace: true });
      } else {
        navigate(allowedModules[0].route, { replace: true });
      }
    }
  }, [allowedModules, navigate, isNative]);

  // Đang redirect (1 module)
  if (allowedModules.length === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-[#1a3a52]">
        <div className="flex flex-col items-center gap-4 text-white">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center animate-pulse">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <p className="text-sm text-white/60">Đang mở {allowedModules[0].label}...</p>
        </div>
      </div>
    );
  }

  // Handler khi chọn module trên native
  const handleModuleSelect = (mod) => {
    if (isNative) {
      sessionStorage.setItem('activeModule', mod.key);
      navigate('/app', { replace: true });
    } else {
      navigate(mod.route);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0f1f2e] to-slate-900 flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg tracking-tight">ProHouze</h1>
            <p className="text-white/40 text-xs">Hệ thống quản lý bất động sản</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#316585] to-violet-600 flex items-center justify-center text-white text-sm font-bold">
            {user?.full_name?.[0] || 'U'}
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-white text-sm font-medium">{user?.full_name || 'Người dùng'}</p>
            <p className="text-white/40 text-xs capitalize">{userRole}</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">

        {/* Title */}
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Chọn mảng nghiệp vụ
          </h2>
          <p className="text-white/50 text-sm sm:text-base max-w-sm mx-auto">
            Xin chào, <span className="text-white/80 font-medium">{user?.full_name || 'bạn'}</span>.
            Hôm nay bạn muốn làm việc ở mảng nào?
          </p>
        </div>

        {/* Module cards */}
        <div className={`grid gap-4 w-full max-w-4xl ${
          allowedModules.length === 2 ? 'sm:grid-cols-2' :
          allowedModules.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-1 max-w-md'
        }`}>
          {allowedModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.key}
                onClick={() => handleModuleSelect(mod)}
                className="group relative overflow-hidden rounded-2xl text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-white/30"
                data-testid={`module-select-${mod.key}`}
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${mod.gradient} opacity-90 group-hover:opacity-100 transition-opacity`} />

                {/* Decorative circle */}
                <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5 group-hover:bg-white/10 transition-all" />
                <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/5" />

                {/* Content */}
                <div className="relative z-10 p-6">
                  {/* Tag */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-white text-[10px] font-bold tracking-widest mb-4">
                    {mod.tag}
                  </div>

                  {/* Icon + Title */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mb-3 group-hover:bg-white/25 transition-colors">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-white font-bold text-xl">{mod.label}</h3>
                      <p className="text-white/70 text-sm">{mod.sublabel}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors mt-1">
                      <ArrowRight className="w-4 h-4 text-white/70 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-white/60 text-sm leading-relaxed mb-4">
                    {mod.description}
                  </p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-1.5">
                    {mod.features.map(f => (
                      <span
                        key={f}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white/80"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom border glow on hover */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/0 group-hover:bg-white/20 transition-colors" />
              </button>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-white/25 text-xs mt-8 text-center">
          Bạn có thể chuyển mảng bất kỳ lúc nào từ menu chính
        </p>
      </div>
    </div>
  );
}
