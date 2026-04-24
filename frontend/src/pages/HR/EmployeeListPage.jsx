/**
 * Employee List Page - Danh sách nhân sự
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Users, Search, Filter, Plus, ChevronRight, 
  CheckCircle, Clock, AlertCircle, X
} from 'lucide-react';
import { hrApi } from '../../api/hrApi';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'probation', label: 'Thử việc' },
  { value: 'official', label: 'Chính thức' },
  { value: 'collaborator', label: 'CTV' },
  { value: 'intern', label: 'Thực tập' },
  { value: 'resigned', label: 'Đã nghỉ' },
  { value: 'terminated', label: 'Sa thải' },
];

const STATUS_COLORS = {
  probation: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Thử việc' },
  official: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Chính thức' },
  collaborator: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'CTV' },
  intern: { bg: 'bg-purple-500/10', text: 'text-purple-400', label: 'Thực tập' },
  resigned: { bg: 'bg-gray-500/10', text: 'text-gray-400', label: 'Đã nghỉ' },
  terminated: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Sa thải' },
};

const DEMO_EMPLOYEES = [
  { id: 'emp-1', full_name: 'Nguyễn Hoàng Phúc', employee_code: 'PH-102', current_position: 'Chuyên viên kinh doanh', employment_status: 'official', profile_completeness: 92, total_deals: 14 },
  { id: 'emp-2', full_name: 'Lê Mỹ Linh', employee_code: 'PH-108', current_position: 'Nhân sự tuyển dụng', employment_status: 'probation', profile_completeness: 78, total_deals: 0 },
  { id: 'emp-3', full_name: 'Trần Gia Bảo', employee_code: 'CTV-021', current_position: 'Cộng tác viên', employment_status: 'collaborator', profile_completeness: 64, total_deals: 6 },
];

export default function EmployeeListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [showFilters, setShowFilters] = useState(false);
  const incompleteOnly = searchParams.get('filter') === 'incomplete';

  const matchesEmployeeFilters = useCallback((item, keyword = searchQuery.trim().toLowerCase(), statusValue = statusFilter) => {
    const matchStatus = !statusValue || item.employment_status === statusValue;
    const matchSearch = !keyword || [item.full_name, item.employee_code, item.current_position].join(' ').toLowerCase().includes(keyword);
    const matchIncomplete = !incompleteOnly || Number(item.profile_completeness || 0) < 100;
    return matchStatus && matchSearch && matchIncomplete;
  }, [incompleteOnly, searchQuery, statusFilter]);

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const data = await hrApi.listProfiles({
        search: searchQuery,
        status: statusFilter || undefined,
        limit: 100,
      });
      const employeeItems = data || [];
      setEmployees(employeeItems.length > 0 ? employeeItems : DEMO_EMPLOYEES.filter((item) => matchesEmployeeFilters(item)));
    } catch (error) {
      console.error('Error loading employees:', error);
      setEmployees(DEMO_EMPLOYEES.filter((item) => matchesEmployeeFilters(item)));
    } finally {
      setLoading(false);
    }
  }, [matchesEmployeeFilters, searchQuery, statusFilter]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const handleSearch = (e) => {
    e.preventDefault();
    const nextParams = new URLSearchParams();
    if (searchQuery.trim()) nextParams.set('search', searchQuery.trim());
    if (statusFilter) nextParams.set('status', statusFilter);
    if (incompleteOnly) nextParams.set('filter', 'incomplete');
    setSearchParams(nextParams, { replace: true });
    loadEmployees();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setSearchParams({});
    loadEmployees();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6" data-testid="employee-list-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Danh sách nhân sự</h1>
          <p className="text-gray-400 mt-1">
            {employees.filter((item) => matchesEmployeeFilters(item)).length} nhân viên
            {incompleteOnly ? ' cần bổ sung hồ sơ' : ''}
          </p>
        </div>
        <Link
          to="/hr/employees/new"
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-lg transition-colors"
        >
          <Plus size={18} />
          Thêm nhân sự
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="bg-[#12121a] border border-gray-800 rounded-xl p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm (tên, mã NV, SĐT, email)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            
            <button
              type="submit"
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-lg transition-colors"
            >
              Tìm kiếm
            </button>
            
            {(searchQuery || statusFilter || incompleteOnly) && (
              <button
                type="button"
                onClick={clearFilters}
                className="p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                title="Xóa bộ lọc"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </form>
      </div>

      {incompleteOnly && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-300">
          <AlertCircle size={16} />
          Đang lọc hồ sơ chưa hoàn chỉnh
        </div>
      )}

      {/* Employee List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
        </div>
      ) : employees.filter((item) => matchesEmployeeFilters(item)).length === 0 ? (
        <div className="bg-[#12121a] border border-gray-800 rounded-xl p-12 text-center">
          <Users className="mx-auto mb-4 text-gray-600" size={48} />
          <p className="text-gray-400">Không tìm thấy nhân sự nào</p>
          {(searchQuery || statusFilter || incompleteOnly) && (
            <button
              onClick={clearFilters}
              className="mt-4 text-cyan-400 hover:text-cyan-300"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      ) : (
        <div className="bg-[#12121a] border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 text-sm border-b border-gray-800">
                <th className="px-6 py-4">Nhân viên</th>
                <th className="px-6 py-4">Vị trí</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Hồ sơ</th>
                <th className="px-6 py-4">Deals</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="text-white">
              {employees.filter((item) => matchesEmployeeFilters(item)).map((emp) => {
                const status = STATUS_COLORS[emp.employment_status] || STATUS_COLORS.probation;
                
                return (
                  <tr key={emp.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-medium">
                          {emp.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="font-medium">{emp.full_name}</div>
                          <div className="text-gray-400 text-sm">{emp.employee_code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {emp.current_position || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-xs ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              emp.profile_completeness >= 70 ? 'bg-emerald-500' :
                              emp.profile_completeness >= 40 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${emp.profile_completeness}%` }}
                          ></div>
                        </div>
                        <span className="text-gray-400 text-sm">{emp.profile_completeness}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {emp.total_deals || 0}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/hr/employees/${emp.id}`}
                        className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                      >
                        Xem chi tiết
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
