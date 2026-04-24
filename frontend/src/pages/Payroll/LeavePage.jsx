/**
 * Leave Management Page - Quản lý nghỉ phép
 * ProHouze HR AI Platform - Phase 1
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarDays, ChevronLeft, Plus, CheckCircle, XCircle,
  Clock, Filter, User, FileText, AlertTriangle
} from 'lucide-react';
import { payrollApi } from '../../api/payrollApi';
import { toast } from 'sonner';

const LEAVE_TYPE_LABELS = {
  annual: 'Phép năm',
  sick: 'Nghỉ ốm',
  maternity: 'Thai sản',
  paternity: 'Nghỉ cha',
  marriage: 'Nghỉ cưới',
  bereavement: 'Tang chế',
  unpaid: 'Không lương',
  compensatory: 'Nghỉ bù',
  other: 'Khác',
};

const STATUS_COLORS = {
  pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Chờ duyệt' },
  approved: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Đã duyệt' },
  rejected: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Từ chối' },
  cancelled: { bg: 'bg-gray-500/10', text: 'text-gray-400', label: 'Đã hủy' },
};

const DEMO_LEAVE_BALANCES = [
  { id: 'leave-balance-1', leave_type: 'annual', entitled_days: 12, used_days: 4, pending_days: 1, remaining_days: 7 },
  { id: 'leave-balance-2', leave_type: 'sick', entitled_days: 6, used_days: 1, pending_days: 0, remaining_days: 5 },
  { id: 'leave-balance-3', leave_type: 'compensatory', entitled_days: 3, used_days: 0, pending_days: 0, remaining_days: 3 },
];

const DEMO_LEAVE_REQUESTS = [
  {
    id: 'leave-demo-1',
    employee_name: 'Nguyễn Minh Anh',
    employee_code: 'PH001',
    leave_type: 'annual',
    start_date: '2026-03-28',
    end_date: '2026-03-29',
    is_half_day: false,
    half_day_type: '',
    days_count: 2,
    reason: 'Về quê giải quyết việc gia đình',
    status: 'pending',
    rejection_reason: '',
  },
  {
    id: 'leave-demo-2',
    employee_name: 'Trần Quốc Huy',
    employee_code: 'PH014',
    leave_type: 'sick',
    start_date: '2026-03-20',
    end_date: '2026-03-20',
    is_half_day: true,
    half_day_type: 'morning',
    days_count: 0.5,
    reason: 'Khám bệnh định kỳ',
    status: 'approved',
    rejection_reason: '',
  },
  {
    id: 'leave-demo-3',
    employee_name: 'Lê Thanh Hà',
    employee_code: 'PH027',
    leave_type: 'unpaid',
    start_date: '2026-03-22',
    end_date: '2026-03-22',
    is_half_day: false,
    half_day_type: '',
    days_count: 1,
    reason: 'Giải quyết việc cá nhân gấp',
    status: 'rejected',
    rejection_reason: 'Không đủ người trực dự án hôm đó',
  },
];

export default function LeavePage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [balances, setBalances] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [pendingOnly, setPendingOnly] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Create form state
  const [formData, setFormData] = useState({
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    is_half_day: false,
    half_day_type: '',
    reason: '',
    handover_to: '',
    handover_notes: '',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [requestsData, balancesData] = await Promise.all([
        payrollApi.getLeaveRequests({
          status: selectedStatus || undefined,
          pending_only: pendingOnly,
          limit: 100,
        }),
        payrollApi.getLeaveBalance(),
      ]);
      const requestsPayload = Array.isArray(requestsData) ? requestsData : [];
      const balancesPayload = Array.isArray(balancesData) ? balancesData : [];
      const filteredDemoRequests = DEMO_LEAVE_REQUESTS.filter((request) => {
        if (pendingOnly && request.status !== 'pending') return false;
        if (selectedStatus && request.status !== selectedStatus) return false;
        return true;
      });
      setRequests(requestsPayload.length > 0 ? requestsPayload : filteredDemoRequests);
      setBalances(balancesPayload.length > 0 ? balancesPayload : DEMO_LEAVE_BALANCES);
    } catch (error) {
      console.error('Error loading leave data:', error);
      setRequests(DEMO_LEAVE_REQUESTS.filter((request) => {
        if (pendingOnly && request.status !== 'pending') return false;
        if (selectedStatus && request.status !== selectedStatus) return false;
        return true;
      }));
      setBalances(DEMO_LEAVE_BALANCES);
      toast.error('Không thể tải dữ liệu nghỉ phép');
    } finally {
      setLoading(false);
    }
  }, [pendingOnly, selectedStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateLeave = async (e) => {
    e.preventDefault();
    
    if (!formData.start_date || !formData.end_date) {
      toast.error('Vui lòng chọn ngày bắt đầu và kết thúc');
      return;
    }
    
    try {
      setActionLoading(true);
      await payrollApi.createLeaveRequest(formData);
      toast.success('Đã gửi đơn xin nghỉ phép');
      setShowCreateModal(false);
      setFormData({
        leave_type: 'annual',
        start_date: '',
        end_date: '',
        is_half_day: false,
        half_day_type: '',
        reason: '',
        handover_to: '',
        handover_notes: '',
      });
      loadData();
    } catch (error) {
      toast.error(error.message || 'Gửi đơn thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      setActionLoading(true);
      await payrollApi.approveLeaveRequest(requestId);
      toast.success('Đã duyệt đơn nghỉ phép');
      loadData();
    } catch (error) {
      toast.error(error.message || 'Duyệt đơn thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (requestId) => {
    const reason = prompt('Lý do từ chối:');
    if (!reason) return;
    
    try {
      setActionLoading(true);
      await payrollApi.rejectLeaveRequest(requestId, reason);
      toast.success('Đã từ chối đơn nghỉ phép');
      loadData();
    } catch (error) {
      toast.error(error.message || 'Từ chối thất bại');
    } finally {
      setActionLoading(false);
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
    <div className="min-h-screen bg-[#0a0a0f] p-6" data-testid="leave-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/payroll" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <ChevronLeft size={20} className="text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Nghỉ phép</h1>
            <p className="text-gray-400">Quản lý đơn xin nghỉ phép</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-lg transition-colors"
          data-testid="create-leave-btn"
        >
          <Plus size={18} />
          Tạo đơn nghỉ phép
        </button>
      </div>

      {/* Leave Balance Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        {balances.map((balance) => (
          <div 
            key={balance.id || balance.leave_type} 
            className="bg-[#12121a] border border-gray-800 rounded-xl p-4"
          >
            <div className="text-gray-400 text-sm mb-2">
              {LEAVE_TYPE_LABELS[balance.leave_type] || balance.leave_type}
            </div>
            <div className="flex items-end gap-1">
              <span className="text-2xl font-bold text-white">{balance.remaining_days}</span>
              <span className="text-gray-500 text-sm mb-1">/{balance.entitled_days}</span>
            </div>
            <div className="text-gray-500 text-xs mt-1">
              Đã dùng: {balance.used_days} | Chờ: {balance.pending_days}
            </div>
          </div>
        ))}
        
        {balances.length === 0 && (
          <div className="col-span-full text-center py-4 text-gray-500">
            Chưa có thông tin số ngày phép
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-[#12121a] border border-gray-800 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-4">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
            data-testid="status-filter"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS_COLORS).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          
          <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={pendingOnly}
              onChange={(e) => setPendingOnly(e.target.checked)}
              className="rounded border-gray-600"
            />
            Chỉ hiển thị chờ duyệt
          </label>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-[#12121a] border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="p-4 text-left text-gray-400 font-medium">Nhân viên</th>
              <th className="p-4 text-left text-gray-400 font-medium">Loại phép</th>
              <th className="p-4 text-center text-gray-400 font-medium">Thời gian</th>
              <th className="p-4 text-center text-gray-400 font-medium">Số ngày</th>
              <th className="p-4 text-left text-gray-400 font-medium">Lý do</th>
              <th className="p-4 text-center text-gray-400 font-medium">Trạng thái</th>
              <th className="p-4 text-center text-gray-400 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  <CalendarDays className="mx-auto mb-4" size={48} />
                  <p>Không có đơn nghỉ phép</p>
                </td>
              </tr>
            ) : (
              requests.map((request) => {
                const statusStyle = STATUS_COLORS[request.status] || STATUS_COLORS.pending;
                
                return (
                  <tr 
                    key={request.id} 
                    className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors"
                    data-testid={`leave-row-${request.id}`}
                  >
                    <td className="p-4">
                      <div>
                        <div className="text-white font-medium">{request.employee_name}</div>
                        <div className="text-gray-500 text-sm">{request.employee_code}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-cyan-400">
                        {LEAVE_TYPE_LABELS[request.leave_type] || request.leave_type}
                      </span>
                    </td>
                    <td className="p-4 text-center text-gray-300">
                      {request.start_date} → {request.end_date}
                      {request.is_half_day && (
                        <div className="text-xs text-gray-500">
                          ({request.half_day_type === 'morning' ? 'Sáng' : 'Chiều'})
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-white font-medium">{request.days_count}</span>
                      <span className="text-gray-500 text-sm"> ngày</span>
                    </td>
                    <td className="p-4 text-gray-400 max-w-xs truncate" title={request.reason}>
                      {request.reason || '-'}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${statusStyle.bg} ${statusStyle.text}`}>
                        {statusStyle.label}
                      </span>
                      {request.rejection_reason && (
                        <div className="text-red-400 text-xs mt-1" title={request.rejection_reason}>
                          <AlertTriangle className="inline" size={12} /> {request.rejection_reason.substring(0, 20)}...
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {request.status === 'pending' && (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleApprove(request.id)}
                            disabled={actionLoading}
                            className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors disabled:opacity-50"
                            title="Duyệt"
                            data-testid={`approve-${request.id}`}
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
                            disabled={actionLoading}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                            title="Từ chối"
                            data-testid={`reject-${request.id}`}
                          >
                            <XCircle size={16} />
                          </button>
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

      {/* Create Leave Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#12121a] border border-gray-800 rounded-xl p-6 w-full max-w-lg mx-4">
            <h2 className="text-xl font-bold text-white mb-4">Tạo đơn xin nghỉ phép</h2>
            
            <form onSubmit={handleCreateLeave} className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Loại phép</label>
                <select
                  value={formData.leave_type}
                  onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  data-testid="leave-type-select"
                >
                  {Object.entries(LEAVE_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    required
                    data-testid="start-date-input"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    required
                    data-testid="end-date-input"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_half_day}
                    onChange={(e) => setFormData({ ...formData, is_half_day: e.target.checked })}
                    className="rounded border-gray-600"
                  />
                  Nghỉ nửa ngày
                </label>
                
                {formData.is_half_day && (
                  <select
                    value={formData.half_day_type}
                    onChange={(e) => setFormData({ ...formData, half_day_type: e.target.value })}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="">Chọn buổi</option>
                    <option value="morning">Buổi sáng</option>
                    <option value="afternoon">Buổi chiều</option>
                  </select>
                )}
              </div>
              
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Lý do</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white h-24 resize-none"
                  placeholder="Nhập lý do xin nghỉ..."
                  required
                  data-testid="reason-textarea"
                />
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-lg transition-colors disabled:opacity-50"
                  data-testid="submit-leave-btn"
                >
                  {actionLoading ? 'Đang gửi...' : 'Gửi đơn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
