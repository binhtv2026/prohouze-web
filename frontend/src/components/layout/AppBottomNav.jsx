/**
 * AppBottomNav.jsx — Premium Arc FAB Menu
 * Items tỏa ra hình cung từ FAB · Arc decoration · Spring animation
 * Design: iOS-native feel, WOW-level first impression
 */
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Building2, Users, User, Flame,
  TrendingUp, CheckSquare, BarChart3, Plus,
  UserPlus, Calendar, FileText, Share2,
  Megaphone, UserCog, PenTool, Scale, Wallet,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ROLES } from '@/config/navigation';

// ──────────────────── Nav Configs ────────────────────────────────────────────
const NAV_CONFIGS = {
  [ROLES.SALES]: {
    accent: '#316585',
    hasFab: true,
    tabs: [
      { id: 'home',      label: 'Home',     icon: Home,      path: '/app' },
      { id: 'products',  label: 'Sản phẩm', icon: Building2, path: '/sales/catalog' },
      { id: '__fab__',   label: '',          icon: null,      path: null },
      { id: 'customers', label: 'Khách',     icon: Users,     path: '/crm/contacts' },
      { id: 'me',        label: 'Tôi',       icon: User,      path: '/profile' },
    ],
    fabOptions: [
      { icon: UserPlus, label: 'Thêm khách', path: '/crm/contacts/new',   color: ['#f59e0b','#ef4444'] },
      { icon: FileText, label: 'Giữ chỗ',   path: '/sales/bookings',     color: ['#8b5cf6','#6366f1'] },
      { icon: Calendar, label: 'Lịch hẹn',  path: '/work/calendar',      color: ['#06b6d4','#3b82f6'] },
    ],
  },
  [ROLES.AGENCY]: {
    accent: '#0369a1',
    hasFab: true,
    tabs: [
      { id: 'home',     label: 'Home',    icon: Home,  path: '/app' },
      { id: 'products', label: 'Sản phẩm',icon: Flame, path: '/sales/catalog' },
      { id: '__fab__',  label: '',         icon: null,  path: null },
      { id: 'referred', label: 'Khách GT', icon: Users, path: '/crm/contacts' },
      { id: 'me',       label: 'Tôi',      icon: User,  path: '/profile' },
    ],
    fabOptions: [
      { icon: UserPlus, label: 'Giới thiệu', path: '/crm/contacts/new',      color: ['#f59e0b','#ef4444'] },
      { icon: Share2,   label: 'Chia sẻ',    path: '/sales/catalog',          color: ['#8b5cf6','#6366f1'] },
      { icon: FileText, label: 'Mã GT',      path: '/recruitment/referral',   color: ['#10b981','#06b6d4'] },
    ],
  },
  [ROLES.PROJECT_DIRECTOR]: {
    accent: '#7c3aed', hasFab: false,
    tabs: [
      { id: 'home', label: 'Home', icon: Home, path: '/app' },
      { id: 'team', label: 'Đội Sales', icon: Users, path: '/kpi/team' },
      { id: 'approvals', label: 'Duyệt', icon: CheckSquare, path: '/sales/bookings?status=pending', badge: true },
      { id: 'reports', label: 'Báo cáo', icon: BarChart3, path: '/analytics/reports' },
      { id: 'me', label: 'Tôi', icon: User, path: '/profile' },
    ],
  },
  [ROLES.MANAGER]: {
    accent: '#1d4ed8', hasFab: true,
    tabs: [
      { id: 'home',      label: 'Home',      icon: Home,        path: '/app' },
      { id: 'catalog',   label: 'Sản phẩm',  icon: Building2,   path: '/sales/catalog' },
      { id: 'team',      label: 'Đội nhóm',  icon: Users,       path: '/kpi/team' },
      { id: 'approvals', label: 'Duyệt',     icon: CheckSquare, path: '/app/approvals', badge: true },
      { id: 'me',        label: 'Tôi',        icon: User,        path: '/profile' },
    ],
  },
  [ROLES.BOD]: {
    accent: '#be185d', hasFab: false,
    tabs: [
      { id: 'home',      label: 'Home',     icon: Home,        path: '/app' },
      { id: 'approvals', label: 'Duyệt',    icon: CheckSquare, path: '/app/approvals', badge: true },
      { id: 'analytics', label: 'Báo cáo',  icon: BarChart3,   path: '/analytics/executive' },
      { id: 'team',      label: 'Đội nhóm', icon: Users,       path: '/kpi/team' },
      { id: 'me',        label: 'Tôi',      icon: User,        path: '/profile' },
    ],
  },

  [ROLES.SALES_SUPPORT]: {
    accent: '#0891b2', hasFab: false,
    tabs: [
      { id: 'home', label: 'Home', icon: Home, path: '/app' },
      { id: 'bookings', label: 'Hồ sơ', icon: FileText, path: '/sales/bookings' },
      { id: 'customers', label: 'Khách', icon: Users, path: '/crm/contacts' },
      { id: 'calendar', label: 'Lịch', icon: Calendar, path: '/work/calendar' },
      { id: 'me', label: 'Tôi', icon: User, path: '/profile' },
    ],
  },
  [ROLES.AUDIT]: {
    accent: '#374151', hasFab: false,
    tabs: [
      { id: 'home', label: 'Home', icon: Home, path: '/app' },
      { id: 'finance', label: 'Tài chính', icon: TrendingUp, path: '/audit/finance' },
      { id: 'hr', label: 'Nhân sự', icon: Users, path: '/audit/hr' },
      { id: 'reports', label: 'Báo cáo', icon: BarChart3, path: '/audit/reports' },
      { id: 'me', label: 'Tôi', icon: User, path: '/profile' },
    ],
  },
  [ROLES.ADMIN]: {
    accent: '#374151', hasFab: false,
    tabs: [
      { id: 'home', label: 'Home', icon: Home, path: '/app' },
      { id: 'reports', label: 'Báo cáo', icon: BarChart3, path: '/analytics/reports' },
      { id: 'approvals', label: 'Duyệt', icon: CheckSquare, path: '/admin' },
      { id: 'me', label: 'Tôi', icon: User, path: '/profile' },
    ],
  },

  // ── Marketing ─────────────────────────────────
  [ROLES.MARKETING]: {
    accent: '#db2777', hasFab: false,
    tabs: [
      { id: 'home',      label: 'Home',     icon: Home,       path: '/app' },
      { id: 'content',   label: 'Nội dung', icon: PenTool,    path: '/cms/articles' },
      { id: 'analytics', label: 'Analytics',icon: BarChart3,  path: '/analytics/content' },
      { id: 'calendar',  label: 'Lịch',     icon: Calendar,   path: '/work/calendar' },
      { id: 'me',        label: 'Tôi',      icon: User,       path: '/profile' },
    ],
  },

  // ── HR / Nhân sự ─────────────────────────────
  [ROLES.HR]: {
    accent: '#0891b2', hasFab: false,
    tabs: [
      { id: 'home',       label: 'Home',     icon: Home,       path: '/app' },
      { id: 'team',       label: 'Nhân sự',  icon: Users,      path: '/kpi/team' },
      { id: 'recruitment',label: 'Tuyển dụng',icon: UserCog,  path: '/app/recruitment' },
      { id: 'reports',    label: 'Báo cáo',  icon: BarChart3,  path: '/analytics/reports' },
      { id: 'me',         label: 'Tôi',      icon: User,       path: '/profile' },
    ],
  },

  // ── Content / Website ─────────────────────────
  [ROLES.CONTENT]: {
    accent: '#7c3aed', hasFab: false,
    tabs: [
      { id: 'home',    label: 'Home',    icon: Home,      path: '/app' },
      { id: 'news',    label: 'Tin tức', icon: FileText,  path: '/cms/news' },
      { id: 'media',   label: 'Media',   icon: PenTool,   path: '/cms/media' },
      { id: 'calendar',label: 'Lịch',   icon: Calendar,  path: '/work/calendar' },
      { id: 'me',      label: 'Tôi',    icon: User,      path: '/profile' },
    ],
  },

  // ── Legal / Pháp lý ──────────────────────────
  [ROLES.LEGAL]: {
    accent: '#92400e', hasFab: false,
    tabs: [
      { id: 'home',     label: 'Home',    icon: Home,       path: '/app' },
      { id: 'bookings', label: 'Hồ sơ',  icon: FileText,   path: '/sales/bookings' },
      { id: 'approvals',label: 'Duyệt',  icon: CheckSquare, path: '/app/approvals' },
      { id: 'calendar', label: 'Lịch',   icon: Calendar,   path: '/work/calendar' },
      { id: 'me',       label: 'Tôi',    icon: User,       path: '/profile' },
    ],
  },

  // ── Finance / Kế toán ────────────────────────
  [ROLES.FINANCE]: {
    accent: '#15803d', hasFab: false,
    tabs: [
      { id: 'home',     label: 'Home',    icon: Home,      path: '/app' },
      { id: 'income',   label: 'Thu chi', icon: Wallet,    path: '/finance/my-income' },
      { id: 'reports',  label: 'Báo cáo', icon: BarChart3, path: '/analytics/reports' },
      { id: 'calendar', label: 'Lịch',   icon: Calendar,  path: '/work/calendar' },
      { id: 'me',       label: 'Tôi',    icon: User,      path: '/profile' },
    ],
  },
};

const HIDDEN_PREFIXES = ['/login', '/register', '/select-module', '/home', '/du-an', '/workspace', '/dashboard', '/admin/settings'];

function isTabActive(tab, pathname) {
  if (tab.id === 'home') return pathname === '/app' || pathname === '/app/';
  if (!tab.path) return false;
  return pathname.startsWith(tab.path.split('?')[0]);
}

// ──────────────────── Arc position calculator ─────────────────────────────────
function getArcPositions(count, radius = 112) {
  if (count === 0) return [];
  if (count === 1) return [{ x: 0, y: -radius }];
  // Fan from -150° to -30° (left to right, above FAB)
  const start = -150, end = -30;
  return Array.from({ length: count }, (_, i) => {
    const deg = start + (i * (end - start)) / (count - 1);
    const rad = (deg * Math.PI) / 180;
    return { x: Math.cos(rad) * radius, y: Math.sin(rad) * radius };
  });
}

// ──────────────────── Arc FAB Menu ───────────────────────────────────────────
function FabMenu({ options, onClose, onSelect }) {
  const positions = getArcPositions(options.length, 120);
  const FAB_BOTTOM = 38; // px from bottom of viewport to center of FAB

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        style={{
          background: 'rgba(0,0,0,0.62)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          animation: 'fadeIn 0.18s ease forwards',
        }}
      />

      {/* ── Arc container anchored to FAB center ── */}
      <div
        className="fixed z-50 pointer-events-none"
        style={{ bottom: FAB_BOTTOM, left: '50%', transform: 'translateX(-50%)' }}
      >
        {/* Decorative arc curves — drawn as SVG centered on FAB */}
        <svg
          width="340" height="180"
          style={{ position: 'absolute', left: -170, bottom: -28, overflow: 'visible' }}
          aria-hidden="true"
        >
          {/* Outer arc */}
          <path
            d="M 25 160 Q 170 -30 315 160"
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Inner arc */}
          <path
            d="M 55 160 Q 170 10 285 160"
            fill="none"
            stroke="rgba(255,255,255,0.10)"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </svg>

        {/* ── Items ── */}
        {options.map((opt, i) => {
          const { x, y } = positions[i];
          const Icon = opt.icon;
          const [c1, c2] = opt.color;
          const delay = i * 0.07;

          return (
            <button
              key={opt.label}
              className="pointer-events-auto flex flex-col items-center gap-1.5 active:scale-90"
              onClick={() => onSelect(opt.path)}
              style={{
                position: 'absolute',
                // center the 64px bubble on this arc point
                left: x - 32,
                top: y - 42,  // y is negative = upward from FAB
                animation: `arcItemIn 0.38s cubic-bezier(0.34,1.56,0.64,1) ${delay}s both`,
              }}
            >
              {/* Bubble */}
              <div
                style={{
                  width: 64, height: 64,
                  borderRadius: 20,
                  background: `linear-gradient(135deg, ${c1}, ${c2})`,
                  boxShadow: `0 8px 24px ${c1}55, 0 2px 8px rgba(0,0,0,0.2)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Icon style={{ width: 26, height: 26, color: '#fff' }} strokeWidth={2} />
              </div>

              {/* Label */}
              <span
                style={{
                  fontSize: 11, fontWeight: 700, color: '#fff',
                  textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                  whiteSpace: 'nowrap',
                  letterSpacing: '-0.2px',
                }}
              >
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes fadeIn     { from { opacity: 0 } to { opacity: 1 } }
        @keyframes arcItemIn  {
          from { opacity: 0; transform: scale(0.4) translateY(20px); }
          to   { opacity: 1; transform: scale(1)   translateY(0px); }
        }
      `}</style>
    </>
  );
}

// ──────────────────── MAIN ───────────────────────────────────────────────────
export default function AppBottomNav() {
  const { user }       = useAuth();
  const { pathname }   = useLocation();
  const navigate       = useNavigate();
  const [fabOpen, setFabOpen] = useState(false);
  const [pendingCount]        = useState(0);

  const shouldHide = HIDDEN_PREFIXES.some(p => pathname.startsWith(p)) || pathname === '/';
  if (shouldHide || !user?.role) return null;

  const cfg = NAV_CONFIGS[user.role] || NAV_CONFIGS[ROLES.ADMIN];
  const { accent, hasFab, tabs, fabOptions } = cfg;

  const handleSelect = (path) => { setFabOpen(false); navigate(path); };

  return (
    <>
      {fabOpen && hasFab && (
        <FabMenu options={fabOptions} onClose={() => setFabOpen(false)} onSelect={handleSelect} />
      )}

      {/* Spacer */}
      <div style={{ height: 80, flexShrink: 0 }} />

      {/* ── Bottom Nav Bar ── */}
      <nav
        className="fixed bottom-0 left-0 right-0"
        style={{
          zIndex: 9999, // Đảm bảo nổi lên trên tất cả (Copilot, Charts, v.v.)
          background: 'rgba(255,255,255,0.98)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          borderTop: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.12)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          pointerEvents: 'auto', // Đảm bảo luôn nhận click
        }}
      >
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-around',
            height: 60, paddingLeft: 8, paddingRight: 8, maxWidth: 480, margin: '0 auto',
          }}
        >
          {tabs.map((tab) => {

            // ── FAB slot ──────────────────────────────────────────────────────
            if (tab.id === '__fab__') {
              return (
                <div key="fab" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: -22 }}>
                  <button
                    onClick={() => setFabOpen(v => !v)}
                    aria-label="Thêm mới"
                    style={{
                      width: 56, height: 56, borderRadius: 18,
                      background: fabOpen
                        ? 'linear-gradient(135deg,#1e293b,#334155)'
                        : `linear-gradient(135deg,${accent},${accent}bb)`,
                      boxShadow: fabOpen
                        ? '0 6px 24px rgba(0,0,0,0.4)'
                        : `0 6px 24px ${accent}60, 0 2px 8px rgba(0,0,0,0.15)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: 'none', cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                    }}
                  >
                    <div style={{
                      transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                      transform: fabOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                    }}>
                      <Plus style={{ width: 28, height: 28, color: '#fff' }} strokeWidth={2.5} />
                    </div>
                  </button>
                </div>
              );
            }

            // ── Normal Tab ────────────────────────────────────────────────────
            const Icon   = tab.icon;
            const active = isTabActive(tab, pathname);
            return (
              <button
                key={tab.id}
                id={`bottom-nav-${tab.id}`}
                onClick={() => { setFabOpen(false); navigate(tab.path); }}
                aria-label={tab.label}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  minWidth: 52, padding: '6px 0 4px',
                  border: 'none', background: 'none', cursor: 'pointer',
                  position: 'relative', transition: 'transform 0.15s',
                }}
              >
                {/* Pill highlight */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 14,
                  width: active ? 44 : 32,
                  height: 28,
                  background: active ? `${accent}1A` : 'transparent',
                  transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                }}>
                  <Icon
                    style={{
                      width: active ? 22 : 20,
                      height: active ? 22 : 20,
                      color: active ? accent : '#94a3b8',
                      strokeWidth: active ? 2.4 : 1.8,
                      transition: 'all 0.2s',
                    }}
                  />
                </div>

                {/* Label */}
                <span style={{
                  fontSize: active ? 10.5 : 10,
                  fontWeight: active ? 700 : 500,
                  color: active ? accent : '#94a3b8',
                  lineHeight: 1,
                  transition: 'all 0.2s',
                  letterSpacing: active ? '-0.2px' : 0,
                }}>
                  {tab.label}
                </span>

                {/* Notification badge */}
                {tab.badge && pendingCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 4, right: 4,
                    minWidth: 16, height: 16, borderRadius: 8,
                    background: '#ef4444', color: '#fff',
                    fontSize: 9, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 3px', border: '2px solid white',
                  }}>
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
