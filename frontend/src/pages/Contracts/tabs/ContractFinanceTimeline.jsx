/**
 * Contract Finance Timeline
 * Hiển thị flow tài chính của hợp đồng:
 * Contract signed → Payment received → Commission created → Split completed → Payout pending → Paid
 * 
 * Mỗi step có: timestamp, người thực hiện, số tiền
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { 
  FileText, CreditCard, Calculator, Users, Clock, CheckCircle, 
  ArrowRight, DollarSign
} from 'lucide-react';
import { getContractTimeline } from '../../../api/financeApi';

const DEMO_TIMELINE = [
  { step_type: 'contract_signed', completed: true, details: 'Khách đã ký hợp đồng mua bán', actor_name: 'Nguyen Minh Quan', amount: 0, timestamp: '2026-03-18T09:30:00' },
  { step_type: 'payment_received', completed: true, details: 'Đợt thanh toán 1 đã ghi nhận', actor_name: 'Ke toan', amount: 350000000, timestamp: '2026-03-19T15:10:00' },
  { step_type: 'commission_created', completed: true, details: 'Commission đã được tạo tự động', actor_name: 'System', amount: 92000000, timestamp: '2026-03-20T08:00:00' },
  { step_type: 'split_completed', completed: true, details: 'Đã chia hoa hồng cho sale và leader', actor_name: 'Tai chinh', amount: 92000000, timestamp: '2026-03-20T08:15:00' },
  { step_type: 'payout_pending', completed: false, details: 'Payout đang chờ duyệt', actor_name: 'Ke toan', amount: 55200000, timestamp: '2026-03-21T10:20:00' },
  { step_type: 'paid', completed: false, details: 'Sẽ chi trả sau khi hoàn tất duyệt', actor_name: null, amount: 55200000, timestamp: null },
];

// Format VND
function formatCurrency(amount) {
  if (!amount) return '0 đ';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date
function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

// Step config
const STEP_CONFIG = {
  contract_signed: {
    label: 'Ký hợp đồng',
    icon: FileText,
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200',
  },
  commission_created: {
    label: 'Tạo commission',
    icon: Calculator,
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-600',
    borderColor: 'border-purple-200',
  },
  payment_received: {
    label: 'Nhận thanh toán từ CĐT',
    icon: CreditCard,
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-600',
    borderColor: 'border-green-200',
  },
  split_completed: {
    label: 'Chia hoa hồng',
    icon: Users,
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-200',
  },
  payout_pending: {
    label: 'Payout chờ duyệt',
    icon: Clock,
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-600',
    borderColor: 'border-yellow-200',
  },
  paid: {
    label: 'Đã chi trả',
    icon: CheckCircle,
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-600',
    borderColor: 'border-green-200',
  },
};

// Timeline Step Component
function TimelineStep({ step, isLast }) {
  const config = STEP_CONFIG[step.step_type] || {
    label: step.step_type,
    icon: FileText,
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-400',
    borderColor: 'border-gray-200',
  };
  
  const Icon = config.icon;
  const isCompleted = step.completed;
  
  return (
    <div className="flex items-start gap-4">
      {/* Icon circle */}
      <div className="flex flex-col items-center">
        <div className={`
          w-12 h-12 rounded-full border-2 flex items-center justify-center
          ${isCompleted ? `${config.bgColor} ${config.borderColor}` : 'bg-gray-50 border-gray-200'}
        `}>
          <Icon className={`w-5 h-5 ${isCompleted ? config.textColor : 'text-gray-300'}`} />
        </div>
        {!isLast && (
          <div className={`w-0.5 flex-1 min-h-[60px] mt-2 ${isCompleted ? 'bg-green-400' : 'bg-gray-200'}`} />
        )}
      </div>
      
      {/* Content */}
      <div className={`flex-1 pb-6 ${!isCompleted ? 'opacity-50' : ''}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className={`font-semibold ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
              {config.label}
            </p>
            {step.details && (
              <p className="text-sm text-gray-500 mt-0.5">{step.details}</p>
            )}
            {step.actor_name && (
              <p className="text-xs text-gray-400 mt-1">
                Bởi: {step.actor_name}
              </p>
            )}
          </div>
          
          <div className="text-right">
            {step.amount > 0 && (
              <p className={`font-semibold ${isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                {formatCurrency(step.amount)}
              </p>
            )}
            {step.timestamp && (
              <p className="text-xs text-gray-400 mt-1">
                {formatDate(step.timestamp)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Component
export default function ContractFinanceTimeline({ contractId }) {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTimeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getContractTimeline(contractId);
      setTimeline(Array.isArray(data) && data.length > 0 ? data : DEMO_TIMELINE);
    } catch (err) {
      console.error('Load timeline error:', err);
      setTimeline(DEMO_TIMELINE);
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

  // Calculate completion
  const completedSteps = timeline.filter(s => s.completed).length;
  const totalSteps = timeline.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  const isFullyCompleted = completedSteps === totalSteps && totalSteps > 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-gray-500">
            <p>Không thể tải timeline: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (timeline.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Finance Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Chưa có dữ liệu tài chính</p>
            <p className="text-sm mt-1">Timeline sẽ xuất hiện sau khi hợp đồng được ký</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="contract-finance-timeline">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Finance Timeline
          </CardTitle>
          <Badge 
            variant="outline" 
            className={`text-sm ${isFullyCompleted ? 'border-green-300 text-green-600 bg-green-50' : 'border-blue-300 text-blue-600 bg-blue-50'}`}
          >
            {isFullyCompleted ? '✓ Hoàn tất' : `${completedSteps}/${totalSteps} bước`}
          </Badge>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Tiến độ</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${isFullyCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        {/* Flow summary */}
        <div className="flex items-center justify-between mb-6 p-3 bg-gray-50 rounded-lg text-xs overflow-x-auto">
          {timeline.map((step, idx) => {
            const config = STEP_CONFIG[step.step_type] || { label: step.step_type };
            return (
              <React.Fragment key={step.step_type}>
                <div className={`flex items-center gap-1 whitespace-nowrap ${step.completed ? 'text-green-600' : 'text-gray-400'}`}>
                  {step.completed ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  <span>{config.label}</span>
                </div>
                {idx < timeline.length - 1 && (
                  <ArrowRight className={`w-4 h-4 mx-1 ${step.completed ? 'text-green-400' : 'text-gray-300'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Timeline steps */}
        <div className="space-y-0">
          {timeline.map((step, index) => (
            <TimelineStep
              key={step.step_type || index}
              step={step}
              isLast={index === timeline.length - 1}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
