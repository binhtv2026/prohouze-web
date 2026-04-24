/**
 * Payroll Rules Config Page - Cấu hình quy tắc tính lương
 * ProHouze HR AI Platform - Phase 1
 * 
 * HR chỉ chỉnh RULE, không chỉnh số tiền trực tiếp
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronLeft, Settings, DollarSign, Percent, Clock,
  Calculator, Shield, Save, AlertTriangle, CheckCircle,
  RefreshCw, Users, Briefcase
} from 'lucide-react';
import { payrollApi } from '../../api/payrollApi';
import { toast } from 'sonner';

const DEMO_PAYROLL_RULES = {
  insurance: {
    social_rate: 0.08,
    health_rate: 0.015,
    unemployment_rate: 0.01,
    insurance_cap: 36000000,
  },
  overtime: {
    weekday_rate: 1.5,
    weekend_rate: 2,
    holiday_rate: 3,
  },
  deductions: {
    late_per_minute: 10000,
    early_leave_per_minute: 10000,
    absent_per_day: 350000,
  },
  work: {
    standard_work_days: 24,
    standard_work_hours: 8,
  },
};

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0 đ';
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
};

const formatPercent = (value) => {
  return `${(value * 100).toFixed(1)}%`;
};

export default function PayrollRulesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  const loadRules = useCallback(async () => {
    try {
      setLoading(true);
      const result = await payrollApi.getPayrollRules();
      setRules(result?.data || DEMO_PAYROLL_RULES);
      setHasChanges(false);
    } catch (error) {
      console.error('Error loading rules:', error);
      setRules(DEMO_PAYROLL_RULES);
      toast.error('Không thể tải cấu hình');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await payrollApi.updatePayrollRules(rules);
      toast.success('Đã lưu cấu hình');
      setHasChanges(false);
    } catch (error) {
      toast.error(error.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const updateInsurance = (key, value) => {
    setRules({
      ...rules,
      insurance: {
        ...rules.insurance,
        [key]: parseFloat(value) || 0,
      },
    });
    setHasChanges(true);
  };

  const updateOvertime = (key, value) => {
    setRules({
      ...rules,
      overtime: {
        ...rules.overtime,
        [key]: parseFloat(value) || 0,
      },
    });
    setHasChanges(true);
  };

  const updateDeduction = (key, value) => {
    setRules({
      ...rules,
      deductions: {
        ...rules.deductions,
        [key]: parseFloat(value) || 0,
      },
    });
    setHasChanges(true);
  };

  const updateWork = (key, value) => {
    setRules({
      ...rules,
      work: {
        ...rules.work,
        [key]: parseInt(value) || 0,
      },
    });
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6" data-testid="payroll-rules-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/payroll" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <ChevronLeft size={20} className="text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Cấu hình quy tắc</h1>
            <p className="text-gray-400">Chỉnh RULE, không chỉnh số tiền trực tiếp</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={loadRules}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <RefreshCw size={18} />
            Reload
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-lg transition-colors disabled:opacity-50"
            data-testid="save-rules-btn"
          >
            <Save size={18} />
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-amber-400" size={24} />
          <div>
            <div className="text-amber-400 font-medium">Lưu ý quan trọng</div>
            <div className="text-gray-400 text-sm">
              Thay đổi quy tắc sẽ áp dụng cho TẤT CẢ bảng lương CHƯA KHÓA. Đảm bảo kiểm tra kỹ trước khi lưu.
            </div>
          </div>
        </div>
      </div>

      {rules && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Insurance Rates */}
          <div className="bg-[#12121a] border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Shield className="text-blue-400" size={20} />
              Bảo hiểm
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm mb-2 block">
                  BHXH (Bảo hiểm xã hội)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.001"
                    value={rules.insurance?.social_rate || 0.08}
                    onChange={(e) => updateInsurance('social_rate', e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    data-testid="social-rate-input"
                  />
                  <span className="text-cyan-400 w-16 text-right">
                    {formatPercent(rules.insurance?.social_rate || 0.08)}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="text-gray-400 text-sm mb-2 block">
                  BHYT (Bảo hiểm y tế)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.001"
                    value={rules.insurance?.health_rate || 0.015}
                    onChange={(e) => updateInsurance('health_rate', e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                  <span className="text-cyan-400 w-16 text-right">
                    {formatPercent(rules.insurance?.health_rate || 0.015)}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="text-gray-400 text-sm mb-2 block">
                  BHTN (Bảo hiểm thất nghiệp)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.001"
                    value={rules.insurance?.unemployment_rate || 0.01}
                    onChange={(e) => updateInsurance('unemployment_rate', e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                  <span className="text-cyan-400 w-16 text-right">
                    {formatPercent(rules.insurance?.unemployment_rate || 0.01)}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="text-gray-400 text-sm mb-2 block">
                  Mức trần đóng BH
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1000000"
                    value={rules.insurance?.insurance_cap || 36000000}
                    onChange={(e) => updateInsurance('insurance_cap', e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                  <span className="text-cyan-400 w-24 text-right text-sm">
                    {formatCurrency(rules.insurance?.insurance_cap || 36000000)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* OT Rates */}
          <div className="bg-[#12121a] border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Clock className="text-amber-400" size={20} />
              Tăng ca (OT)
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm mb-2 block">
                  OT ngày thường (x lương giờ)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={rules.overtime?.normal_rate || 1.5}
                    onChange={(e) => updateOvertime('normal_rate', e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    data-testid="ot-normal-input"
                  />
                  <span className="text-amber-400 w-16 text-right">
                    {rules.overtime?.normal_rate || 1.5}x
                  </span>
                </div>
              </div>
              
              <div>
                <label className="text-gray-400 text-sm mb-2 block">
                  OT cuối tuần (x lương giờ)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={rules.overtime?.weekend_rate || 2.0}
                    onChange={(e) => updateOvertime('weekend_rate', e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                  <span className="text-amber-400 w-16 text-right">
                    {rules.overtime?.weekend_rate || 2.0}x
                  </span>
                </div>
              </div>
              
              <div>
                <label className="text-gray-400 text-sm mb-2 block">
                  OT ngày lễ (x lương giờ)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={rules.overtime?.holiday_rate || 3.0}
                    onChange={(e) => updateOvertime('holiday_rate', e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                  <span className="text-amber-400 w-16 text-right">
                    {rules.overtime?.holiday_rate || 3.0}x
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tax Deductions */}
          <div className="bg-[#12121a] border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Calculator className="text-red-400" size={20} />
              Giảm trừ thuế TNCN
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm mb-2 block">
                  Giảm trừ bản thân
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1000000"
                    value={rules.deductions?.personal || 11000000}
                    onChange={(e) => updateDeduction('personal', e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    data-testid="personal-deduction-input"
                  />
                  <span className="text-cyan-400 w-24 text-right text-sm">
                    {formatCurrency(rules.deductions?.personal || 11000000)}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="text-gray-400 text-sm mb-2 block">
                  Giảm trừ người phụ thuộc (mỗi người)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="100000"
                    value={rules.deductions?.dependent || 4400000}
                    onChange={(e) => updateDeduction('dependent', e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                  <span className="text-cyan-400 w-24 text-right text-sm">
                    {formatCurrency(rules.deductions?.dependent || 4400000)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Work Config */}
          <div className="bg-[#12121a] border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Briefcase className="text-emerald-400" size={20} />
              Cấu hình làm việc
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm mb-2 block">
                  Ngày công chuẩn / tháng
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={rules.work?.standard_days_per_month || 22}
                    onChange={(e) => updateWork('standard_days_per_month', e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    data-testid="work-days-input"
                  />
                  <span className="text-emerald-400 w-16 text-right">ngày</span>
                </div>
              </div>
              
              <div>
                <label className="text-gray-400 text-sm mb-2 block">
                  Giờ làm chuẩn / ngày
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={rules.work?.standard_hours_per_day || 8}
                    onChange={(e) => updateWork('standard_hours_per_day', e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                  <span className="text-emerald-400 w-16 text-right">giờ</span>
                </div>
              </div>
              
              <div>
                <label className="text-gray-400 text-sm mb-2 block">
                  Cho phép đi muộn (không phạt)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={rules.work?.late_tolerance_minutes || 15}
                    onChange={(e) => updateWork('late_tolerance_minutes', e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                  <span className="text-emerald-400 w-16 text-right">phút</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tax Brackets (read-only) */}
          <div className="bg-[#12121a] border border-gray-800 rounded-xl p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Percent className="text-purple-400" size={20} />
              Biểu thuế TNCN lũy tiến
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="p-3 text-left text-gray-400 font-medium">Bậc</th>
                    <th className="p-3 text-left text-gray-400 font-medium">Thu nhập chịu thuế</th>
                    <th className="p-3 text-center text-gray-400 font-medium">Thuế suất</th>
                  </tr>
                </thead>
                <tbody>
                  {(rules.tax_brackets || []).map((bracket, index) => (
                    <tr key={index} className="border-t border-gray-800">
                      <td className="p-3 text-white">{bracket.label || `Bậc ${index + 1}`}</td>
                      <td className="p-3 text-gray-400">
                        {bracket.threshold ? `Đến ${formatCurrency(bracket.threshold)}` : 'Trên 80M'}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-lg">
                          {formatPercent(bracket.rate)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-500 text-sm mt-4">
              * Biểu thuế theo quy định của Bộ Tài chính. Liên hệ admin để cập nhật khi có thay đổi.
            </p>
          </div>
        </div>
      )}

      {/* Saved Changes Indicator */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 bg-amber-500 text-black px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <AlertTriangle size={18} />
          Có thay đổi chưa lưu
        </div>
      )}
    </div>
  );
}
