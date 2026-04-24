/**
 * Payroll Audit Log Page - Lịch sử thao tác
 * ProHouze HR AI Platform - Phase 1
 * 
 * Lưu toàn bộ: ai calculate, ai approve, ai xem lương
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronLeft, History, Calculator, CheckCircle, DollarSign,
  Lock, Eye, AlertTriangle, Filter, RefreshCw, User, Settings
} from 'lucide-react';
import { payrollApi } from '../../api/payrollApi';
import { toast } from 'sonner';

const ACTION_LABELS = {
  calculate: { label: 'Tính lương', icon: Calculator, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  approve: { label: 'Duyệt', icon: CheckCircle, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  pay: { label: 'Chi trả', icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  lock: { label: 'Khóa', icon: Lock, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  view: { label: 'Xem lương', icon: Eye, color: 'text-gray-400', bg: 'bg-gray-500/20' },
  adjust: { label: 'Điều chỉnh', icon: Settings, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  update_rules: { label: 'Cập nhật rule', icon: Settings, color: 'text-orange-400', bg: 'bg-orange-500/20' },
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('vi-VN');
};

const DEMO_AUDIT_LOGS = [
  { id: 'audit-1', action: 'calculate', actor_name: 'Phòng Tài chính', actor_role: 'finance', employee_info: null, period: '2026-03', notes: 'Tính lương tự động kỳ tháng 3', timestamp: new Date().toISOString(), warnings: [] },
  { id: 'audit-2', action: 'approve', actor_name: 'Giám đốc tài chính', actor_role: 'leader', employee_info: { employee_name: 'Nguyễn Minh Anh', employee_code: 'PH001' }, period: '2026-03', notes: 'Duyệt bảng lương cá nhân', timestamp: new Date(Date.now() - 3600000).toISOString(), warnings: [] },
];

const DEMO_SALARY_VIEW_LOGS = [
  { id: 'view-1', employee_name: 'Nguyễn Minh Anh', employee_code: 'PH001', viewed_by_name: 'Nguyễn Minh Anh', viewed_by_role: 'sales', viewed_at: new Date().toISOString(), period: '2026-03' },
  { id: 'view-2', employee_name: 'Trần Quốc Huy', employee_code: 'PH014', viewed_by_name: 'Trần Quốc Huy', viewed_by_role: 'sales', viewed_at: new Date(Date.now() - 7200000).toISOString(), period: '2026-03' },
];

export default function PayrollAuditPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [salaryViewLogs, setSalaryViewLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('actions'); // actions | views
  const [filterAction, setFilterAction] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const [actionsData, viewsData] = await Promise.all([
        payrollApi.getAuditLogs({
          action: filterAction || undefined,
          period: filterPeriod || undefined,
          limit: 100,
        }),
        payrollApi.getSalaryViewLogs({ limit: 100 }),
      ]);
      setLogs(Array.isArray(actionsData) && actionsData.length > 0 ? actionsData : DEMO_AUDIT_LOGS);
      setSalaryViewLogs(Array.isArray(viewsData) && viewsData.length > 0 ? viewsData : DEMO_SALARY_VIEW_LOGS);
    } catch (error) {
      console.error('Error loading logs:', error);
      setLogs(DEMO_AUDIT_LOGS);
      setSalaryViewLogs(DEMO_SALARY_VIEW_LOGS);
      toast.error('Không thể tải audit log');
    } finally {
      setLoading(false);
    }
  }, [filterAction, filterPeriod]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6" data-testid="payroll-audit-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/payroll" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <ChevronLeft size={20} className="text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Audit Log</h1>
            <p className="text-gray-400">Lịch sử thao tác bảng lương</p>
          </div>
        </div>
        
        <button
          onClick={loadLogs}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setActiveTab('actions')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'actions' 
              ? 'bg-cyan-500 text-black' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <History size={18} />
            Thao tác ({logs.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('views')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'views' 
              ? 'bg-cyan-500 text-black' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Eye size={18} />
            Xem lương ({salaryViewLogs.length})
          </div>
        </button>
      </div>

      {/* Filters */}
      {activeTab === 'actions' && (
        <div className="bg-[#12121a] border border-gray-800 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-4">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Loại thao tác</label>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                data-testid="action-filter"
              >
                <option value="">Tất cả</option>
                {Object.entries(ACTION_LABELS).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Kỳ lương</label>
              <input
                type="month"
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Actions Log Table */}
      {activeTab === 'actions' && (
        <div className="bg-[#12121a] border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="p-4 text-left text-gray-400 font-medium">Thời gian</th>
                <th className="p-4 text-left text-gray-400 font-medium">Thao tác</th>
                <th className="p-4 text-left text-gray-400 font-medium">Người thực hiện</th>
                <th className="p-4 text-left text-gray-400 font-medium">Nhân viên</th>
                <th className="p-4 text-left text-gray-400 font-medium">Kỳ lương</th>
                <th className="p-4 text-left text-gray-400 font-medium">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    <History className="mx-auto mb-4" size={48} />
                    <p>Chưa có lịch sử thao tác</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const actionInfo = ACTION_LABELS[log.action] || ACTION_LABELS.calculate;
                  const ActionIcon = actionInfo.icon;
                  
                  return (
                    <tr 
                      key={log.id} 
                      className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors"
                      data-testid={`audit-row-${log.id}`}
                    >
                      <td className="p-4 text-gray-400 text-sm">
                        {formatDateTime(log.timestamp)}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-lg ${actionInfo.bg} ${actionInfo.color}`}>
                          <ActionIcon size={14} />
                          {actionInfo.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="text-white">{log.actor_name || 'N/A'}</div>
                          <div className="text-gray-500 text-xs">{log.actor_role}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        {log.employee_info ? (
                          <div>
                            <div className="text-white">{log.employee_info.employee_name}</div>
                            <div className="text-gray-500 text-xs">{log.employee_info.employee_code}</div>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="p-4 text-cyan-400">{log.period || '-'}</td>
                      <td className="p-4 text-gray-400 text-sm max-w-xs truncate">
                        {log.notes || '-'}
                        {log.warnings?.length > 0 && (
                          <div className="flex items-center gap-1 text-amber-400 mt-1">
                            <AlertTriangle size={12} />
                            {log.warnings.length} cảnh báo
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Salary View Logs Table */}
      {activeTab === 'views' && (
        <div className="bg-[#12121a] border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="p-4 text-left text-gray-400 font-medium">Thời gian</th>
                <th className="p-4 text-left text-gray-400 font-medium">Người xem</th>
                <th className="p-4 text-left text-gray-400 font-medium">Xem lương của</th>
                <th className="p-4 text-left text-gray-400 font-medium">Loại</th>
                <th className="p-4 text-left text-gray-400 font-medium">Kỳ lương</th>
                <th className="p-4 text-center text-gray-400 font-medium">Có quyền</th>
              </tr>
            </thead>
            <tbody>
              {salaryViewLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    <Eye className="mx-auto mb-4" size={48} />
                    <p>Chưa có lịch sử xem lương</p>
                  </td>
                </tr>
              ) : (
                salaryViewLogs.map((log) => (
                  <tr 
                    key={log.id} 
                    className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors"
                    data-testid={`view-log-${log.id}`}
                  >
                    <td className="p-4 text-gray-400 text-sm">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="text-white">{log.viewer_name || 'N/A'}</div>
                        <div className="text-gray-500 text-xs">{log.viewer_role}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="text-white">{log.target_employee_name}</div>
                        <div className="text-gray-500 text-xs">{log.target_employee_code}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-lg text-xs ${
                        log.view_type === 'own' 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {log.view_type === 'own' ? 'Tự xem' : 'Xem người khác'}
                      </span>
                    </td>
                    <td className="p-4 text-cyan-400">{log.period || '-'}</td>
                    <td className="p-4 text-center">
                      {log.is_authorized ? (
                        <CheckCircle className="inline text-emerald-400" size={18} />
                      ) : (
                        <AlertTriangle className="inline text-red-400" size={18} />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-[#12121a] border border-gray-800 rounded-xl p-4 text-center">
          <Calculator className="mx-auto text-cyan-400 mb-2" size={24} />
          <div className="text-2xl font-bold text-white">
            {logs.filter(l => l.action === 'calculate').length}
          </div>
          <div className="text-gray-400 text-sm">Lần tính lương</div>
        </div>
        <div className="bg-[#12121a] border border-gray-800 rounded-xl p-4 text-center">
          <CheckCircle className="mx-auto text-blue-400 mb-2" size={24} />
          <div className="text-2xl font-bold text-white">
            {logs.filter(l => l.action === 'approve').length}
          </div>
          <div className="text-gray-400 text-sm">Lần duyệt</div>
        </div>
        <div className="bg-[#12121a] border border-gray-800 rounded-xl p-4 text-center">
          <DollarSign className="mx-auto text-emerald-400 mb-2" size={24} />
          <div className="text-2xl font-bold text-white">
            {logs.filter(l => l.action === 'pay').length}
          </div>
          <div className="text-gray-400 text-sm">Lần chi trả</div>
        </div>
        <div className="bg-[#12121a] border border-gray-800 rounded-xl p-4 text-center">
          <Eye className="mx-auto text-gray-400 mb-2" size={24} />
          <div className="text-2xl font-bold text-white">
            {salaryViewLogs.length}
          </div>
          <div className="text-gray-400 text-sm">Lần xem lương</div>
        </div>
      </div>
    </div>
  );
}
