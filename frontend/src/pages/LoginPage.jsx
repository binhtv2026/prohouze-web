import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEMO_ACCOUNTS, useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Building2, ChevronRight, Loader2, Zap } from 'lucide-react';
import { DEFAULT_DASHBOARD, ROLES } from '@/config/navigation';
import { getRoleLabel } from '@/lib/utils';

// ─── Role colours ──────────────────────────────────────────────────────────────
const ROLE_ACCENT = {
  [ROLES.ADMIN]:            { dot: 'bg-slate-500',   pill: 'bg-slate-100 text-slate-600',   emoji: '⚙️' },
  [ROLES.AUDIT]:            { dot: 'bg-slate-700',   pill: 'bg-slate-100 text-slate-700',   emoji: '🔍' },
  [ROLES.BOD]:              { dot: 'bg-pink-500',    pill: 'bg-pink-50 text-pink-700',      emoji: '👔' },
  [ROLES.PROJECT_DIRECTOR]: { dot: 'bg-violet-500',  pill: 'bg-violet-50 text-violet-700',  emoji: '🏗️' },
  [ROLES.MANAGER]:          { dot: 'bg-blue-500',    pill: 'bg-blue-50 text-blue-700',      emoji: '📊' },
  [ROLES.SALES]:            { dot: 'bg-[#316585]',   pill: 'bg-[#316585]/10 text-[#316585]',emoji: '💼' },
  [ROLES.SALES_SUPPORT]:    { dot: 'bg-cyan-500',    pill: 'bg-cyan-50 text-cyan-700',      emoji: '🗂️' },
  [ROLES.MARKETING]:        { dot: 'bg-orange-500',  pill: 'bg-orange-50 text-orange-700',  emoji: '📣' },
  [ROLES.FINANCE]:          { dot: 'bg-green-500',   pill: 'bg-green-50 text-green-700',    emoji: '💰' },
  [ROLES.HR]:               { dot: 'bg-purple-500',  pill: 'bg-purple-50 text-purple-700',  emoji: '👥' },
  [ROLES.LEGAL]:            { dot: 'bg-amber-500',   pill: 'bg-amber-50 text-amber-700',    emoji: '⚖️' },
  [ROLES.CONTENT]:          { dot: 'bg-teal-500',    pill: 'bg-teal-50 text-teal-700',      emoji: '✍️' },
  [ROLES.AGENCY]:           { dot: 'bg-sky-500',     pill: 'bg-sky-50 text-sky-700',        emoji: '🤝' },
};
const DEFAULT_ACCENT = { dot: 'bg-slate-400', pill: 'bg-slate-100 text-slate-600', emoji: '👤' };

// Thứ tự ưu tiên hiển thị (quan trọng lên trên)
const PRIORITY_ROLES = [ROLES.BOD, ROLES.MANAGER, ROLES.SALES, ROLES.ADMIN, ROLES.MARKETING, ROLES.FINANCE, ROLES.HR, ROLES.LEGAL];

export default function LoginPage() {
  const [loadingId, setLoadingId] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const allAccounts = Object.values(DEMO_ACCOUNTS).sort((a, b) => {
    const ai = PRIORITY_ROLES.indexOf(a.role);
    const bi = PRIORITY_ROLES.indexOf(b.role);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const handleQuickLogin = async (account) => {
    if (loadingId) return;
    setLoadingId(account.id);
    try {
      const userData = await login(account.email, 'admin123');
      toast.success(`👋 Xin chào ${account.full_name}!`);
      const role = userData?.role || account.role;
      navigate(DEFAULT_DASHBOARD[role] || '/app');
    } catch {
      toast.error('Không thể đăng nhập, thử lại.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex flex-col items-center justify-start py-10 px-4">

      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-[#316585] flex items-center justify-center mb-4 shadow-lg shadow-[#316585]/30">
          <Building2 className="w-9 h-9 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">ProHouze</h1>
        <p className="text-slate-500 text-sm mt-1">Nền tảng phân phối BĐS Sơ cấp</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <div className="flex-1 h-px bg-slate-100" />
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            <p className="text-sm font-bold text-slate-600">Chọn vai trò để vào hệ thống</p>
          </div>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        {/* Account list */}
        <div className="space-y-2">
          {allAccounts.map((account) => {
            const accent = ROLE_ACCENT[account.role] || DEFAULT_ACCENT;
            const isLoading = loadingId === account.id;
            const anyLoading = loadingId !== null;

            return (
              <button
                key={account.id}
                onClick={() => handleQuickLogin(account)}
                disabled={anyLoading}
                className={`w-full flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-150
                  active:scale-[0.98] disabled:opacity-60
                  ${isLoading
                    ? 'border-[#316585]/40 bg-[#316585]/5 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-[#316585]/40 hover:bg-slate-50 hover:shadow-md cursor-pointer'
                  }`}
              >
                {/* Role colour dot */}
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${accent.dot}`} />

                {/* Name + position */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 leading-tight">{account.full_name}</p>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {account.position || getRoleLabel(account.role)}
                    {account.branch_name ? ` · ${account.branch_name}` : ''}
                  </p>
                </div>

                {/* Role pill */}
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${accent.pill}`}>
                  {accent.emoji} {getRoleLabel(account.role)}
                </span>

                {/* Arrow / spinner */}
                <div className="flex-shrink-0 w-5 flex items-center justify-center">
                  {isLoading
                    ? <Loader2 className="w-4 h-4 animate-spin text-[#316585]" />
                    : <ChevronRight className="w-4 h-4 text-slate-300" />
                  }
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-center text-xs text-slate-400 mt-6">
        © 2026 ProHouze · Nền tảng phân phối BĐS Sơ cấp
      </p>
    </div>
  );
}
