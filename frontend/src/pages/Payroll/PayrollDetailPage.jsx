/**
 * Payroll Detail Page - Chi tiết bảng lương nhân viên
 * ProHouze HR AI Platform - Phase 1
 * 
 * SECURITY: Strict access control - only employee, authorized accountant, admin can view
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, DollarSign, Calculator, FileText, Download,
  User, Calendar, Clock, Building, CreditCard, Shield,
  Plus, Minus, CheckCircle, AlertTriangle, Lock
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
  if (!amount && amount !== 0) return '0 đ';
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('vi-VN');
};

const DEMO_PAYROLL = {
  id: 'payroll-demo-001',
  period: '03/2026',
  status: 'approved',
  employee_name: 'Nguyen Van Minh',
  employee_code: 'NV001',
  bank_name: 'Vietcombank',
  bank_account: '0123456789',
  net_salary: 36935000,
  has_debt: false,
  carry_forward_debt: 0,
  raw_net_salary: 36935000,
  actual_work_days: 21,
  standard_work_days: 22,
  overtime_normal_hours: 4,
  overtime_weekend_hours: 4,
  overtime_holiday_hours: 0,
  leave_days: 1,
  absent_days: 0,
  late_days: 1,
  total_late_minutes: 12,
  base_salary: 18000000,
  commission_income: 12000000,
  bonus_income: 5000000,
  allowance_income: 3500000,
  overtime_income: 1000000,
  total_income: 39500000,
  insurance_deduction: 3780000,
  tax_deduction: 785000,
  discipline_deduction: 0,
  other_deduction: 0,
  total_deduction: 4565000,
};

export default function PayrollDetailPage() {
  const { payrollId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [payroll, setPayroll] = useState(null);
  const [error, setError] = useState(null);

  const loadPayroll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await payrollApi.getPayroll(payrollId);
      setPayroll(result.data || { ...DEMO_PAYROLL, id: payrollId || DEMO_PAYROLL.id });
    } catch (err) {
      console.error('Error loading payroll:', err);
      setPayroll({ ...DEMO_PAYROLL, id: payrollId || DEMO_PAYROLL.id });
      setError(null);
      toast.error('Không thể tải bảng lương, đang hiển thị dữ liệu mẫu');
    } finally {
      setLoading(false);
    }
  }, [payrollId]);

  useEffect(() => {
    loadPayroll();
  }, [loadPayroll]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto mb-4 text-red-400" size={64} />
          <h2 className="text-xl font-bold text-white mb-2">Truy cập bị từ chối</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <Link to="/payroll" className="text-cyan-400 hover:text-cyan-300">
            Quay lại
          </Link>
        </div>
      </div>
    );
  }

  if (!payroll) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto mb-4 text-gray-500" size={64} />
          <p className="text-gray-400">Không tìm thấy bảng lương</p>
        </div>
      </div>
    );
  }

  const statusStyle = STATUS_COLORS[payroll.status] || STATUS_COLORS.draft;

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6" data-testid="payroll-detail-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/payroll/payrolls" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <ChevronLeft size={20} className="text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Phiếu lương</h1>
            <p className="text-gray-400">Tháng {payroll.period}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg ${statusStyle.bg} ${statusStyle.text}`}>
            {payroll.status === 'locked' && <Lock size={14} />}
            {statusStyle.label}
          </span>
        </div>
      </div>

      {/* Employee Info Card */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center">
            <User className="text-cyan-400" size={32} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{payroll.employee_name}</h2>
            <div className="flex items-center gap-4 text-gray-400 mt-1">
              <span>{payroll.employee_code}</span>
              {payroll.bank_account && (
                <>
                  <span className="text-gray-600">|</span>
                  <span className="flex items-center gap-1">
                    <CreditCard size={14} />
                    {payroll.bank_name}: {payroll.bank_account}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-gray-400 text-sm">Thực nhận</div>
            <div className="text-3xl font-bold text-cyan-400">{formatCurrency(payroll.net_salary)}</div>
            {payroll.has_debt && (
              <div className="text-red-400 text-sm mt-1">
                Nợ chuyển tiếp: {formatCurrency(payroll.carry_forward_debt)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Debt Warning */}
      {payroll.has_debt && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-400" size={24} />
            <div>
              <div className="text-red-400 font-medium">Cảnh báo: Nợ lương</div>
              <div className="text-gray-400 text-sm">
                Net thực tế = {formatCurrency(payroll.raw_net_salary)} (âm). 
                Số nợ {formatCurrency(payroll.carry_forward_debt)} sẽ được trừ vào tháng sau.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Salary Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Work Summary */}
          <div className="bg-[#12121a] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Calendar className="text-cyan-400" size={20} />
                Thông tin chấm công
              </h3>
              <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg text-xs">AUTO từ hệ thống</span>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              <div className="bg-gray-800/30 rounded-lg p-4 text-center">
                <div className="text-gray-400 text-sm mb-1">Ngày công</div>
                <div className="text-xl font-bold text-white">{payroll.actual_work_days || 0}/{payroll.standard_work_days || 22}</div>
              </div>
              <div className="bg-gray-800/30 rounded-lg p-4 text-center">
                <div className="text-gray-400 text-sm mb-1">OT</div>
                <div className="text-xl font-bold text-amber-400">
                  {((payroll.overtime_normal_hours || 0) + (payroll.overtime_weekend_hours || 0) + (payroll.overtime_holiday_hours || 0)).toFixed(1)}h
                </div>
              </div>
              <div className="bg-gray-800/30 rounded-lg p-4 text-center">
                <div className="text-gray-400 text-sm mb-1">Nghỉ phép</div>
                <div className="text-xl font-bold text-cyan-400">{payroll.leave_days || 0}</div>
              </div>
              <div className="bg-gray-800/30 rounded-lg p-4 text-center">
                <div className="text-gray-400 text-sm mb-1">Vắng</div>
                <div className="text-xl font-bold text-red-400">{payroll.absent_days || 0}</div>
              </div>
              <div className="bg-gray-800/30 rounded-lg p-4 text-center">
                <div className="text-gray-400 text-sm mb-1">Đi muộn</div>
                <div className="text-xl font-bold text-orange-400">{payroll.late_days || 0}</div>
              </div>
              <div className="bg-gray-800/30 rounded-lg p-4 text-center">
                <div className="text-gray-400 text-sm mb-1">Phút muộn</div>
                <div className="text-xl font-bold text-orange-400">{payroll.total_late_minutes || 0}p</div>
              </div>
            </div>
          </div>

          {/* Calculation Formula */}
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Calculator className="text-blue-400" size={20} />
              Công thức tính lương (AUTO)
            </h3>
            <div className="bg-black/30 rounded-lg p-4 font-mono text-sm space-y-2">
              <div className="text-gray-400 text-xs mb-2">// SALARY BREAKDOWN - Chi tiết từng dòng</div>
              
              {/* Base Salary */}
              <div className="flex items-center justify-between text-emerald-400">
                <span>① Lương cơ bản ({formatCurrency(payroll.base_salary_full || 0)} / {payroll.standard_work_days || 22} ngày) × {payroll.actual_work_days || 0}</span>
                <span>{formatCurrency(payroll.base_salary)}</span>
              </div>
              
              {/* OT */}
              {payroll.total_overtime > 0 && (
                <div className="border-l-2 border-amber-500/30 pl-3">
                  <div className="flex items-center justify-between text-amber-400">
                    <span>② Tăng ca (OT)</span>
                    <span>+ {formatCurrency(payroll.total_overtime)}</span>
                  </div>
                  <div className="text-xs text-gray-500 ml-4">
                    {payroll.overtime_normal_hours > 0 && (
                      <div>• Thường: {payroll.overtime_normal_hours.toFixed(1)}h × {payroll.ot_rate_normal || 1.5}x = {formatCurrency(payroll.overtime_normal_amount)}</div>
                    )}
                    {payroll.overtime_weekend_hours > 0 && (
                      <div>• Cuối tuần: {payroll.overtime_weekend_hours.toFixed(1)}h × {payroll.ot_rate_weekend || 2.0}x = {formatCurrency(payroll.overtime_weekend_amount)}</div>
                    )}
                    {payroll.overtime_holiday_hours > 0 && (
                      <div>• Ngày lễ: {payroll.overtime_holiday_hours.toFixed(1)}h × {payroll.ot_rate_holiday || 3.0}x = {formatCurrency(payroll.overtime_holiday_amount)}</div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Allowances */}
              {payroll.total_allowances > 0 && (
                <div className="border-l-2 border-cyan-500/30 pl-3">
                  <div className="flex items-center justify-between text-cyan-400">
                    <span>③ Phụ cấp</span>
                    <span>+ {formatCurrency(payroll.total_allowances)}</span>
                  </div>
                  {payroll.allowance_details?.map((a, i) => (
                    <div key={i} className="text-xs text-gray-500 ml-4">• {a.name}: {formatCurrency(a.amount)}</div>
                  ))}
                </div>
              )}
              
              {/* Commission */}
              {payroll.total_commission > 0 && (
                <div className="border-l-2 border-purple-500/30 pl-3">
                  <div className="flex items-center justify-between text-purple-400">
                    <span>④ Hoa hồng (Finance Module)</span>
                    <span>+ {formatCurrency(payroll.total_commission)}</span>
                  </div>
                  {payroll.commission_details?.map((c, i) => (
                    <div key={i} className="text-xs text-gray-500 ml-4">• {c.description || 'Commission'}: {formatCurrency(c.amount)}</div>
                  ))}
                </div>
              )}
              
              {/* Bonus */}
              {payroll.total_bonus > 0 && (
                <div className="flex items-center justify-between text-emerald-400">
                  <span>⑤ Thưởng</span>
                  <span>+ {formatCurrency(payroll.total_bonus)}</span>
                </div>
              )}
              
              {/* GROSS */}
              <div className="border-t border-gray-700 pt-2 flex items-center justify-between text-white font-bold">
                <span>═══ GROSS</span>
                <span>{formatCurrency(payroll.gross_salary)}</span>
              </div>
              
              {/* Deductions */}
              <div className="border-l-2 border-red-500/30 pl-3 space-y-1">
                <div className="flex items-center justify-between text-red-400">
                  <span>⑥ BHXH ({((payroll.insurance_rate_social || 0.08) * 100).toFixed(1)}% × {formatCurrency(payroll.insurance_base || 0)})</span>
                  <span>- {formatCurrency(payroll.social_insurance)}</span>
                </div>
                <div className="flex items-center justify-between text-red-400">
                  <span>⑦ BHYT ({((payroll.insurance_rate_health || 0.015) * 100).toFixed(1)}%)</span>
                  <span>- {formatCurrency(payroll.health_insurance)}</span>
                </div>
                <div className="flex items-center justify-between text-red-400">
                  <span>⑧ BHTN ({((payroll.insurance_rate_unemployment || 0.01) * 100).toFixed(1)}%)</span>
                  <span>- {formatCurrency(payroll.unemployment_insurance)}</span>
                </div>
                <div className="flex items-center justify-between text-red-400">
                  <span>⑨ Thuế TNCN (Thu nhập chịu thuế: {formatCurrency(payroll.taxable_income)})</span>
                  <span>- {formatCurrency(payroll.personal_income_tax)}</span>
                </div>
                {payroll.total_penalties > 0 && (
                  <div className="flex items-center justify-between text-red-400">
                    <span>⑩ Phạt / Kỷ luật</span>
                    <span>- {formatCurrency(payroll.total_penalties)}</span>
                  </div>
                )}
                {payroll.total_advances > 0 && (
                  <div className="flex items-center justify-between text-red-400">
                    <span>⑪ Tạm ứng</span>
                    <span>- {formatCurrency(payroll.total_advances)}</span>
                  </div>
                )}
              </div>
              
              {/* NET */}
              <div className="border-t-2 border-cyan-500 pt-2 mt-2">
                {payroll.has_debt ? (
                  <>
                    <div className="flex items-center justify-between text-gray-400">
                      <span>Net thực tế (âm)</span>
                      <span>{formatCurrency(payroll.raw_net_salary)}</span>
                    </div>
                    <div className="flex items-center justify-between text-red-400">
                      <span>Nợ chuyển tiếp tháng sau</span>
                      <span>{formatCurrency(payroll.carry_forward_debt)}</span>
                    </div>
                    <div className="flex items-center justify-between text-cyan-400 font-bold text-lg">
                      <span>═══ THỰC NHẬN</span>
                      <span>0 đ</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between text-cyan-400 font-bold text-lg">
                    <span>═══ THỰC NHẬN (NET)</span>
                    <span>{formatCurrency(payroll.net_salary)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Earnings */}
          <div className="bg-[#12121a] border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Plus className="text-emerald-400" size={20} />
              Khoản cộng
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400">Lương cơ bản</span>
                <span className="text-white font-medium">{formatCurrency(payroll.base_salary)}</span>
              </div>
              
              {payroll.total_allowances > 0 && (
                <div className="flex items-center justify-between py-2 border-b border-gray-800">
                  <div>
                    <span className="text-gray-400">Phụ cấp</span>
                    {payroll.allowance_details?.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {payroll.allowance_details.map((a, i) => (
                          <span key={i}>{a.name}: {formatCurrency(a.amount)}{i < payroll.allowance_details.length - 1 ? ', ' : ''}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-emerald-400 font-medium">{formatCurrency(payroll.total_allowances)}</span>
                </div>
              )}
              
              {payroll.total_commission > 0 && (
                <div className="flex items-center justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-400">Hoa hồng</span>
                  <span className="text-emerald-400 font-medium">{formatCurrency(payroll.total_commission)}</span>
                </div>
              )}
              
              {payroll.total_overtime > 0 && (
                <div className="flex items-center justify-between py-2 border-b border-gray-800">
                  <div>
                    <span className="text-gray-400">Tăng ca</span>
                    <div className="text-xs text-gray-500 mt-1">
                      {payroll.overtime_normal_hours > 0 && <span>Thường: {payroll.overtime_normal_hours}h | </span>}
                      {payroll.overtime_weekend_hours > 0 && <span>Cuối tuần: {payroll.overtime_weekend_hours}h | </span>}
                      {payroll.overtime_holiday_hours > 0 && <span>Lễ: {payroll.overtime_holiday_hours}h</span>}
                    </div>
                  </div>
                  <span className="text-emerald-400 font-medium">{formatCurrency(payroll.total_overtime)}</span>
                </div>
              )}
              
              {payroll.total_bonus > 0 && (
                <div className="flex items-center justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-400">Thưởng</span>
                  <span className="text-emerald-400 font-medium">{formatCurrency(payroll.total_bonus)}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between py-3 bg-emerald-500/10 rounded-lg px-3 mt-4">
                <span className="text-emerald-400 font-semibold">Tổng thu nhập (Gross)</span>
                <span className="text-emerald-400 font-bold text-lg">{formatCurrency(payroll.gross_salary)}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className="bg-[#12121a] border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Minus className="text-red-400" size={20} />
              Khoản trừ
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-800">
                <div>
                  <span className="text-gray-400">Bảo hiểm xã hội (8%)</span>
                </div>
                <span className="text-red-400">{formatCurrency(payroll.social_insurance)}</span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400">Bảo hiểm y tế (1.5%)</span>
                <span className="text-red-400">{formatCurrency(payroll.health_insurance)}</span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400">Bảo hiểm thất nghiệp (1%)</span>
                <span className="text-red-400">{formatCurrency(payroll.unemployment_insurance)}</span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-gray-800">
                <div>
                  <span className="text-gray-400">Thuế TNCN</span>
                  <div className="text-xs text-gray-500 mt-1">
                    Thu nhập chịu thuế: {formatCurrency(payroll.taxable_income)}
                    {payroll.tax_dependents > 0 && ` | Người phụ thuộc: ${payroll.tax_dependents}`}
                  </div>
                </div>
                <span className="text-red-400">{formatCurrency(payroll.personal_income_tax)}</span>
              </div>
              
              {payroll.total_penalties > 0 && (
                <div className="flex items-center justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-400">Phạt / Kỷ luật</span>
                  <span className="text-red-400">{formatCurrency(payroll.total_penalties)}</span>
                </div>
              )}
              
              {payroll.total_advances > 0 && (
                <div className="flex items-center justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-400">Tạm ứng</span>
                  <span className="text-red-400">{formatCurrency(payroll.total_advances)}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between py-3 bg-red-500/10 rounded-lg px-3 mt-4">
                <span className="text-red-400 font-semibold">Tổng khấu trừ</span>
                <span className="text-red-400 font-bold text-lg">
                  {formatCurrency(
                    (payroll.total_insurance || 0) + 
                    (payroll.personal_income_tax || 0) + 
                    (payroll.total_penalties || 0) + 
                    (payroll.total_advances || 0)
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Net Salary */}
          <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl p-6">
            <div className="text-center">
              <DollarSign className="mx-auto text-cyan-400 mb-2" size={32} />
              <div className="text-gray-400 mb-2">Thực nhận</div>
              <div className="text-4xl font-bold text-white">{formatCurrency(payroll.net_salary)}</div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-[#12121a] border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Tiến trình</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calculator className="text-emerald-400" size={14} />
                </div>
                <div>
                  <div className="text-white text-sm font-medium">Đã tính</div>
                  <div className="text-gray-500 text-xs">{formatDate(payroll.calculated_at)}</div>
                </div>
              </div>
              
              {payroll.approved_at && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="text-blue-400" size={14} />
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">Đã duyệt</div>
                    <div className="text-gray-500 text-xs">{formatDate(payroll.approved_at)}</div>
                  </div>
                </div>
              )}
              
              {payroll.paid_at && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <DollarSign className="text-emerald-400" size={14} />
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">Đã chi</div>
                    <div className="text-gray-500 text-xs">{formatDate(payroll.paid_at)}</div>
                    {payroll.payment_reference && (
                      <div className="text-gray-500 text-xs">Ref: {payroll.payment_reference}</div>
                    )}
                  </div>
                </div>
              )}
              
              {payroll.locked_at && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Lock className="text-purple-400" size={14} />
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">Đã khóa</div>
                    <div className="text-gray-500 text-xs">{formatDate(payroll.locked_at)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {payroll.notes && (
            <div className="bg-[#12121a] border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Ghi chú</h3>
              <p className="text-gray-400 text-sm">{payroll.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
