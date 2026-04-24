/**
 * Finance Alerts Component
 * Hiển thị cảnh báo tài chính:
 * 1. Công nợ quá hạn
 * 2. Sale chưa được trả tiền
 * 3. Deal có tiền nhưng chưa chia hoa hồng
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  AlertTriangle, Bell, CheckCircle, Clock, 
  DollarSign, Users, CreditCard, RefreshCw, X
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DEMO_FINANCE_ALERTS = [
  {
    id: 'alert-001',
    type: 'receivable_overdue',
    severity: 'high',
    message: 'Khach hang du an The Emerald dang qua han thanh toan dot 2',
    created_at: '2026-03-26T08:00:00+07:00',
    data: {
      amount: 320000000,
      days_overdue: 7
    }
  },
  {
    id: 'alert-002',
    type: 'commission_not_split',
    severity: 'medium',
    message: 'Deal booking tower B chua chia hoa hong cho doi kinh doanh',
    created_at: '2026-03-25T15:30:00+07:00',
    data: {
      amount: 54000000,
      days_pending: 3
    }
  }
];

// Format số tiền
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

// Format date
function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

// Alert type config
const ALERT_CONFIG = {
  receivable_overdue: {
    icon: CreditCard,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    title: 'Công nợ quá hạn',
  },
  payout_pending_too_long: {
    icon: Users,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    title: 'Payout chờ quá lâu',
  },
  commission_not_split: {
    icon: DollarSign,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    title: 'Chưa chia hoa hồng',
  },
};

// Severity badge
function SeverityBadge({ severity }) {
  const config = {
    high: { label: 'Cao', color: 'bg-red-100 text-red-700' },
    medium: { label: 'Trung bình', color: 'bg-yellow-100 text-yellow-700' },
    low: { label: 'Thấp', color: 'bg-gray-100 text-gray-700' },
  };

  const c = config[severity] || config.medium;

  return (
    <Badge className={`${c.color} text-xs`}>
      {c.label}
    </Badge>
  );
}

// Single Alert Card
function AlertCard({ alert, onResolve }) {
  const config = ALERT_CONFIG[alert.type] || ALERT_CONFIG.receivable_overdue;
  const Icon = config.icon;
  const [resolving, setResolving] = useState(false);

  async function handleResolve() {
    setResolving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/finance/alerts/${alert.id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        toast.success('Đã đánh dấu xử lý');
        onResolve(alert.id);
      } else {
        toast.error('Không thể xử lý alert');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setResolving(false);
    }
  }

  return (
    <div className={`p-3 rounded-lg border ${config.borderColor} ${config.bgColor}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <Icon className={`w-5 h-5 ${config.color} mt-0.5`} />
          <div>
            <p className="font-medium text-sm">{alert.message}</p>
            <div className="flex items-center gap-2 mt-1">
              <SeverityBadge severity={alert.severity} />
              <span className="text-xs text-gray-500">
                {formatDate(alert.created_at)}
              </span>
            </div>
            {alert.data?.amount && (
              <p className="text-sm mt-1">
                Số tiền: <span className="font-semibold">{formatCurrency(alert.data.amount)}</span>
              </p>
            )}
            {alert.data?.days_overdue && (
              <p className="text-xs text-red-600 mt-1">
                Quá hạn {alert.data.days_overdue} ngày
              </p>
            )}
            {alert.data?.days_pending && (
              <p className="text-xs text-yellow-600 mt-1">
                Chờ {alert.data.days_pending} ngày
              </p>
            )}
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleResolve}
          disabled={resolving}
          className="h-7 w-7 p-0"
        >
          {resolving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

// Main Alerts Component
export default function FinanceAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/finance/alerts`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts(Array.isArray(data.alerts) ? data.alerts : DEMO_FINANCE_ALERTS);
      } else {
        setAlerts(DEMO_FINANCE_ALERTS);
      }
    } catch (err) {
      console.error('Load alerts error:', err);
      setAlerts(DEMO_FINANCE_ALERTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  async function checkAlerts() {
    setChecking(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/finance/alerts/check`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Đã kiểm tra: ${data.alerts_count} cảnh báo`);
        loadAlerts();
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setChecking(false);
    }
  }

  function handleResolve(alertId) {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  }

  // Group alerts by type
  const alertsByType = alerts.reduce((acc, alert) => {
    const type = alert.type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(alert);
    return acc;
  }, {});

  const highPriorityCount = alerts.filter(a => a.severity === 'high').length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Cảnh báo tài chính
            {alerts.length > 0 && (
              <Badge className="bg-red-100 text-red-700">
                {alerts.length}
              </Badge>
            )}
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={checkAlerts}
            disabled={checking}
          >
            {checking ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
            Không có cảnh báo nào
          </div>
        ) : (
          <div className="space-y-4">
            {/* High priority first */}
            {highPriorityCount > 0 && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                {highPriorityCount} cảnh báo ưu tiên cao cần xử lý
              </div>
            )}

            {/* Group by type */}
            {Object.entries(alertsByType).map(([type, typeAlerts]) => {
              const config = ALERT_CONFIG[type] || ALERT_CONFIG.receivable_overdue;
              return (
                <div key={type}>
                  <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                    {config.title} ({typeAlerts.length})
                  </h4>
                  <div className="space-y-2">
                    {typeAlerts.map(alert => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                        onResolve={handleResolve}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Mini version for sidebar/header
export function AlertsBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    loadCount();
    const interval = setInterval(loadCount, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  async function loadCount() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/finance/alerts`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        setCount(data.total || 0);
      }
    } catch (err) {
      console.error('Load alerts count error:', err);
    }
  }

  if (count === 0) return null;

  return (
    <Badge className="bg-red-500 text-white text-xs">
      {count}
    </Badge>
  );
}
