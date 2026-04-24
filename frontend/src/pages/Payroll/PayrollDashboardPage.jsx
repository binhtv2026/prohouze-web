/**
 * Payroll Dashboard Page
 * ProHouze HR AI Platform - Phase 1
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, Users, CalendarDays, DollarSign, AlertTriangle,
  CheckCircle, XCircle, Calculator, FileText, TrendingUp,
  Calendar, ChevronRight, Briefcase, UserCheck
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

const DEMO_PAYROLL_DASHBOARD = {
  current_period: '03/2026',
  pending_leave_requests: 3,
  today_attendance: {
    total_employees: 148,
    checked_in: 131,
    anomalies: 5,
  },
  payroll_summary: {
    total_employees: 148,
    total_gross: 2840000000,
    total_net: 2380000000,
    total_tax: 142000000,
    by_status: {
      draft: 12,
      calculated: 84,
      approved: 31,
      paid: 18,
      locked: 3,
    },
  },
};

const DEMO_TODAY_ATTENDANCE = {
  id: 'payroll-dashboard-attendance-demo',
  check_in_time: '08:05',
  check_out_time: null,
  work_hours: 0,
};

const DEMO_PENDING_LEAVES = [
  { id: 'payroll-leave-demo-1', employee_name: 'Nguyễn Minh Anh', leave_type: 'annual', start_date: '2026-03-28', end_date: '2026-03-29', days_count: 2 },
  { id: 'payroll-leave-demo-2', employee_name: 'Trần Quốc Huy', leave_type: 'sick', start_date: '2026-03-26', end_date: '2026-03-26', days_count: 1 },
  { id: 'payroll-leave-demo-3', employee_name: 'Lê Thanh Hà', leave_type: 'compensatory', start_date: '2026-03-30', end_date: '2026-03-30', days_count: 1 },
];

const formatCurrency = (amount) => {
  if (!amount) return '0';
  if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)}B`;
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(0)}M`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
  return amount.toLocaleString('vi-VN');
};

export default function PayrollDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [pendingLeaves, setPendingLeaves] = useState([]);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const dashboardData = await payrollApi.getDashboard();
      setDashboard(dashboardData || DEMO_PAYROLL_DASHBOARD);
      
      try {
        const attendanceData = await payrollApi.getTodayAttendance();
        setTodayAttendance(attendanceData?.data || DEMO_TODAY_ATTENDANCE);
      } catch (e) {
        console.log('No attendance data (user may not have HR profile)');
        setTodayAttendance(DEMO_TODAY_ATTENDANCE);
      }
      
      try {
        const leavesData = await payrollApi.getLeaveRequests({ pending_only: true, limit: 5 });
        setPendingLeaves(Array.isArray(leavesData) && leavesData.length > 0 ? leavesData : DEMO_PENDING_LEAVES);
      } catch (e) {
        console.log('Could not load leave requests');
        setPendingLeaves(DEMO_PENDING_LEAVES);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setDashboard(DEMO_PAYROLL_DASHBOARD);
      setTodayAttendance(DEMO_TODAY_ATTENDANCE);
      setPendingLeaves(DEMO_PENDING_LEAVES);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleCheckIn = async () => {
    try {
      const result = await payrollApi.checkIn({});
      if (result.success) {
        toast.success(`Check-in lúc ${result.data.check_in_time}`);
        loadDashboard();
      }
    } catch (error) {
      toast.error(error.message || 'Check-in thất bại');
    }
  };

  const handleCheckOut = async () => {
    try {
      const result = await payrollApi.checkOut({});
      if (result.success) {
        toast.success(`Check-out lúc ${result.data.check_out_time}. Làm việc: ${result.data.work_hours}h`);
        loadDashboard();
      }
    } catch (error) {
      toast.error(error.message || 'Check-out thất bại');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  const summary = dashboard?.payroll_summary;
  const attendanceStats = dashboard?.today_attendance;

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6" data-testid="payroll-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">AUTO Payroll Engine</h1>
          <p className="text-gray-400 mt-1">Tự động 100% - Không Excel - Không sai số</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/payroll/summary"
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <FileText size={18} />
            Tổng hợp công
          </Link>
          <Link
            to="/payroll/payrolls"
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-lg transition-colors"
          >
            <Calculator size={18} />
            1 Click - Bảng lương
          </Link>
        </div>
      </div>

      {/* AUTO Flow Banner */}
      <div className="bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 border border-emerald-500/20 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-4 overflow-x-auto pb-2">
          <div className="flex items-center gap-2 bg-emerald-500/20 px-4 py-2 rounded-lg flex-shrink-0">
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
            <Link to="/payroll/attendance" className="text-emerald-400 hover:text-emerald-300">Check-in/out</Link>
          </div>
          <ChevronRight className="text-gray-600 flex-shrink-0" size={16} />
          <div className="flex items-center gap-2 bg-blue-500/20 px-4 py-2 rounded-lg flex-shrink-0">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
            <span className="text-blue-400">Attendance Record</span>
          </div>
          <ChevronRight className="text-gray-600 flex-shrink-0" size={16} />
          <div className="flex items-center gap-2 bg-cyan-500/20 px-4 py-2 rounded-lg flex-shrink-0">
            <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
            <Link to="/payroll/summary" className="text-cyan-400 hover:text-cyan-300">Tổng hợp tháng</Link>
          </div>
          <ChevronRight className="text-gray-600 flex-shrink-0" size={16} />
          <div className="flex items-center gap-2 bg-amber-500/20 px-4 py-2 rounded-lg flex-shrink-0">
            <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-black text-xs font-bold">4</div>
            <Link to="/payroll/payrolls" className="text-amber-400 hover:text-amber-300">Tính lương AUTO</Link>
          </div>
          <ChevronRight className="text-gray-600 flex-shrink-0" size={16} />
          <div className="flex items-center gap-2 bg-purple-500/20 px-4 py-2 rounded-lg flex-shrink-0">
            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">5</div>
            <span className="text-purple-400 font-bold">Net Salary</span>
          </div>
        </div>
      </div>

      {/* Quick Check-in/out Card */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Chấm công hôm nay</h2>
            <div className="text-gray-400">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            {todayAttendance ? (
              <div className="mt-3 space-y-1">
                <div className="text-emerald-400">
                  Check-in: {todayAttendance.check_in_time || 'Chưa'}
                </div>
                <div className="text-amber-400">
                  Check-out: {todayAttendance.check_out_time || 'Chưa'}
                </div>
                {todayAttendance.work_hours > 0 && (
                  <div className="text-cyan-400">
                    Giờ làm: {todayAttendance.work_hours}h
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-3 text-gray-500">Chưa có dữ liệu chấm công</div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {!todayAttendance?.check_in_time ? (
              <button
                onClick={handleCheckIn}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors"
                data-testid="check-in-btn"
              >
                <UserCheck size={20} />
                Check-in
              </button>
            ) : !todayAttendance?.check_out_time ? (
              <button
                onClick={handleCheckOut}
                className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-xl transition-colors"
                data-testid="check-out-btn"
              >
                <Clock size={20} />
                Check-out
              </button>
            ) : (
              <div className="flex items-center gap-2 px-6 py-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <CheckCircle size={20} />
                Đã hoàn thành
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Users className="text-blue-400" size={24} />
            </div>
            <span className="text-2xl font-bold text-white">{attendanceStats?.total_employees || 0}</span>
          </div>
          <div className="text-gray-400">Tổng nhân sự</div>
          <div className="text-blue-400 text-sm mt-1">{attendanceStats?.checked_in || 0} đã check-in</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-500/20 rounded-lg">
              <DollarSign className="text-emerald-400" size={24} />
            </div>
            <span className="text-2xl font-bold text-white">{formatCurrency(summary?.total_gross)}</span>
          </div>
          <div className="text-gray-400">Tổng lương gross</div>
          <div className="text-emerald-400 text-sm mt-1">{dashboard?.current_period}</div>
        </div>

        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-500/20 rounded-lg">
              <CalendarDays className="text-amber-400" size={24} />
            </div>
            <span className="text-2xl font-bold text-white">{dashboard?.pending_leave_requests || 0}</span>
          </div>
          <div className="text-gray-400">Đơn nghỉ phép</div>
          <div className="text-amber-400 text-sm mt-1">Chờ duyệt</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <AlertTriangle className="text-purple-400" size={24} />
            </div>
            <span className="text-2xl font-bold text-white">{attendanceStats?.anomalies || 0}</span>
          </div>
          <div className="text-gray-400">Bất thường</div>
          <div className="text-purple-400 text-sm mt-1">Hôm nay</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payroll Summary */}
        <div className="lg:col-span-2 bg-[#12121a] border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Calculator size={20} className="text-cyan-400" />
              Bảng lương tháng {dashboard?.current_period}
            </h2>
            <Link to="/payroll/payrolls" className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1">
              Xem chi tiết <ChevronRight size={16} />
            </Link>
          </div>

          {summary ? (
            <div className="space-y-4">
              {/* Status breakdown */}
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(summary.by_status || {}).map(([status, count]) => {
                  const style = STATUS_COLORS[status] || STATUS_COLORS.draft;
                  return (
                    <div key={status} className={`p-3 rounded-lg ${style.bg} text-center`}>
                      <div className={`text-xl font-bold ${style.text}`}>{count}</div>
                      <div className="text-gray-400 text-xs">{style.label}</div>
                    </div>
                  );
                })}
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-800">
                <div>
                  <div className="text-gray-400 text-sm">Số nhân viên</div>
                  <div className="text-white text-xl font-bold">{summary.total_employees}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Tổng Gross</div>
                  <div className="text-emerald-400 text-xl font-bold">{formatCurrency(summary.total_gross)}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Tổng Net</div>
                  <div className="text-cyan-400 text-xl font-bold">{formatCurrency(summary.total_net)}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Thuế TNCN</div>
                  <div className="text-amber-400 text-xl font-bold">{formatCurrency(summary.total_tax)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calculator className="mx-auto mb-4" size={48} />
              <p>Chưa có dữ liệu bảng lương</p>
            </div>
          )}
        </div>

        {/* Pending Leave Requests */}
        <div className="bg-[#12121a] border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <CalendarDays size={20} className="text-amber-400" />
              Đơn nghỉ phép chờ duyệt
            </h2>
            <Link to="/payroll/leave" className="text-cyan-400 hover:text-cyan-300 text-sm">
              Xem tất cả
            </Link>
          </div>

          <div className="space-y-3">
            {pendingLeaves.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="mx-auto mb-2 text-emerald-500" size={32} />
                Không có đơn chờ duyệt
              </div>
            ) : (
              pendingLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className="bg-gray-800/30 border border-gray-800 rounded-lg p-3 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">{leave.employee_name}</div>
                      <div className="text-gray-400 text-sm">{leave.employee_code}</div>
                    </div>
                    <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-xs">
                      {leave.days_count} ngày
                    </span>
                  </div>
                  <div className="text-gray-500 text-sm mt-2">
                    {leave.start_date} → {leave.end_date}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <Link
          to="/payroll/attendance"
          className="bg-[#12121a] border border-gray-800 rounded-xl p-4 hover:border-cyan-500/50 transition-colors group"
        >
          <Clock className="text-cyan-400 mb-3" size={24} />
          <div className="text-white font-medium group-hover:text-cyan-400 transition-colors">Chấm công</div>
          <div className="text-gray-500 text-sm">Check-in / Check-out</div>
        </Link>
        
        <Link
          to="/payroll/leave"
          className="bg-[#12121a] border border-gray-800 rounded-xl p-4 hover:border-amber-500/50 transition-colors group"
        >
          <CalendarDays className="text-amber-400 mb-3" size={24} />
          <div className="text-white font-medium group-hover:text-amber-400 transition-colors">Nghỉ phép</div>
          <div className="text-gray-500 text-sm">Xin phép / Duyệt đơn</div>
        </Link>
        
        <Link
          to="/payroll/salary"
          className="bg-[#12121a] border border-gray-800 rounded-xl p-4 hover:border-emerald-500/50 transition-colors group"
        >
          <DollarSign className="text-emerald-400 mb-3" size={24} />
          <div className="text-white font-medium group-hover:text-emerald-400 transition-colors">Lương của tôi</div>
          <div className="text-gray-500 text-sm">Xem phiếu lương</div>
        </Link>
        
        <Link
          to="/payroll/attendance"
          className="bg-[#12121a] border border-gray-800 rounded-xl p-4 hover:border-purple-500/50 transition-colors group"
        >
          <Briefcase className="text-purple-400 mb-3" size={24} />
          <div className="text-white font-medium group-hover:text-purple-400 transition-colors">Ca làm việc</div>
          <div className="text-gray-500 text-sm">Quản lý ca</div>
        </Link>
      </div>
    </div>
  );
}
