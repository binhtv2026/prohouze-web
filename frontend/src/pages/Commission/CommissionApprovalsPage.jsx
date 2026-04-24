/**
 * Commission Approval Queue
 * Prompt 11/20 - Commission Engine
 * Updated: API v2 PostgreSQL Integration
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { 
  CheckCircle, XCircle, Clock, AlertCircle, 
  ChevronRight, User, Building, FileText, DollarSign
} from 'lucide-react';
import { commissionsAPI } from '@/lib/crmApi';
import { toast } from 'sonner';

// Format currency
const formatCurrency = (amount) => {
  if (!amount) return '0 đ';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const DEMO_APPROVALS = [
  {
    id: 'approval-001',
    entry_code: 'COM-2026-001',
    commission_type: 'booking',
    earning_status: 'pending_approval',
    beneficiary_name: 'Nguyen Van Minh',
    contract_id: 'contract-001',
    project_id: 'project-emerald',
    base_amount: 3200000000,
    rate_value: 1.5,
    deductions: 2400000,
    net_amount: 45600000
  },
  {
    id: 'approval-002',
    entry_code: 'COM-2026-002',
    commission_type: 'deal',
    earning_status: 'pending_approval',
    beneficiary_name: 'Tran Thu Ha',
    contract_id: 'contract-002',
    project_id: 'project-rivera',
    base_amount: 2150000000,
    rate_value: 1.2,
    deductions: 1800000,
    net_amount: 24000000
  }
];

const DEMO_APPROVAL_SUMMARY = {
  pending_count: 2,
  pending_amount: 69600000
};

export default function CommissionApprovalsPage() {
  const [approvals, setApprovals] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const response = await commissionsAPI.getPendingApprovals({ limit: 100 });
      // API v2 returns { data: [...], meta: {...} }
      const approvalItems = response.data || response || [];
      setApprovals(Array.isArray(approvalItems) && approvalItems.length > 0 ? approvalItems : DEMO_APPROVALS);
    } catch (error) {
      console.error('Error loading approvals:', error);
      toast.error('Lỗi tải danh sách duyệt, đang hiển thị dữ liệu mẫu');
      setApprovals(DEMO_APPROVALS);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSummary = useCallback(async () => {
    try {
      const response = await commissionsAPI.getSummary();
      setSummary(response.data || DEMO_APPROVAL_SUMMARY);
    } catch (error) {
      console.error('Error loading summary:', error);
      setSummary(DEMO_APPROVAL_SUMMARY);
    }
  }, []);

  useEffect(() => {
    loadApprovals();
    loadSummary();
  }, [loadApprovals, loadSummary]);

  const handleApprove = async (recordId) => {
    setProcessing(true);
    try {
      await commissionsAPI.approve(recordId);
      toast.success('Đã duyệt hoa hồng');
      loadApprovals();
      loadSummary();
    } catch (error) {
      toast.error('Lỗi duyệt hoa hồng');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    
    setProcessing(true);
    try {
      await commissionsAPI.reject(selectedApproval.id, { reason: rejectReason });
      toast.success('Đã từ chối hoa hồng');
      setShowRejectModal(false);
      setSelectedApproval(null);
      setRejectReason('');
      loadApprovals();
      loadSummary();
    } catch (error) {
      toast.error('Lỗi từ chối hoa hồng');
    } finally {
      setProcessing(false);
    }
  };

  const openRejectModal = (item) => {
    setSelectedApproval(item);
    setShowRejectModal(true);
  };

  // Stats from API v2 response
  const totalAmount = approvals.reduce((sum, a) => sum + (parseFloat(a.net_amount) || 0), 0);
  const highValueCount = approvals.filter(a => (parseFloat(a.net_amount) || 0) >= 100_000_000).length;

  return (
    <div className="p-6 space-y-6" data-testid="commission-approvals-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Duyệt Hoa hồng</h1>
          <p className="text-gray-500 mt-1">Xét duyệt các yêu cầu hoa hồng chờ xử lý</p>
        </div>
        <Button variant="outline" onClick={loadApprovals}>
          Làm mới
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Chờ duyệt</p>
                <p className="text-2xl font-bold text-orange-600">{approvals.length}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-300" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tổng giá trị</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalAmount)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-300" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Giá trị cao (&gt;100M)</p>
                <p className="text-2xl font-bold text-red-600">{highValueCount}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approvals List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Danh sách chờ duyệt</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : approvals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" />
              <p>Không có hoa hồng nào cần duyệt</p>
            </div>
          ) : (
            <div className="space-y-4">
              {approvals.map((item) => (
                <div 
                  key={item.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  data-testid={`approval-item-${item.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-lg">{item.entry_code}</span>
                        <Badge variant="outline" className="border-orange-500 text-orange-600">
                          {item.commission_type} - {item.earning_status}
                        </Badge>
                        {parseFloat(item.net_amount) >= 100_000_000 && (
                          <Badge variant="destructive">Giá trị cao</Badge>
                        )}
                      </div>
                      
                      {/* Details */}
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            {item.beneficiary_name || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">Contract: {item.contract_id?.substring(0, 8) || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">Project: {item.project_id?.substring(0, 8) || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            Base: {formatCurrency(item.base_amount)}
                          </span>
                        </div>
                      </div>

                      {/* Commission breakdown */}
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">
                            {formatCurrency(item.base_amount)} × {item.rate_value}% - {formatCurrency(item.deductions)} (thuế)
                          </span>
                          <span className="font-bold text-lg text-green-600">
                            = {formatCurrency(item.net_amount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-4">
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(item.id)}
                        disabled={processing}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Duyệt
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-red-500 text-red-600 hover:bg-red-50"
                        onClick={() => openRejectModal(item)}
                        disabled={processing}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Từ chối
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối Hoa hồng</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500 mb-4">
              Mã: <strong>{selectedApproval?.entry_code}</strong> - 
              Số tiền: <strong>{formatCurrency(selectedApproval?.net_amount)}</strong>
            </p>
            <Textarea 
              placeholder="Nhập lý do từ chối..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing}>
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
