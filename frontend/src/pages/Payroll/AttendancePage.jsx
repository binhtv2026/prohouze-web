/**
 * Attendance Page - Quản lý chấm công
 * ProHouze HR AI Platform - Phase 1
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, ChevronLeft, Calendar, Users, CheckCircle, XCircle,
  AlertTriangle, Filter, Download, UserCheck, LogOut
} from 'lucide-react';
import { payrollApi } from '../../api/payrollApi';
import { toast } from 'sonner';

const STATUS_COLORS = {
  present: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Có mặt' },
  absent: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Vắng' },
  late: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Đi muộn' },
  early_leave: { bg: 'bg-orange-500/10', text: 'text-orange-400', label: 'Về sớm' },
  half_day: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Nửa ngày' },
  holiday: { bg: 'bg-purple-500/10', text: 'text-purple-400', label: 'Ngày lễ' },
  weekend: { bg: 'bg-gray-500/10', text: 'text-gray-400', label: 'Cuối tuần' },
  on_leave: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', label: 'Nghỉ phép' },
};

const DEMO_TODAY_ATTENDANCE = {
  id: 'attendance-today-demo',
  check_in_time: '08:07',
  check_out_time: null,
  work_hours: 0,
  overtime_hours: 0,
  late_minutes: 7,
};

const DEMO_ATTENDANCE_RECORDS = [
  {
    id: 'attendance-demo-1',
    employee_name: 'Nguyễn Minh Anh',
    employee_code: 'PH001',
    shift_name: 'Hành chính',
    check_in_time: '08:07',
    check_out_time: '17:45',
    work_hours: 8.6,
    overtime_hours: 0.6,
    late_minutes: 7,
    early_leave_minutes: 0,
    status: 'late',
    note: 'Kẹt xe giờ cao điểm',
  },
  {
    id: 'attendance-demo-2',
    employee_name: 'Trần Quốc Huy',
    employee_code: 'PH014',
    shift_name: 'Hành chính',
    check_in_time: '07:55',
    check_out_time: '17:32',
    work_hours: 8.2,
    overtime_hours: 0,
    late_minutes: 0,
    early_leave_minutes: 0,
    status: 'present',
    note: '',
  },
  {
    id: 'attendance-demo-3',
    employee_name: 'Lê Thanh Hà',
    employee_code: 'PH027',
    shift_name: 'Hành chính',
    check_in_time: null,
    check_out_time: null,
    work_hours: 0,
    overtime_hours: 0,
    late_minutes: 0,
    early_leave_minutes: 0,
    status: 'on_leave',
    note: 'Nghỉ phép đã được duyệt',
  },
];

export default function AttendancePage() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [selectedStatus, setSelectedStatus] = useState('');

  function getToday() {
    return new Date().toISOString().split('T')[0];
  }

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [todayData, recordsData] = await Promise.all([
        payrollApi.getTodayAttendance(),
        payrollApi.getAttendanceRecords({
          start_date: selectedDate,
          end_date: selectedDate,
          status: selectedStatus || undefined,
          limit: 100,
        }),
      ]);
      const recordsPayload = Array.isArray(recordsData) ? recordsData : [];
      const filteredDemoRecords = DEMO_ATTENDANCE_RECORDS.filter((record) => {
        return !selectedStatus || record.status === selectedStatus;
      });
      setTodayAttendance(todayData?.data || DEMO_TODAY_ATTENDANCE);
      setRecords(recordsPayload.length > 0 ? recordsPayload : filteredDemoRecords);
    } catch (error) {
      console.error('Error loading attendance:', error);
      setTodayAttendance(DEMO_TODAY_ATTENDANCE);
      setRecords(DEMO_ATTENDANCE_RECORDS.filter((record) => !selectedStatus || record.status === selectedStatus));
      toast.error('Không thể tải dữ liệu chấm công');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCheckIn = async () => {
    try {
      const result = await payrollApi.checkIn({});
      if (result.success) {
        toast.success(`Check-in thành công lúc ${result.data.check_in_time}`);
        if (result.data.late_minutes > 0) {
          toast.warning(`Bạn đi muộn ${result.data.late_minutes} phút`);
        }
        loadData();
      }
    } catch (error) {
      toast.error(error.message || 'Check-in thất bại');
    }
  };

  const handleCheckOut = async () => {
    try {
      const result = await payrollApi.checkOut({});
      if (result.success) {
        toast.success(`Check-out thành công. Giờ làm: ${result.data.work_hours}h`);
        if (result.data.overtime_hours > 0) {
          toast.info(`Tăng ca: ${result.data.overtime_hours}h`);
        }
        loadData();
      }
    } catch (error) {
      toast.error(error.message || 'Check-out thất bại');
    }
  };

  // Summary statistics
  const summary = {
    total: records.length,
    present: records.filter(r => ['present', 'late', 'early_leave'].includes(r.status)).length,
    absent: records.filter(r => r.status === 'absent').length,
    late: records.filter(r => r.status === 'late').length,
    on_leave: records.filter(r => r.status === 'on_leave').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6" data-testid="attendance-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/payroll" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <ChevronLeft size={20} className="text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Chấm công</h1>
            <p className="text-gray-400">Quản lý giờ làm việc</p>
          </div>
        </div>
      </div>

      {/* My Attendance Card */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Chấm công của tôi</h2>
            <div className="text-gray-400">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            {todayAttendance ? (
              <div className="mt-4 flex items-center gap-6">
                <div>
                  <div className="text-gray-500 text-sm">Check-in</div>
                  <div className="text-emerald-400 text-xl font-bold">
                    {todayAttendance.check_in_time || '--:--'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-sm">Check-out</div>
                  <div className="text-amber-400 text-xl font-bold">
                    {todayAttendance.check_out_time || '--:--'}
                  </div>
                </div>
                {todayAttendance.work_hours > 0 && (
                  <div>
                    <div className="text-gray-500 text-sm">Giờ làm</div>
                    <div className="text-cyan-400 text-xl font-bold">
                      {todayAttendance.work_hours}h
                    </div>
                  </div>
                )}
                {todayAttendance.late_minutes > 0 && (
                  <div>
                    <div className="text-gray-500 text-sm">Đi muộn</div>
                    <div className="text-red-400 text-xl font-bold">
                      {todayAttendance.late_minutes} phút
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 text-gray-500">Chưa chấm công hôm nay</div>
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
                <LogOut size={20} />
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

      {/* Filters */}
      <div className="bg-[#12121a] border border-gray-800 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Ngày</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                data-testid="date-filter"
              />
            </div>
            
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Trạng thái</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                data-testid="status-filter"
              >
                <option value="">Tất cả</option>
                {Object.entries(STATUS_COLORS).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Summary Stats */}
          <div className="flex items-center gap-4">
            <div className="text-center px-4 border-r border-gray-700">
              <div className="text-lg font-bold text-white">{summary.total}</div>
              <div className="text-gray-500 text-xs">Tổng</div>
            </div>
            <div className="text-center px-4 border-r border-gray-700">
              <div className="text-lg font-bold text-emerald-400">{summary.present}</div>
              <div className="text-gray-500 text-xs">Có mặt</div>
            </div>
            <div className="text-center px-4 border-r border-gray-700">
              <div className="text-lg font-bold text-red-400">{summary.absent}</div>
              <div className="text-gray-500 text-xs">Vắng</div>
            </div>
            <div className="text-center px-4 border-r border-gray-700">
              <div className="text-lg font-bold text-amber-400">{summary.late}</div>
              <div className="text-gray-500 text-xs">Đi muộn</div>
            </div>
            <div className="text-center px-4">
              <div className="text-lg font-bold text-cyan-400">{summary.on_leave}</div>
              <div className="text-gray-500 text-xs">Nghỉ phép</div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-[#12121a] border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="p-4 text-left text-gray-400 font-medium">Nhân viên</th>
              <th className="p-4 text-center text-gray-400 font-medium">Ca làm</th>
              <th className="p-4 text-center text-gray-400 font-medium">Check-in</th>
              <th className="p-4 text-center text-gray-400 font-medium">Check-out</th>
              <th className="p-4 text-center text-gray-400 font-medium">Giờ làm</th>
              <th className="p-4 text-center text-gray-400 font-medium">Tăng ca</th>
              <th className="p-4 text-center text-gray-400 font-medium">Trạng thái</th>
              <th className="p-4 text-center text-gray-400 font-medium">Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">
                  <Clock className="mx-auto mb-4" size={48} />
                  <p>Không có dữ liệu chấm công</p>
                </td>
              </tr>
            ) : (
              records.map((record) => {
                const statusStyle = STATUS_COLORS[record.status] || STATUS_COLORS.present;
                
                return (
                  <tr 
                    key={record.id} 
                    className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors"
                    data-testid={`attendance-row-${record.id}`}
                  >
                    <td className="p-4">
                      <div>
                        <div className="text-white font-medium">{record.employee_name}</div>
                        <div className="text-gray-500 text-sm">{record.employee_code}</div>
                      </div>
                    </td>
                    <td className="p-4 text-center text-gray-400">
                      {record.shift_name || 'Hành chính'}
                    </td>
                    <td className="p-4 text-center">
                      <span className={record.check_in_time ? 'text-emerald-400' : 'text-gray-500'}>
                        {record.check_in_time || '--:--'}
                      </span>
                      {record.late_minutes > 0 && (
                        <div className="text-red-400 text-xs">+{record.late_minutes}p</div>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className={record.check_out_time ? 'text-amber-400' : 'text-gray-500'}>
                        {record.check_out_time || '--:--'}
                      </span>
                      {record.early_leave_minutes > 0 && (
                        <div className="text-orange-400 text-xs">-{record.early_leave_minutes}p</div>
                      )}
                    </td>
                    <td className="p-4 text-center text-white">
                      {record.work_hours > 0 ? `${record.work_hours}h` : '-'}
                    </td>
                    <td className="p-4 text-center">
                      {record.overtime_hours > 0 ? (
                        <span className="text-cyan-400">{record.overtime_hours}h</span>
                      ) : '-'}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${statusStyle.bg} ${statusStyle.text}`}>
                        {statusStyle.label}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {record.anomaly_detected && (
                        <AlertTriangle className="inline text-red-400" size={16} title={record.anomaly_reason} />
                      )}
                      {record.is_adjusted && (
                        <span className="text-amber-400 text-xs ml-1" title={record.adjustment_reason}>Đã chỉnh</span>
                      )}
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
