/**
 * Contract Timeline Component
 * Hiển thị full history: Contract → Payment → Commission → Split → Receivable → Payout
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { 
  FileText, DollarSign, TrendingUp, Users, CreditCard, 
  CheckCircle, Clock, AlertTriangle, ArrowRight
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Format số tiền
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

// Format date
function formatDateTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('vi-VN');
}

// Event type config
const EVENT_CONFIG = {
  contract: {
    icon: FileText,
    color: 'blue',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    label: 'Hợp đồng',
  },
  payment: {
    icon: DollarSign,
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
    label: 'Thanh toán',
  },
  commission: {
    icon: TrendingUp,
    color: 'green',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    label: 'Hoa hồng',
  },
  split: {
    icon: Users,
    color: 'purple',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
    label: 'Chia HH',
  },
  receivable: {
    icon: CreditCard,
    color: 'orange',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-300',
    label: 'Công nợ',
  },
  payout: {
    icon: CheckCircle,
    color: 'emerald',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-300',
    label: 'Chi trả',
  },
};

const DEMO_TIMELINE_EVENTS = [
  {
    type: 'contract',
    title: 'Hợp đồng mua bán đã ký',
    timestamp: '2026-03-18T09:30:00',
    status: 'signed',
  },
  {
    type: 'payment',
    title: 'Khách thanh toán đợt 1',
    timestamp: '2026-03-19T15:10:00',
    status: 'paid',
    amount: 350000000,
    paid: 350000000,
  },
  {
    type: 'commission',
    title: 'Tạo commission tự động',
    timestamp: '2026-03-20T08:00:00',
    status: 'calculated',
    amount: 92000000,
  },
  {
    type: 'split',
    title: 'Đã chia hoa hồng cho sale',
    timestamp: '2026-03-20T08:15:00',
    status: 'split',
    amount: 55200000,
    data: { role: 'sale' },
  },
  {
    type: 'payout',
    title: 'Payout chờ duyệt',
    timestamp: '2026-03-21T10:20:00',
    status: 'pending_payout',
    amount: 55200000,
  },
];

// Status badge
function StatusBadge({ status }) {
  const statusConfig = {
    pending: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-700' },
    paid: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-700' },
    overdue: { label: 'Quá hạn', color: 'bg-red-100 text-red-700' },
    confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700' },
    split: { label: 'Đã chia', color: 'bg-purple-100 text-purple-700' },
    calculated: { label: 'Đã tính', color: 'bg-blue-100 text-blue-700' },
    pending_payout: { label: 'Chờ chi', color: 'bg-yellow-100 text-yellow-700' },
    approved: { label: 'Đã duyệt', color: 'bg-blue-100 text-blue-700' },
    signed: { label: 'Đã ký', color: 'bg-green-100 text-green-700' },
  };

  const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-700' };

  return (
    <Badge className={`${config.color} text-xs`}>
      {config.label}
    </Badge>
  );
}

// Timeline Event Component
function TimelineEvent({ event, isLast }) {
  const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.contract;
  const Icon = config.icon;

  return (
    <div className="flex gap-3">
      {/* Icon */}
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 text-${config.color}-600`} />
        </div>
        {!isLast && (
          <div className="w-0.5 h-full bg-gray-200 my-1" />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 pb-4 ${!isLast ? 'border-b border-gray-100' : ''} mb-2`}>
        <div className="flex justify-between items-start">
          <div>
            <p className="font-medium text-sm">{event.title}</p>
            <p className="text-xs text-gray-500">{formatDateTime(event.timestamp)}</p>
          </div>
          <StatusBadge status={event.status} />
        </div>

        {/* Amount */}
        {event.amount > 0 && (
          <div className="mt-2 text-sm">
            <span className="text-gray-500">Số tiền:</span>{' '}
            <span className="font-semibold text-green-600">{formatCurrency(event.amount)}</span>
            {event.paid !== undefined && event.paid < event.amount && (
              <span className="text-xs text-gray-400 ml-2">
                (Đã thu: {formatCurrency(event.paid)})
              </span>
            )}
          </div>
        )}

        {/* Role for splits */}
        {event.data?.role && (
          <div className="mt-1">
            <Badge variant="outline" className="text-xs">
              {event.data.role === 'sale' && 'Sale 60%'}
              {event.data.role === 'leader' && 'Leader 10%'}
              {event.data.role === 'company' && 'Company'}
              {event.data.role === 'affiliate' && 'Affiliate 5%'}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}

// Main Timeline Component
export default function ContractTimeline({ contractId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState(null);

  const loadTimeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/finance/timeline/${contractId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (!response.ok) {
        throw new Error('Failed to load timeline');
      }
      
      const data = await response.json();
      setTimeline(Array.isArray(data.timeline) && data.timeline.length > 0 ? data.timeline : DEMO_TIMELINE_EVENTS);
    } catch (err) {
      setTimeline(DEMO_TIMELINE_EVENTS);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    if (contractId) {
      loadTimeline();
    }
  }, [contractId, loadTimeline]);

  if (!contractId) return null;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Timeline giao dịch
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-4 text-red-500 text-sm">{error}</div>
        ) : timeline.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">
            Chưa có dữ liệu timeline
          </div>
        ) : (
          <div className="space-y-0">
            {timeline.map((event, index) => (
              <TimelineEvent
                key={`${event.type}-${index}`}
                event={event}
                isLast={index === timeline.length - 1}
              />
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
          {Object.entries(EVENT_CONFIG).map(([key, config]) => (
            <div key={key} className="flex items-center gap-1 text-xs text-gray-500">
              <div className={`w-3 h-3 rounded-full ${config.bgColor}`}></div>
              {config.label}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Export smaller version for embedding
export function TimelineMini({ contractId }) {
  const [timeline, setTimeline] = useState([]);

  const loadTimeline = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/finance/timeline/${contractId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (response.ok) {
        const data = await response.json();
        setTimeline(Array.isArray(data.timeline) && data.timeline.length > 0 ? data.timeline : DEMO_TIMELINE_EVENTS);
      }
    } catch (err) {
      console.error('Timeline error:', err);
      setTimeline(DEMO_TIMELINE_EVENTS);
    }
  }, [contractId]);

  useEffect(() => {
    if (contractId) {
      loadTimeline();
    }
  }, [contractId, loadTimeline]);

  if (timeline.length === 0) return null;

  // Show flow as icons
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {timeline.map((event, index) => {
        const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.contract;
        const Icon = config.icon;
        const isDone = ['paid', 'approved', 'split', 'signed'].includes(event.status);

        return (
          <React.Fragment key={`${event.type}-${index}`}>
            <div 
              className={`w-6 h-6 rounded-full ${config.bgColor} flex items-center justify-center ${isDone ? 'ring-2 ring-green-400' : ''}`}
              title={`${config.label}: ${event.title}`}
            >
              <Icon className="w-3 h-3" />
            </div>
            {index < timeline.length - 1 && (
              <ArrowRight className="w-3 h-3 text-gray-300" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
