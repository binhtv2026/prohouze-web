/**
 * Contract Approval Tab
 * Visual stepper for multi-level approval workflow
 * Sales → Legal → Finance → Director
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/utils';
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Shield,
  DollarSign,
  Crown,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';

const APPROVAL_STEPS = [
  { key: 'sales', label: 'Sales Manager', icon: User, step: 1 },
  { key: 'legal', label: 'Pháp lý', icon: Shield, step: 2 },
  { key: 'finance', label: 'Tài chính', icon: DollarSign, step: 3 },
  { key: 'director', label: 'Giám đốc', icon: Crown, step: 4 },
];

export default function ContractApprovalTab({ contract, onApprove, onRefresh }) {
  const [rejectNotes, setRejectNotes] = React.useState('');

  const getStepStatus = (stepKey) => {
    switch (stepKey) {
      case 'sales':
        return contract.sales_review_status;
      case 'legal':
        return contract.legal_review_status;
      case 'finance':
        return contract.finance_review_status;
      default:
        return 'pending';
    }
  };

  const getStepReviewer = (stepKey) => {
    switch (stepKey) {
      case 'sales':
        return { by: contract.sales_reviewed_by, at: contract.sales_reviewed_at };
      case 'legal':
        return { by: contract.legal_reviewed_by, at: contract.legal_reviewed_at };
      case 'finance':
        return { by: contract.finance_reviewed_by, at: contract.finance_reviewed_at };
      default:
        return { by: null, at: null };
    }
  };

  const isStepRequired = (stepKey) => {
    if (stepKey === 'finance') return contract.finance_review_required;
    if (stepKey === 'director') {
      // Director required for high value or high discount
      return contract.grand_total >= 5000000000 || contract.discount_percent > 10;
    }
    return true;
  };

  const canApproveStep = (stepKey, stepNum) => {
    if (contract.status !== 'pending_review') return false;
    if (contract.current_approval_step !== stepNum) return false;
    
    // Check previous step is approved
    if (stepNum > 1) {
      const prevStep = APPROVAL_STEPS.find(s => s.step === stepNum - 1);
      if (prevStep && getStepStatus(prevStep.key) !== 'approved') return false;
    }
    
    return true;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-6 h-6 text-red-600" />;
      case 'pending':
      default:
        return <Clock className="w-6 h-6 text-slate-400" />;
    }
  };

  const getStatusColor = (status, isRequired) => {
    if (!isRequired) return 'bg-slate-100 border-slate-200 text-slate-400';
    switch (status) {
      case 'approved':
        return 'bg-green-50 border-green-200';
      case 'rejected':
        return 'bg-red-50 border-red-200';
      case 'pending':
      default:
        return 'bg-white border-slate-200';
    }
  };

  const getLineColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-slate-200';
    }
  };

  return (
    <div className="space-y-6" data-testid="approval-tab">
      {/* Approval Status Overview */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#316585]" />
            Trạng thái phê duyệt
            <Badge className={
              contract.approval_status === 'approved' ? 'bg-green-100 text-green-700' :
              contract.approval_status === 'rejected' ? 'bg-red-100 text-red-700' :
              contract.approval_status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
              'bg-slate-100 text-slate-700'
            }>
              {contract.approval_status === 'approved' ? 'Đã duyệt' :
               contract.approval_status === 'rejected' ? 'Từ chối' :
               contract.approval_status === 'in_progress' ? 'Đang duyệt' :
               'Chưa bắt đầu'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Visual Stepper */}
          <div className="relative">
            {/* Steps */}
            <div className="flex items-start justify-between">
              {APPROVAL_STEPS.map((step, index) => {
                const status = getStepStatus(step.key);
                const reviewer = getStepReviewer(step.key);
                const required = isStepRequired(step.key);
                const canApprove = canApproveStep(step.key, step.step);
                const Icon = step.icon;
                
                return (
                  <React.Fragment key={step.key}>
                    <div className="flex flex-col items-center flex-1">
                      {/* Step Circle */}
                      <div className={`
                        relative w-16 h-16 rounded-full border-2 flex items-center justify-center
                        ${getStatusColor(status, required)}
                        ${contract.current_approval_step === step.step ? 'ring-2 ring-[#316585] ring-offset-2' : ''}
                      `}>
                        {!required ? (
                          <span className="text-xs text-slate-400">Bỏ qua</span>
                        ) : status === 'approved' ? (
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        ) : status === 'rejected' ? (
                          <XCircle className="w-8 h-8 text-red-600" />
                        ) : (
                          <Icon className={`w-8 h-8 ${contract.current_approval_step === step.step ? 'text-[#316585]' : 'text-slate-400'}`} />
                        )}
                        
                        {/* Step Number Badge */}
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#316585] text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {step.step}
                        </div>
                      </div>
                      
                      {/* Step Info */}
                      <div className="mt-3 text-center">
                        <p className={`font-medium ${!required ? 'text-slate-400' : ''}`}>{step.label}</p>
                        {required && (
                          <p className="text-xs text-slate-500 mt-1">
                            {status === 'approved' ? (
                              <span className="text-green-600">Đã duyệt</span>
                            ) : status === 'rejected' ? (
                              <span className="text-red-600">Từ chối</span>
                            ) : (
                              'Chờ duyệt'
                            )}
                          </p>
                        )}
                        {reviewer.at && (
                          <p className="text-xs text-slate-400 mt-1">
                            {formatDate(reviewer.at)}
                          </p>
                        )}
                      </div>
                      
                      {/* Action Button */}
                      {canApprove && (
                        <Button
                          size="sm"
                          onClick={() => onApprove(step.key)}
                          className="mt-3 bg-green-500 hover:bg-green-600"
                          data-testid={`approve-${step.key}-btn`}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Duyệt
                        </Button>
                      )}
                    </div>
                    
                    {/* Connector Line */}
                    {index < APPROVAL_STEPS.length - 1 && (
                      <div className="flex-1 flex items-center pt-8">
                        <div className={`h-1 w-full rounded ${getLineColor(status)}`} />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Info */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quy trình phê duyệt nhiều cấp</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <div>
                <span className="font-medium">Bước 1: Sales Manager</span>
                <p className="text-slate-500">Kiểm tra thông tin khách hàng, giá bán, chính sách</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <div>
                <span className="font-medium">Bước 2: Pháp lý</span>
                <p className="text-slate-500">Kiểm tra tài liệu pháp lý, điều khoản hợp đồng</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
              <div>
                <span className="font-medium">Bước 3: Tài chính</span>
                <p className="text-slate-500">Chỉ yêu cầu khi chiết khấu &gt; 5%</p>
                {contract.finance_review_required ? (
                  <Badge className="bg-amber-100 text-amber-700 mt-1">Bắt buộc</Badge>
                ) : (
                  <Badge variant="outline" className="text-slate-400 mt-1">Bỏ qua</Badge>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
              <div>
                <span className="font-medium">Bước 4: Giám đốc</span>
                <p className="text-slate-500">Chỉ yêu cầu khi giá trị ≥ 5 tỷ hoặc chiết khấu &gt; 10%</p>
                {isStepRequired('director') ? (
                  <Badge className="bg-amber-100 text-amber-700 mt-1">Bắt buộc</Badge>
                ) : (
                  <Badge variant="outline" className="text-slate-400 mt-1">Bỏ qua</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Step Action Panel */}
      {contract.status === 'pending_review' && (
        <Card className="bg-blue-50 border border-blue-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-blue-700">
              <Clock className="w-6 h-6" />
              <div>
                <p className="font-semibold">Đang chờ duyệt - Bước {contract.current_approval_step}</p>
                <p className="text-sm text-blue-600">
                  {APPROVAL_STEPS.find(s => s.step === contract.current_approval_step)?.label}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Completed */}
      {contract.approval_status === 'approved' && (
        <Card className="bg-green-50 border border-green-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-green-700">
              <CheckCircle className="w-6 h-6" />
              <div>
                <p className="font-semibold">Đã phê duyệt hoàn tất</p>
                <p className="text-sm text-green-600">
                  Hợp đồng sẵn sàng để ký
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
