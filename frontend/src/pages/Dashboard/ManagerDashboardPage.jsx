import React, { useState, useEffect, useCallback } from 'react';
import { 
  Phone, 
  Clock, 
  AlertTriangle, 
  Users, 
  TrendingUp, 
  Activity,
  RefreshCw,
  CheckCircle,
  XCircle,
  ArrowRight,
  Zap,
  Target,
  Calendar,
  UserCheck
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ManagerDashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/dashboard/manager/overview`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboardData(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    
    // Auto-refresh every 30 seconds
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchDashboard, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchDashboard, autoRefresh]);

  const handleCallNow = (phone) => {
    if (phone && phone !== 'N/A') {
      window.location.href = `tel:${phone.replace(/[^0-9+]/g, '')}`;
    }
  };

  const handleReassign = async (bookingId, newSalesId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/dashboard/manager/bookings/${bookingId}/reassign?new_sales_id=${newSalesId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchDashboard();
      }
    } catch (err) {
      console.error('Reassign error:', err);
    }
  };

  const getSLAStatusColor = (status) => {
    switch (status) {
      case 'critical': return 'bg-red-500 text-white';
      case 'warning': return 'bg-yellow-500 text-white';
      default: return 'bg-green-500 text-white';
    }
  };

  const getSLAStatusText = (status) => {
    switch (status) {
      case 'critical': return 'VI PHẠM';
      case 'warning': return 'CẢNH BÁO';
      default: return 'OK';
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6" data-testid="manager-dashboard">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Target className="w-8 h-8 text-blue-500" />
            SALES CONTROL CENTER
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time monitoring • SLA Enforcement • Team Performance
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input 
              type="checkbox" 
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh (30s)
          </label>
          
          <button
            onClick={fetchDashboard}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
            data-testid="refresh-btn"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          {lastUpdate && (
            <span className="text-gray-400 text-sm">
              Updated: {lastUpdate.toLocaleTimeString('vi-VN')}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {dashboardData && (
        <>
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <MetricCard
              icon={<Zap className="w-6 h-6 text-red-500" />}
              label="HOT Leads Chờ Gọi"
              value={dashboardData.hot_leads?.uncalled || 0}
              color="red"
              testId="hot-leads-uncalled"
            />
            <MetricCard
              icon={<Clock className="w-6 h-6 text-yellow-500" />}
              label="SLA Violations Hôm nay"
              value={dashboardData.sla_status?.violations_today || 0}
              color="yellow"
              testId="sla-violations-today"
            />
            <MetricCard
              icon={<Calendar className="w-6 h-6 text-blue-500" />}
              label="Bookings Hôm nay"
              value={dashboardData.bookings?.today || 0}
              color="blue"
              testId="bookings-today"
            />
            <MetricCard
              icon={<UserCheck className="w-6 h-6 text-green-500" />}
              label="Pending Bookings"
              value={dashboardData.bookings?.pending || 0}
              color="green"
              testId="pending-bookings"
            />
            <MetricCard
              icon={<TrendingUp className="w-6 h-6 text-purple-500" />}
              label="SLA Compliance"
              value={`${dashboardData.metrics?.sla_compliance_rate || 0}%`}
              color="purple"
              testId="sla-compliance"
            />
            <MetricCard
              icon={<Activity className="w-6 h-6 text-cyan-500" />}
              label="Avg Response Time"
              value={`${dashboardData.sla_status?.avg_response_time_minutes || 0}m`}
              color="cyan"
              testId="avg-response-time"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* HOT Leads - Urgent */}
            <div className="lg:col-span-2 bg-gray-800 rounded-xl p-4" data-testid="urgent-leads-section">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  HOT LEADS CẦN GỌI NGAY
                </h2>
                <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm">
                  {dashboardData.hot_leads?.urgent_list?.length || 0} leads
                </span>
              </div>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {dashboardData.hot_leads?.urgent_list?.length > 0 ? (
                  dashboardData.hot_leads.urgent_list.map((lead, idx) => (
                    <div 
                      key={lead.booking_id || idx}
                      className="bg-gray-700/50 rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-3"
                      data-testid={`urgent-lead-${idx}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{lead.customer_name}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${getSLAStatusColor(lead.sla_status)}`}>
                            {getSLAStatusText(lead.sla_status)}
                          </span>
                        </div>
                        <div className="text-gray-400 text-sm mt-1">
                          <span className="mr-4">{lead.customer_phone}</span>
                          <span className="mr-4">{lead.project_name}</span>
                          <span className="text-yellow-500">{lead.minutes_waiting} phút chờ</span>
                        </div>
                        <div className="text-gray-500 text-xs mt-1">
                          Assigned: {lead.assigned_to}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleCallNow(lead.customer_phone)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition whitespace-nowrap"
                        data-testid={`call-btn-${idx}`}
                      >
                        <Phone className="w-4 h-4" />
                        GỌI NGAY
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                    <p>Không có HOT lead nào cần xử lý</p>
                  </div>
                )}
              </div>
            </div>

            {/* SLA Alerts */}
            <div className="bg-gray-800 rounded-xl p-4" data-testid="sla-alerts-section">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  SLA ALERTS
                </h2>
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                  {dashboardData.sla_status?.unresolved_alerts || 0} unresolved
                </span>
              </div>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {dashboardData.recent_alerts?.length > 0 ? (
                  dashboardData.recent_alerts.map((alert, idx) => (
                    <div 
                      key={alert.id || idx}
                      className={`rounded-lg p-3 ${alert.resolved ? 'bg-gray-700/30' : 'bg-red-900/30 border border-red-500/50'}`}
                      data-testid={`sla-alert-${idx}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">
                          {alert.type === 'violation' ? '🚨' : alert.type === 'warning' ? '⚠️' : '🔄'} {alert.type}
                        </span>
                        {alert.resolved ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <div className="text-gray-400 text-sm mt-1">
                        {alert.sales_name} • {alert.minutes_overdue}m overdue
                      </div>
                      <div className="text-gray-500 text-xs mt-1">
                        {new Date(alert.created_at).toLocaleTimeString('vi-VN')}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                    <p>Không có alert nào</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sales Team Performance */}
          <div className="mt-6 bg-gray-800 rounded-xl p-4" data-testid="sales-performance-section">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                SALES TEAM PERFORMANCE
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                    <th className="pb-3">Sales</th>
                    <th className="pb-3">Region</th>
                    <th className="pb-3">Workload</th>
                    <th className="pb-3">Today Calls</th>
                    <th className="pb-3">Today Bookings</th>
                    <th className="pb-3">SLA Violations</th>
                    <th className="pb-3">Conversion</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.sales_performance?.map((sales, idx) => (
                    <tr 
                      key={sales.id || idx}
                      className="border-b border-gray-700/50 hover:bg-gray-700/30"
                      data-testid={`sales-row-${idx}`}
                    >
                      <td className="py-3">
                        <div className="font-medium">{sales.name}</div>
                        <div className="text-gray-500 text-xs">{sales.phone}</div>
                      </td>
                      <td className="py-3 text-gray-400">{sales.region}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                (sales.current_load / sales.max_load) >= 1 ? 'bg-red-500' :
                                (sales.current_load / sales.max_load) >= 0.8 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min((sales.current_load / sales.max_load) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm">{sales.current_load}/{sales.max_load}</span>
                        </div>
                      </td>
                      <td className="py-3">{sales.today_calls}</td>
                      <td className="py-3">{sales.today_bookings}</td>
                      <td className="py-3">
                        <span className={sales.sla_violations > 0 ? 'text-red-500 font-bold' : 'text-green-500'}>
                          {sales.sla_violations}
                        </span>
                      </td>
                      <td className="py-3">{sales.conversion_rate}%</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          sales.status === 'overloaded' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                        }`}>
                          {sales.status === 'overloaded' ? 'QUÁ TẢI' : 'HOẠT ĐỘNG'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bookings by Time Slot */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {['09:00', '14:00', '19:00'].map((slot) => {
              const count = dashboardData.bookings?.by_time_slot?.[slot] || 0;
              const label = slot === '09:00' ? 'Sáng' : slot === '14:00' ? 'Chiều' : 'Tối';
              
              return (
                <div key={slot} className="bg-gray-800 rounded-xl p-4" data-testid={`slot-${slot}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">{label} ({slot})</p>
                      <p className="text-2xl font-bold mt-1">{count} bookings</p>
                    </div>
                    <Calendar className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ icon, label, value, color, testId }) => {
  const colorClasses = {
    red: 'border-red-500/30 bg-red-500/10',
    yellow: 'border-yellow-500/30 bg-yellow-500/10',
    blue: 'border-blue-500/30 bg-blue-500/10',
    green: 'border-green-500/30 bg-green-500/10',
    purple: 'border-purple-500/30 bg-purple-500/10',
    cyan: 'border-cyan-500/30 bg-cyan-500/10',
  };

  return (
    <div 
      className={`rounded-xl p-4 border ${colorClasses[color]}`}
      data-testid={testId}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-gray-400 text-xs">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};

export default ManagerDashboardPage;
