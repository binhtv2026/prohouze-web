import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  BarChart3,
  Settings,
  Bot,
  LogOut,
  UserCircle,
  FileText,
  Target,
  Zap,
  ChevronDown,
  ChevronRight,
  Share2,
  Calendar,
  MessageSquare,
  GitBranch,
  Layers,
  Network,
  UserCog,
  HandCoins,
  TrendingUp,
  TrendingDown,
  Receipt,
  FileSignature,
  Calculator,
  PiggyBank,
  DollarSign,
  Coins,
  Banknote,
  CreditCard,
  LineChart,
  Landmark,
  GraduationCap,
  Heart,
  UserPlus,
  CheckSquare,
  ShoppingCart,
  Columns,
  Bell,
  Scale,
  FileCheck,
  ShieldCheck,
  BookOpen,
  Database,
  PieChart,
  TrendingDown as MarketDown,
  Globe,
  Home,
  Package,
  Video,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRoleLabel } from '@/lib/utils';

// 0. Dashboard Tổng quan
const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard Tổng quan', path: '/dashboard', roles: ['bod', 'manager', 'sales', 'marketing', 'admin', 'hr'] },
];

// 1. Tài chính
const financeItems = [
  { icon: LayoutDashboard, label: 'Tổng quan', path: '/finance', roles: ['bod', 'admin', 'manager'] },
  { icon: TrendingUp, label: 'Doanh thu', path: '/finance/revenue', roles: ['bod', 'admin', 'manager'] },
  { icon: TrendingDown, label: 'Chi phí', path: '/finance/expense', roles: ['bod', 'admin', 'manager'] },
  { icon: Coins, label: 'Hoa hồng', path: '/finance/commission', roles: ['bod', 'admin', 'manager', 'sales'] },
  { icon: Banknote, label: 'Lương & Phúc lợi', path: '/finance/salary', roles: ['bod', 'admin'] },
  { icon: Target, label: 'Mục tiêu DS', path: '/finance/sales-target', roles: ['bod', 'admin', 'manager', 'sales'] },
  { icon: Receipt, label: 'Hoá đơn', path: '/finance/invoices', roles: ['bod', 'admin', 'manager'] },
  { icon: FileSignature, label: 'Hợp đồng TC', path: '/finance/contracts', roles: ['bod', 'admin', 'manager', 'sales'] },
  { icon: CreditCard, label: 'Công nợ', path: '/finance/debt', roles: ['bod', 'admin', 'manager'] },
  { icon: Calculator, label: 'Báo cáo Thuế', path: '/finance/tax', roles: ['bod', 'admin'] },
  { icon: PiggyBank, label: 'Ngân sách', path: '/finance/budget', roles: ['bod', 'admin'] },
  { icon: LineChart, label: 'Dự báo', path: '/finance/forecast', roles: ['bod', 'admin', 'manager'] },
  { icon: Landmark, label: 'Tài khoản NH', path: '/finance/bank-accounts', roles: ['bod', 'admin'] },
];

// 2. Bán hàng
const salesItems = [
  { icon: LayoutDashboard, label: 'Tổng quan', path: '/dashboard/sales', roles: ['bod', 'admin', 'manager', 'sales'] },
  { icon: Calendar, label: 'Chiến dịch', path: '/sales/campaigns', roles: ['bod', 'admin', 'manager'] },
  { icon: Target, label: 'Pipeline', path: '/sales/deals', roles: ['bod', 'admin', 'manager', 'sales'] },
  { icon: ShoppingCart, label: 'Booking', path: '/sales/bookings', roles: ['bod', 'admin', 'manager', 'sales'] },
  { icon: FileText, label: 'Hợp đồng', path: '/contracts', roles: ['bod', 'manager', 'sales', 'admin'] },
  { icon: Target, label: 'KPI', path: '/kpi', roles: ['bod', 'manager', 'sales', 'admin'] },
];

// 3. Khách hàng
const customerItems = [
  { icon: LayoutDashboard, label: 'Tổng quan', path: '/dashboard/customers', roles: ['bod', 'admin', 'manager', 'sales'] },
  { icon: Users, label: 'Quản lý Lead', path: '/leads', roles: ['bod', 'manager', 'sales', 'marketing', 'admin'] },
  { icon: UserCircle, label: 'Khách hàng', path: '/customers', roles: ['bod', 'manager', 'sales', 'admin'] },
  { icon: HandCoins, label: 'Cộng tác viên', path: '/collaborators', roles: ['bod', 'admin', 'manager', 'sales'] },
];

// 4. Sản phẩm
const productItems = [
  { icon: LayoutDashboard, label: 'Tổng quan', path: '/dashboard/products', roles: ['bod', 'admin', 'manager', 'sales'] },
  { icon: Building2, label: 'Dự án BĐS', path: '/sales/projects', roles: ['bod', 'admin', 'manager', 'sales'] },
  { icon: Layers, label: 'Quản lý Dự án', path: '/admin/projects', roles: ['bod', 'admin', 'manager'] },
  { icon: Home, label: 'Căn hộ/Nhà', path: '/sales/products', roles: ['bod', 'admin', 'manager', 'sales'] },
  { icon: Package, label: 'Quỹ hàng', path: '/products/inventory', roles: ['bod', 'admin', 'manager'] },
];

// 5. Nhân sự
const hrmItems = [
  { icon: LayoutDashboard, label: 'Tổng quan', path: '/dashboard/hr', roles: ['bod', 'admin', 'hr'] },
  { icon: Network, label: 'Sơ đồ tổ chức', path: '/organization', roles: ['bod', 'admin', 'manager', 'hr'] },
  { icon: Briefcase, label: 'Vị trí công việc', path: '/job-positions', roles: ['bod', 'admin', 'hr'] },
  { icon: FileText, label: 'Hợp đồng LĐ', path: '/hrm/contracts', roles: ['bod', 'admin', 'hr'] },
  { icon: UserPlus, label: 'Tuyển dụng', path: '/hrm/recruitment', roles: ['bod', 'admin', 'hr'] },
  { icon: GraduationCap, label: 'Đào tạo', path: '/hrm/training', roles: ['bod', 'admin', 'hr', 'manager', 'sales'] },
  { icon: MessageSquare, label: 'Tin nhắn', path: '/hrm/messages', roles: ['bod', 'admin', 'hr', 'manager', 'sales', 'marketing'] },
  { icon: Heart, label: 'Văn hóa DN', path: '/hrm/culture', roles: ['bod', 'admin', 'hr', 'manager', 'sales', 'marketing'] },
];

// 6. Pháp lý
const legalItems = [
  { icon: LayoutDashboard, label: 'Tổng quan', path: '/dashboard/legal', roles: ['bod', 'admin'] },
  { icon: Scale, label: 'Hợp đồng pháp lý', path: '/legal/contracts', roles: ['bod', 'admin'] },
  { icon: FileCheck, label: 'Giấy phép & Pháp lý', path: '/legal/licenses', roles: ['bod', 'admin'] },
  { icon: ShieldCheck, label: 'Tuân thủ', path: '/legal/compliance', roles: ['bod', 'admin'] },
  { icon: BookOpen, label: 'Văn bản pháp luật', path: '/legal/regulations', roles: ['bod', 'admin', 'manager'] },
];

// 7. Công việc
const taskItems = [
  { icon: LayoutDashboard, label: 'Tổng quan', path: '/dashboard/tasks', roles: ['bod', 'admin', 'manager', 'sales', 'marketing', 'hr'] },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks', roles: ['bod', 'admin', 'manager', 'sales', 'marketing', 'hr'] },
  { icon: Columns, label: 'Kanban', path: '/tasks/kanban', roles: ['bod', 'admin', 'manager', 'sales', 'marketing', 'hr'] },
  { icon: Calendar, label: 'Calendar', path: '/calendar', roles: ['bod', 'admin', 'manager', 'sales', 'marketing', 'hr'] },
  { icon: Bell, label: 'Reminders', path: '/reminders', roles: ['bod', 'admin', 'manager', 'sales', 'marketing', 'hr'] },
];

// 8. Omnichannel
const omnichannelItems = [
  { icon: LayoutDashboard, label: 'Tổng quan', path: '/dashboard/omnichannel', roles: ['bod', 'marketing', 'admin'] },
  { icon: Share2, label: 'Kênh Marketing', path: '/channels', roles: ['bod', 'marketing', 'admin'] },
  { icon: Calendar, label: 'Content Calendar', path: '/content-calendar', roles: ['bod', 'marketing', 'content', 'admin'] },
  { icon: MessageSquare, label: 'Response Templates', path: '/response-templates', roles: ['bod', 'marketing', 'admin'] },
  { icon: GitBranch, label: 'Phân bổ Lead', path: '/distribution-rules', roles: ['bod', 'admin'] },
];

// 9. Dữ liệu & Phân tích thị trường
const dataItems = [
  { icon: LayoutDashboard, label: 'Tổng quan', path: '/dashboard/data', roles: ['bod', 'admin', 'manager'] },
  { icon: BarChart3, label: 'Báo cáo', path: '/reports', roles: ['bod', 'admin', 'manager'] },
  { icon: PieChart, label: 'Phân tích kinh doanh', path: '/data/analytics', roles: ['bod', 'admin', 'manager'] },
  { icon: Globe, label: 'Phân tích thị trường', path: '/data/market', roles: ['bod', 'admin', 'manager'] },
  { icon: TrendingUp, label: 'Xu hướng BĐS', path: '/data/trends', roles: ['bod', 'admin', 'manager'] },
  { icon: Database, label: 'Quản lý dữ liệu', path: '/data/management', roles: ['bod', 'admin'] },
];

// 10. AI & Automation
const automationItems = [
  { icon: LayoutDashboard, label: 'Master Overview', path: '/admin/overview', roles: ['bod', 'admin'] },
  { icon: Zap, label: 'Automation Rules', path: '/automation', roles: ['bod', 'marketing', 'admin'] },
  { icon: Bot, label: 'AI Assistant', path: '/ai-assistant', roles: ['bod', 'manager', 'sales', 'marketing', 'admin'] },
  { icon: Video, label: 'Video Editor', path: '/admin/video-editor', roles: ['bod', 'admin', 'marketing', 'content'] },
  { icon: Settings, label: 'Cài đặt', path: '/settings', roles: ['bod', 'admin'] },
];

// 11. Admin Content Management
import { Newspaper, Quote, Building2 as Partners, Briefcase as Jobs } from 'lucide-react';

const adminContentItems = [
  { icon: Building2, label: 'Quản lý Dự án', path: '/admin/projects', roles: ['bod', 'admin', 'marketing'] },
  { icon: Briefcase, label: 'Quản lý Tuyển dụng', path: '/admin/careers', roles: ['bod', 'admin', 'hr'] },
  { icon: FileText, label: 'Quản lý Tin tức', path: '/admin/news', roles: ['bod', 'admin', 'marketing', 'content'] },
  { icon: Users, label: 'Quản lý Đánh giá', path: '/admin/testimonials', roles: ['bod', 'admin', 'marketing'] },
  { icon: Layers, label: 'Quản lý Đối tác', path: '/admin/partners', roles: ['bod', 'admin'] },
  { icon: BarChart3, label: 'Content Analytics', path: '/admin/content-analytics', roles: ['bod', 'admin', 'marketing'] },
  { icon: Bell, label: 'Thông báo & Newsletter', path: '/admin/notifications', roles: ['bod', 'admin', 'hr', 'marketing'] },
];

export default function Sidebar() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [financeOpen, setFinanceOpen] = useState(false);
  const [salesOpen, setSalesOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [hrmOpen, setHrmOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [omnichannelOpen, setOmnichannelOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);
  const [automationOpen, setAutomationOpen] = useState(false);
  const [adminContentOpen, setAdminContentOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredMenu = menuItems.filter(item => hasRole(item.roles));
  const filteredFinance = financeItems.filter(item => hasRole(item.roles));
  const filteredSales = salesItems.filter(item => hasRole(item.roles));
  const filteredCustomer = customerItems.filter(item => hasRole(item.roles));
  const filteredProduct = productItems.filter(item => hasRole(item.roles));
  const filteredHrm = hrmItems.filter(item => hasRole(item.roles));
  const filteredLegal = legalItems.filter(item => hasRole(item.roles));
  const filteredTask = taskItems.filter(item => hasRole(item.roles));
  const filteredOmnichannel = omnichannelItems.filter(item => hasRole(item.roles));
  const filteredData = dataItems.filter(item => hasRole(item.roles));
  const filteredAutomation = automationItems.filter(item => hasRole(item.roles));
  const filteredAdminContent = adminContentItems.filter(item => hasRole(item.roles));

  const renderSection = (title, icon, items, isOpen, setIsOpen, testId) => {
    if (items.length === 0) return null;
    
    const Icon = icon;
    return (
      <div className="mt-3 px-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          data-testid={testId}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
        >
          <Icon className="w-4 h-4" />
          <span className="flex-1 text-left">{title}</span>
          <ChevronRight className={cn("w-4 h-4 transition-transform", isOpen && "rotate-90")} />
        </button>
        {isOpen && (
          <ul className="space-y-0.5 mt-1">
            {items.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  data-testid={`nav-${item.path.replace(/\//g, '-')}`}
                  className={({ isActive }) =>
                    cn(
                      'sidebar-item flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                      isActive
                        ? 'bg-[#316585]/30 text-white border-l-[3px] border-[#316585] -ml-[3px]'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    )
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-slate-200 z-50 flex flex-col shadow-xl">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#316585] flex items-center justify-center">
            <svg viewBox="0 0 40 40" className="w-6 h-6 text-white">
              <path
                fill="currentColor"
                d="M20 4L4 14v22h32V14L20 4zm0 4l12 8v16H8V16l12-8zm-4 10v8h8v-8h-8z"
              />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-lg text-white tracking-tight">ProHouze</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-400">Real Estate CRM</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {/* 0. Dashboard Tổng quan */}
        <ul className="space-y-1 px-3">
          {filteredMenu.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                data-testid={`nav-${item.path.replace('/', '')}`}
                className={({ isActive }) =>
                  cn(
                    'sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                    isActive
                      ? 'bg-[#316585]/30 text-white border-l-[3px] border-[#316585] -ml-[3px]'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* 1. Tài chính */}
        {renderSection('Tài chính', DollarSign, filteredFinance, financeOpen, setFinanceOpen, 'nav-finance-toggle')}

        {/* 2. Bán hàng */}
        {renderSection('Bán hàng', ShoppingCart, filteredSales, salesOpen, setSalesOpen, 'nav-sales-toggle')}

        {/* 3. Khách hàng */}
        {renderSection('Khách hàng', Users, filteredCustomer, customerOpen, setCustomerOpen, 'nav-customer-toggle')}

        {/* 4. Sản phẩm */}
        {renderSection('Sản phẩm', Package, filteredProduct, productOpen, setProductOpen, 'nav-product-toggle')}

        {/* 5. Nhân sự */}
        {renderSection('Nhân sự', UserCog, filteredHrm, hrmOpen, setHrmOpen, 'nav-hrm-toggle')}

        {/* 6. Pháp lý */}
        {renderSection('Pháp lý', Scale, filteredLegal, legalOpen, setLegalOpen, 'nav-legal-toggle')}

        {/* 7. Công việc */}
        {renderSection('Công việc', CheckSquare, filteredTask, taskOpen, setTaskOpen, 'nav-task-toggle')}

        {/* 8. Omnichannel */}
        {renderSection('Omnichannel', Layers, filteredOmnichannel, omnichannelOpen, setOmnichannelOpen, 'nav-omnichannel-toggle')}

        {/* 9. Dữ liệu & Phân tích */}
        {renderSection('Dữ liệu & Phân tích', BarChart3, filteredData, dataOpen, setDataOpen, 'nav-data-toggle')}

        {/* 10. AI & Automation */}
        {renderSection('AI & Automation', Zap, filteredAutomation, automationOpen, setAutomationOpen, 'nav-automation-toggle')}

        {/* 11. Admin Content */}
        {renderSection('Quản lý Nội dung', FileText, filteredAdminContent, adminContentOpen, setAdminContentOpen, 'nav-admin-content-toggle')}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-slate-700/50">
        <button
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-[#316585] flex items-center justify-center font-semibold text-white">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-400 truncate">{getRoleLabel(user?.role)}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </button>
        <button
          onClick={handleLogout}
          className="mt-2 w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
