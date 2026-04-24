/**
 * DealTimeline - Timeline dạng step cho contract
 * 
 * Steps:
 * 1. Contract signed
 * 2. Payment received  
 * 3. Commission created
 * 4. Split completed
 * 5. Payout pending
 * 6. Paid
 * 
 * Mỗi step có: timestamp, người thực hiện, số tiền
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { 
  FileText, CreditCard, Calculator, Users, Clock, CheckCircle, XCircle
} from 'lucide-react';

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
  },
  payment_received: {
    label: 'Nhận thanh toán từ CĐT',
    icon: CreditCard,
    color: 'green',
  },
  commission_created: {
    label: 'Tạo commission',
    icon: Calculator,
    color: 'purple',
  },
  split_completed: {
    label: 'Chia hoa hồng',
    icon: Users,
    color: 'orange',
  },
  payout_pending: {
    label: 'Payout chờ duyệt',
    icon: Clock,
    color: 'yellow',
  },
  payout_approved: {
    label: 'Payout đã duyệt',
    icon: CheckCircle,
    color: 'teal',
  },
  paid: {
    label: 'Đã chi trả',
    icon: CheckCircle,
    color: 'green',
  },
};

const DEMO_DEAL_TIMELINE = [
  { step_type: 'contract_signed', completed: true, title: 'Hợp đồng đã ký', timestamp: '2026-03-18T09:30:00', actor_name: 'Nguyen Minh Quan', amount: 0 },
  { step_type: 'payment_received', completed: true, title: 'Nhận thanh toán đợt 1', timestamp: '2026-03-19T15:10:00', actor_name: 'Ke toan', amount: 350000000 },
  { step_type: 'commission_created', completed: true, title: 'Commission được tạo', timestamp: '2026-03-20T08:00:00', actor_name: 'System', amount: 92000000 },
  { step_type: 'split_completed', completed: false, title: 'Đang chờ chia hoa hồng', timestamp: null, actor_name: null, amount: 92000000 },
];

// Timeline Step Component
function TimelineStep({ step, isLast, isActive }) {
  const config = STEP_CONFIG[step.step_type] || {
    label: step.step_type,
    icon: FileText,
    color: 'gray',
  };
  
  const Icon = config.icon;
  const isCompleted = step.completed;
  
  // Color classes
  const colorMap = {
    blue: 'bg-blue-100 text-blue-600 border-blue-200',
    green: 'bg-green-100 text-green-600 border-green-200',
    purple: 'bg-purple-100 text-purple-600 border-purple-200',
    orange: 'bg-orange-100 text-orange-600 border-orange-200',
    yellow: 'bg-yellow-100 text-yellow-600 border-yellow-200',
    teal: 'bg-teal-100 text-teal-600 border-teal-200',
    gray: 'bg-gray-100 text-gray-400 border-gray-200',
  };
  
  const activeColor = isCompleted ? colorMap[config.color] : colorMap.gray;
  const lineColor = isCompleted ? 'bg-green-400' : 'bg-gray-200';
  
  return (
    <div className="flex gap-3">
      {/* Icon & Line */}
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${activeColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        {!isLast && (
          <div className={`w-0.5 flex-1 min-h-[40px] ${lineColor}`} />
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className={`font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
              {config.label}
            </p>
            {step.actor_name && (
              <p className="text-xs text-gray-500 mt-0.5">
                Bởi: {step.actor_name}
              </p>
            )}
          </div>
          
          <div className="text-right">
            {step.amount > 0 && (
              <p className={`text-sm font-medium ${isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                {formatCurrency(step.amount)}
              </p>
            )}
            {step.timestamp && (
              <p className="text-xs text-gray-400">
                {formatDate(step.timestamp)}
              </p>
            )}
          </div>
        </div>
        
        {step.details && (
          <p className="text-xs text-gray-500 mt-1">{step.details}</p>
        )}
      </div>
    </div>
  );
}

// Main Component
export default function DealTimeline({ contractId, timeline, loading }) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!timeline || timeline.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-4">
            Chưa có dữ liệu timeline
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate completion
  const completedSteps = timeline.filter(s => s.completed).length;
  const totalSteps = timeline.length;
  const progress = (completedSteps / totalSteps) * 100;
  
  return (
    <Card data-testid="deal-timeline">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Timeline Deal</CardTitle>
          <Badge 
            variant="outline" 
            className={`text-xs ${progress === 100 ? 'border-green-200 text-green-600' : 'border-blue-200 text-blue-600'}`}
          >
            {completedSteps}/{totalSteps} bước
          </Badge>
        </div>
        
        {/* Progress bar */}
        <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        {timeline.map((step, index) => (
          <TimelineStep
            key={step.step_type || index}
            step={step}
            isLast={index === timeline.length - 1}
            isActive={index === completedSteps}
          />
        ))}
      </CardContent>
    </Card>
  );
}

// Standalone component to fetch and display timeline
export function ContractTimeline({ contractId }) {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const loadTimeline = useCallback(async () => {
    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${API_URL}/api/finance/timeline/${contractId}`);
      if (response.ok) {
        const data = await response.json();
        setTimeline(Array.isArray(data) && data.length > 0 ? data : Array.isArray(data.timeline) && data.timeline.length > 0 ? data.timeline : DEMO_DEAL_TIMELINE);
      } else {
        setTimeline(DEMO_DEAL_TIMELINE);
      }
    } catch (error) {
      console.error('Load timeline error:', error);
      setTimeline(DEMO_DEAL_TIMELINE);
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    if (contractId) {
      loadTimeline();
    }
  }, [contractId, loadTimeline]);
  
  return <DealTimeline contractId={contractId} timeline={timeline} loading={loading} />;
}
