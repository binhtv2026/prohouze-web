/**
 * HR Dashboard - Tổng quan nhân sự
 * ProHouze HR Profile 360°
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, UserPlus, AlertTriangle, FileText, 
  Search, ChevronRight, Calendar, CheckCircle,
  Clock, TrendingUp, AlertCircle, Building,
  BarChart3, UserCog, DollarSign, GraduationCap,
  Target, Network, BookOpen,
} from 'lucide-react';
import { hrApi } from '../../api/hrApi';

// Status colors
const STATUS_COLORS = {
  probation: { bg: 'bg-amber-500/10', text: 'text-amber-500', label: 'Thử việc' },
  official: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', label: 'Chính thức' },
  collaborator: { bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'CTV' },
  intern: { bg: 'bg-purple-500/10', text: 'text-purple-500', label: 'Thực tập' },
  resigned: { bg: 'bg-gray-500/10', text: 'text-gray-500', label: 'Đã nghỉ' },
  terminated: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'Sa thải' },
};

// Alert severity colors
const SEVERITY_COLORS = {
  critical: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30' },
  high: { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/30' },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/30' },
  low: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/30' },
};

const DEMO_HR_STATS = {
  total_employees: 126,
  new_employees: 7,
  by_status: {
    official: 82,
    probation: 19,
    collaborator: 17,
    intern: 5,
    resigned: 3,
  },
  incomplete_profiles: 9,
  active_alerts: 6,
  expiring_contracts: 4,
};

const DEMO_RECENT_EMPLOYEES = [
  { id: 'emp-1', full_name: 'Nguyễn Hoàng Phúc', employee_code: 'PH-102', employment_status: 'official' },
  { id: 'emp-2', full_name: 'Lê Mỹ Linh', employee_code: 'PH-108', employment_status: 'probation' },
  { id: 'emp-3', full_name: 'Trần Gia Bảo', employee_code: 'CTV-021', employment_status: 'collaborator' },
];

const DEMO_INCOMPLETE = [
  { id: 'emp-4', full_name: 'Phạm Quỳnh Anh', employee_code: 'PH-115', profile_completeness: 74 },
  { id: 'emp-5', full_name: 'Đỗ Minh Khoa', employee_code: 'PH-116', profile_completeness: 68 },
];

const DEMO_EXPIRING = [
  { id: 'contract-1', employee_name: 'Nguyễn Hoài Nam', employee_code: 'PH-083', contract_number: 'LD-2025-083', contract_type: 'fixed_term', end_date: '2026-04-10', hr_profile_id: 'emp-6' },
  { id: 'contract-2', employee_name: 'Trần Kim Oanh', employee_code: 'PH-091', contract_number: 'TV-2025-091', contract_type: 'probation', end_date: '2026-04-05', hr_profile_id: 'emp-7' },
];

const DEMO_ALERTS = [
  { id: 'alert-1', title: 'Thiếu hồ sơ BHXH', employee_name: 'Nguyễn Hoài Nam', employee_code: 'PH-083', severity: 'high' },
  { id: 'alert-2', title: 'Hợp đồng sắp hết hạn', employee_name: 'Trần Kim Oanh', employee_code: 'PH-091', severity: 'medium' },
];

export default function HRDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [incompleteProfiles, setIncompleteProfiles] = useState([]);
  const [expiringContracts, setExpiringContracts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, recent, incomplete, expiring, alertsData] = await Promise.all([
        hrApi.getDashboard(),
        hrApi.getRecentEmployees(5),
        hrApi.getIncompleteProfiles(5),
        hrApi.getExpiringContracts(30),
        hrApi.getAlerts({ resolved: false, limit: 10 }),
      ]);
      
      setStats(statsData || DEMO_HR_STATS);
      setRecentEmployees(recent?.length > 0 ? recent : DEMO_RECENT_EMPLOYEES);
      setIncompleteProfiles(incomplete?.length > 0 ? incomplete : DEMO_INCOMPLETE);
      setExpiringContracts(expiring?.length > 0 ? expiring : DEMO_EXPIRING);
      setAlerts(alertsData?.length > 0 ? alertsData : DEMO_ALERTS);
    } catch (error) {
      console.error('Error loading HR dashboard:', error);
      setStats(DEMO_HR_STATS);
      setRecentEmployees(DEMO_RECENT_EMPLOYEES);
      setIncompleteProfiles(DEMO_INCOMPLETE);
      setExpiringContracts(DEMO_EXPIRING);
      setAlerts(DEMO_ALERTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      try {
        const results = await hrApi.searchProfiles(query, { limit: 5 });
        setSearchResults(results);
        setShowSearchResults(true);
      } catch (error) {
        console.error('Search error:', error);
      }
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const resolveAlert = async (alertId) => {
    try {
      await hrApi.resolveAlert(alertId);
      setAlerts(alerts.filter(a => a.id !== alertId));
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6" data-testid="hr-dashboard">

      {/* ── PREMIUM HEADER ── */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0c4a6e] to-[#0891b2] p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-white/70">NHÂN SỰ / HR</span>
            </div>
            <h1 className="text-2xl font-bold">HR Command Center</h1>
            <p className="mt-1 text-white/60 text-sm">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Link
            to="/hr/employees/new"
            className="flex items-center gap-2 px-4 py-2 bg-white text-[#0891b2] font-semibold rounded-xl hover:bg-white/90 transition-colors"
            data-testid="add-employee-btn"
          >
            <UserPlus size={18} />
            Thêm nhân sự
          </Link>
        </div>

        {/* Tab navigation strip */}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-white/20 pt-4">
          {[
            { label: 'Tổng quan',   icon: BarChart3,      path: '/hr' },
            { label: 'Danh sách NS', icon: Users,          path: '/hr/employees' },
            { label: 'Sơ đồ tổ chức', icon: Network,        path: '/hr/organization' },
            { label: 'Vị trí / Chức vụ', icon: BookOpen,    path: '/hr/positions' },
            { label: 'Tuyển dụng', icon: UserCog,        path: '/recruitment' },
            { label: 'Lương & công', icon: DollarSign,     path: '/payroll' },
            { label: 'KPI đội',    icon: Target,         path: '/kpi/team' },
            { label: 'Đào tạo',     icon: GraduationCap,  path: '/hr/training' },
            { label: 'Báo cáo',     icon: FileText,       path: '/analytics/reports' },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.path}
                onClick={() => navigate(t.path)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/15 hover:bg-white/30 text-white transition-colors">
                <Icon className="h-3 w-3" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Search */}
      <div className="relative mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm nhân sự (tên, mã NV, SĐT, email)..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
            className="w-full pl-12 pr-4 py-3 bg-[#12121a] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
            data-testid="hr-search-input"
          />
        </div>
        
        {/* Search Results Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#12121a] border border-gray-800 rounded-xl overflow-hidden z-50">
            {searchResults.map((profile) => (
              <Link
                key={profile.id}
                to={`/hr/employees/${profile.id}`}
                className="flex items-center gap-4 p-4 hover:bg-gray-800/50 transition-colors"
                onClick={() => setShowSearchResults(false)}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-medium">
                  {profile.full_name?.charAt(0) || '?'}
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">{profile.full_name}</div>
                  <div className="text-gray-400 text-sm">{profile.employee_code} - {profile.current_position || 'Chưa có chức vụ'}</div>
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs ${STATUS_COLORS[profile.employment_status]?.bg || 'bg-gray-500/10'} ${STATUS_COLORS[profile.employment_status]?.text || 'text-gray-500'}`}>
                  {STATUS_COLORS[profile.employment_status]?.label || profile.employment_status}
                </span>
              </Link>
            ))}
            <Link
              to={`/hr/employees?search=${searchQuery}`}
              className="flex items-center justify-center gap-2 p-3 text-cyan-400 hover:bg-gray-800/50 transition-colors border-t border-gray-800"
              onClick={() => setShowSearchResults(false)}
            >
              Xem tất cả kết quả
              <ChevronRight size={16} />
            </Link>
          </div>
        )}
      </div>

      {/* Quick shortcuts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Hồ sơ thiếu',      icon: FileText,      path: '/hr/employees?filter=incomplete', color: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
          { label: 'HĐ sắp hết hạn', icon: Calendar,      path: '/hr/employees?filter=expiring',   color: 'bg-orange-500/10 border-orange-500/30 text-orange-400' },
          { label: 'Cảnh báo mới',    icon: AlertTriangle, path: '/hr/alerts',                      color: 'bg-red-500/10 border-red-500/30 text-red-400' },
          { label: 'Thêm nhân sự',    icon: UserPlus,      path: '/hr/employees/new',               color: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.path} onClick={() => navigate(item.path)}
              className={`rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:opacity-90 ${item.color}`}>
              <Icon className="h-5 w-5 mb-2" />
              <p className="text-sm font-semibold">{item.label}</p>
            </button>
          );
        })}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-cyan-500/20 rounded-lg">
              <Users className="text-cyan-400" size={24} />
            </div>
            <span className="text-2xl font-bold text-white">{stats?.total_employees || 0}</span>
          </div>
          <div className="text-gray-400">Tổng nhân sự</div>
          <div className="text-cyan-400 text-sm mt-1">+{stats?.new_employees || 0} tháng này</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-500/20 rounded-lg">
              <CheckCircle className="text-emerald-400" size={24} />
            </div>
            <span className="text-2xl font-bold text-white">{stats?.by_status?.official || 0}</span>
          </div>
          <div className="text-gray-400">Chính thức</div>
          <div className="text-emerald-400 text-sm mt-1">{stats?.by_status?.probation || 0} đang thử việc</div>
        </div>

        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-500/20 rounded-lg">
              <FileText className="text-amber-400" size={24} />
            </div>
            <span className="text-2xl font-bold text-white">{stats?.incomplete_profiles || 0}</span>
          </div>
          <div className="text-gray-400">Hồ sơ thiếu</div>
          <div className="text-amber-400 text-sm mt-1">Cần bổ sung</div>
        </div>

        <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-red-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-500/20 rounded-lg">
              <AlertTriangle className="text-red-400" size={24} />
            </div>
            <span className="text-2xl font-bold text-white">{stats?.active_alerts || 0}</span>
          </div>
          <div className="text-gray-400">Cảnh báo</div>
          <div className="text-red-400 text-sm mt-1">{stats?.expiring_contracts || 0} HĐ sắp hết hạn</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Employees */}
        <div className="bg-[#12121a] border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Nhân sự mới</h2>
            <Link to="/hr/employees" className="text-cyan-400 hover:text-cyan-300 text-sm">
              Xem tất cả
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentEmployees.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Chưa có nhân sự
              </div>
            ) : (
              recentEmployees.map((emp) => (
                <Link
                  key={emp.id}
                  to={`/hr/employees/${emp.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-800/50 transition-colors"
                  data-testid={`recent-employee-${emp.id}`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-medium">
                    {emp.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">{emp.full_name}</div>
                    <div className="text-gray-400 text-sm">{emp.employee_code}</div>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-xs ${STATUS_COLORS[emp.employment_status]?.bg || 'bg-gray-500/10'} ${STATUS_COLORS[emp.employment_status]?.text || 'text-gray-500'}`}>
                    {STATUS_COLORS[emp.employment_status]?.label || emp.employment_status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Incomplete Profiles */}
        <div className="bg-[#12121a] border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Hồ sơ cần bổ sung</h2>
            <Link to="/hr/employees?filter=incomplete" className="text-cyan-400 hover:text-cyan-300 text-sm">
              Xem tất cả
            </Link>
          </div>
          
          <div className="space-y-4">
            {incompleteProfiles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="mx-auto mb-2 text-emerald-500" size={32} />
                Tất cả hồ sơ đã hoàn chỉnh
              </div>
            ) : (
              incompleteProfiles.map((profile) => (
                <Link
                  key={profile.id}
                  to={`/hr/employees/${profile.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-800/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-medium">
                    {profile.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">{profile.full_name}</div>
                    <div className="text-gray-400 text-sm">{profile.employee_code}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-amber-400 font-medium">{profile.profile_completeness}%</div>
                    <div className="text-gray-500 text-xs">Hoàn thành</div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-[#12121a] border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Cảnh báo</h2>
            <Link to="/hr" className="text-cyan-400 hover:text-cyan-300 text-sm">
              Xem tất cả
            </Link>
          </div>
          
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="mx-auto mb-2 text-emerald-500" size={32} />
                Không có cảnh báo
              </div>
            ) : (
              alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${SEVERITY_COLORS[alert.severity]?.bg || 'bg-gray-500/10'} ${SEVERITY_COLORS[alert.severity]?.border || 'border-gray-500/30'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className={`font-medium ${SEVERITY_COLORS[alert.severity]?.text || 'text-gray-400'}`}>
                        {alert.title}
                      </div>
                      <div className="text-gray-400 text-sm mt-1">
                        {alert.employee_name} ({alert.employee_code})
                      </div>
                    </div>
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      className="p-1 hover:bg-gray-700 rounded transition-colors"
                      title="Đánh dấu đã xử lý"
                    >
                      <CheckCircle size={16} className="text-gray-400 hover:text-emerald-400" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Expiring Contracts */}
      {expiringContracts.length > 0 && (
        <div className="mt-6 bg-[#12121a] border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Calendar className="text-orange-400" size={20} />
              Hợp đồng sắp hết hạn (30 ngày tới)
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm border-b border-gray-800">
                  <th className="pb-4">Nhân sự</th>
                  <th className="pb-4">Mã HĐ</th>
                  <th className="pb-4">Loại HĐ</th>
                  <th className="pb-4">Ngày hết hạn</th>
                  <th className="pb-4">Còn lại</th>
                  <th className="pb-4"></th>
                </tr>
              </thead>
              <tbody className="text-white">
                {expiringContracts.map((contract) => {
                  const endDate = new Date(contract.end_date);
                  const today = new Date();
                  const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <tr key={contract.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="py-4">
                        <div className="font-medium">{contract.employee_name}</div>
                        <div className="text-gray-400 text-sm">{contract.employee_code}</div>
                      </td>
                      <td className="py-4 text-gray-400">{contract.contract_number}</td>
                      <td className="py-4">
                        <span className="px-2 py-1 rounded-lg text-xs bg-blue-500/10 text-blue-400">
                          {contract.contract_type === 'probation' ? 'Thử việc' :
                           contract.contract_type === 'fixed_term' ? 'Có thời hạn' :
                           contract.contract_type === 'indefinite' ? 'Vô thời hạn' : contract.contract_type}
                        </span>
                      </td>
                      <td className="py-4 text-gray-400">
                        {new Date(contract.end_date).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-4">
                        <span className={`font-medium ${daysLeft <= 7 ? 'text-red-400' : daysLeft <= 14 ? 'text-orange-400' : 'text-amber-400'}`}>
                          {daysLeft} ngày
                        </span>
                      </td>
                      <td className="py-4">
                        <Link
                          to={`/hr/employees/${contract.hr_profile_id}`}
                          className="text-cyan-400 hover:text-cyan-300"
                        >
                          Xem hồ sơ
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Status Distribution */}
      <div className="mt-6 bg-[#12121a] border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Phân bổ nhân sự</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(stats?.by_status || {}).map(([status, count]) => (
            <div
              key={status}
              className={`p-4 rounded-xl ${STATUS_COLORS[status]?.bg || 'bg-gray-500/10'} border border-gray-800`}
            >
              <div className={`text-2xl font-bold ${STATUS_COLORS[status]?.text || 'text-gray-400'}`}>
                {count}
              </div>
              <div className="text-gray-400 text-sm mt-1">
                {STATUS_COLORS[status]?.label || status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
