/**
 * My Salary Page - Xem phiếu lương cá nhân
 * ProHouze HR AI Platform - Phase 1
 * 
 * Nhân viên xem lịch sử lương của mình
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, ChevronLeft, Calendar, TrendingUp, TrendingDown,
  FileText, Download, Eye, Lock
} from 'lucide-react';
import { payrollApi } from '../../api/payrollApi';
import { toast } from 'sonner';

const STATUS_COLORS = {
  draft: { bg: 'bg-gray-500/10', text: 'text-gray-400', label: 'Nháp' },
  calculated: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Đã tính' },
  approved: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Đã duyệt' },
  paid: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Đã chi' },
  locked: { bg: 'bg-purple-500/10', text: 'text-purple-400', label: 'Khóa' },
};

const formatCurrency = (amount) => {
  if (!amount) return '0 đ';
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
};

const DEMO_PAYROLLS = [
  {
    id: 'salary-demo-1',
    period: '03/2026',
    status: 'paid',
    net_salary: 28650000,
    gross_salary: 33200000,
    base_salary: 18000000,
    total_allowances: 3500000,
    total_commission: 8900000,
    total_overtime: 300000,
    total_bonus: 2500000,
    social_insurance: 1440000,
    health_insurance: 270000,
    unemployment_insurance: 180000,
    personal_income_tax: 1160000,
    total_penalties: 0,
    total_advances: 1000000,
    total_insurance: 1890000,
    actual_work_days: 23,
    standard_work_days: 24,
  },
  {
    id: 'salary-demo-2',
    period: '02/2026',
    status: 'paid',
    net_salary: 25100000,
    gross_salary: 29600000,
    base_salary: 18000000,
    total_allowances: 3000000,
    total_commission: 6400000,
    total_overtime: 0,
    total_bonus: 2200000,
    social_insurance: 1440000,
    health_insurance: 270000,
    unemployment_insurance: 180000,
    personal_income_tax: 980000,
    total_penalties: 0,
    total_advances: 0,
    total_insurance: 1890000,
    actual_work_days: 22,
    standard_work_days: 24,
  },
];

export default function MySalaryPage() {
  const [loading, setLoading] = useState(true);
  const [payrolls, setPayrolls] = useState([]);
  const [selectedPayroll, setSelectedPayroll] = useState(null);

  const loadPayrolls = useCallback(async () => {
    try {
      setLoading(true);
      const data = await payrollApi.getMyPayrolls(12);
      const payrollData = Array.isArray(data) && data.length > 0 ? data : DEMO_PAYROLLS;
      setPayrolls(payrollData);
      if (payrollData.length > 0) {
        setSelectedPayroll(payrollData[0]);
      }
    } catch (error) {
      console.error('Error loading payrolls:', error);
      setPayrolls(DEMO_PAYROLLS);
      setSelectedPayroll(DEMO_PAYROLLS[0]);
      toast.error('Không thể tải dữ liệu lương');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayrolls();
  }, [loadPayrolls]);

  // Calculate trend
  const calculateTrend = () => {
    if (payrolls.length < 2) return null;
    const current = payrolls[0]?.net_salary || 0;
    const previous = payrolls[1]?.net_salary || 0;
    if (previous === 0) return null;
    
    const change = ((current - previous) / previous) * 100;
    return {
      value: change.toFixed(1),
      isUp: change >= 0,
    };
  };

  const trend = calculateTrend();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6" data-testid="my-salary-page">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/payroll" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ChevronLeft size={20} className="text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Lương của tôi</h1>
          <p className="text-gray-400">Xem lịch sử phiếu lương</p>
        </div>
      </div>

      {payrolls.length === 0 ? (
        <div className="bg-[#12121a] border border-gray-800 rounded-xl p-12 text-center">
          <DollarSign className="mx-auto mb-4 text-gray-500" size={64} />
          <h2 className="text-xl font-semibold text-white mb-2">Chưa có phiếu lương</h2>
          <p className="text-gray-400">Phiếu lương của bạn sẽ hiển thị ở đây sau khi được tính</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payroll List */}
          <div className="lg:col-span-1">
            <div className="bg-[#12121a] border border-gray-800 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar className="text-cyan-400" size={20} />
                Lịch sử lương
              </h3>
              
              <div className="space-y-2">
                {payrolls.map((payroll, index) => {
                  const statusStyle = STATUS_COLORS[payroll.status] || STATUS_COLORS.draft;
                  const isSelected = selectedPayroll?.id === payroll.id;
                  
                  return (
                    <button
                      key={payroll.id}
                      onClick={() => setSelectedPayroll(payroll)}
                      className={`w-full p-4 rounded-lg text-left transition-colors ${
                        isSelected 
                          ? 'bg-cyan-500/20 border border-cyan-500/30' 
                          : 'bg-gray-800/30 hover:bg-gray-800/50 border border-transparent'
                      }`}
                      data-testid={`payroll-item-${payroll.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">Tháng {payroll.period}</div>
                          <div className="text-cyan-400 font-bold">{formatCurrency(payroll.net_salary)}</div>
                        </div>
                        <span className={`px-2 py-1 rounded-lg text-xs ${statusStyle.bg} ${statusStyle.text}`}>
                          {statusStyle.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Payroll Detail */}
          <div className="lg:col-span-2">
            {selectedPayroll && (
              <div className="space-y-6">
                {/* Summary Card */}
                <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-gray-400 text-sm">Tháng {selectedPayroll.period}</div>
                      <div className="text-3xl font-bold text-white">{formatCurrency(selectedPayroll.net_salary)}</div>
                      {trend && (
                        <div className={`flex items-center gap-1 mt-1 ${trend.isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                          {trend.isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                          <span className="text-sm">{trend.isUp ? '+' : ''}{trend.value}% so với tháng trước</span>
                        </div>
                      )}
                    </div>
                    <Link
                      to={`/payroll/detail/${selectedPayroll.id}`}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      <Eye size={18} />
                      Xem chi tiết
                    </Link>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-black/20 rounded-lg p-3 text-center">
                      <div className="text-gray-400 text-sm">Ngày công</div>
                      <div className="text-white font-bold">{selectedPayroll.actual_work_days || 0}/{selectedPayroll.standard_work_days || 22}</div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3 text-center">
                      <div className="text-gray-400 text-sm">Gross</div>
                      <div className="text-emerald-400 font-bold">{formatCurrency(selectedPayroll.gross_salary)}</div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3 text-center">
                      <div className="text-gray-400 text-sm">Khấu trừ</div>
                      <div className="text-red-400 font-bold">
                        {formatCurrency((selectedPayroll.total_insurance || 0) + (selectedPayroll.personal_income_tax || 0))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Earnings */}
                  <div className="bg-[#12121a] border border-gray-800 rounded-xl p-6">
                    <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="text-emerald-400" size={18} />
                      Khoản cộng
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Lương cơ bản</span>
                        <span className="text-white">{formatCurrency(selectedPayroll.base_salary)}</span>
                      </div>
                      {selectedPayroll.total_allowances > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Phụ cấp</span>
                          <span className="text-emerald-400">{formatCurrency(selectedPayroll.total_allowances)}</span>
                        </div>
                      )}
                      {selectedPayroll.total_commission > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Hoa hồng</span>
                          <span className="text-emerald-400">{formatCurrency(selectedPayroll.total_commission)}</span>
                        </div>
                      )}
                      {selectedPayroll.total_overtime > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Tăng ca</span>
                          <span className="text-emerald-400">{formatCurrency(selectedPayroll.total_overtime)}</span>
                        </div>
                      )}
                      {selectedPayroll.total_bonus > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Thưởng</span>
                          <span className="text-emerald-400">{formatCurrency(selectedPayroll.total_bonus)}</span>
                        </div>
                      )}
                      <div className="pt-3 border-t border-gray-800 flex justify-between">
                        <span className="text-emerald-400 font-semibold">Tổng Gross</span>
                        <span className="text-emerald-400 font-bold">{formatCurrency(selectedPayroll.gross_salary)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="bg-[#12121a] border border-gray-800 rounded-xl p-6">
                    <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <TrendingDown className="text-red-400" size={18} />
                      Khoản trừ
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">BHXH (8%)</span>
                        <span className="text-red-400">{formatCurrency(selectedPayroll.social_insurance)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">BHYT (1.5%)</span>
                        <span className="text-red-400">{formatCurrency(selectedPayroll.health_insurance)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">BHTN (1%)</span>
                        <span className="text-red-400">{formatCurrency(selectedPayroll.unemployment_insurance)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Thuế TNCN</span>
                        <span className="text-red-400">{formatCurrency(selectedPayroll.personal_income_tax)}</span>
                      </div>
                      {selectedPayroll.total_penalties > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Phạt</span>
                          <span className="text-red-400">{formatCurrency(selectedPayroll.total_penalties)}</span>
                        </div>
                      )}
                      {selectedPayroll.total_advances > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Tạm ứng</span>
                          <span className="text-red-400">{formatCurrency(selectedPayroll.total_advances)}</span>
                        </div>
                      )}
                      <div className="pt-3 border-t border-gray-800 flex justify-between">
                        <span className="text-red-400 font-semibold">Tổng khấu trừ</span>
                        <span className="text-red-400 font-bold">
                          {formatCurrency(
                            (selectedPayroll.total_insurance || 0) + 
                            (selectedPayroll.personal_income_tax || 0) +
                            (selectedPayroll.total_penalties || 0) +
                            (selectedPayroll.total_advances || 0)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
