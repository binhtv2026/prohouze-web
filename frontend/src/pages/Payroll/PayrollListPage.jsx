/**
 * Payroll List Page - Danh sách bảng lương theo kỳ
 * ProHouze HR AI Platform - Phase 1
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Calculator, Users, DollarSign, CheckCircle, Clock, Lock,
  ChevronLeft, ChevronRight, Download, Filter, Search,
  AlertTriangle, TrendingUp, FileText
} from 'lucide-react';
import { payrollApi } from '../../api/payrollApi';
import { toast } from 'sonner';

const STATUS_COLORS = {
  draft: { bg: 'bg-gray-500/10', text: 'text-gray-400', label: 'Nháp', icon: FileText },
  calculated: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Đã tính', icon: Calculator },
  approved: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Đã duyệt', icon: CheckCircle },
  paid: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Đã chi', icon: DollarSign },
  locked: { bg: 'bg-purple-500/10', text: 'text-purple-400', label: 'Khóa', icon: Lock },
};

const formatCurrency = (amount) => {
  if (!amount) return '0 đ';
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
};

const DEMO_PAYROLL_LIST = [
  { id: 'payroll-list-1', employee_name: 'Nguyễn Minh Anh', employee_code: 'PH001', status: 'approved', net_salary: 28650000, gross_salary: 33200000 },
  { id: 'payroll-list-2', employee_name: 'Trần Quốc Huy', employee_code: 'PH014', status: 'calculated', net_salary: 25100000, gross_salary: 29600000 },
  { id: 'payroll-list-3', employee_name: 'Lê Thanh Hà', employee_code: 'PH027', status: 'paid', net_salary: 21950000, gross_salary: 25400000 },
];

const DEMO_PAYROLL_SUMMARY = {
  total_employees: 3,
  total_gross: 88200000,
  total_net: 75700000,
  total_tax: 3140000,
  by_status: { approved: 1, calculated: 1, paid: 1 },
};

export default function PayrollListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [payrolls, setPayrolls] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(searchParams.get('period') || getCurrentPeriod());
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayrolls, setSelectedPayrolls] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  function getCurrentPeriod() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  function getPreviousPeriods(count = 12) {
    const periods = [];
    const now = new Date();
    for (let i = 0; i < count; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      periods.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    }
    return periods;
  }

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [payrollsData, summaryData] = await Promise.all([
        payrollApi.getPayrollsForPeriod(selectedPeriod, selectedStatus || null),
        payrollApi.getPayrollSummary(selectedPeriod),
      ]);
      const payrollPayload = Array.isArray(payrollsData) && payrollsData.length > 0 ? payrollsData : DEMO_PAYROLL_LIST;
      setPayrolls(payrollPayload.filter((item) => !selectedStatus || item.status === selectedStatus));
      setSummary(summaryData?.data || DEMO_PAYROLL_SUMMARY);
    } catch (error) {
      console.error('Error loading payrolls:', error);
      setPayrolls(DEMO_PAYROLL_LIST.filter((item) => !selectedStatus || item.status === selectedStatus));
      setSummary(DEMO_PAYROLL_SUMMARY);
      toast.error('Không thể tải dữ liệu bảng lương');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, selectedStatus]);

  useEffect(() => {
    loadData();
    setSearchParams({ period: selectedPeriod, ...(selectedStatus && { status: selectedStatus }) });
  }, [loadData, selectedPeriod, selectedStatus, setSearchParams]);

  const handleCalculate = async () => {
    if (!confirm('Bạn có chắc muốn tính lương cho tất cả nhân viên?')) return;
    
    try {
      setActionLoading(true);
      const result = await payrollApi.calculatePayroll(selectedPeriod);
      toast.success(`Đã tính lương cho ${result.processed} nhân viên`);
      loadData();
    } catch (error) {
      toast.error(error.message || 'Tính lương thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (selectedPayrolls.length === 0) {
      toast.error('Vui lòng chọn bảng lương cần duyệt');
      return;
    }
    
    try {
      setActionLoading(true);
      const result = await payrollApi.approvePayroll(selectedPayrolls);
      toast.success(`Đã duyệt ${result.results.filter(r => r.status === 'approved').length} bảng lương`);
      setSelectedPayrolls([]);
      loadData();
    } catch (error) {
      toast.error(error.message || 'Duyệt thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    if (selectedPayrolls.length === 0) {
      toast.error('Vui lòng chọn bảng lương đã thanh toán');
      return;
    }
    
    try {
      setActionLoading(true);
      const result = await payrollApi.markPayrollPaid(selectedPayrolls);
      toast.success(`Đã đánh dấu ${result.results.filter(r => r.status === 'paid').length} bảng lương đã chi`);
      setSelectedPayrolls([]);
      loadData();
    } catch (error) {
      toast.error(error.message || 'Cập nhật thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLock = async () => {
    if (!confirm(`Khóa bảng lương tháng ${selectedPeriod}? Sau khi khóa sẽ không thể chỉnh sửa.`)) return;
    
    try {
      setActionLoading(true);
      const result = await payrollApi.lockPayroll(selectedPeriod);
      toast.success(`Đã khóa ${result.locked_count} bảng lương`);
      loadData();
    } catch (error) {
      toast.error(error.message || 'Khóa thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleSelectPayroll = (id) => {
    setSelectedPayrolls(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedPayrolls.length === filteredPayrolls.length) {
      setSelectedPayrolls([]);
    } else {
      setSelectedPayrolls(filteredPayrolls.map(p => p.id));
    }
  };

  const filteredPayrolls = payrolls.filter(p => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return p.employee_name?.toLowerCase().includes(search) ||
           p.employee_code?.toLowerCase().includes(search);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6" data-testid="payroll-list-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/payroll" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <ChevronLeft size={20} className="text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Bảng lương AUTO</h1>
            <p className="text-gray-400">1 click = Tính lương tự động từ chấm công + hoa hồng + thưởng phạt</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            to="/payroll/summary"
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <FileText size={18} />
            Xem tổng hợp công
          </Link>
          <button
            onClick={handleCalculate}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-lg transition-colors disabled:opacity-50"
            data-testid="calculate-payroll-btn"
          >
            <Calculator size={18} />
            1 Click - Tính lương
          </button>
        </div>
      </div>

      {/* Auto Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
            <CheckCircle className="text-emerald-400" size={20} />
          </div>
          <div className="flex-1">
            <div className="text-white font-medium">AUTO 100% - Không nhập tay</div>
            <div className="text-gray-400 text-sm">
              Lương = (Cơ bản / ngày chuẩn) × ngày thực tế + OT + phụ cấp + hoa hồng (Finance) - BHXH - thuế - phạt
            </div>
          </div>
          <div className="text-right">
            <div className="text-gray-400 text-xs">Flow</div>
            <div className="text-cyan-400 text-sm">Check-in → Attendance → Payroll → Net</div>
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="bg-[#12121a] border border-gray-800 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              data-testid="period-selector"
            >
              {getPreviousPeriods().map(period => (
                <option key={period} value={period}>
                  Tháng {period.split('-')[1]}/{period.split('-')[0]}
                </option>
              ))}
            </select>
            
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
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm nhân viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 w-64"
              data-testid="search-input"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="text-blue-400" size={20} />
              <span className="text-xl font-bold text-white">{summary.total_employees}</span>
            </div>
            <div className="text-gray-400 text-sm">Số nhân viên</div>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="text-emerald-400" size={20} />
              <span className="text-lg font-bold text-emerald-400">{formatCurrency(summary.total_gross)}</span>
            </div>
            <div className="text-gray-400 text-sm">Tổng Gross</div>
          </div>
          
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="text-cyan-400" size={20} />
              <span className="text-lg font-bold text-cyan-400">{formatCurrency(summary.total_net)}</span>
            </div>
            <div className="text-gray-400 text-sm">Tổng Net</div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="text-amber-400" size={20} />
              <span className="text-lg font-bold text-amber-400">{formatCurrency(summary.total_tax)}</span>
            </div>
            <div className="text-gray-400 text-sm">Thuế TNCN</div>
          </div>
        </div>
      )}

      {/* Actions Bar */}
      {selectedPayrolls.length > 0 && (
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 mb-4 flex items-center justify-between">
          <span className="text-cyan-400">
            Đã chọn {selectedPayrolls.length} bảng lương
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
              data-testid="approve-selected-btn"
            >
              Duyệt
            </button>
            <button
              onClick={handleMarkPaid}
              disabled={actionLoading}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50"
              data-testid="mark-paid-btn"
            >
              Đánh dấu đã chi
            </button>
            <button
              onClick={handleLock}
              disabled={actionLoading}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50"
              data-testid="lock-btn"
            >
              Khóa kỳ
            </button>
          </div>
        </div>
      )}

      {/* Payroll Table */}
      <div className="bg-[#12121a] border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="p-4 text-left">
                <input
                  type="checkbox"
                  checked={selectedPayrolls.length === filteredPayrolls.length && filteredPayrolls.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-600"
                />
              </th>
              <th className="p-4 text-left text-gray-400 font-medium">Nhân viên</th>
              <th className="p-4 text-left text-gray-400 font-medium">Ngày công</th>
              <th className="p-4 text-right text-gray-400 font-medium">Lương Gross</th>
              <th className="p-4 text-right text-gray-400 font-medium">Bảo hiểm</th>
              <th className="p-4 text-right text-gray-400 font-medium">Thuế TNCN</th>
              <th className="p-4 text-right text-gray-400 font-medium">Lương Net</th>
              <th className="p-4 text-center text-gray-400 font-medium">Trạng thái</th>
              <th className="p-4 text-center text-gray-400 font-medium">Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayrolls.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-gray-500">
                  <Calculator className="mx-auto mb-4" size={48} />
                  <p>Chưa có bảng lương cho kỳ này</p>
                  <button
                    onClick={handleCalculate}
                    className="mt-4 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black rounded-lg transition-colors"
                  >
                    Tính lương ngay
                  </button>
                </td>
              </tr>
            ) : (
              filteredPayrolls.map((payroll) => {
                const statusStyle = STATUS_COLORS[payroll.status] || STATUS_COLORS.draft;
                const StatusIcon = statusStyle.icon;
                
                return (
                  <tr 
                    key={payroll.id} 
                    className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors"
                    data-testid={`payroll-row-${payroll.id}`}
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedPayrolls.includes(payroll.id)}
                        onChange={() => toggleSelectPayroll(payroll.id)}
                        className="rounded border-gray-600"
                        disabled={payroll.status === 'locked'}
                      />
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="text-white font-medium">{payroll.employee_name}</div>
                        <div className="text-gray-500 text-sm">{payroll.employee_code}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-white">{payroll.actual_work_days || 0}</span>
                      <span className="text-gray-500">/{payroll.standard_work_days || 22}</span>
                    </td>
                    <td className="p-4 text-right text-emerald-400 font-medium">
                      {formatCurrency(payroll.gross_salary)}
                    </td>
                    <td className="p-4 text-right text-amber-400">
                      {formatCurrency(payroll.total_insurance)}
                    </td>
                    <td className="p-4 text-right text-red-400">
                      {formatCurrency(payroll.personal_income_tax)}
                    </td>
                    <td className="p-4 text-right text-cyan-400 font-bold">
                      {formatCurrency(payroll.net_salary)}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${statusStyle.bg} ${statusStyle.text}`}>
                        <StatusIcon size={14} />
                        {statusStyle.label}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Link
                        to={`/payroll/detail/${payroll.id}`}
                        className="text-cyan-400 hover:text-cyan-300"
                        data-testid={`view-payroll-${payroll.id}`}
                      >
                        Xem
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
